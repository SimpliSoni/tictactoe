// Game types matching server types
export type PlayerSymbol = 'X' | 'O';
export type CellValue = PlayerSymbol | null;
export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned';
export type GameResult = 'win' | 'loss' | 'draw';

export type Board = [
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue
];

export interface Player {
  userId: string;
  socketId: string;
  username: string;
  symbol: PlayerSymbol;
  connected: boolean;
  lastActivity: Date;
}

export interface GameMove {
  player: PlayerSymbol;
  position: number;
  timestamp: Date;
}

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
  winningPattern?: number[] | null;  // ✅ Added for highlighting winning cells
}

export interface UserStats {
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  stats: UserStats;
  elo: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  elo: number;
  rank: number;
  stats: UserStats;
  lastActive: Date;
}

// Socket event types
export interface ServerToClientEvents {
  authenticated: (data: { userId: string; username: string; stats: UserStats; elo: number }) => void;
  matchFound: (game: GameState) => void;
  gameUpdate: (state: GameState) => void;
  opponentMove: (data: { position: number; board: Board; nextTurn: PlayerSymbol }) => void;
  gameOver: (result: { 
    winner: PlayerSymbol | 'draw'; 
    finalBoard: Board; 
    stats: UserStats | null;  // ✅ Made optional to match server
    eloChange: number;
    winningPattern: number[] | null;  // ✅ Added for highlighting winning cells
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
