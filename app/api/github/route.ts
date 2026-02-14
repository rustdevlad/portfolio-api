import { getPinnedRepos } from '../../lib/github';
import { jsonResponse, optionsResponse, CacheControl } from '../../lib/response';

export const runtime = 'edge';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const repos = await getPinnedRepos();
    
    return jsonResponse(repos, { cache: CacheControl.LONG });
  } catch (error) {
    console.error('GitHub error:', error);
    return jsonResponse([], { cache: CacheControl.SHORT });
  }
}