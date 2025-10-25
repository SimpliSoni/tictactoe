import { User } from '../models/User';
import { Leaderboard } from '../models/Leaderboard';
import { config } from '../config/env';
import { UserStats, LeaderboardEntry } from '../types/game';

/**
 * Leaderboard and ELO rating service
 * Implements ELO rating system for fair skill-based rankings
 * Updates stats and rankings after each game
 */
export class LeaderboardService {
  private static instance: LeaderboardService;

  private constructor() {}

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /**
   * Update player stats after game
   * @param userId - Player ID
   * @param result - Game result (win/loss/draw)
   */
  public async updateStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    try {
      const user = await User.findOne({ _id: userId });
      if (!user) {
        console.warn(`⚠️  User ${userId} not found for stats update`);
        return;
      }

      await user.updateStats(result);
      console.log(`📊 Stats updated for user ${user.username}: ${result}`);
    } catch (error) {
      console.error(`❌ Error updating stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate and apply ELO rating changes after game
   * Uses standard ELO formula with K-factor
   * @param winnerId - Winner user ID
   * @param loserId - Loser user ID
   * @param isDraw - True if game was a draw
   */
  public async calculateELO(
    winnerId: string,
    loserId: string,
    isDraw: boolean = false
  ): Promise<{ winnerEloChange: number; loserEloChange: number }> {
    try {
      const winner = await User.findOne({ _id: winnerId });
      const loser = await User.findOne({ _id: loserId });

      if (!winner || !loser) {
        console.warn('❌ Winner or loser not found for ELO calculation');
        return { winnerEloChange: 0, loserEloChange: 0 };
      }

      const K = config.eloKFactor;
      const winnerElo = winner.elo;
      const loserElo = loser.elo;

      // ELO formulas
      const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
      const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

      let winnerEloChange: number;
      let loserEloChange: number;

      if (isDraw) {
        // Draw: both get 0.5 score
        winnerEloChange = Math.round(K * (0.5 - expectedWinner));
        loserEloChange = Math.round(K * (0.5 - expectedLoser));
      } else {
        // Winner gets 1, loser gets 0
        winnerEloChange = Math.round(K * (1 - expectedWinner));
        loserEloChange = Math.round(K * (0 - expectedLoser));
      }

      // Ensure minimum ELO of 0
      winner.elo = Math.max(0, winner.elo + winnerEloChange);
      loser.elo = Math.max(0, loser.elo + loserEloChange);

      await winner.save();
      await loser.save();

      console.log(`📈 ELO updated - ${winner.username}: ${winnerElo} → ${winner.elo} (${winnerEloChange > 0 ? '+' : ''}${winnerEloChange})`);
      console.log(`📉 ELO updated - ${loser.username}: ${loserElo} → ${loser.elo} (${loserEloChange > 0 ? '+' : ''}${loserEloChange})`);

      return { winnerEloChange, loserEloChange };
    } catch (error) {
      console.error('❌ Error calculating ELO:', error);
      throw error;
    }
  }

  /**
   * Get top N players
   * @param limit - Number of players to return
   * @returns Array of top players
   */
  public async getTopPlayers(limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const topUsers = await User.find({})
        .sort({ elo: -1, 'stats.gamesPlayed': -1 })
        .limit(Math.min(limit, 100))
        .lean()
        .exec();

      return topUsers.map((user, index) => ({
        userId: user._id.toString(),
        username: user.username,
        elo: user.elo,
        rank: index + 1,
        stats: user.stats,
        lastActive: user.lastActive,
      }));
    } catch (error) {
      console.error('❌ Error fetching top players:', error);
      throw error;
    }
  }

  /**
   * Get user's global rank
   * @param userId - User ID
   * @returns 1-indexed rank (1 = best)
   */
  public async getUserRank(userId: string): Promise<number> {
    try {
      const user = await User.findById(userId);
      if (!user) return -1;

      const rank = await User.countDocuments({ elo: { $gt: user.elo } });
      return rank + 1;
    } catch (error) {
      console.error(`❌ Error getting rank for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's stats
   */
  public async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const user = await User.findById(userId);
      if (!user) return null;
      return user.stats;
    } catch (error) {
      console.error(`❌ Error getting stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Rebuild leaderboard (call after user changes)
   * Denormalizes data for fast queries
   */
  public async rebuildLeaderboard(): Promise<void> {
    try {
      // Clear existing leaderboard
      await Leaderboard.deleteMany({});

      // Get all users sorted by ELO
      const users = await User.find({})
        .sort({ elo: -1 })
        .lean()
        .exec();

      // Create leaderboard entries
      const entries = users.map((user, index) => ({
        userId: user._id.toString(),
        username: user.username,
        elo: user.elo,
        rank: index + 1,
        stats: user.stats,
        lastActive: user.lastActive,
        updatedAt: new Date(),
      }));

      // Batch insert
      await Leaderboard.insertMany(entries);

      console.log(`✅ Leaderboard rebuilt with ${entries.length} entries`);
    } catch (error) {
      console.error('❌ Error rebuilding leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard statistics
   */
  public async getStats(): Promise<{
    totalPlayers: number;
    avgElo: number;
    topElo: number;
  }> {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgElo: { $avg: '$elo' },
            maxElo: { $max: '$elo' },
          },
        },
      ]);

      if (stats.length === 0) {
        return { totalPlayers: 0, avgElo: 0, topElo: 0 };
      }

      const { count, avgElo, maxElo } = stats[0];
      return {
        totalPlayers: count,
        avgElo: Math.round(avgElo),
        topElo: maxElo,
      };
    } catch (error) {
      console.error('❌ Error getting leaderboard stats:', error);
      throw error;
    }
  }
}

export const leaderboardService = LeaderboardService.getInstance();