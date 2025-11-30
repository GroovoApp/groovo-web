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

export async function createPlaylist(payload: any) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists`;

  const res = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Create playlist failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return res.json().catch(() => null);
}
