import { v4 as uuidv4 } from 'uuid';
import { GameLogic } from './gameLogic';
import { Game } from '../models/Game';
import { GameState, Player, PlayerSymbol, MoveResult } from '../types/game';

/**
 * Manages all active and completed games
 * Handles game creation, move validation, and state synchronization
 * CRITICAL: All game logic is server-authoritative
 */
export class GameManager {
  private static instance: GameManager;
  private activeGames: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map(); // socketId -> gameId
  private disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private moveLocks: Map<string, boolean> = new Map(); // gameId -> isProcessing (prevents race conditions)

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Create new game
   * Initializes board state and assigns symbols
   * @param player1 - First player (will be X)
   * @param player2 - Second player (will be O)
   * @returns Created game state
   */
  public createGame(
    player1: Omit<Player, 'connected' | 'lastActivity'>,
    player2: Omit<Player, 'connected' | 'lastActivity'>
  ): GameState {
    const gameId = uuidv4();

    const game: GameState = {
      gameId,
      players: {
        X: {
          ...player1,
          symbol: 'X',
          connected: true,
          lastActivity: new Date(),
        },
        O: {
          ...player2,
          symbol: 'O',
          connected: true,
          lastActivity: new Date(),
        },
      },
      board: GameLogic.createEmptyBoard(),
      currentTurn: 'X',
      status: 'active',
      winner: null,
      moves: [],
      createdAt: new Date(),
      lastMoveAt: new Date(),
    };

    // Store in memory
    this.activeGames.set(gameId, game);
    this.playerToGame.set(player1.socketId, gameId);
    this.playerToGame.set(player2.socketId, gameId);

    console.log(`🎮 Game created: ${gameId} - ${player1.username}(X) vs ${player2.username}(O)`);

    return game;
  }

  /**
   * Get game by ID
   */
  public getGame(gameId: string): GameState | null {
    return this.activeGames.get(gameId) || null;
  }

  /**
   * Get game for a specific player
   */
  public getGameBySocket(socketId: string): GameState | null {
    const gameId = this.playerToGame.get(socketId);
    if (!gameId) return null;
    return this.getGame(gameId);
  }

  /**
   * Make a move in a game
   * SERVER-AUTHORITATIVE: Validates everything before accepting move
   * RACE CONDITION PREVENTION: Uses locking mechanism
   * ✅ FIX #14: Added disconnection check
   * @returns Result of move attempt
   */
  public makeMove(gameId: string, socketId: string, position: number): MoveResult {
    // 🔒 PREVENT RACE CONDITION: Check if another move is being processed
    if (this.moveLocks.get(gameId)) {
      return {
        success: false,
        error: 'Move already in progress, please wait',
      };
    }

    // Lock this game while processing
    this.moveLocks.set(gameId, true);

    try {
      const game = this.getGame(gameId);

      // Validate game exists
      if (!game) {
        return {
          success: false,
          error: 'Game not found',
        };
      }

      // Validate game is active
      if (game.status !== 'active') {
        return {
          success: false,
          error: 'Game is not active',
        };
      }

      // Determine player symbol
      const playerSymbol = this.getPlayerSymbol(game, socketId);
      if (!playerSymbol) {
        return {
          success: false,
          error: 'You are not a player in this game',
        };
      }

      // ✅ FIX #14: Check if player is still connected
      if (!game.players[playerSymbol].connected) {
        return {
          success: false,
          error: 'You are disconnected. Game will be forfeited soon.',
        };
      }

      // Validate it's player's turn
      if (game.currentTurn !== playerSymbol) {
        return {
          success: false,
          error: `It's not your turn. Current turn: ${game.currentTurn}`,
        };
      }

      // Validate position
      if (!Number.isInteger(position) || position < 0 || position > 8) {
        return {
          success: false,
          error: 'Invalid position: must be 0-8',
        };
      }

      // Validate board state is not corrupted
      if (!GameLogic.isValidBoardState(game.board)) {
        console.error(`❌ Corrupted board state detected in game ${gameId}`);
        return {
          success: false,
          error: 'Game state corrupted',
        };
      }

      // Validate move is legal
      if (!GameLogic.isValidMove(position, game.board)) {
        return {
          success: false,
          error: 'That cell is already occupied',
        };
      }

      // ✅ MAKE THE MOVE - Server-side only
      const boardCopy = GameLogic.cloneBoard(game.board);
      GameLogic.makeMove(boardCopy, position, playerSymbol);

      // Update game state
      game.board = boardCopy;
      game.moves.push({
        player: playerSymbol,
        position,
        timestamp: new Date(),
      });
      game.lastMoveAt = new Date();
      game.players[playerSymbol].lastActivity = new Date();

      // Check if game is over
      const { isOver, winner } = GameLogic.checkGameOver(game.board);

      if (isOver) {
        // 🏁 GAME OVER
        game.status = 'completed';
        game.winner = winner;
        console.log(`🏁 Game ${gameId} completed. Winner: ${winner}`);

        return {
          success: true,
          gameState: game,
          gameOver: true,
          winner: winner || undefined,
        };
      }

      // ↪️ SWITCH TURN
      game.currentTurn = GameLogic.getOpponentSymbol(playerSymbol);

      return {
        success: true,
        gameState: game,
        gameOver: false,
      };
    } catch (error) {
      console.error(`❌ Move processing error in game ${gameId}:`, error);
      return {
        success: false,
        error: 'Failed to process move',
      };
    } finally {
      // 🔓 ALWAYS release lock, even if unexpected error occurs
      this.moveLocks.delete(gameId);
    }
  }

  /**
   * Get player's symbol in a game
   */
  private getPlayerSymbol(game: GameState, socketId: string): PlayerSymbol | null {
    if (game.players.X.socketId === socketId) return 'X';
    if (game.players.O.socketId === socketId) return 'O';
    return null;
  }

  /**
   * Handle player disconnection
   * Marks player as disconnected and sets timeout for forfeit
   * If opponent is also disconnected, end game immediately
   */
  public handleDisconnect(
    socketId: string,
    timeoutSeconds: number,
    onTimeout?: (game: GameState, forfeitingSocketId: string) => void
  ): { gameId: string; shouldForfeit: boolean } | null {
    const game = this.getGameBySocket(socketId);
    if (!game || game.status !== 'active') {
      return null;
    }

    const playerSymbol = this.getPlayerSymbol(game, socketId);
    if (!playerSymbol) return null;

    // Mark player as disconnected
    game.players[playerSymbol].connected = false;

    console.log(`⚠️  Player ${game.players[playerSymbol].username} disconnected from game ${game.gameId}`);

    // Set forfeit timeout
    const existingTimeout = this.disconnectTimeouts.get(socketId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      const activeGame = this.getGame(game.gameId);
      if (!activeGame || activeGame.status !== 'active') {
        return;
      }

      if (onTimeout) {
        onTimeout(activeGame, socketId);
      } else {
        this.forfeitGame(game.gameId, socketId);
      }
    }, timeoutSeconds * 1000);

    this.disconnectTimeouts.set(socketId, timeout);

    // Check if both players disconnected
    const bothDisconnected = !game.players.X.connected && !game.players.O.connected;

    return {
      gameId: game.gameId,
      shouldForfeit: bothDisconnected,
    };
  }

  /**
   * Handle player reconnection
   * Clears disconnect timeout
   */
  public handleReconnect(socketId: string): GameState | null {
    const game = this.getGameBySocket(socketId);
    if (!game || game.status !== 'active') {
      return null;
    }

    const playerSymbol = this.getPlayerSymbol(game, socketId);
    if (!playerSymbol) return null;

    // Mark player as reconnected
    game.players[playerSymbol].connected = true;
    game.players[playerSymbol].lastActivity = new Date();

    // Clear timeout
    const timeout = this.disconnectTimeouts.get(socketId);
    if (timeout) {
      clearTimeout(timeout);
      this.disconnectTimeouts.delete(socketId);
    }

    console.log(`✅ Player ${game.players[playerSymbol].username} reconnected to game ${game.gameId}`);

    return game;
  }

  /**
   * Forfeit game
   * Marks game as completed with other player as winner
   */
  public forfeitGame(gameId: string, socketId: string): GameState | null {
    /**
     * ✅ FIX #5: Prevent forfeit race condition
     * Check if game is already marked as completed or if a move is being processed
     */
    
    const game = this.getGame(gameId);
    if (!game) {
      console.warn(`⚠️  Forfeit: Game ${gameId} not found`);
      return null;
    }

    // If game is already completed, don't allow forfeit
    if (game.status !== 'active') {
      console.warn(`⚠️  Forfeit: Game ${gameId} is already ${game.status}`);
      return null;
    }

    // Check if a move is currently being processed
    if (this.moveLocks.get(gameId)) {
      console.warn(`⚠️  Forfeit: Move validation in progress for game ${gameId}. Forfeit queued.`);
      // Forfeit will be processed after move lock is released
    }

    const forfeiter = this.getPlayerSymbol(game, socketId);
    if (!forfeiter) {
      console.warn(`⚠️  Forfeit: Socket ${socketId} is not a player in game ${gameId}`);
      return null;
    }

    const winner = forfeiter === 'X' ? 'O' : 'X';

    game.status = 'completed';
    game.winner = winner;

    console.log(`🚩 Player forfeited. ${game.players[winner].username} wins game ${gameId}`);

    return game;
  }

  /**
   * End game and persist to database
   */
  public async endGame(gameId: string): Promise<void> {
    const game = this.getGame(gameId);
    if (!game) return;

    // Persist to database
    try {
      const dbGame = new Game({
        gameId: game.gameId,
        players: {
          X: {
            userId: game.players.X.userId,
            socketId: game.players.X.socketId,
            username: game.players.X.username,
          },
          O: {
            userId: game.players.O.userId,
            socketId: game.players.O.socketId,
            username: game.players.O.username,
          },
        },
        board: game.board,
        currentTurn: game.currentTurn,
        status: game.status,
        winner: game.winner,
        moves: game.moves,
        createdAt: game.createdAt,
        completedAt: new Date(),
        lastMoveAt: game.lastMoveAt,
      });

      await dbGame.save();
      console.log(`💾 Game ${gameId} persisted to database`);
    } catch (error) {
      console.error(`❌ Error persisting game ${gameId}:`, error);
    }

    // Remove from active games
    this.activeGames.delete(gameId);
    this.playerToGame.delete(game.players.X.socketId);
    this.playerToGame.delete(game.players.O.socketId);

    // Clear disconnect timeouts
    this.disconnectTimeouts.delete(game.players.X.socketId);
    this.disconnectTimeouts.delete(game.players.O.socketId);
    
    // 🔓 Clear move lock to prevent memory leak
    this.moveLocks.delete(gameId);
    
    console.log(`🧹 Game ${gameId} cleaned up from memory`);
  }

  /**
   * Clean up abandoned games (memory leak prevention)
   * Call this periodically (e.g., every 5 minutes)
   * Removes games that have been inactive for > 1 hour
   */
  public cleanupAbandonedGames(): void {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    let cleanedCount = 0;

    this.activeGames.forEach((game, gameId) => {
      const lastActivity = game.lastMoveAt.getTime();
      const timeSinceActivity = now - lastActivity;

      if (timeSinceActivity > ONE_HOUR) {
        console.log(`🧹 Cleaning up abandoned game: ${gameId} (inactive for ${Math.round(timeSinceActivity / 60000)} minutes)`);
        
        // Mark as abandoned
        game.status = 'abandoned';
        
        // Persist to database (async, fire and forget)
        this.endGame(gameId).catch(err => {
          console.error(`Failed to persist abandoned game ${gameId}:`, err);
        });
        
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} abandoned game(s)`);
    }
  }

  /**
   * Get all active games
   */
  public getActiveGames(): GameState[] {
    return Array.from(this.activeGames.values());
  }

  /**
   * Get game count
   */
  public getGameCount(): number {
    return this.activeGames.size;
  }

  /**
   * Get manager statistics
   */
  public getStats(): {
    activeGames: number;
    activePlayers: number;
    pendingDisconnects: number;
  } {
    return {
      activeGames: this.activeGames.size,
      activePlayers: this.playerToGame.size,
      pendingDisconnects: this.disconnectTimeouts.size,
    };
  }

  /**
   * Clear all games (testing/cleanup)
   */
  public clear(): void {
    this.activeGames.clear();
    this.playerToGame.clear();
    this.disconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.disconnectTimeouts.clear();
    console.log('🗑️  Game manager cleared');
  }
}

export const gameManager = GameManager.getInstance();