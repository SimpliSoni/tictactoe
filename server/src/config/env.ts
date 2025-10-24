import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Environment configuration with validation
 * Throws error if required variables are missing
 */
interface Config {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  corsOrigin: string;
  matchTimeout: number;
  turnTimeout: number;
  reconnectTimeout: number;
  initialElo: number;
  eloKFactor: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export const config: Config = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3000),
  mongodbUri: getEnvVar('MONGODB_URI'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:19000'),
  matchTimeout: getEnvNumber('MATCH_TIMEOUT_SECONDS', 30),
  turnTimeout: getEnvNumber('TURN_TIMEOUT_SECONDS', 30),
  reconnectTimeout: getEnvNumber('RECONNECT_TIMEOUT_SECONDS', 30),
  initialElo: getEnvNumber('INITIAL_ELO', 1000),
  eloKFactor: getEnvNumber('ELO_K_FACTOR', 32),
};

// Validate configuration on startup
export function validateConfig(): void {
  console.log('🔍 Validating configuration...');
  
  if (config.port < 1024 || config.port > 65535) {
    throw new Error('Invalid PORT: must be between 1024 and 65535');
  }

  if (!config.mongodbUri.startsWith('mongodb')) {
    throw new Error('Invalid MONGODB_URI: must start with mongodb:// or mongodb+srv://');
  }

  if (config.jwtSecret.length < 32) {
    console.warn('⚠️  JWT_SECRET is too short. Use at least 32 characters in production.');
  }

  console.log('✅ Configuration validated');
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🚪 Port: ${config.port}`);
}