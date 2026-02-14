import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { nextJsonResponse, nextErrorResponse, corsHeaders } from '@/app/lib/response';
import { createInitialBoard } from '@/app/types/checkers';
import type { CreateGameRequest } from '@/app/types/checkers';

export const runtime = 'edge';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateGameRequest;
    
    const initialBoard = createInitialBoard();
    
    const { data, error } = await supabase
      .from('checkers_games')
      .insert([{
        board: initialBoard,
        current_turn: 'white',
        player_white: body.player_name || null,
        status: 'waiting',
        white_captured: 0,
        black_captured: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return nextJsonResponse(data);
  } catch (error) {
    console.error('Failed to create game:', error);
    return nextErrorResponse('Failed to create game', 500);
  }
}