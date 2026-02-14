import { getOsuData } from '../../lib/osu';
import { jsonResponse, optionsResponse, CacheControl } from '../../lib/response';

export const runtime = 'edge';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const data = await getOsuData();
    
    return jsonResponse(data, { cache: CacheControl.MEDIUM });
  } catch (error) {
    console.error('osu! error:', error);
    return jsonResponse(null, { cache: CacheControl.SHORT });
  }
}