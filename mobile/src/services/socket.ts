import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/game';
import Config from '../config/config';

// Get server URL from config
const SERVER_URL = Config.SERVER_URL;

export class SocketService {
  private static instance: SocketService;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnecting = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;

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
      console.log('✅ Already connected to server');
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('⏳ Connection already in progress');
      return this.socket!;
    }

    if (this.socket && !this.socket.connected) {
      console.log('🔄 Reconnecting existing socket');
      this.socket.connect();
      return this.socket;
    }

    this.isConnecting = true;
    this.connectionAttempts++;

    console.log(`🔌 Connecting to server (attempt ${this.connectionAttempts}):`, SERVER_URL);

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxConnectionAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id);
      this.isConnecting = false;
      this.connectionAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected from server:', reason);
      this.isConnecting = false;
      
      // Auto-reconnect if not intentional disconnect
      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected us, attempting reconnect...');
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      this.isConnecting = false;
      
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.error('❌ Max connection attempts reached');
        this.connectionAttempts = 0;
      }
    });

    // ✅ FIX #7: reconnect_attempt and reconnect_failed are Socket.io reserved events
    // They should be listened to on the socket without custom event type constraints
    this.socket.on('reconnect_attempt' as any, (attemptNumber: number) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    this.socket.on('reconnect_failed' as any, () => {
      console.error('❌ Reconnection failed after all attempts');
      this.isConnecting = false;
    });

    return this.socket;
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      // Remove all listeners before disconnecting
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.connectionAttempts = 0;
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
