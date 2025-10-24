import { Types } from 'mongoose';

// Player symbol types
export type PlayerSymbol = 'X' | 'O';
export type CellValue = PlayerSymbol | null;
export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned';
export type GameResult = 'win' | 'loss' | 'draw';

// Board is a 3x3 grid represented as array of 9 cells
export type Board = [
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue
];

// Player information
export interface Player {
  userId: string;
  socketId: string;
  username: string;
  symbol: PlayerSymbol;
  connected: boolean;
  lastActivity: Date;
}

// Game move
export interface GameMove {
  player: PlayerSymbol;
  position: number; // 0-8
  timestamp: Date;
}

// Game state
export interface GameState {
  gameId: string;
  players: {
    X: Player;
    O: Player;
  };
  board: Board;
  currentTurn: PlayerSymbol;
  status: GameStatus;
  winner: PlayerSymbol | 'draw' | null;
  moves: GameMove[];
  createdAt: Date;
  lastMoveAt: Date;
}

// Move validation result
export interface MoveResult {
  success: boolean;
  error?: string;
  gameState?: GameState;
  gameOver?: boolean;
  winner?: PlayerSymbol | 'draw';
}

// User statistics
export interface UserStats {
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  userId: string;
  username: string;
  elo: number;
  rank: number;
  stats: UserStats;
  lastActive: Date;
}

// Socket events (type-safe)
export interface ServerToClientEvents {
  authenticated: (data: { userId: string; username: string; stats: UserStats; elo: number }) => void;
  matchFound: (game: GameState) => void;
  gameUpdate: (state: GameState) => void;
  opponentMove: (data: { position: number; board: Board; nextTurn: PlayerSymbol }) => void;
  gameOver: (result: { 
    winner: PlayerSymbol | 'draw'; 
    finalBoard: Board; 
    stats: UserStats;
    eloChange: number;
  }) => void;
  opponentDisconnected: (data: { timeoutSeconds: number }) => void;
  opponentReconnected: () => void;
  error: (data: { message: string; code?: string }) => void;
  queueStatus: (data: { position: number; estimatedWait: number }) => void;
}

export interface ClientToServerEvents {
  auth: (data: { deviceId: string; username?: string }) => void;
  joinQueue: () => void;
  leaveQueue: () => void;
  makeMove: (data: { position: number }) => void;
  leaveGame: () => void;
  forfeit: () => void;
}

// Win patterns (all possible winning combinations)
export const WIN_PATTERNS: number[][] = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];