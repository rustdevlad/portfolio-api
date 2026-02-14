import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { nextJsonResponse, nextErrorResponse, corsHeaders } from '@/app/lib/response';
import type { JoinGameRequest } from '@/app/types/checkers';

export const runtime = 'edge';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = (await req.json()) as JoinGameRequest;
    
    const { data: gameData, error: fetchError } = await supabase
      .from('checkers_games')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return nextErrorResponse('Game not found', 404);
      }
      throw fetchError;
    }

    if (gameData.status !== 'waiting') {
      return nextErrorResponse('Game is not available for joining', 400);
    }

    if (gameData.player_black) {
      return nextErrorResponse('Game is already full', 400);
    }

    const { data, error } = await supabase
      .from('checkers_games')
      .update({
        player_black: body.player_name || null,
        status: 'playing',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return nextJsonResponse(data);
  } catch (error) {
    console.error('Failed to join game:', error);
    return nextErrorResponse('Failed to join game', 500);
  }
}