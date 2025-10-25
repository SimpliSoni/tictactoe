import { v4 as uuidv4 } from 'uuid';

export interface QueuedPlayer {
  socketId: string;
  userId: string;
  username: string;
  joinedAt: Date;
}

/**
 * Matchmaking queue service
 * FIFO queue-based matching for fair and simple pairing
 * Scales efficiently to hundreds of concurrent players
 */
export class MatchmakingService {
  private static instance: MatchmakingService;
  private queue: QueuedPlayer[] = [];
  private privateRooms: Map<string, { hostId: string; code: string }> = new Map();
  private playerToQueue: Map<string, string> = new Map(); // socketId -> queueId

  private constructor() {}

  public static getInstance(): MatchmakingService {
    if (!MatchmakingService.instance) {
      MatchmakingService.instance = new MatchmakingService();
    }
    return MatchmakingService.instance;
  }

  /**
   * Add player to matchmaking queue
   * O(1) operation
   * @returns Queue position (0-indexed)
   */
  public addPlayerToQueue(socketId: string, userId: string, username: string): number {
    // Check if player already in queue
    if (this.playerToQueue.has(socketId)) {
      console.warn(`⚠️  Player ${socketId} already in queue`);
      return this.queue.findIndex(p => p.socketId === socketId);
    }

    const player: QueuedPlayer = {
      socketId,
      userId,
      username,
      joinedAt: new Date(),
    };

    this.queue.push(player);
    this.playerToQueue.set(socketId, uuidv4());

    const position = this.queue.length - 1;
    console.log(`✅ Player added to queue. Position: ${position + 1}/${this.queue.length}`);

    return position;
  }

  /**
   * Remove player from queue
   * O(n) operation - acceptable for queue size typically < 1000
   */
  public removePlayerFromQueue(socketId: string): boolean {
    const index = this.queue.findIndex(p => p.socketId === socketId);

    if (index === -1) {
      console.warn(`⚠️  Player ${socketId} not found in queue`);
      return false;
    }

    this.queue.splice(index, 1);
    this.playerToQueue.delete(socketId);

    console.log(`✅ Player removed from queue. Queue size: ${this.queue.length}`);
    return true;
  }

  /**
   * Try to find a match
   * Returns first two players in queue if available
   * O(1) operation
   */
  public findMatch(): [QueuedPlayer, QueuedPlayer] | null {
    if (this.queue.length < 2) {
      return null;
    }

    // FIFO matching - take first two players
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    this.playerToQueue.delete(player1.socketId);
    this.playerToQueue.delete(player2.socketId);

    console.log(`🎮 Match found: ${player1.username} vs ${player2.username}`);

    return [player1, player2];
  }

  /**
   * Get current queue position for a player
   */
  public getQueuePosition(socketId: string): number {
    return this.queue.findIndex(p => p.socketId === socketId);
  }

  /**
   * Get queue size
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Estimate wait time based on queue position
   * Rough estimate: ~5 seconds per game on average
   */
  public estimateWaitTime(socketId: string): number {
    const position = this.getQueuePosition(socketId);
    if (position === -1) return 0;

    // Estimate: 5 seconds per game, but we're making 2 at a time
    return Math.max(5, (position / 2) * 5);
  }

  /**
   * Create private game room
   * @returns Room code for sharing
   */
  public createPrivateRoom(hostId: string): string {
    const roomCode = this.generateRoomCode();
    this.privateRooms.set(roomCode, { hostId, code: roomCode });

    console.log(`🔐 Private room created: ${roomCode}`);
    return roomCode;
  }

  /**
   * Verify room exists and return host
   */
  public getPrivateRoom(roomCode: string): { hostId: string; code: string } | null {
    return this.privateRooms.get(roomCode) || null;
  }

  /**
   * Remove private room after game starts
   */
  public removePrivateRoom(roomCode: string): boolean {
    return this.privateRooms.delete(roomCode);
  }

  /**
   * Generate unique room code
   * Format: 4 uppercase letters + 4 digits (e.g., ABCD1234)
   */
  private generateRoomCode(): string {
    let code: string;
    const maxAttempts = 10;
    let attempts = 0;

    do {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';

      let codeStr = '';
      for (let i = 0; i < 4; i++) {
        codeStr += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      for (let i = 0; i < 4; i++) {
        codeStr += digits.charAt(Math.floor(Math.random() * digits.length));
      }

      code = codeStr;
      attempts++;
    } while (this.privateRooms.has(code) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique room code');
    }

    return code;
  }

  /**
   * Get queue statistics for debugging
   */
  public getQueueStats(): {
    size: number;
    privateRooms: number;
    avgWaitTime: number;
  } {
    return {
      size: this.queue.length,
      privateRooms: this.privateRooms.size,
      avgWaitTime: this.queue.length > 0
        ? (this.queue.reduce((sum, p) => sum + (Date.now() - p.joinedAt.getTime()), 0) / this.queue.length) / 1000
        : 0,
    };
  }

  /**
   * Clear all queues (for testing/cleanup)
   */
  public clear(): void {
    this.queue = [];
    this.privateRooms.clear();
    this.playerToQueue.clear();
    console.log('🗑️  Matchmaking queues cleared');
  }
}

export const matchmakingService = MatchmakingService.getInstance();