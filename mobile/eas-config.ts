/**
 * EAS Build Configuration
 * 
 * ✅ FIX #4: Production Environment Configuration
 * This file defines separate build profiles for development and production
 * 
 * Usage:
 * - Local development: npx expo start
 * - Build for staging: eas build --platform ios --profile staging
 * - Build for production: eas build --platform android --profile production
 * 
 * Environment Variables (EAS Secrets):
 * Set via: eas secret:create
 * 
 * Commands:
 * eas secret:create --scope project --name API_URL
 * eas secret:create --scope project --name EXPO_PUBLIC_API_URL
 */

export default {
  // Build profiles for different environments
  build: {
    preview: {
      android: {
        buildType: 'apk',
      },
    },
    preview2: {
      android: {
        gradleCommand: ':app:assembleBundleRelease',
      },
    },
    
    // Development builds - connect to local server
    development: {
      developmentClient: true,
      env: {
        API_URL: 'http://10.113.140.174:3000', // Local PC IP on mobile hotspot network
      },
    },
    
    // Staging builds - connects to staging server
    staging: {
      env: {
        API_URL: 'https://tictactoe-staging.up.railway.app', // Staging server
      },
    },
    
    // Production builds - connects to production server
    production: {
      env: {
        API_URL: 'https://tictactoe-production-dc7d.up.railway.app', // Production server
      },
    },
  },
  
  // Submit profiles for app stores (iOS/Android)
  submit: {
    production: {
      android: {
        serviceAccount: './.secret/android-service-account.json',
        track: 'production',
      },
      ios: {
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
        ascAppId: '1234567890', // Your app ID from App Store Connect
      },
    },
  },
};
