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

// ========================
// 🛡️ Global Error Handlers
// ========================
process.on('unhandledRejection', (reason, promise) => {
  console.error(`💥 [${new Date().toISOString()}] Unhandled Promise Rejection at:`, promise);
  console.error('Reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
  // Log to external service in production if available
  // Consider process.exit(1) for critical errors
});

process.on('uncaughtException', (error, origin) => {
  console.error(`💥 [${new Date().toISOString()}] Uncaught Exception thrown from ${origin}:`, error);
  if (error instanceof Error) {
    console.error('Stack:', error.stack);
  }
  // Log to external service in production if available
  // Consider process.exit(1) for critical errors
});

process.on('warning', (warning) => {
  console.warn(`⚠️ [${new Date().toISOString()}] Process Warning:`, warning.name, warning.message);
});

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
    // Request logging (do this FIRST before other middleware)
    this.app.use((req, _res, next) => {
      console.log(`📨 ${req.method} ${req.path}`);
      next();
    });

    // Security
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
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
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check root - HTML response for browser visibility
    this.app.get('/', (_req, res) => {
      console.log('🏠 Root endpoint called');
      res.status(200).set('Content-Type', 'text/html').send(`
<!DOCTYPE html>
<html>
<head>
  <title>Tic-Tac-Toe Server</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #4CAF50; }
    .status { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-left: 3px solid #2196F3; }
  </style>
</head>
<body>
  <h1>🎮 Multiplayer Tic-Tac-Toe Server</h1>
  <div class="status">
    <h2>✅ Server is Running</h2>
    <p><strong>Version:</strong> 1.0.0</p>
    <p><strong>Status:</strong> Online</p>
  </div>
  <h2>📡 Available Endpoints:</h2>
  <div class="endpoint"><strong>GET /health</strong> - Health check endpoint</div>
  <div class="endpoint"><strong>GET /api/health</strong> - API health check</div>
  <div class="endpoint"><strong>GET /api/leaderboard</strong> - Global leaderboard</div>
  <div class="endpoint"><strong>WebSocket</strong> - Real-time game connections via Socket.io</div>
  <h2>🔗 Quick Test:</h2>
  <p>Try: <a href="/health">/health</a> | <a href="/api/health">/api/health</a> | <a href="/api/leaderboard">/api/leaderboard</a></p>
</body>
</html>
      `);
    });

    // Health check endpoint (for Railway/other orchestration)
    this.app.get('/health', (_req, res) => {
      // 🩺 Minimal health check for Railway diagnosis
      console.log(`🩺 Minimal /health check hit at ${new Date().toISOString()}`);
      // Send minimal successful response immediately
      res.status(200).json({ status: 'ok-simple' });
    });

    // API routes
    this.app.use('/api', apiRoutes);

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
      // Setup graceful shutdown handlers FIRST
      process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM signal, shutting down gracefully...');
        this.shutdown();
      });
      process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT signal, shutting down gracefully...');
        this.shutdown();
      });

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

      // Start listening - return a promise that resolves when server is ready
      return new Promise((resolve, reject) => {
        this.httpServer.listen(config.port, '0.0.0.0', () => {
          console.log(`
╔════════════════════════════════════════╗
║   🎮 Multiplayer Tic-Tac-Toe Server   ║
╠════════════════════════════════════════╣
║ ✅ Server running on port ${config.port}          ║
║ 📍 Environment: ${config.nodeEnv.padEnd(16)} ║
║ 🌐 CORS Origin: ${config.corsOrigin}    ║
╚════════════════════════════════════════╝
          `);
          
          // 🧹 Setup periodic cleanup for abandoned games (every 5 minutes)
          setInterval(() => {
            try {
              console.log(`🧹 [${new Date().toISOString()}] Starting periodic cleanup task...`);
              gameManager.cleanupAbandonedGames();
              console.log(`✅ [${new Date().toISOString()}] Cleanup task completed successfully`);
            } catch (error) {
              console.error(`❌ [${new Date().toISOString()}] Error calling gameManager.cleanupAbandonedGames:`, error);
            }
          }, 5 * 60 * 1000); // 5 minutes

          console.log('🧹 Periodic cleanup task started (every 5 minutes)');
          resolve();
        });

        this.httpServer.on('error', (error: Error) => {
          console.error('❌ Server error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    console.log('\n🛑 Starting graceful shutdown...');

    try {
      // Set a timeout for shutdown (30 seconds max)
      const shutdownTimeout = setTimeout(() => {
        console.error('⚠️  Shutdown timeout - forcing exit');
        process.exit(1);
      }, 30000);

      // Close new HTTP connections
      this.httpServer.close(async () => {
        console.log('✅ HTTP server closed (no new connections)');
      });

      // Disconnect socket.io clients gracefully
      this.io.disconnectSockets();
      this.io.close();
      console.log('✅ Socket.io closed');

      // Close database
      await database.disconnect();

      clearTimeout(shutdownTimeout);
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