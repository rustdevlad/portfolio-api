import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { nextJsonResponse, nextErrorResponse, corsHeaders } from '@/app/lib/response';
import type { CheckersGameState } from '@/app/types/checkers';

export const runtime = 'edge';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    const { data: gameData, error: gameError } = await supabase
      .from('checkers_games')
      .select('*')
      .eq('id', params.id)
      .single();

    if (gameError) {
      if (gameError.code === 'PGRST116') {
        return nextErrorResponse('Game not found', 404);
      }
      throw gameError;
    }

    const { data: movesData, error: movesError } = await supabase
      .from('checkers_moves')
      .select('*')
      .eq('game_id', params.id)
      .order('created_at', { ascending: true });

    if (movesError) throw movesError;

    const response: CheckersGameState = {
      game: gameData,
      moves: movesData || [],
      can_move: gameData.status === 'playing',
      is_player_turn: true
    };

    return nextJsonResponse(response);
  } catch (error) {
    console.error('Failed to get game:', error);
    return nextErrorResponse('Failed to get game', 500);
  }
}