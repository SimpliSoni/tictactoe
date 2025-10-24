import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Game } from '../models/Game';
import { gameManager } from '../services/gameManager';
import { matchmakingService } from '../services/matchmaking';
import { leaderboardService } from '../services/leaderboard';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get top players leaderboard
 */
router.get('/leaderboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(_req.query.limit as string) || 50, 100);
    const topPlayers = await leaderboardService.getTopPlayers(limit);

    res.json({
      success: true,
      count: topPlayers.length,
      data: topPlayers,
    });
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

/**
 * Get user stats
 */
router.get('/stats/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const rank = await leaderboardService.getUserRank(userId);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        elo: user.elo,
        rank,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
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
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const games = await Game.find({
      $or: [
        { 'players.X.userId': userId },
        { 'players.O.userId': userId },
      ],
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    res.json({
      success: true,
      count: games.length,
      data: games,
    });
  } catch (error) {
    console.error('❌ Game history error:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

export default router;