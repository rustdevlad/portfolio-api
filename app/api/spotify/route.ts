import { getNowPlaying } from '../../lib/spotify';
import { jsonResponse, optionsResponse, CacheControl } from '../../lib/response';
import type { SpotifyTrack } from '../../types';

export const runtime = 'edge';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const response = await getNowPlaying();

    if (response.status === 401 || response.status === 204) {
      return jsonResponse({ isPlaying: false }, { cache: CacheControl.NO_CACHE });
    }

    if (!response.ok) {
      console.error('Spotify API error:', response.status);
      return jsonResponse({ isPlaying: false }, { cache: CacheControl.NO_CACHE });
    }

    const song = (await response.json()) as SpotifyTrack;

    return jsonResponse(
      {
        isPlaying: song.is_playing,
        title: song.item?.name,
        artist: song.item?.artists.map(artist => artist.name).join(', '),
        album: song.item?.album?.name,
        albumImageUrl: song.item?.album?.images[0]?.url,
        songUrl: song.item?.external_urls?.spotify,
      },
      { cache: CacheControl.NO_CACHE }
    );
  } catch (error) {
    console.error('Spotify error:', error);
    return jsonResponse({ isPlaying: false }, { cache: CacheControl.NO_CACHE });
  }
}