import { cache, CacheTTL } from './cache';

const OSU_CLIENT_ID = process.env.OSU_CLIENT_ID;
const OSU_CLIENT_SECRET = process.env.OSU_CLIENT_SECRET;
const OSU_USERNAME = process.env.OSU_USERNAME;

interface OsuToken {
  access_token: string;
  expires_in: number;
}

const TOKEN_CACHE_KEY = 'osu_token';
const DATA_CACHE_KEY = 'osu_data';

async function getAccessToken(): Promise<string | null> {
  if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
    console.warn('osu! credentials not configured');
    return null;
  }


  const cached = cache.get<string>(TOKEN_CACHE_KEY);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch('https://osu.ppy.sh/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: OSU_CLIENT_ID,
        client_secret: OSU_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'public',
      }),
    });

    if (!response.ok) {
      console.error('osu! token request failed:', response.status);
      return null;
    }

    const data = await response.json() as OsuToken;

    const ttl = (data.expires_in * 1000) - CacheTTL.TOKEN_MARGIN;
    cache.set(TOKEN_CACHE_KEY, data.access_token, Math.max(ttl, CacheTTL.SHORT));

    return data.access_token;
  } catch (error) {
    console.error('Error getting osu! access token:', error);
    return null;
  }
}

export async function getOsuData() {
  if (!OSU_USERNAME) {
    console.warn('osu! username not configured');
    return null;
  }

  const cached = cache.get<{ user: unknown; recentActivity: unknown }>(DATA_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const token = await getAccessToken();
  if (!token) return null;

  try {
    const [userResponse, activityResponse] = await Promise.all([
      fetch(`https://osu.ppy.sh/api/v2/users/${OSU_USERNAME}/osu`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }),
      fetch(`https://osu.ppy.sh/api/v2/users/${OSU_USERNAME}/recent_activity`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }),
    ]);

    if (!userResponse.ok) {
      console.error('osu! user fetch failed:', userResponse.status);
      return null;
    }

    const userData = await userResponse.json();
    const activityData = activityResponse.ok ? await activityResponse.json() : [];

    const result = {
      user: userData,
      recentActivity: activityData[0] || null,
    };

    cache.set(DATA_CACHE_KEY, result, CacheTTL.MEDIUM);

    return result;
  } catch (error) {
    console.error('Error fetching osu! data:', error);
    return null;
  }
}