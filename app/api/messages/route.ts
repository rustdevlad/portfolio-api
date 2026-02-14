import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
import { nextJsonResponse, nextErrorResponse, corsHeaders } from '../../lib/response';
import { rateLimiter, RateLimits, getClientIP, rateLimitHeaders } from '../../lib/rate-limit';
import type { CreateMessageRequest, Message } from '../../types/messages';

export const runtime = 'edge';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return nextJsonResponse(data as Message[]);
  } catch (error) {
    console.error('Failed to get messages:', error);
    return nextErrorResponse('Failed to get messages', 500);
  }
}

export async function POST(req: Request) {
  try {
    const clientIP = getClientIP(req);
    const rateLimit = rateLimiter.check(
      `messages:${clientIP}`,
      RateLimits.WRITE.maxRequests,
      RateLimits.WRITE.windowMs
    );

    if (!rateLimit.allowed) {
      return nextErrorResponse('Too many requests. Please try again later.', 429);
    }

    const body = (await req.json()) as CreateMessageRequest;
    
    if (!body.content?.trim()) {
      return nextErrorResponse('Message content is required', 400);
    }

    if (body.content.length > 500) {
      return nextErrorResponse('Message is too long (max 500 characters)', 400);
    }

    const trimmedContent = body.content.trim();

    const { data, error } = await supabase
      .from('messages')
      .insert([{ content: trimmedContent }])
      .select()
      .single();

    if (error) throw error;

    return nextJsonResponse(data as Message, {
      headers: rateLimitHeaders(rateLimit.remaining, rateLimit.resetIn),
    });
  } catch (error) {
    console.error('Failed to create message:', error);
    return nextErrorResponse('Failed to create message', 500);
  }
}