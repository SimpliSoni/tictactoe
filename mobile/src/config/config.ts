/**
 * Application configuration
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

const Config = {
  // Server URL - CHANGE THIS FOR TESTING ON REAL DEVICE
  SERVER_URL: __DEV__ 
    ? 'http://192.168.56.1:3000'  // ⚠️ Change to your computer's IP address for testing on device
    : 'https://tictactoe-production-768b.up.railway.app', // Production URL
  
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
