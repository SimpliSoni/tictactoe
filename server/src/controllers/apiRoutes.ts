import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Game } from '../models/Game';
import { gameManager } from '../services/gameManager';
import { matchmakingService } from '../services/matchmaking';
import { leaderboardService } from '../services/leaderboard';
import { database } from '../config/database'; // Import database instance

const router = Router();

/**
 * Validation helper: Check if a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validation helper: Parse and validate limit parameter
 */
const parseLimit = (limitStr: string | undefined, defaultLimit: number = 50, maxLimit: number = 100): { valid: boolean; value: number } => {
  if (!limitStr) {
    return { valid: true, value: defaultLimit };
  }

  const parsed = parseInt(limitStr, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > maxLimit) {
    return { valid: false, value: defaultLimit };
  }

  return { valid: true, value: parsed };
};

/**
 * Health check endpoint with dependency status
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check MongoDB connection status
    const dbHealthy = database.isHealthy(); 

    const healthStatus = {
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: dbHealthy ? 'connected' : 'disconnected',
      },
    };

    // Return 503 if database is not healthy, otherwise 200
    res.status(dbHealthy ? 200 : 503).json(healthStatus);

  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get top players leaderboard
 * ✅ FIX #12: Added null safety and error validation
 */
router.get('/leaderboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const limitResult = parseLimit(_req.query.limit as string, 50, 100);
    if (!limitResult.valid) {
      res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be a number between 1 and 100',
      });
      return;
    }

    const topPlayers = await leaderboardService.getTopPlayers(limitResult.value);

    // ✅ FIX #12: Validate result is array and not null
    if (!Array.isArray(topPlayers)) {
      console.error('❌ Leaderboard service returned non-array:', typeof topPlayers);
      res.status(500).json({
        success: false,
        error: 'Invalid leaderboard data format',
      });
      return;
    }

    res.json({
      success: true,
      count: topPlayers.length,
      data: topPlayers || [],
    });
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get user stats
 * ✅ FIX #13: Added null safety check for rank
 */
router.get('/stats/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!isValidObjectId(userId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // ✅ FIX #13: Handle potential null/undefined rank
    let rank = 0;
    try {
      rank = await leaderboardService.getUserRank(userId);
    } catch (rankError) {
      console.warn(`⚠️  Could not fetch rank for user ${userId}:`, rankError);
      rank = -1; // Indicate rank unknown
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        elo: user.elo,
        rank: rank >= 0 ? rank : null,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
});

/**
 * Get server status and metrics
 */
router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = {
      games: gameManager.getStats(),
      queue: matchmakingService.getQueueStats(),
      leaderboard: await leaderboardService.getStats(),
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ Status error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * Get game history
 */
router.get('/games/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!isValidObjectId(userId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
      return;
    }

    const limitResult = parseLimit(req.query.limit as string, 20, 100);
    if (!limitResult.valid) {
      res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be a number between 1 and 100',
      });
      return;
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const games = await Game.find({
      $or: [
        { 'players.X.userId': userId },
        { 'players.O.userId': userId },
      ],
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(limitResult.value)
      .lean()
      .exec();

    res.json({
      success: true,
      count: games.length,
      data: games,
    });
  } catch (error) {
    console.error('❌ Game history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game history',
    });
  }
});

export default router;