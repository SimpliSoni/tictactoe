/**
 * Application configuration
 * 
 * ✅ FIX #4: Production Environment Configuration
 * Separate dev/prod API URLs to prevent hardcoding
 * 
 * Environment Variables:
 * - __DEV__: Automatically set by React Native (true in dev, false in production)
 * - API_URL: Can be set via EAS secrets or environment variables
 * 
 * IMPORTANT: Update SERVER_URL based on your environment
 * 
 * For local testing with Expo Go:
 * 1. Find your computer's IP address:
 *    - Windows: ipconfig (look for IPv4 Address)
 *    - Mac/Linux: ifconfig (look for inet)
 * 2. Replace localhost with your IP: http://192.168.1.X:3000
 * 3. Make sure your phone is on the same WiFi network
 * 
 * For production:
 * - Use your deployed server URL (e.g., https://your-app.up.railway.app)
 */

import { Platform } from 'react-native';

const isDev = __DEV__;

// Environment-aware configuration
const DEV_CONFIG = {
  SERVER_URL: 'http://localhost:3000', // For local testing with emulator
};

const PROD_CONFIG = {
  SERVER_URL: 'https://tictactoe-production-dc7d.up.railway.app',
};

// Fallback URLs if environment variables not set
const FALLBACK_CONFIG = isDev ? DEV_CONFIG : PROD_CONFIG;

/**
 * Get server URL from:
 * 1. Environment variable (EAS secrets)
 * 2. Fallback configuration
 */
const getServerUrl = (): string => {
  // Try to get from environment first (set via EAS secrets or env vars)
  const envUrl = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    console.log(`📡 Using environment API URL: ${envUrl}`);
    return envUrl;
  }

  const url = isDev ? DEV_CONFIG.SERVER_URL : PROD_CONFIG.SERVER_URL;
  console.log(`📡 Using fallback ${isDev ? 'development' : 'production'} API URL: ${url}`);
  return url;
};

const Config = {
  // ✅ FIX #4: Environment-aware server URL
  SERVER_URL: getServerUrl(),
  
  // Build environment info for debugging
  BUILD_ENV: isDev ? 'development' : 'production',
  PLATFORM: Platform.OS,
  
  // API endpoints
  API: {
    LEADERBOARD: '/api/leaderboard',
    STATS: '/api/stats',
    HEALTH: '/api/health',
  },

  // Game settings
  GAME: {
    BOARD_SIZE: 3,
    CELLS_COUNT: 9,
    RECONNECT_TIMEOUT: 30000, // 30 seconds
  },

  // Colors
  COLORS: {
    primary: '#007AFF',
    secondary: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    xColor: '#007AFF',
    oColor: '#FF3B30',
    emptyCell: '#1C1C1E',
    winningCell: '#34C759',
  },
};

export default Config;
