import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { nextJsonResponse, nextErrorResponse, corsHeaders } from '@/app/lib/response';
import { isValidMove, applyMove, checkWinner } from '@/app/types/checkers';
import type { MoveRequest } from '@/app/types/checkers';

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
    const move = (await req.json()) as MoveRequest;
    
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

    if (gameData.status !== 'playing') {
      return nextErrorResponse('Game is not in playing state', 400);
    }

    if (gameData.current_turn !== move.player) {
      return nextErrorResponse('Not your turn', 400);
    }

    const board = gameData.board as number[][];
    
    if (!isValidMove(board, move.from_row, move.from_col, move.to_row, move.to_col, move.player)) {
      return nextErrorResponse('Invalid move', 400);
    }

    const moveResult = applyMove(board, move);
    const newBoard = moveResult.board;
    
    const newWhiteCaptured = gameData.white_captured + moveResult.whiteCaptured;
    const newBlackCaptured = gameData.black_captured + moveResult.blackCaptured;
    
    const winner = checkWinner(newBoard);
    const nextTurn = move.player === 'white' ? 'black' : 'white';
    const gameStatus = winner ? 'finished' : 'playing';

    const { data: updatedGame, error: updateError } = await supabase
      .from('checkers_games')
      .update({
        board: newBoard,
        current_turn: gameStatus === 'finished' ? gameData.current_turn : nextTurn,
        status: gameStatus,
        winner: winner,
        white_captured: newWhiteCaptured,
        black_captured: newBlackCaptured,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    const { error: moveError } = await supabase
      .from('checkers_moves')
      .insert([{
        game_id: params.id,
        from_row: move.from_row,
        from_col: move.from_col,
        to_row: move.to_row,
        to_col: move.to_col,
        player: move.player
      }]);

    if (moveError) throw moveError;

    return nextJsonResponse({
      game: updatedGame,
      move_result: {
        captured: moveResult.captured,
        winner: winner,
        next_turn: gameStatus === 'finished' ? null : nextTurn
      }
    });
  } catch (error) {
    console.error('Failed to make move:', error);
    return nextErrorResponse('Failed to make move', 500);
  }
}