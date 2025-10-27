import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config, validateConfig } from './config/env';
import { database } from './config/database';
import { SocketHandlers } from './controllers/socketHandlers';
import { gameManager } from './services/gameManager';
import apiRoutes from './controllers/apiRoutes';

/**
 * Production-ready multiplayer Tic-Tac-Toe server
 * - Server-authoritative game logic
 * - Real-time multiplayer via Socket.io
 * - MongoDB persistence
 * - Comprehensive error handling
 */
class TicTacToeServer {
  private app: Application;
  private io: SocketIOServer;
  private httpServer: any;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    
    // Parse CORS origins - handle wildcard or comma-separated list
    const corsOrigins = config.corsOrigin === '*' 
      ? '*'
      : config.corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean);
    
    console.log('🌐 CORS Origins configured:', corsOrigins);
    
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
      maxHttpBufferSize: 1e6, // 1MB max message size
      allowEIO3: true, // Support older socket.io clients
    });
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));

    // Compression
    this.app.use(compression());

    // CORS
    const corsOrigins = config.corsOrigin === '*' 
      ? '*'
      : config.corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean);

    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (corsOrigins === '*') {
          return callback(null, true);
        }
        
        if (Array.isArray(corsOrigins) && corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }));

    // Parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`📨 ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // API routes
    this.app.use('/api', apiRoutes);

    // Health check root
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Multiplayer Tic-Tac-Toe Server',
        version: '1.0.0',
        status: 'running',
      });
    });

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  /**
   * Setup Socket.io events
   */
  private setupSocket(): void {
    this.io.on('connection', (socket) => {
      SocketHandlers.initializeSocket(socket, this.io);

      socket.on('error', (error) => {
        console.error(`❌ Socket error: ${socket.id}`, error);
      });
    });

    console.log('✅ Socket.io initialized');
  }

  /**
   * Start server
   */
  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Connect to database
      await database.connect();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup socket
      this.setupSocket();

      // Start listening
      this.httpServer.listen(config.port, () => {
        console.log(`
╔════════════════════════════════════════╗
║   🎮 Multiplayer Tic-Tac-Toe Server   ║
╠════════════════════════════════════════╣
║ ✅ Server running on port ${config.port}          ║
║ 📍 Environment: ${config.nodeEnv.padEnd(16)} ║
║ 🌐 CORS Origin: ${config.corsOrigin}    ║
╚════════════════════════════════════════╝
        `);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

      // 🧹 Setup periodic cleanup for abandoned games (every 5 minutes)
      setInterval(() => {
        gameManager.cleanupAbandonedGames();
      }, 5 * 60 * 1000); // 5 minutes

      console.log('🧹 Periodic cleanup task started (every 5 minutes)');
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down gracefully...');

    try {
      // Close socket
      this.io.close();

      // Close HTTP server
      this.httpServer.close(() => {
        console.log('✅ HTTP server closed');
      });

      // Close database
      await database.disconnect();

      console.log('✅ Server shut down successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start server
const server = new TicTacToeServer();
server.start().catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});