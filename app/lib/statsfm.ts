const STATSFM_USERNAME = process.env.STATSFM_USERNAME;

interface StatsFmArtist {
  name: string;
}

interface StatsFmAlbum {
  name: string;
  image: string;
}

interface StatsFmTrack {
  id: number;
  name: string;
  artists: StatsFmArtist[];
  albums?: StatsFmAlbum[];
  spotifyPopularity?: number;
  explicit?: boolean;
  durationMs?: number;
}

interface StatsFmResponse {
  item?: {
    track: StatsFmTrack;
    isPlaying: boolean;
    progressMs: number;
    platform: string;
    date?: string;
  };
}

export async function getCurrentTrack() {
  if (!STATSFM_USERNAME) {
    console.warn('Stats.fm username not configured');
    return null;
  }

  const url = `https://api.stats.fm/api/v1/users/${STATSFM_USERNAME}/streams/current`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Stats.fm API error:', response.status);
      return null;
    }

    const data = await response.json() as StatsFmResponse;

    if (!data.item) {
      return null;
    }

    const { track } = data.item;

    return {
      name: track.name,
      artists: track.artists.map((artist) => artist.name).join(', '),
      album: track.albums?.[0]?.name || 'Unknown',
      albumImageUrl: track.albums?.[0]?.image || '',
      url: `https://stats.fm/track/${track.id}`,
      isPlaying: data.item.isPlaying,
      progressMs: data.item.progressMs,
      platform: data.item.platform,
      spotifyPopularity: track.spotifyPopularity || 0,
      explicit: track.explicit || false,
      durationMs: track.durationMs || 0,
      date: data.item.date || null
    };
  } catch (error) {
    console.error('Error fetching Stats.fm data:', error);
    return null;
  }
}