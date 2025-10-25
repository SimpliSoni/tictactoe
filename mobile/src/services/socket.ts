import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/game';
import Config from '../config/config';

// Get server URL from config
const SERVER_URL = Config.SERVER_URL;

export class SocketService {
  private static instance: SocketService;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to the server
   */
  public connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      console.log('Already connected to server');
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('Connection already in progress');
      return this.socket!;
    }

    this.isConnecting = true;

    console.log('Connecting to server:', SERVER_URL);

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected from server:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      this.isConnecting = false;
    });

    return this.socket;
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      console.log('Disconnected from server');
    }
  }

  /**
   * Get current socket instance
   */
  public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Emit auth event
   */
  public authenticate(deviceId: string, username?: string): void {
    if (this.socket) {
      this.socket.emit('auth', { deviceId, username });
    }
  }

  /**
   * Join matchmaking queue
   */
  public joinQueue(): void {
    if (this.socket) {
      this.socket.emit('joinQueue');
    }
  }

  /**
   * Leave matchmaking queue
   */
  public leaveQueue(): void {
    if (this.socket) {
      this.socket.emit('leaveQueue');
    }
  }

  /**
   * Make a move
   */
  public makeMove(position: number): void {
    if (this.socket) {
      this.socket.emit('makeMove', { position });
    }
  }

  /**
   * Leave current game
   */
  public leaveGame(): void {
    if (this.socket) {
      this.socket.emit('leaveGame');
    }
  }

  /**
   * Forfeit current game
   */
  public forfeit(): void {
    if (this.socket) {
      this.socket.emit('forfeit');
    }
  }
}

export const socketService = SocketService.getInstance();
