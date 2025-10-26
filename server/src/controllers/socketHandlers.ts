import { Socket, Server } from 'socket.io';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { GameState, ClientToServerEvents, ServerToClientEvents } from '../types/game';
import { gameManager } from '../services/gameManager';
import { matchmakingService } from '../services/matchmaking';
import { leaderboardService } from '../services/leaderboard';
import { config } from '../config/env';

/**
 * Socket.io event handlers
 * All game logic is server-authoritative
 * Clients CANNOT decide game outcomes
 */
export class SocketHandlers {
  /**
   * Initialize socket event listeners
   */
  public static initializeSocket(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    io: Server
  ): void {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('auth', (data) => this.handleAuth(socket, io, data));
    socket.on('joinQueue', () => this.handleJoinQueue(socket, io));
    socket.on('leaveQueue', () => this.handleLeaveQueue(socket, io));
    socket.on('makeMove', (data) => this.handleMakeMove(socket, io, data));
    socket.on('leaveGame', () => this.handleLeaveGame(socket, io));
    socket.on('forfeit', () => this.handleForfeit(socket, io));
    socket.on('disconnect', () => this.handleDisconnect(socket, io));
  }

  /**
   * Handle authentication
   * Creates or retrieves user based on device ID
   */
  private static async handleAuth(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    _io: Server,
    data: { deviceId: string; username?: string }
  ): Promise<void> {
    try {
      const { deviceId, username } = data;

      // Validate device ID
      if (!deviceId || typeof deviceId !== 'string') {
        socket.emit('error', { message: 'Invalid device ID' });
        return;
      }

      // Validate username if provided
      if (username) {
        // Trim whitespace
        const trimmedUsername = username.trim();
        
        // Check length (3-20 characters)
        if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
          socket.emit('error', { message: 'Username must be between 3 and 20 characters' });
          return;
        }
        
        // Check for valid characters (alphanumeric, spaces, underscores, hyphens)
        if (!/^[a-zA-Z0-9_ -]+$/.test(trimmedUsername)) {
          socket.emit('error', { message: 'Username can only contain letters, numbers, spaces, underscores, and hyphens' });
          return;
        }
      }

      // Find or create user
      let user = await User.findOne({ deviceId });

      if (!user) {
        // New user
        const newUsername = username?.trim() || `Player_${deviceId.substring(0, 8)}`;

        user = new User({
          deviceId,
          username: newUsername,
          stats: {
            wins: 0,
            losses: 0,
            draws: 0,
            gamesPlayed: 0,
            winRate: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
          elo: config.initialElo,
          lastActive: new Date(),
        });

        await user.save();
        console.log(`👤 New user created: ${user.username} (${deviceId})`);
      } else {
        // Update username if provided
        if (username && username.trim() !== user.username) {
          user.username = username.trim();
        }
        
        // Update last active
        user.lastActive = new Date();
        await user.save();
      }

      // Store user ID in socket data
      socket.data.userId = (user._id as Types.ObjectId).toString();
      socket.data.username = user.username;

      // Emit authenticated event
      socket.emit('authenticated', {
        userId: (user._id as Types.ObjectId).toString(),
        username: user.username,
        stats: user.stats,
        elo: user.elo,
      });

      console.log(`✅ User authenticated: ${user.username} (Socket: ${socket.id})`);
    } catch (error) {
      console.error('❌ Auth error:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  }

  /**
   * Handle join queue
   * Player enters matchmaking queue
   */
  private static async handleJoinQueue(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    io: Server
  ): Promise<void> {
    try {
      const userId = socket.data.userId as string;
      const username = socket.data.username as string;

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Add to queue
      const position = matchmakingService.addPlayerToQueue(socket.id, userId, username);

      socket.emit('queueStatus', {
        position: position + 1,
        estimatedWait: matchmakingService.estimateWaitTime(socket.id),
      });

      console.log(`📋 Player ${username} joined queue at position ${position + 1}`);

      // Try to find match
      const match = matchmakingService.findMatch();
      if (match) {
        const [player1, player2] = match;

        // Create game
        const gameState = gameManager.createGame(
          {
            userId: player1.userId,
            socketId: player1.socketId,
            username: player1.username,
            symbol: 'X',
          },
          {
            userId: player2.userId,
            socketId: player2.socketId,
            username: player2.username,
            symbol: 'O',
          }
        );

        // Get sockets
        const socket1 = io.sockets.sockets.get(player1.socketId);
        const socket2 = io.sockets.sockets.get(player2.socketId);

        if (socket1 && socket2) {
          // Emit match found to both players
          socket1.emit('matchFound', gameState);
          socket2.emit('matchFound', gameState);

          console.log(`🎮 Match created: ${gameState.gameId}`);
        }
      }
    } catch (error) {
      console.error('❌ Join queue error:', error);
      socket.emit('error', { message: 'Failed to join queue' });
    }
  }

  /**
   * Handle leave queue
   */
  private static handleLeaveQueue(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    _io: Server
  ): void {
    try {
      matchmakingService.removePlayerFromQueue(socket.id);
      console.log(`📋 Player left queue: ${socket.id}`);
    } catch (error) {
      console.error('❌ Leave queue error:', error);
      socket.emit('error', { message: 'Failed to leave queue' });
    }
  }

  /**
   * Handle move
   * SERVER-AUTHORITATIVE: Server validates and applies move
   * CLIENT CANNOT DECIDE GAME OUTCOMES
   */
  private static async handleMakeMove(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    io: Server,
    data: { position: number }
  ): Promise<void> {
    try {
      const userId = socket.data.userId as string;
      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const game = gameManager.getGameBySocket(socket.id);
      if (!game) {
        socket.emit('error', { message: 'No active game' });
        return;
      }

      // Validate position
      const position = data.position;
      if (!Number.isInteger(position) || position < 0 || position > 8) {
        socket.emit('error', { message: 'Invalid position' });
        return;
      }

      // Make move (server validates)
      const result = gameManager.makeMove(game.gameId, socket.id, position);

      if (!result.success) {
        socket.emit('error', { message: result.error || 'Invalid move' });
        return;
      }

      // Broadcast updated state to both players
      const updatedGame = result.gameState!;
      const opponentSocketId = updatedGame.players.X.socketId === socket.id
        ? updatedGame.players.O.socketId
        : updatedGame.players.X.socketId;

      const opponentSocket = io.sockets.sockets.get(opponentSocketId);

      if (!opponentSocket) {
        console.warn(`⚠️  Opponent socket not found: ${opponentSocketId}`);
        return;
      }

      // Emit to current player
      socket.emit('gameUpdate', updatedGame);

      // Emit to opponent
      opponentSocket.emit('opponentMove', {
        position,
        board: updatedGame.board,
        nextTurn: updatedGame.currentTurn,
      });

      // Check if game over
      if (result.gameOver && result.winner !== undefined) {
        await this.handleGameOver(socket, io, updatedGame, result.winner);
      }
    } catch (error) {
      console.error('❌ Make move error:', error);
      socket.emit('error', { message: 'Move failed' });
    }
  }

  /**
   * Handle game over
   * Update stats, ELO, and persist game
   */
  private static async handleGameOver(
    _socket: Socket,
    io: Server,
    game: GameState,
    winner: string
  ): Promise<void> {
    try {
      const playerXId = game.players.X.userId;
      const playerOId = game.players.O.userId;

      // Update stats
      if (winner === 'X') {
        await leaderboardService.updateStats(playerXId, 'win');
        await leaderboardService.updateStats(playerOId, 'loss');
        await leaderboardService.calculateELO(playerXId, playerOId, false);
      } else if (winner === 'O') {
        await leaderboardService.updateStats(playerOId, 'win');
        await leaderboardService.updateStats(playerXId, 'loss');
        await leaderboardService.calculateELO(playerOId, playerXId, false);
      } else {
        // Draw
        await leaderboardService.updateStats(playerXId, 'draw');
        await leaderboardService.updateStats(playerOId, 'draw');
        await leaderboardService.calculateELO(playerXId, playerOId, true);
      }

      // Get updated user data
      const winnerUser = winner === 'X'
        ? await User.findById(playerXId)
        : winner === 'O'
        ? await User.findById(playerOId)
        : null;

      const loserUser = winner === 'X'
        ? await User.findById(playerOId)
        : winner === 'O'
        ? await User.findById(playerXId)
        : null;

      // Emit game over to both players
      const socket1 = io.sockets.sockets.get(game.players.X.socketId);
      const socket2 = io.sockets.sockets.get(game.players.O.socketId);

      const userData = winner === 'X'
        ? { stats: winnerUser?.stats, eloChange: (winnerUser?.elo ?? 0) - 1000 }
        : winner === 'O'
        ? { stats: loserUser?.stats, eloChange: (loserUser?.elo ?? 0) - 1000 }
        : { stats: winnerUser?.stats, eloChange: 0 };

      if (socket1) {
        socket1.emit('gameOver', {
          winner: winner as any,
          finalBoard: game.board,
          stats: userData.stats,
          eloChange: userData.eloChange,
        });
      }

      if (socket2) {
        socket2.emit('gameOver', {
          winner: winner as any,
          finalBoard: game.board,
          stats: userData.stats,
          eloChange: userData.eloChange,
        });
      }

      // Persist game
      await gameManager.endGame(game.gameId);

      console.log(`🏁 Game over: ${game.gameId} - Winner: ${winner}`);
    } catch (error) {
      console.error('❌ Game over error:', error);
    }
  }

  /**
   * Handle leave game
   */
  private static handleLeaveGame(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    io: Server
  ): void {
    try {
      const game = gameManager.getGameBySocket(socket.id);
      if (game) {
        gameManager.forfeitGame(game.gameId, socket.id);

        // Notify opponent
        const opponent = game.players.X.socketId === socket.id
          ? game.players.O
          : game.players.X;

        const opponentSocket = io.sockets.sockets.get(opponent.socketId);
        if (opponentSocket) {
          opponentSocket.emit('gameOver', {
            winner: opponent.symbol,
            finalBoard: game.board,
            stats: null,
            eloChange: 0,
          });
        }

        gameManager.endGame(game.gameId);
      }
    } catch (error) {
      console.error('❌ Leave game error:', error);
    }
  }

  /**
   * Handle forfeit
   */
  private static async handleForfeit(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    io: Server
  ): Promise<void> {
    try {
      const game = gameManager.getGameBySocket(socket.id);
      if (!game) {
        socket.emit('error', { message: 'No active game' });
        return;
      }

      const forfeitingPlayer = game.players.X.socketId === socket.id ? 'X' : 'O';
      const winner = forfeitingPlayer === 'X' ? 'O' : 'X';

      gameManager.forfeitGame(game.gameId, socket.id);
      await this.handleGameOver(socket, io, game, winner);
    } catch (error) {
      console.error('❌ Forfeit error:', error);
      socket.emit('error', { message: 'Forfeit failed' });
    }
  }

  /**
   * Handle disconnect
   * Start timeout for reconnection
   */
  private static handleDisconnect(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    io: Server
  ): void {
    try {
      console.log(`❌ Socket disconnected: ${socket.id}`);

      // Remove from queue if present
      matchmakingService.removePlayerFromQueue(socket.id);

      // Handle game disconnect
      const result = gameManager.handleDisconnect(socket.id, config.reconnectTimeout);

      if (result) {
        const game = gameManager.getGame(result.gameId);
        if (game) {
          const opponent = game.players.X.socketId === socket.id
            ? game.players.O
            : game.players.X;

          const opponentSocket = io.sockets.sockets.get(opponent.socketId);
          if (opponentSocket) {
            opponentSocket.emit('opponentDisconnected', {
              timeoutSeconds: config.reconnectTimeout,
            });
          }
        }

        // Auto forfeit after timeout
        if (result.shouldForfeit) {
          setTimeout(() => {
            const game = gameManager.getGame(result.gameId);
            if (game && game.status === 'active') {
              gameManager.forfeitGame(result.gameId, socket.id);
            }
          }, config.reconnectTimeout * 1000);
        }
      }
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  }
}