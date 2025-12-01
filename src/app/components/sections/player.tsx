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
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import { fetchWithAuth } from "../../utils/api";

export default function Player() {
  const {
    currentSong,
    setCurrentSong,
    isPlaying,
    setIsPlaying,
  } = useContext(PlayerContext);

  const { playbackState, playSong, playPause, seek, isConnected, setPlayerControls } = useSignalR();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const controlsRegistered = useRef(false);
  const lastProcessedSongId = useRef<string | null>(null);
  const lastIsPlayingState = useRef<boolean>(false);
  const lastPreloadedNextSongId = useRef<string | null>(null);

  // Register player controls with SignalR context only once
  useEffect(() => {
    if (controlsRegistered.current) return;
    
    const controls = {
      play: () => {
        if (audioRef.current && audioRef.current.readyState >= 2) {
          audioRef.current.play().catch((error) => {
            console.error('Error playing audio:', error);
          });
        }
      },
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      },
      seekTo: (position: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = position;
        }
      },
      getCurrentPosition: () => {
        return audioRef.current?.currentTime || 0;
      },
      loadSong: (songId: string) => {
        if (audioRef.current) {
          const audioUrl = `http://localhost:5039/contents/audio/${songId}`;
          audioRef.current.src = audioUrl;
          audioRef.current.load();
        }
      },
    };

    setPlayerControls(controls);
    controlsRegistered.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync with SignalR playback state
  useEffect(() => {
    if (!playbackState || !audioRef.current) return;

    console.log('📥 Received server state:', { songId: playbackState.currentSongId, isPlaying: playbackState.isPlaying, position: playbackState.currentPosition });

    if (playbackState.currentSongId === null) return;

    // Update isPlaying based on server state
    if (playbackState.isPlaying !== lastIsPlayingState.current) {
      lastIsPlayingState.current = playbackState.isPlaying;
      setIsPlaying(playbackState.isPlaying);
      
      // Control audio element based on server state
      if (playbackState.isPlaying) {
        if (audioRef.current.readyState >= 2) {
          audioRef.current.play().catch((error) => {
            console.error("Error playing audio:", error);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }

    // Update current position and sync audio element (only if not seeking)
    if (!isSeeking) {
      const timeDiff = Math.abs(audioRef.current.currentTime - playbackState.currentPosition);
      // Only seek if difference is significant to avoid jitter
      if (timeDiff > 1) {
        audioRef.current.currentTime = playbackState.currentPosition;
        setCurrentTime(playbackState.currentPosition);
      }
    }

    // Update duration
    if (playbackState.currentLength !== duration && playbackState.currentLength > 0) {
      setDuration(playbackState.currentLength);
    }

    // If song changed, fetch song details and update current song
    if (playbackState.currentSongId && playbackState.currentSongId !== lastProcessedSongId.current) {
      lastProcessedSongId.current = playbackState.currentSongId;
      
      // Fetch song details from API
      const fetchSongDetails = async () => {
        try {
          const response = await fetchWithAuth(`http://localhost:8080/api/v1/Songs/${playbackState.currentSongId}`, {
          });
          
          if (response.ok) {
            const json = await response.json();
            if (json.success && json.data) {
              const songData = json.data;
              console.log("Fetched song details:", songData);
              
              // Handle authors - could be array or single object
              let authorName = "Unknown";
              if (songData.authors) {
                if (Array.isArray(songData.authors)) {
                  authorName = songData.authors.map((a: any) => a.name).join(", ");
                } else if (songData.authors.name) {
                  authorName = songData.authors.name;
                }
              }
              
              const newSong = {
                id: songData.id,
                title: songData.name,
                album: "", // API doesn't provide album
                image: `http://localhost:5039/contents/images/${songData.id}`,
                author: authorName,
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

      // Pause current playback before loading new song to prevent interruption error
      audioRef.current.pause();
      
      // Load the new song audio
      const audioUrl = `http://localhost:5039/contents/audio/${playbackState.currentSongId}`;
      setIsLoadingAudio(true);
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      
      // Wait for audio to be ready before playing
      const handleCanPlay = () => {
        if (audioRef.current && playbackState.isPlaying) {
          audioRef.current.currentTime = playbackState.currentPosition;
          audioRef.current.play().catch((error) => {
            console.error("Error playing audio:", error);
          });
        }
        setIsLoadingAudio(false);
        audioRef.current?.removeEventListener('canplay', handleCanPlay);
      };
      
      audioRef.current.addEventListener('canplay', handleCanPlay);
    }

    // Preload next song if provided by server
    if (playbackState.nextSongId && playbackState.nextSongId !== lastPreloadedNextSongId.current) {
      lastPreloadedNextSongId.current = playbackState.nextSongId;
      
      if (!nextAudioRef.current) {
        nextAudioRef.current = new Audio();
      }
      
      const nextAudioUrl = `http://localhost:5039/contents/audio/${playbackState.nextSongId}`;
      nextAudioRef.current.src = nextAudioUrl;
      nextAudioRef.current.load();
      console.log('🔄 Preloading next song:', playbackState.nextSongId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState, isSeeking]);

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

  // This effect is no longer needed - songs are loaded from server state only
  // Keeping for duration parsing from initial song metadata
  useEffect(() => {
    if (!currentSong?.duration) return;
    
    const parsedDuration = parseDuration(currentSong.duration);
    if (parsedDuration > 0 && parsedDuration !== duration) {
      setDuration(parsedDuration);
    }
  }, [currentSong?.duration, duration]);

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
    
    // Check if there's a next song available
    if (!playbackState?.nextSongId) {
      console.warn('No next song available');
      return;
    }
    
    console.log('📤 Sending PlaySong: next');
    try {
      await playSong(null);
    } catch (error) {
      console.error('Error playing next song:', error);
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
      handleNext();
    };

    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [handleNext]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isConnected, isPlaying]);

  if (!currentSong) return null;

  const togglePlay = async () => {
    if (!isConnected) {
      console.warn('Not connected to SignalR');
      return;
    }
    console.log('📤 Sending PlayPause:', !isPlaying);
    try {
      await playPause(!isPlaying);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
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
    console.log('📤 Sending Seek:', seekPosition);
    try {
      await seek(seekPosition);
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl px-4 overflow-hidden">
      <audio ref={audioRef} />
      {/* Hidden audio element for preloading next song */}
      <audio ref={nextAudioRef} style={{ display: 'none' }} />

      <div className="flex items-center justify-between py-3 gap-4">
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pl-2">
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
              className={`p-2 rounded-full transition text-white ${
                playbackState?.nextSongId 
                  ? 'hover:bg-neutral-700 cursor-pointer' 
                  : 'opacity-30 cursor-not-allowed'
              }`}
              title={playbackState?.nextSongId ? "Next" : "No next song"}
              disabled={!playbackState?.nextSongId}
            >
              <ForwardIcon className="w-5 h-5" />
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
              value={currentTime || 0}
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
        <div className="flex items-center gap-3 flex-1 justify-end pr-4">
          <div className="flex items-center gap-2 max-w-[140px] w-full">
            {volume === 0 ? (
              <SpeakerXMarkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <SpeakerWaveIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
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
