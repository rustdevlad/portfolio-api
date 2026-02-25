import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
import { nextJsonResponse, nextErrorResponse, corsHeaders } from '../../lib/response';
import { rateLimiter, getClientIP } from '../../lib/rate-limit';

export const runtime = 'edge';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);

    const rateLimit = rateLimiter.check(`analytics:${ip}`, 1, 60 * 1000);
    if (!rateLimit.allowed) {
      const { data } = await supabase
        .from('analytics')
        .select('*')
        .eq('id', 1)
        .single();

      return nextJsonResponse({
        views: data?.views || 0,
        unique_visitors: data?.unique_visitors || 0,
      });
    }

    const { error: visitorError } = await supabase
      .from('visitors')
      .upsert({ ip_address: ip, last_visit: new Date().toISOString() }, { onConflict: 'ip_address', ignoreDuplicates: false });

    if (visitorError) throw visitorError;

    const { count: uniqueVisitors } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    const { data: analyticsArray, error: analyticsError } = await supabase
      .rpc('increment_views', {
        unique_visitors_count: uniqueVisitors || 0,
        last_visit: new Date().toISOString()
      });

    if (analyticsError) throw analyticsError;

    const analytics = analyticsArray?.[0];

    if (!analytics) {
      throw new Error('increment_views returned no data');
    }

    return nextJsonResponse({
      views: analytics.views,
      unique_visitors: analytics.unique_visitors,
    });
  } catch (error) {
    console.error('Failed to update analytics:', error);
    return nextErrorResponse('Failed to update analytics', 500);
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;

    return nextJsonResponse({
      views: data.views,
      unique_visitors: data.unique_visitors,
    });
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return nextErrorResponse('Failed to get analytics', 500);
  }
}