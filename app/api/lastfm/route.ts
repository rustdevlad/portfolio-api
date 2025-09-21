import { getRecentTracks } from '../../lib/lastfm';
import type { LastFmTrack } from '../../types';

export const runtime = 'edge';

export async function GET() {
  try {
    const data = await getRecentTracks();

    if (!data) {
      return new Response(
        JSON.stringify({ tracks: [] }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const first = data?.recenttracks?.track?.[0];

    if (!first) {
      return new Response(
        JSON.stringify({ tracks: [] }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

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

    return new Response(
      JSON.stringify({ tracks }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    return new Response(
      JSON.stringify({ tracks: [] }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}