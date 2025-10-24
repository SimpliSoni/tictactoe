import { Board, PlayerSymbol, WIN_PATTERNS, CellValue } from '../types/game';

/**
 * Pure game logic functions (no side effects)
 * All validation and win detection happens here
 * SERVER-AUTHORITATIVE: Never trust client input
 */
export class GameLogic {
  /**
   * Create empty board
   */
  static createEmptyBoard(): Board {
    return [null, null, null, null, null, null, null, null, null];
  }

  /**
   * Validate move position
   * @param position - Cell index (0-8)
   * @param board - Current board state
   * @returns true if move is legal
   */
  static isValidMove(position: number, board: Board): boolean {
    // Check bounds
    if (position < 0 || position > 8) {
      return false;
    }

    // Check if cell is empty
    if (board[position] !== null) {
      return false;
    }

    return true;
  }

  /**
   * Make a move on the board
   * IMPORTANT: This mutates the board array
   * @param board - Board to modify
   * @param position - Cell index
   * @param symbol - Player symbol
   * @returns Success boolean
   */
  static makeMove(board: Board, position: number, symbol: PlayerSymbol): boolean {
    if (!this.isValidMove(position, board)) {
      return false;
    }

    board[position] = symbol;
    return true;
  }

  /**
   * Check if a player has won
   * Checks all 8 winning patterns
   * @param board - Current board state
   * @param symbol - Player symbol to check
   * @returns true if player has won
   */
  static checkWin(board: Board, symbol: PlayerSymbol): boolean {
    return WIN_PATTERNS.some(pattern => {
      return pattern.every(index => board[index] === symbol);
    });
  }

  /**
   * Get winning pattern if exists
   * Used for highlighting winning cells
   * @param board - Current board state
   * @returns Winning cell indexes or null
   */
  static getWinningPattern(board: Board): number[] | null {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      const cellValue = board[a];
      
      if (cellValue !== null && 
          board[b] === cellValue && 
          board[c] === cellValue) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Check if board is full (draw condition)
   * @param board - Current board state
   * @returns true if no empty cells
   */
  static isBoardFull(board: Board): boolean {
    return board.every(cell => cell !== null);
  }

  /**
   * Check if game is over
   * @param board - Current board state
   * @returns Object with game over status and winner
   */
  static checkGameOver(board: Board): {
    isOver: boolean;
    winner: PlayerSymbol | 'draw' | null;
  } {
    // Check X win
    if (this.checkWin(board, 'X')) {
      return { isOver: true, winner: 'X' };
    }

    // Check O win
    if (this.checkWin(board, 'O')) {
      return { isOver: true, winner: 'O' };
    }

    // Check draw
    if (this.isBoardFull(board)) {
      return { isOver: true, winner: 'draw' };
    }

    // Game continues
    return { isOver: false, winner: null };
  }

  /**
   * Get opposite player symbol
   * @param symbol - Current player symbol
   * @returns Opposite symbol
   */
  static getOpponentSymbol(symbol: PlayerSymbol): PlayerSymbol {
    return symbol === 'X' ? 'O' : 'X';
  }

  /**
   * Count moves made
   * @param board - Current board state
   * @returns Number of non-null cells
   */
  static countMoves(board: Board): number {
    return board.filter(cell => cell !== null).length;
  }

  /**
   * Clone board (deep copy)
   * @param board - Board to clone
   * @returns New board instance
   */
  static cloneBoard(board: Board): Board {
    return [...board] as Board;
  }

  /**
   * Check if it's a valid board state
   * Validates move count difference between X and O
   * X always goes first, so X moves >= O moves
   * @param board - Board to validate
   * @returns true if valid state
   */
  static isValidBoardState(board: Board): boolean {
    const xCount = board.filter(cell => cell === 'X').length;
    const oCount = board.filter(cell => cell === 'O').length;

    // X goes first, so can have at most 1 more move than O
    return xCount === oCount || xCount === oCount + 1;
  }

  /**
   * Get board representation as string (for logging)
   * @param board - Board to represent
   * @returns String representation
   */
  static boardToString(board: Board): string {
    const symbols = board.map(cell => cell || '.');
    return `
      ${symbols[0]} | ${symbols[1]} | ${symbols[2]}
      ---------
      ${symbols[3]} | ${symbols[4]} | ${symbols[5]}
      ---------
      ${symbols[6]} | ${symbols[7]} | ${symbols[8]}
    `;
  }
}