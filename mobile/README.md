# 📱 Mobile App Setup Instructions

## 🚀 Quick Setup

Run these commands to install dependencies and start the app:

```bash
# Install dependencies
npm install

# Start Expo development server
npm start
```

## 📦 Dependencies

This project uses:
- **Expo** - React Native framework
- **React Navigation** - Screen navigation
- **Socket.io Client** - Real-time server connection
- **TypeScript** - Type safety

## ⚙️ Configuration

### 🌐 Server URL (IMPORTANT!)

**For testing on your phone with Expo Go:**

1. Find your computer's IP address:
   - **Windows:** `ipconfig` → Look for IPv4 Address (e.g., 192.168.1.10)
   - **Mac/Linux:** `ifconfig` → Look for inet (e.g., 192.168.1.10)

2. Update `src/config/config.ts`:
   ```typescript
   SERVER_URL: 'http://YOUR_IP_ADDRESS:3000'
   // Example: 'http://192.168.1.10:3000'
   ```

3. Make sure:
   - Server is running on your computer
   - Your phone is on the **same WiFi network**
   - Port 3000 is not blocked by firewall

**For iOS Simulator/Android Emulator:**
```typescript
SERVER_URL: 'http://localhost:3000'
```

**For Production:**
```typescript
SERVER_URL: 'https://your-server.up.railway.app'
```

## 🎮 Testing

### Test on Device (Recommended)

1. Install **Expo Go** app from App Store or Google Play
2. Start the Expo server: `npm start`
3. Scan the QR code with Expo Go
4. App will load on your phone

### Test on Emulator

**iOS Simulator (Mac only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

## 🐛 Troubleshooting

### "Network request failed"

**Cause:** App can't reach the server

**Solutions:**
1. Update `SERVER_URL` in `src/config/config.ts` with your computer's IP
2. Ensure server is running: `cd ../server && npm run dev`
3. Check phone and computer are on same WiFi
4. Try disabling firewall temporarily
5. Verify the URL in config matches your IP exactly

### "Cannot connect to Expo Go"

**Solutions:**
1. Make sure Expo Go app is installed
2. Check that your phone is on the same network
3. Try scanning QR code again
4. Restart Expo dev server

### "TypeError: Cannot read property..."

**Cause:** Missing environment or server down

**Solutions:**
1. Check server is running
2. Check `SERVER_URL` is correct
3. Clear Metro bundler cache: `npm start -- --clear`

### "Invariant Violation: requireNativeComponent"

**Cause:** Missing native dependencies

**Solution:**
```bash
npm install
expo start --clear
```

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── Board.tsx           # Game board UI
│   ├── config/
│   │   └── config.ts           # ⚙️ App configuration (UPDATE HERE!)
│   ├── context/
│   │   └── GameContext.tsx     # Global state management
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Main menu
│   │   ├── MatchmakingScreen.tsx # Queue screen
│   │   ├── GameScreen.tsx      # Active game
│   │   ├── LeaderboardScreen.tsx # Rankings
│   │   └── StatsScreen.tsx     # User statistics
│   ├── services/
│   │   └── socket.ts           # Socket.io service
│   ├── types/
│   │   └── game.ts             # TypeScript types
│   └── utils/
│       └── device.ts           # Device ID generation
├── App.tsx                      # Root component
├── package.json
└── tsconfig.json
```

## 🎯 Features

- ✅ Auto-connect to server on launch
- ✅ Device-based authentication
- ✅ Real-time matchmaking
- ✅ Interactive game board
- ✅ Turn indicators
- ✅ Win/loss/draw detection
- ✅ ELO rating display
- ✅ Statistics tracking
- ✅ Global leaderboard
- ✅ Opponent disconnect notifications
- ✅ Error handling with alerts

## 🔄 Development Workflow

1. **Start server first:**
   ```bash
   cd server
   npm run dev
   ```

2. **Then start mobile app:**
   ```bash
   cd mobile
   npm start
   ```

3. **Make changes:**
   - Code updates reload automatically (Fast Refresh)
   - Press `r` in terminal to reload manually

4. **Check logs:**
   - Expo Dev Tools shows console logs
   - Server terminal shows backend logs
   - Use `console.log()` for debugging

## 📱 Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build APK
eas build --platform android --profile preview
```

### iOS App

```bash
# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

## 🎨 Customization

### Change Colors

Edit `src/config/config.ts`:
```typescript
COLORS: {
  primary: '#007AFF',      // Main accent color
  secondary: '#34C759',    // Success color
  danger: '#FF3B30',       // Error/loss color
  background: '#000000',   // Screen background
  card: '#1C1C1E',         // Card background
  text: '#FFFFFF',         // Text color
  xColor: '#007AFF',       // X player color
  oColor: '#FF3B30',       // O player color
}
```

### Modify Screens

All screens are in `src/screens/`:
- Home screen shows user stats
- Matchmaking shows queue status
- Game screen has the board
- Leaderboard shows rankings
- Stats shows detailed analytics

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)

## 🆘 Getting Help

1. Check server logs for backend errors
2. Check Expo console for frontend errors
3. Verify network connectivity
4. Read error messages carefully
5. Check `PROJECT_SUMMARY.md` for architecture overview

---

**Ready to play? Install dependencies and start the app!** 🎮
