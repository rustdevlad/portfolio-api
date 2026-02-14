import { getCurrentGame } from '../../lib/steam';
import { jsonResponse, optionsResponse, CacheControl } from '../../lib/response';

export const runtime = 'edge';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const game = await getCurrentGame();
    
    // Use short cache for live status, medium for recent games
    const cacheControl = game?.isPlaying ? CacheControl.NO_CACHE : CacheControl.MEDIUM;

    return jsonResponse(game, { cache: cacheControl });
  } catch (error) {
    console.error('Steam error:', error);
    return jsonResponse(null, { cache: CacheControl.SHORT });
  }
}