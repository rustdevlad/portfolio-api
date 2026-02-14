const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;

export async function getRecentTracks(limit: number = 1) {
  if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
    console.warn('Last.fm credentials not configured');
    return null;
  }

  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error('Last.fm API error:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    return null;
  }
}