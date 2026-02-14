import { getCurrentTrack } from '../../lib/statsfm';
import { jsonResponse, optionsResponse, errorResponse, CacheControl } from '../../lib/response';

export const runtime = 'edge';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const track = await getCurrentTrack();
    
    return jsonResponse(track, { cache: CacheControl.NO_CACHE });
  } catch (err) {
    const error = err as Error;
    console.error('Stats.fm error:', error);

    return errorResponse(error?.message || 'Failed to fetch Stats.fm data', 500);
  }
}