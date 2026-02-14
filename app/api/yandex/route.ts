import { getCurrentYandexTrack } from '../../lib/yandex';
import { jsonResponse, optionsResponse, CacheControl } from '../../lib/response';

export const runtime = 'edge';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const track = await getCurrentYandexTrack();
    
    return jsonResponse(track, { cache: CacheControl.NO_CACHE });
  } catch (error) {
    console.error('Yandex error:', error);
    return jsonResponse(null, { cache: CacheControl.NO_CACHE });
  }
}