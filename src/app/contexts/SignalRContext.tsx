'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { EmojiReaction, ReactionResponse } from '@/src/app/types/emojiReaction';

type PlaybackState = {
  currentSongId: string | null;
  currentPosition: number;
  currentLength: number;
  nextSongId: string | null;
  isPlaying: boolean;
  lastUpdated: string;
};

type PlayerControls = {
  play: () => void;
  pause: () => void;
  seekTo: (position: number) => void;
  getCurrentPosition: () => number;
  loadSong: (songId: string) => void;
};

type SignalRContextType = {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
  playbackState: PlaybackState | null;
  currentPlaylistId: string | null;
  currentPlaylistSongs: string[];
  setCurrentPlaylistId: (id: string | null) => void;
  setCurrentPlaylistSongs: (songs: string[]) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinPlaylist: (playlistId: string) => Promise<void>;
  leavePlaylist: () => Promise<void>;
  playSong: (songId: string | null) => Promise<void>;
  playPause: (status: boolean) => Promise<void>;
  seek: (position: number) => Promise<void>;
  getPlaybackState: () => Promise<void>;
  activateState: (state: PlaybackState) => Promise<void>;
  setPlaylistSongs: (songIds: string[]) => void;
  setPlayerControls: (controls: PlayerControls | null) => void;
  // Reactions
  sendReaction: (reaction: EmojiReaction, songId?: string | null) => Promise<void>;
  setOnReactionListener: (listener: ((r: ReactionResponse) => void) | null) => void;
};

const SignalRContext = createContext<SignalRContextType>({
  connection: null,
  isConnected: false,
  playbackState: null,
  currentPlaylistId: null,
  currentPlaylistSongs: [],
  setCurrentPlaylistId: () => {},
  setCurrentPlaylistSongs: () => {},
  connect: async () => {},
  disconnect: async () => {},
  joinPlaylist: async () => {},
  leavePlaylist: async () => {},
  playSong: async () => {},
  playPause: async () => {},
  seek: async () => {},
  getPlaybackState: async () => {},
  activateState: async () => {},
  setPlaylistSongs: () => {},
  setPlayerControls: () => {},
  // Reactions defaults
  sendReaction: async () => {},
  setOnReactionListener: () => {},
});

export const useSignalR = () => useContext(SignalRContext);

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [currentPlaylistSongs, setCurrentPlaylistSongs] = useState<string[]>([]);
  
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const playlistSongsRef = useRef<string[]>([]);
  const playerControlsRef = useRef<PlayerControls | null>(null);
  const reactionListenerRef = useRef<((r: ReactionResponse) => void) | null>(null);

  const connect = async () => {
    console.log('Attempting to connect to SignalR...', { isConnected, connectionExists: !!connectionRef.current });
    if (connectionRef.current && isConnected) {
      console.log('Already connected');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No access token found');
    }

    const contentBase = process.env.NEXT_PUBLIC_CONTENT_BASE || 'http://localhost:5039';
    const hubUrl = `${contentBase}/live`;
    console.log('Initializing SignalR connection to', hubUrl);

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          const currentToken = localStorage.getItem('accessToken');
          console.log('Providing token for SignalR connection:', currentToken ? 'Token found' : 'No token');
          return currentToken || '';
        },
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = newConnection;
    setConnection(newConnection);

    // Listen for PlaybackState updates from server
    newConnection.on('PlaybackState', (state: PlaybackState) => {
      console.log('Received PlaybackState:', state);
      activateState(state);
    });

    // Listen for emoji reactions from server
    newConnection.on('ReceiveReaction', (reaction: ReactionResponse) => {
      try {
        console.log('Received Reaction:', reaction);
        if (reactionListenerRef.current) {
          reactionListenerRef.current(reaction);
        }
      } catch (err) {
        console.error('Error handling ReceiveReaction:', err);
      }
    });

    // Handle reconnection events
    newConnection.onreconnecting((error) => {
      console.log('SignalR Reconnecting...', error);
      setIsConnected(false);
    });

    newConnection.onreconnected((connectionId) => {
      console.log('SignalR Reconnected:', connectionId);
      setIsConnected(true);
    });

    newConnection.onclose((error) => {
      console.log('SignalR Connection Closed', error);
      setIsConnected(false);
    });

    // Start connection
    console.log('Starting SignalR connection...');
    try {
      await newConnection.start();
      console.log('✅ SignalR Connected successfully');
      setIsConnected(true);
    } catch (err: any) {
      console.error('❌ SignalR Connection Error:', err);
      // If WebSockets failed, try long polling as a fallback
      try {
        console.log('Attempting LongPolling fallback for SignalR...');
        const fallbackConnection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => localStorage.getItem('accessToken') || '',
            transport: signalR.HttpTransportType.LongPolling,
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Information)
          .build();

        connectionRef.current = fallbackConnection;
        setConnection(fallbackConnection);
        await fallbackConnection.start();
        console.log('✅ SignalR Connected with LongPolling fallback');
        setIsConnected(true);
      } catch (fallbackErr) {
        console.error('LongPolling fallback failed:', fallbackErr);
      }
      const contentBase = process.env.NEXT_PUBLIC_CONTENT_BASE || 'http://localhost:5039';
      console.error('Error details:', {
        message: err.message,
        statusCode: err.statusCode,
        url: `${contentBase}/live`
      });
      setIsConnected(false);
      throw err;
    }
  };

  const disconnect = async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
      connectionRef.current = null;
      setConnection(null);
      setIsConnected(false);
      console.log('SignalR disconnected');
    }
  };

  const activateState = async (state: PlaybackState) => {
    if (state.currentSongId === null) {
      if (playlistSongsRef.current.length === 0) return;
      // Play the first song from the playlist
      const firstSongId = playlistSongsRef.current[0];
      console.log('Playing first song in playlist:', firstSongId);
      try {
        setPlaybackState(state);
        await playSong(firstSongId);
      } catch (err) {
        console.error('Failed to play first song:', err);
      }
      return;
    }
    setPlaybackState(state);
  };

  const joinPlaylist = async (playlistId: string) => {
    const currentConnection = connectionRef.current;
    if (!currentConnection || currentConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await currentConnection.invoke('JoinPlaylist', playlistId);
      setCurrentPlaylistId(playlistId);
      console.log('Joined playlist:', playlistId);
    } catch (err) {
      console.error('Error joining playlist:', err);
      throw err;
    }
  };

  const leavePlaylist = async () => {
    const currentConnection = connectionRef.current;
    if (!currentConnection || currentConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await currentConnection.invoke('LeavePlaylist');
      console.log('Left playlist');
      setPlaybackState(null);
      playlistSongsRef.current = [];
      setCurrentPlaylistId(null);
      try {
        localStorage.removeItem('currentPlaylistId');
      } catch (err) {
        console.warn('Could not remove stored playlist id:', err);
      }
    } catch (err) {
      console.error('Error leaving playlist:', err);
      throw err;
    }
  };

  // Persist current playlist id to localStorage so a page refresh can restore it
  useEffect(() => {
    try {
      if (currentPlaylistId) {
        localStorage.setItem('currentPlaylistId', currentPlaylistId);
      } else {
        localStorage.removeItem('currentPlaylistId');
      }
    } catch (err) {
      console.warn('Could not persist current playlist id:', err);
    }
  }, [currentPlaylistId]);

  // Note: auto-join on reconnect was removed so pages control joining explicitly.

  const playSong = async (songId: string | null) => {
    const currentConnection = connectionRef.current;
    if (!currentConnection || currentConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await currentConnection.invoke('PlaySong', songId);
    } catch (err) {
      console.error('Error playing song:', err);
      throw err;
    }
  };

  const playPause = async (status: boolean) => {
    const currentConnection = connectionRef.current;
    if (!currentConnection || currentConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await currentConnection.invoke('PlayPause', status);
    } catch (err) {
      console.error('Error toggling play/pause:', err);
      throw err;
    }
  };

  const seek = async (position: number) => {
    const currentConnection = connectionRef.current;
    if (!currentConnection || currentConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await currentConnection.invoke('Seek', position);
    } catch (err) {
      console.error('Error seeking:', err);
      throw err;
    }
  };

  const getPlaybackState = async () => {
    const currentConnection = connectionRef.current;
    console.log('getPlaybackState check - connection exists:', !!currentConnection, 'state:', currentConnection?.state);
    
    if (!currentConnection || currentConnection.state !== signalR.HubConnectionState.Connected) {
      console.error('Cannot get playback state: SignalR connection not established');
      throw new Error('SignalR connection not established');
    }
    try {
      await currentConnection.invoke('GetPlaybackState');
    } catch (err) {
      console.error('Error getting playback state:', err);
      throw err;
    }
  };

  const setPlaylistSongs = (songIds: string[]) => {
    playlistSongsRef.current = songIds;
    setCurrentPlaylistSongs(songIds);
    console.log('Playlist songs updated:', songIds.length, 'songs', playlistSongsRef.current);
  };

  const sendReaction = async (reaction: EmojiReaction, songId?: string | null) => {
    const currentConnection = connectionRef.current;
    if (!currentConnection || currentConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }
    try {
      // Server expects SendReaction(EmojiReaction reaction)
      await currentConnection.invoke('SendReaction', reaction);
    } catch (err) {
      console.error('Error sending reaction:', err);
      throw err;
    }
  };

  const setOnReactionListener = (listener: ((r: ReactionResponse) => void) | null) => {
    reactionListenerRef.current = listener;
  };

  const setPlayerControls = (controls: PlayerControls | null) => {
    playerControlsRef.current = controls;
    console.log('Player controls set:', controls ? 'Controls available' : 'Controls cleared');
  };

  return (
    <SignalRContext.Provider
      value={{
        connection,
        isConnected,
        playbackState,
        currentPlaylistId,
        currentPlaylistSongs,
        setCurrentPlaylistId,
        setCurrentPlaylistSongs,
        connect,
        disconnect,
        joinPlaylist,
        leavePlaylist,
        playSong,
        playPause,
        seek,
        getPlaybackState,
        activateState,
        setPlaylistSongs,
        setPlayerControls,
          sendReaction,
          setOnReactionListener,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
}
