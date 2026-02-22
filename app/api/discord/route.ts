import { jsonResponse, CacheControl } from '../../lib/response';

export const runtime = 'edge';

const DISCORD_ID = '1139593105969000449';

export async function GET() {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Lanyard API error:', response.status);
      return jsonResponse({ status: 'offline' }, { cache: CacheControl.NO_CACHE });
    }

    const data = await response.json();

    return jsonResponse(
      { status: data.data?.discord_status || 'offline' },
      { cache: CacheControl.NO_CACHE }
    );
  } catch (error) {
    console.error('Discord status error:', error);
    return jsonResponse({ status: 'offline' }, { cache: CacheControl.NO_CACHE });
  }
}