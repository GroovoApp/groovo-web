"use client";
import React, { useState, useRef, useEffect } from "react";
import Button from "@/src/app/components/ui/button";
import { useRouter } from "next/navigation";
import { createSong, createPlaylist, fetchPlaylistsByAuthor } from "@/src/app/utils/api";
import { startTusUpload } from "@/src/app/utils/tusClient";
import { useUserId, useRouteRedirect } from "@/src/app/utils/auth";
import CreatePlaylistModal from "@/src/app/components/ui/createPlaylistModal";

export default function UploadPage() {
  const router = useRouter();
  const userId = useUserId();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [authorIds, setAuthorIds] = useState("");
  const [genre, setGenre] = useState("");
  const [album, setAlbum] = useState("");
  const [description, setDescription] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number | null>(null);
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const audioUploadRef = useRef<any | null>(null);
  const imageUploadRef = useRef<any | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Album/Playlist states
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  // Ensure this page is visited under the `/artist` route; otherwise redirect.
  useRouteRedirect('/artist', '/');

  useEffect(() => {
    // Set the current user's ID as the default author ID
    if (userId) {
      setAuthorIds(userId);
    }
  }, [userId]);

  // Fetch user's playlists/albums
  useEffect(() => {
    async function loadPlaylists() {
      if (!userId) return;
      try {
        setLoadingPlaylists(true);
        const data = await fetchPlaylistsByAuthor(userId);
        const playlists = data?.data || data || [];

        // In the artist area, show only albums (isAlbum: true)
        const filteredPlaylists = playlists.filter((p: any) => p.isAlbum === true);
        setUserPlaylists(filteredPlaylists);
      } catch (err: any) {
        console.error('Failed to fetch playlists:', err);
      } finally {
        setLoadingPlaylists(false);
      }
    }

    loadPlaylists();
  }, [userId]);

  // Route-based guard handles redirects; no userType checks here anymore.

  // Modal confirm handler used by CreatePlaylistModal
  async function handleModalConfirm(
    name: string,
    description: string,
    ownerIds: string[],
    picture?: string,
    isPublic?: boolean
  ) {
    if (!name.trim() || !userId) {
      setMessage("Invalid album data or missing user ID.");
      return;
    }

    try {
      setCreatingAlbum(true);
      setMessage("Creating album...");

      const payload = {
        name: name.trim(),
        description: description.trim() || "",
        picture: picture || "",
        isPublic: isPublic ?? true,
        isAlbum: true,
        ownerIds,
      };

      const created = await createPlaylist(payload);
      const albumId = created?.id || created?.data?.id;
      const albumData = created?.data || created;
      if (albumId) {
        setSelectedAlbumId(albumId);
        setAlbum(albumId);
        setUserPlaylists((prev) => [albumData, ...prev]);
        setMessage("Album created successfully!");
      } else {
        setMessage("Album created but ID not returned");
      }
    } catch (err: any) {
      console.error("Failed to create album:", err);
      setMessage(`Failed to create album: ${err?.message || err}`);
    } finally {
      setCreatingAlbum(false);
    }
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
          // Parse author IDs from comma-separated string
          const parsedAuthorIds = authorIds
            .split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0);

          // Use selected album ID or the manual album input
          const albumValue = selectedAlbumId || album.trim();
          const albumGuid = albumValue ? albumValue : null;

          const body = {
            name: title.trim(),
            description: description.trim() || "",
            releaseDate: new Date().toISOString(),
            authorIds: parsedAuthorIds,
            album: albumGuid,
            genre: genre.trim() || "",
            tags: ["/"],
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

      {/* Album Selection Section */}
      <div className="mb-6 bg-neutral-900 p-6 rounded">
        <h3 className="text-lg font-semibold mb-3">Album Selection</h3>
        
        {loadingPlaylists ? (
          <p className="text-gray-400">Loading your albums...</p>
        ) : userPlaylists.length > 0 ? (
          <>
            <p className="text-sm text-gray-400 mb-3">Select an existing album or create a new one:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {userPlaylists.map((playlist) => (
                <Button
                  key={playlist.id}
                  type="button"
                  variant={selectedAlbumId === playlist.id ? "default" : "outline"}
                  onClick={() => setSelectedAlbumId(selectedAlbumId === playlist.id ? null : playlist.id)}
                  className="p-3 h-auto text-left flex flex-col items-start"
                >
                  <div className="font-medium text-sm truncate w-full">{playlist.name || playlist.title}</div>
                  {playlist.description && (
                    <div className="text-xs text-gray-400 truncate mt-1 w-full">{playlist.description}</div>
                  )}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateAlbum(!showCreateAlbum)}
            >
              {showCreateAlbum ? 'Cancel' : 'Create New Album'}
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-400 mb-3">You don't have any albums yet. Create one to organize your songs!</p>
            <Button
              type="button"
              variant="default"
              onClick={() => setShowCreateAlbum(!showCreateAlbum)}
            >
              {showCreateAlbum ? 'Cancel' : 'Create Album'}
            </Button>
          </>
        )}

        <CreatePlaylistModal
          isOpen={showCreateAlbum}
          onClose={() => setShowCreateAlbum(false)}
          onConfirm={handleModalConfirm}
          isAlbum={true}
          userId={userId}
        />

        {selectedAlbumId && (
          <p className="text-sm text-green-400 mt-3">
            Album selected: {userPlaylists.find(p => p.id === selectedAlbumId)?.name || "New Album"}
          </p>
        )}
      </div>

      {/* Only show song upload form if an album is selected */}
      {!selectedAlbumId ? (
        <div className="bg-neutral-900 p-6 rounded text-center">
          <p className="text-gray-400">Please select or create an album before uploading a song.</p>
        </div>
      ) : (
        <form className="space-y-4 bg-neutral-900 p-6 rounded" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-gray-300">Title *</label>
          <input 
            name="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="mt-1 w-full rounded-md p-2 bg-neutral-800 border border-neutral-700" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Description</label>
          <textarea 
            name="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            className="mt-1 w-full rounded-md p-2 bg-neutral-800 border border-neutral-700" 
            rows={3}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Artist *</label>
          <input 
            name="artist" 
            value={artist} 
            onChange={(e) => setArtist(e.target.value)} 
            className="mt-1 w-full rounded-md p-2 bg-neutral-800 border border-neutral-700" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Author IDs (comma-separated) *</label>
          <input 
            name="authorIds" 
            value={authorIds} 
            onChange={(e) => setAuthorIds(e.target.value)} 
            className="mt-1 w-full rounded-md p-2 bg-neutral-800 border border-neutral-700" 
            placeholder="e.g., id1, id2, id3"
            required
          />
          <p className="mt-1 text-xs text-gray-400">Your ID is pre-filled. You can add more IDs separated by commas.</p>
        </div>

        <div>
          <label className="block text-sm text-gray-300">Genre *</label>
          <input 
            name="genre" 
            value={genre} 
            onChange={(e) => setGenre(e.target.value)} 
            className="mt-1 w-full rounded-md p-2 bg-neutral-800 border border-neutral-700" 
            required 
          />
        </div>

        {/* Hidden input for album GUID - auto-filled from selection */}
        <input type="hidden" name="album" value={selectedAlbumId || album} />

        <div>
          <label className="block text-sm text-gray-300 mb-2">Cover image *</label>
          <input 
            ref={coverFileInputRef}
            name="cover" 
            onChange={(e) => { handleCoverChange(e); }} 
            type="file" 
            accept="image/*" 
            className="hidden"
            required 
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => coverFileInputRef.current?.click()}
          >
            Choose Cover Image
          </Button>
          {coverPreview && (
            <img src={coverPreview} alt="cover" className="mt-2 h-28 w-28 object-cover rounded" />
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Audio file *</label>
          <input 
            ref={audioFileInputRef}
            name="audio" 
            onChange={handleAudioChange} 
            type="file" 
            accept="audio/*" 
            className="hidden"
            required 
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => audioFileInputRef.current?.click()}
          >
            Choose Audio File
          </Button>
          {audioName && <div className="mt-2 text-sm text-gray-300">Selected: {audioName}</div>}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="default" disabled={submitting}>
            {submitting ? "Uploading..." : "Upload"}
          </Button>

          {/* Show cancel-upload while there's an active upload */}
          {(audioUploadRef.current || imageUploadRef.current || submitting) && (
            <Button type="button" variant="destructive" onClick={handleCancelUpload}>
              Cancel Upload
            </Button>
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
      )}
    </div>
  );
}
