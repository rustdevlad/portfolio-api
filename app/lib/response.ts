import { NextResponse } from 'next/server';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

export const CacheControl = {
  NO_CACHE: 'no-cache, no-store, must-revalidate',
  SHORT: 'public, s-maxage=30, stale-while-revalidate=60',
  MEDIUM: 'public, s-maxage=300, stale-while-revalidate=600',
  LONG: 'public, s-maxage=3600, stale-while-revalidate=7200',
} as const;

type CacheControlValue = typeof CacheControl[keyof typeof CacheControl];

interface ResponseOptions {
  status?: number;
  cache?: CacheControlValue;
  headers?: Record<string, string>;
}

export function jsonResponse<T>(
  data: T,
  options: ResponseOptions = {}
): Response {
  const { status = 200, cache, headers = {} } = options;

  const responseHeaders: Record<string, string> = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    ...headers,
  };

  if (cache) {
    responseHeaders['Cache-Control'] = cache;
  }

  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders,
  });
}

export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): Response {
  const errorBody = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && details ? { details: String(details) } : {}),
  };

  return jsonResponse(errorBody, { status });
}

export function optionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function nextJsonResponse<T>(
  data: T,
  options: { status?: number; headers?: Record<string, string> } = {}
): NextResponse {
  const { status = 200, headers = {} } = options;
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders, ...headers },
  });
}

export function nextErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return nextJsonResponse({ error: message }, { status });
}

