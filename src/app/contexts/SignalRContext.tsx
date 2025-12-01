'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

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
};

const SignalRContext = createContext<SignalRContextType>({
  connection: null,
  isConnected: false,
  playbackState: null,
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

    console.log('Initializing SignalR connection to http://localhost:5039/live');

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5039/live', {
        accessTokenFactory: () => {
          const currentToken = localStorage.getItem('accessToken');
          console.log('Providing token for SignalR connection:', currentToken ? 'Token found' : 'No token');
          return currentToken || '';
        },
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
      console.error('Error details:', {
        message: err.message,
        statusCode: err.statusCode,
        url: 'http://localhost:5039/live'
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
      setCurrentPlaylistId(null);
      setCurrentPlaylistSongs([]);
      playlistSongsRef.current = [];
    } catch (err) {
      console.error('Error leaving playlist:', err);
      throw err;
    }
  };

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
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
}
