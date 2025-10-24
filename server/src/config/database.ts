import mongoose from 'mongoose';
import { config } from './env';

/**
 * MongoDB connection handler with retry logic
 * Implements connection pooling and automatic reconnection
 */
export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Connect to MongoDB with retry logic
   * Free tier optimization: connection pooling, timeouts
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📦 Already connected to MongoDB');
      return;
    }

    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10, // Free tier: limit concurrent connections
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4, // Use IPv4, skip IPv6 for faster connection
    };

    try {
      await mongoose.connect(config.mongodbUri, options);
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        this.isConnected = false;
        this.reconnect();
      });

    } catch (error) {
      console.error('❌ MongoDB initial connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Reconnect to MongoDB with exponential backoff
   */
  private async reconnect(): Promise<void> {
    let retries = 0;
    const maxRetries = 5;
    const baseDelay = 1000;

    while (retries < maxRetries && !this.isConnected) {
      try {
        const delay = baseDelay * Math.pow(2, retries);
        console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        await mongoose.connect(config.mongodbUri);
        this.isConnected = true;
        console.log('✅ MongoDB reconnected successfully');
        break;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          console.error('❌ MongoDB reconnection failed after max retries');
          throw new Error('Database connection lost');
        }
      }
    }
  }

  /**
   * Graceful disconnect
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('👋 MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  /**
   * Health check
   */
  public isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const database = Database.getInstance();