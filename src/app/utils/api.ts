export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let authHeader: Record<string, string> = {}
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) authHeader = { Authorization: `Bearer ${token}` }
    }
  } catch (err) {
    console.warn('Could not read accessToken from localStorage', err)
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...authHeader,
    },
  });

  // if (res.status === 401 || res.status === 403) {
  //   window.location.href = '/auth/login';
  //   return res;
  // }

  return res; // Return the raw Response object
}

export async function createSong(payload: any) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Songs`;

  const res = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Create song failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return res.json().catch(() => null);
}

export async function fetchPlaylistsByAuthor(authorId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/users/${authorId}/playlists`;
  console.log("Fetching playlists for author:", url, authorId);

  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Fetch playlists failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return res.json().catch(() => []);
}

export async function fetchPlaylistsByUser(userId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists`;

  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Fetch playlists failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return res.json().catch(() => []);
}

export async function fetchPublicPlaylists() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists`;

  console.log("Fetching public playlists from:", url);

  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    console.error("Error fetching public playlists:", text);
    throw new Error(`Fetch public playlists failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const data = await res.json().catch(() => []);
  console.log("Public playlists data received:", data);
  return data;
}

export async function fetchUserPlaylists(userId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  const url = `${base}/api/v1/users/${userId}/playlists`;

  console.log("Fetching user playlists from:", url);

  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  console.log("Response status:", res.status, res.statusText);

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    console.error("Error response:", text);
    throw new Error(`Fetch user playlists failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const data = await res.json().catch(() => []);
  console.log("Playlists data received:", data);
  return data;
}

export async function createPlaylist(payload: any) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists`;

  console.log("Creating playlist with payload:", payload);

  try {
    const res = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      const errorMessage = text ? `${res.status} ${res.statusText}: ${text}` : `${res.status} ${res.statusText}`;
      console.error("Create playlist error:", errorMessage);
      throw new Error(`Create playlist failed: ${errorMessage}`);
    }

    const data = await res.json().catch(() => null);
    console.log("Playlist created:", data);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Create playlist exception:", error.message);
      throw error;
    }
    console.error("Create playlist unknown error:", error);
    throw new Error(`Create playlist failed: Unknown error ${String(error)}`);
  }
}

export async function addSongToPlaylist(playlistId: string, songId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists/${playlistId}/songs/${songId}`;

  console.log("Adding song to playlist:", { playlistId, songId });

  const res = await fetchWithAuth(url, {
    method: 'POST',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    console.error("Add song to playlist error:", text);
    throw new Error(`Add song to playlist failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  console.log("Song added to playlist successfully");
  return res.ok;
}
