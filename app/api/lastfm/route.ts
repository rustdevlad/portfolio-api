import { getRecentTracks } from '../../lib/lastfm';
import { jsonResponse, optionsResponse, CacheControl } from '../../lib/response';
import type { LastFmTrack } from '../../types';

export const runtime = 'edge';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const data = await getRecentTracks();

    if (!data?.recenttracks?.track?.[0]) {
      return jsonResponse({ tracks: [] }, { cache: CacheControl.NO_CACHE });
    }

    const first = data.recenttracks.track[0];
    const isNowPlaying = first['@attr']?.nowplaying === 'true';
    const timestamp = first.date?.uts ?? (isNowPlaying ? String(Math.floor(Date.now() / 1000)) : undefined);

    const tracks: LastFmTrack[] = [{
      name: first.name,
      artist: first.artist['#text'],
      album: first.album['#text'],
      albumImageUrl: first.image.find((img: { size: string; '#text': string }) => img.size === 'large')?.['#text'] || '',
      url: decodeURIComponent(first.url),
      isNowPlaying,
      timestamp,
    }];

    return jsonResponse({ tracks }, { cache: CacheControl.NO_CACHE });
  } catch (error) {
    console.error('Last.fm error:', error);
    return jsonResponse({ tracks: [] }, { cache: CacheControl.NO_CACHE });
  }
}