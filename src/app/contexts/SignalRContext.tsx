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

type SignalRContextType = {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
  playbackState: PlaybackState | null;
  joinPlaylist: (playlistId: string) => Promise<void>;
  leavePlaylist: () => Promise<void>;
  playSong: (songId: string | null) => Promise<void>;
  playPause: (status: boolean) => Promise<void>;
  seek: (position: number) => Promise<void>;
  getPlaybackState: () => Promise<void>;
};

const SignalRContext = createContext<SignalRContextType>({
  connection: null,
  isConnected: false,
  playbackState: null,
  joinPlaylist: async () => {},
  leavePlaylist: async () => {},
  playSong: async () => {},
  playPause: async () => {},
  seek: async () => {},
  getPlaybackState: async () => {},
});

export const useSignalR = () => useContext(SignalRContext);

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found, skipping SignalR connection');
      return;
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
      setPlaybackState(state);
    });

    // Start connection
    console.log('Starting SignalR connection...');
    newConnection
      .start()
      .then(() => {
        console.log('✅ SignalR Connected successfully');
        setIsConnected(true);
      })
      .catch((err) => {
        console.error('❌ SignalR Connection Error:', err);
        console.error('Error details:', {
          message: err.message,
          statusCode: err.statusCode,
          url: 'http://localhost:5039/live'
        });
        setIsConnected(false);
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

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const joinPlaylist = async (playlistId: string) => {
    if (!connection || !isConnected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await connection.invoke('JoinPlaylist', playlistId);
      console.log('Joined playlist:', playlistId);
    } catch (err) {
      console.error('Error joining playlist:', err);
      throw err;
    }
  };

  const leavePlaylist = async () => {
    if (!connection || !isConnected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await connection.invoke('LeavePlaylist');
      console.log('Left playlist');
      setPlaybackState(null);
    } catch (err) {
      console.error('Error leaving playlist:', err);
      throw err;
    }
  };

  const playSong = async (songId: string | null) => {
    if (!connection || !isConnected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await connection.invoke('PlaySong', songId);
      console.log('PlaySong invoked:', songId);
    } catch (err) {
      console.error('Error playing song:', err);
      throw err;
    }
  };

  const playPause = async (status: boolean) => {
    if (!connection || !isConnected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await connection.invoke('PlayPause', status);
      console.log('PlayPause invoked:', status);
    } catch (err) {
      console.error('Error toggling play/pause:', err);
      throw err;
    }
  };

  const seek = async (position: number) => {
    if (!connection || !isConnected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await connection.invoke('Seek', position);
      console.log('Seek invoked:', position);
    } catch (err) {
      console.error('Error seeking:', err);
      throw err;
    }
  };

  const getPlaybackState = async () => {
    if (!connection || !isConnected) {
      throw new Error('SignalR connection not established');
    }
    try {
      await connection.invoke('GetPlaybackState');
      console.log('GetPlaybackState invoked');
    } catch (err) {
      console.error('Error getting playback state:', err);
      throw err;
    }
  };

  return (
    <SignalRContext.Provider
      value={{
        connection,
        isConnected,
        playbackState,
        joinPlaylist,
        leavePlaylist,
        playSong,
        playPause,
        seek,
        getPlaybackState,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
}
