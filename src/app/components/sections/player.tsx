'use client';

import React, { useContext, useRef, useEffect, useState } from "react";
import Image from "next/image";
import { PlayerContext } from "@/src/app/dashboard/layout";
import { useSignalR } from "@/src/app/contexts/SignalRContext";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathRoundedSquareIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/solid";

export default function Player() {
  const {
    currentSong,
    setCurrentSong,
    isPlaying,
    setIsPlaying,
    isShuffled,
    setIsShuffled,
    repeatMode,
    setRepeatMode,
  } = useContext(PlayerContext);

  const { playbackState, playSong, playPause, seek, isConnected } = useSignalR();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isSeeking, setIsSeeking] = useState(false);

  // Sync with SignalR playback state
  useEffect(() => {
    if (!playbackState || !audioRef.current) return;

    console.log('Received playback state update:', playbackState);

    // Update isPlaying based on server state
    if (playbackState.isPlaying !== isPlaying) {
      setIsPlaying(playbackState.isPlaying);
    }

    // Update current position and sync audio element
    if (!isSeeking) {
      const timeDiff = Math.abs(audioRef.current.currentTime - playbackState.currentPosition);
      // Only seek if difference is significant (> 1 second) to avoid jitter
      if (timeDiff > 1) {
        audioRef.current.currentTime = playbackState.currentPosition;
      }
      setCurrentTime(playbackState.currentPosition);
    }

    // Update duration
    if (playbackState.currentLength !== duration) {
      setDuration(playbackState.currentLength);
    }

    // If song changed, fetch song details and update current song
    if (playbackState.currentSongId && playbackState.currentSongId !== currentSong?.id) {
      // Fetch song details from API
      const fetchSongDetails = async () => {
        try {
          const response = await fetch(`http://localhost:8080/api/v1/Songs/${playbackState.currentSongId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          
          if (response.ok) {
            const json = await response.json();
            if (json.success && json.data) {
              const songData = json.data;
              const newSong = {
                id: songData.id,
                title: songData.name,
                album: "", // API doesn't provide album
                image: `http://localhost:5039/contents/images/${songData.id}`,
                author: songData.authorNames?.join(", ") || "Unknown",
                dateAdded: new Date(songData.releaseDate).toLocaleDateString(),
                duration: songData.duration,
              };
              setCurrentSong(newSong);
            }
          }
        } catch (error) {
          console.error('Error fetching song details:', error);
        }
      };

      fetchSongDetails();

      // Load the new song audio
      const audioUrl = `http://localhost:5039/contents/audio/${playbackState.currentSongId}`;
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = playbackState.currentPosition;
      audioRef.current.load();
      if (playbackState.isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    }
  }, [playbackState, currentSong?.id, setCurrentSong, isPlaying, setIsPlaying, duration, isSeeking]);

  // Parse duration from song (format: "MM:SS" or "H:MM:SS")
  const parseDuration = (durationString: string): number => {
    const parts = durationString.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Update progress bar every half second
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && isPlaying && !isSeeking) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, isSeeking]);

  // Load song when currentSong changes
  useEffect(() => {
    if (!currentSong?.id || !audioRef.current) return;

    setCurrentTime(0);

    if (currentSong.duration) {
      const parsedDuration = parseDuration(currentSong.duration);
      setDuration(parsedDuration);
    }

    const audioUrl = `http://localhost:5039/contents/audio/${currentSong.id}`;
    audioRef.current.src = audioUrl;
    audioRef.current.load();

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    }
  }, [currentSong?.id, currentSong?.duration, isPlaying, setIsPlaying]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleNext = async () => {
    if (!isConnected) {
      console.warn('Not connected to SignalR');
      return;
    }
    try {
      // Wait for server to acknowledge before state updates via PlaybackState callback
      await playSong(null);
      console.log('PlaySong (next) acknowledged by server');
    } catch (error) {
      console.error('Error playing next song:', error);
    }
  };

  const handlePrevious = async () => {
    if (!isConnected) {
      console.warn('Not connected to SignalR');
      return;
    }
    if (audioRef.current && currentTime > 3) {
      try {
        // Wait for server to acknowledge seek command
        await seek(0);
        console.log('Seek to start acknowledged by server');
      } catch (error) {
        console.error('Error seeking to start:', error);
      }
    } else {
      // TODO: Implement previous song logic
      console.log('Previous song not yet implemented');
    }
  };

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleDurationChange = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [repeatMode]);

  if (!currentSong) return null;

  const togglePlay = async () => {
    if (!isConnected) {
      console.warn('Not connected to SignalR');
      return;
    }
    console.log("Toggle play clicked. Current isPlaying:", isPlaying, "-> Sending:", !isPlaying);
    try {
      // Wait for server to acknowledge before state updates via PlaybackState callback
      await playPause(!isPlaying);
      console.log('PlayPause acknowledged by server');
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isConnected) {
      console.warn('Not connected to SignalR');
      return;
    }
    const newTime = parseFloat(e.target.value);
    // Only update visual slider, don't update audio yet
    setCurrentTime(newTime);
    setIsSeeking(true);
  };

  const handleSeekEnd = async () => {
    if (!isConnected || isSeeking === false) return;
    
    const seekPosition = Math.floor(currentTime);
    try {
      // Wait for server acknowledgment before seeking audio
      await seek(seekPosition);
      console.log('Seek acknowledged by server, position:', seekPosition);
      setIsSeeking(false);
    } catch (error) {
      console.error('Error seeking:', error);
      setIsSeeking(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl">
      <audio ref={audioRef} />

      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Image
            src={currentSong.image}
            alt={currentSong.title}
            width={56}
            height={56}
            className="rounded-md flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white truncate">{currentSong.title}</p>
            <p className="text-sm text-gray-400 truncate">{currentSong.author}</p>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full hover:bg-neutral-700 transition ${
                isShuffled ? "text-green-500" : "text-gray-400"
              }`}
              title="Shuffle"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrevious}
              className="p-2 rounded-full hover:bg-neutral-700 transition text-white"
              title="Previous"
            >
              <BackwardIcon className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-white hover:bg-gray-200 transition text-black"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:bg-neutral-700 transition text-white"
              title="Next"
            >
              <ForwardIcon className="w-5 h-5" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full hover:bg-neutral-700 transition relative ${
                repeatMode !== "off" ? "text-green-500" : "text-gray-400"
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              <ArrowPathRoundedSquareIcon className="w-4 h-4" />
              {repeatMode === "one" && (
                <span className="absolute text-[10px] font-bold top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="flex-1 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background:
                  duration > 0
                    ? `linear-gradient(to right, white ${
                        (currentTime / duration) * 100
                      }%, rgb(64, 64, 64) ${(currentTime / duration) * 100}%)`
                    : "rgb(64, 64, 64)",
              }}
            />
            <span className="text-xs text-gray-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="flex items-center gap-2 w-32">
            <span className="text-lg">
              {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${volume * 100}%, rgb(64,64,64) ${volume * 100}%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
