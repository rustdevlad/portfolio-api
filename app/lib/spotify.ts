import { cache, CacheTTL } from './cache';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const getBasicAuth = () => {
  if (typeof btoa !== 'undefined') {
    return btoa(`${client_id}:${client_secret}`);
  }
  return Buffer.from(`${client_id}:${client_secret}`).toString('base64');
};

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  error?: string;
}

const CACHE_KEY = 'spotify_token';

async function getAccessToken(): Promise<SpotifyToken | null> {
  if (!refresh_token || !client_id || !client_secret) {
    console.warn('Spotify credentials not configured');
    return null;
  }

  const cached = cache.get<SpotifyToken>(CACHE_KEY);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${getBasicAuth()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      }),
    });

    if (!response.ok) {
      console.error('Spotify token refresh failed:', response.status);
      return null;
    }

    const token = await response.json() as SpotifyToken;

    if (token.error) {
      console.error('Spotify token error:', token.error);
      return null;
    }

    const ttl = (token.expires_in * 1000) - CacheTTL.TOKEN_MARGIN;
    cache.set(CACHE_KEY, token, Math.max(ttl, CacheTTL.SHORT));

    return token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    return null;
  }
}

export async function getNowPlaying(): Promise<Response> {
  const token = await getAccessToken();
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  return fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
    cache: 'no-store',
  });
}
