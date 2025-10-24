import mongoose, { Document, Schema } from 'mongoose';
import { UserStats } from '../types/game';

export interface IUser extends Document {
  deviceId: string;
  username: string;
  stats: UserStats;
  elo: number;
  createdAt: Date;
  lastActive: Date;
  
  // Methods
  updateStats(result: 'win' | 'loss' | 'draw'): Promise<void>;
  calculateWinRate(): number;
}

const UserSchema = new Schema<IUser>({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  stats: {
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    draws: { type: Number, default: 0, min: 0 },
    gamesPlayed: { type: Number, default: 0, min: 0 },
    winRate: { type: Number, default: 0, min: 0, max: 100 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
  },
  elo: {
    type: Number,
    default: 1000,
    min: 0,
    index: true, // For leaderboard queries
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Indexes for performance
UserSchema.index({ elo: -1, username: 1 }); // Leaderboard sorting
UserSchema.index({ lastActive: -1 }); // Active users

// Update stats after game
UserSchema.methods.updateStats = async function(result: 'win' | 'loss' | 'draw'): Promise<void> {
  this.stats.gamesPlayed += 1;
  
  if (result === 'win') {
    this.stats.wins += 1;
    this.stats.currentStreak += 1;
    this.stats.longestStreak = Math.max(this.stats.longestStreak, this.stats.currentStreak);
  } else if (result === 'loss') {
    this.stats.losses += 1;
    this.stats.currentStreak = 0;
  } else {
    this.stats.draws += 1;
    // Draw doesn't break streak
  }
  
  this.stats.winRate = this.calculateWinRate();
  this.lastActive = new Date();
  
  await this.save();
};

// Calculate win rate
UserSchema.methods.calculateWinRate = function(): number {
  const totalGames = this.stats.wins + this.stats.losses + this.stats.draws;
  if (totalGames === 0) return 0;
  return Math.round((this.stats.wins / totalGames) * 100 * 10) / 10; // One decimal
};

export const User = mongoose.model<IUser>('User', UserSchema);