import mongoose, { Document, Schema } from 'mongoose';
import { Board, GameMove, GameStatus, PlayerSymbol } from '../types/game';

export interface IGame extends Document {
  gameId: string;
  players: {
    X: {
      userId: string;
      socketId: string;
      username: string;
    };
    O: {
      userId: string;
      socketId: string;
      username: string;
    };
  };
  board: Board;
  currentTurn: PlayerSymbol;
  status: GameStatus;
  winner: PlayerSymbol | 'draw' | null;
  moves: GameMove[];
  createdAt: Date;
  completedAt?: Date;
  lastMoveAt: Date;
}

const GameSchema = new Schema<IGame>({
  gameId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  players: {
    X: {
      userId: { type: String, required: true, index: true },
      socketId: { type: String, required: true },
      username: { type: String, required: true },
    },
    O: {
      userId: { type: String, required: true, index: true },
      socketId: { type: String, required: true },
      username: { type: String, required: true },
    },
  },
  board: {
    type: [String],
    default: [null, null, null, null, null, null, null, null, null],
    validate: {
      validator: (v: any[]) => v.length === 9,
      message: 'Board must have exactly 9 cells',
    },
  },
  currentTurn: {
    type: String,
    enum: ['X', 'O'],
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'active',
    index: true,
  },
  winner: {
    type: String,
    enum: ['X', 'O', 'draw', null],
    default: null,
  },
  moves: [{
    player: {
      type: String,
      enum: ['X', 'O'],
      required: true,
    },
    position: {
      type: Number,
      required: true,
      min: 0,
      max: 8,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  completedAt: {
    type: Date,
  },
  lastMoveAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for queries
GameSchema.index({ status: 1, createdAt: -1 });
GameSchema.index({ 'players.X.userId': 1, status: 1 });
GameSchema.index({ 'players.O.userId': 1, status: 1 });

// TTL index: auto-delete abandoned games after 24 hours
GameSchema.index(
  { lastMoveAt: 1 },
  {
    expireAfterSeconds: 86400,
    partialFilterExpression: { status: 'abandoned' },
  }
);

export const Game = mongoose.model<IGame>('Game', GameSchema);