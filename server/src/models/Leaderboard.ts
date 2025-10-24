import mongoose, { Document, Schema } from 'mongoose';
import { UserStats } from '../types/game';

/**
 * Denormalized leaderboard for fast queries
 * Updated after each game completion
 */
export interface ILeaderboard extends Document {
  userId: string;
  username: string;
  elo: number;
  rank: number;
  stats: UserStats;
  lastActive: Date;
  updatedAt: Date;
}

const LeaderboardSchema = new Schema<ILeaderboard>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  elo: {
    type: Number,
    required: true,
    index: true,
  },
  rank: {
    type: Number,
    required: true,
    index: true,
  },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for leaderboard queries
LeaderboardSchema.index({ elo: -1, updatedAt: -1 });

// Update timestamp before save
LeaderboardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Leaderboard = mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema);