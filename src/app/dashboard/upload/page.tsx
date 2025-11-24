"use client";
import React, { useState, useRef, useEffect } from "react";
import Button from "@/src/app/components/ui/button";
import { useRouter } from "next/navigation";
import { createSong } from "@/src/app/utils/api";
import { startTusUpload } from "@/src/app/utils/tusClient";
import { isUserType } from "@/src/app/utils/auth";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number | null>(null);
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const audioUploadRef = useRef<any | null>(null);
  const imageUploadRef = useRef<any | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Only allow artists to access this page
    if (!isUserType("artist")) {
      router.push("/dashboard");
    }
  }, [router]);

  // If not an artist, show nothing while redirecting
  if (!isUserType("artist")) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Access denied. Redirecting...</p>
      </div>
    );
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  }

  function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setAudioName(file ? file.name : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!title.trim() || !artist.trim()) {
      setMessage("Please provide title and artist.");
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const cover = formData.get("cover") as File | null;
    const audio = formData.get("audio") as File | null;

    setSubmitting(true);
    try {
      // Start uploads for audio and cover (if present) using reusable helper
      const uploadPromises: Promise<any>[] = [];
      let audioUploadInstance: any = null;

      if (audio) {
        const { upload, promise } = startTusUpload(audio, {
          metadata: {
            filename: audio.name,
          },
          onProgress(bytesUploaded: number, bytesTotal: number) {
            const pct = Math.floor((bytesUploaded / bytesTotal) * 100);
            setAudioProgress(pct);
          },
        });

        audioUploadInstance = upload;
        audioUploadRef.current = upload;
        uploadPromises.push(promise);
      }

      if (cover) {
        const { upload: imageUpload, promise: coverPromise } = startTusUpload(cover, {
          metadata: {
            filename: cover.name,
          },
          onProgress(bytesUploaded: number, bytesTotal: number) {
            const pct = Math.floor((bytesUploaded / bytesTotal) * 100);
            setImageProgress(pct);
          },
        });

        imageUploadRef.current = imageUpload;
        uploadPromises.push(coverPromise);
      }

      if (uploadPromises.length > 0) {
        // wait for all started uploads to finish
        const results = await Promise.all(uploadPromises);

        // results are in the order we pushed: audio (if present), then cover (if present)
        let idx = 0;
        const audioResult = audio ? results[idx++] : null;
        const coverResult = cover ? results[idx++] : null;

        const audioId = audioResult?.id || null;
        const imageId = coverResult?.id || null;

        // attempt to create the song record on the API
        try {
          const body = {
            name: title.trim(),
            description: "",
            releaseDate: new Date().toISOString(),
            authorIds: [],
            album: null,
            genre: genre.trim() || "",
            tags: [],
            audioId: audioId,
            imageId: imageId,
          };

          console.log('Creating song with body:', body);
          console.log('Access token:', localStorage.getItem('accessToken'));
          await createSong(body);
          setMessage("Upload complete and song created on server.");
        } catch (err: any) {
          console.error('Failed to create song:', err);
          setMessage(`Upload complete but failed to create song on server: ${err?.message || err}`);
        }

        // store metadata locally for now (frontend-only); include uploadedUrl(s) if available
        const saved = {
          id: Date.now().toString(),
          title: title.trim(),
          artist: artist.trim(),
          genre: genre.trim() || null,
          audioName: audio ? audio.name : null,
          coverName: cover ? cover.name : null,
          audioId: audioId,
          imageId: imageId,
          createdAt: new Date().toISOString(),
        };

        const raw = localStorage.getItem("groovo_uploads");
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(saved);
        localStorage.setItem("groovo_uploads", JSON.stringify(arr));

        //setTimeout(() => router.push("/dashboard"), 800);
        setSubmitting(false);
      } else {
        // No audio file — just save metadata locally
        const uploadObj = {
          id: Date.now().toString(),
          title: title.trim(),
          artist: artist.trim(),
          genre: genre.trim() || null,
          audioName: null,
          coverName: cover ? cover.name : null,
          createdAt: new Date().toISOString(),
        };

        const raw = localStorage.getItem("groovo_uploads");
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(uploadObj);
        localStorage.setItem("groovo_uploads", JSON.stringify(arr));

        setMessage("Saved metadata locally (no audio). If you want to upload audio, choose a file.");
        //setTimeout(() => router.push("/dashboard"), 800);
        setSubmitting(false);
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to start upload");
      setSubmitting(false);
    }
  }

  function handleCancelUpload() {
    // Cancel both uploads if they exist
    if (audioUploadRef.current && typeof audioUploadRef.current.abort === "function") {
      audioUploadRef.current.abort(true);
      audioUploadRef.current = null;
    }
    if (imageUploadRef.current && typeof imageUploadRef.current.abort === "function") {
      imageUploadRef.current.abort(true);
      imageUploadRef.current = null;
    }
    setMessage("Upload cancelled.");
    setSubmitting(false);
    setAudioProgress(null);
    setImageProgress(null);
  }

  function handlePauseResume() {
    const audioUpload = audioUploadRef.current;
    if (!audioUpload) return;

    if (!isPaused) {
      // stop without removing stored fingerprint so it can be resumed
      if (typeof audioUpload.abort === "function") {
        audioUpload.abort();
        setIsPaused(true);
        setMessage("Upload paused. You can resume.");
        setSubmitting(false);
      }
    } else {
      // resume
      try {
        audioUpload.start();
        setIsPaused(false);
        setMessage("Resuming upload...");
        setSubmitting(true);
      } catch (err: any) {
        setMessage(`Failed to resume: ${err?.message || err}`);
      }
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Upload a song</h2>

      <form className="space-y-4 bg-neutral-900 p-6 rounded" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-gray-300">Title</label>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md p-2 bg-neutral-800 border border-neutral-700" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Artist</label>
          <input name="artist" value={artist} onChange={(e) => setArtist(e.target.value)} className="mt-1 w-full rounded-md p-2 bg-neutral-800 border border-neutral-700" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Genre</label>
          <input name="genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="mt-1 w-full rounded-md p-2 bg-neutral-800 border border-neutral-700" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Cover image</label>
          <input name="cover" onChange={(e) => { handleCoverChange(e); }} type="file" accept="image/*" className="mt-1 text-sm text-gray-300" />
          {coverPreview && (
            <img src={coverPreview} alt="cover" className="mt-2 h-28 w-28 object-cover rounded" />
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-300">Audio file</label>
          <input name="audio" onChange={handleAudioChange} type="file" accept="audio/*" className="mt-1 text-sm text-gray-300" />
          {audioName && <div className="mt-2 text-sm text-gray-300">Selected: {audioName}</div>}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="default" disabled={submitting}>
            {submitting ? "Uploading..." : "Upload"}
          </Button>

          <Button type="button" variant="outline" onClick={() => router.back()}>
            Back
          </Button>

          {/* Show pause/resume and cancel-upload while there's an active upload */}
          {(audioUploadRef.current || imageUploadRef.current || submitting) && (
            <>
              <Button type="button" variant="outline" onClick={handlePauseResume}>
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button type="button" variant="destructive" onClick={handleCancelUpload}>
                Cancel Upload
              </Button>
            </>
          )}
        </div>

        {/* Progress display */}
        {(audioProgress !== null || imageProgress !== null) && (
          <div className="mt-3 space-y-2">
            {audioProgress !== null && (
              <div>
                <div className="text-sm text-gray-300 mb-1">Audio: {audioProgress}%</div>
                <div className="w-full bg-neutral-800 h-3 rounded overflow-hidden">
                  <div className="h-3 bg-green-500" style={{ width: `${audioProgress}%` }} />
                </div>
              </div>
            )}
            {imageProgress !== null && (
              <div>
                <div className="text-sm text-gray-300 mb-1">Cover: {imageProgress}%</div>
                <div className="w-full bg-neutral-800 h-3 rounded overflow-hidden">
                  <div className="h-3 bg-blue-500" style={{ width: `${imageProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {message && <div className="text-sm text-gray-300">{message}</div>}
      </form>
    </div>
  );
}
