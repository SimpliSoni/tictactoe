# 🎮## 🚀 LIVE DEPLOYMENT - TRY NOW

| 🌐 Backend | 📱 Mobile App | 💻 GitHub |
|---|---|---|
| https://tictactoe-production-768b.up.railway.app | exp://u.expo.dev/d3f8b9d5-d073-48ff-9d78-5222fc0e10dc | https://github.com/SimpliSoni/tictactoe |
| [Health Check](https://tictactoe-production-768b.up.railway.app/api/health) | [Install Expo Go](https://expo.dev/client) | [View Repo](https://github.com/SimpliSoni/tictactoe) |

### ⚡ Play Now (2 minutes)
1. Install [Expo Go](https://expo.dev/client) on your phone
2. Scan or open: `exp://u.expo.dev/d3f8b9d5-d073-48ff-9d78-5222fc0e10dc`
3. Open on 2 devices → tap "Find Match" → Play!-Tac-Toe

A real-time multiplayer Tic-Tac-Toe game with matchmaking, ELO rating system, and leaderboards. Built with React Native (Expo), Node.js, Socket.io, and MongoDB.

## � Quick Links - Live Deployment

| Link | URL |
|------|-----|
| 🌐 **Live Backend API** | https://tictactoe-production-768b.up.railway.app |
| 📱 **Mobile App (Expo Go)** | `exp://exp.host/@simplisoni/tictactoe` |
| 💻 **GitHub Repository** | https://github.com/SimpliSoni/tictactoe |
| 📹 **Video Demo** | [Coming Soon - EAS Update in progress] |
| 🏆 **Leaderboard API** | https://tictactoe-production-768b.up.railway.app/api/leaderboard |
| ❤️ **Health Check** | https://tictactoe-production-768b.up.railway.app/api/health |

**How to Test:**
1. Install [Expo Go](https://expo.dev/client) on your phone
2. Open Expo Go and search for `@simplisoni/tictactoe` OR scan the QR code
3. Play with 2+ devices for real multiplayer action
4. Check API endpoints using `curl` or Postman

---

- [Features](#-features)
- [Architecture & Design Choices](#-architecture--design-choices)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)

---

## ✨ Features

### Core Gameplay
- ✅ **Real-time multiplayer** - Play against other players with instant synchronization
- ✅ **Server-authoritative logic** - All game rules enforced server-side (no cheating possible)
- ✅ **Automatic matchmaking** - Find opponents based on ELO ratings
- ✅ **Reconnection handling** - Resume games after brief disconnections
- ✅ **Forfeit detection** - Auto-forfeit after 30s of disconnection

### Player Features
- ✅ **ELO rating system** - Standard chess-style skill ratings
- ✅ **Stats tracking** - Wins, losses, draws, win rate, streaks
- ✅ **Global leaderboard** - See top players and your ranking
- ✅ **Persistent accounts** - Device-based authentication (no signup needed)

### Technical Features
- ✅ **Race condition prevention** - Move locking ensures fair gameplay
- ✅ **Comprehensive error handling** - Graceful recovery from network issues
- ✅ **Production-ready** - Deployed on Railway with MongoDB Atlas
- ✅ **Cross-platform** - Works on iOS and Android via Expo Go

---

## 🏗️ Architecture & Design Choices

### Why We Built a Custom Server (Not Nakama)

**The Challenge:** We initially considered Nakama, a popular open-source game server, but encountered critical deployment constraints.

**Why Nakama Was Rejected:**
1. **Resource Intensive** - Requires significant RAM (2GB+ minimum) and CPU
2. **Free Tier Incompatibility** - Most free hosting services (Render, Railway free, Heroku free) cannot support Nakama's resource requirements
3. **Complex Setup** - Requires Docker, extensive configuration, and Lua/TypeScript runtime modules
4. **Overkill for Requirements** - We needed basic matchmaking and game logic, not MMO-scale features
5. **Deployment Barrier** - Free trials require payment method verification for resources needed

**Our Solution: Custom Lightweight Stack**
- ✅ Runs comfortably on Railway's free tier (512MB RAM)
- ✅ Simple deployment - just `git push`
- ✅ Full control over game logic
- ✅ Meets all assignment requirements perfectly
- ✅ No payment method required for deployment

### Why Railway Free Tier?

We evaluated multiple hosting platforms:

| Platform | Free Tier | Payment Required | Verdict |
|----------|-----------|------------------|---------|
| **Heroku** | Discontinued | Yes | ❌ No free tier anymore |
| **Render** | 750hrs/month | No, but limited resources | ⚠️ Possible but restrictive |
| **Fly.io** | Limited | Yes (credit card) | ❌ Payment barrier |
| **Railway** | $5 credit/month | No (trial available) | ✅ **CHOSEN** |

**Why Railway Won:**
1. **No Payment Method Required** - True free trial, perfect for assignments
2. **Generous Free Tier** - $5 credit = ~500 hours of small server runtime
3. **GitHub Integration** - Auto-deploy on push
4. **Monorepo Support** - Can deploy just the `server/` folder
5. **Built-in Environment Variables** - Easy secrets management
6. **WebSocket Support** - Critical for Socket.io real-time communication
7. **MongoDB Compatible** - Works seamlessly with MongoDB Atlas free tier

### Why MongoDB?

**Technical Reasons:**
1. **Familiarity** - Team has extensive experience with MongoDB
2. **Horizontal Scaling** - Easy to scale with sharding if game grows
3. **Schema Flexibility** - Game states and user stats can evolve without migrations
4. **JSON-Native** - Perfect match for JavaScript/TypeScript stack
5. **Free Tier Excellence** - MongoDB Atlas offers 512MB free storage (plenty for this game)

**Alternatives Considered:**
- **PostgreSQL** - Great but requires more rigid schemas and migrations
- **Redis** - Perfect for caching but not ideal as primary database
- **Firebase** - Too tightly coupled to Google Cloud Platform

**Our Choice:** MongoDB Atlas + Railway = Perfect free-tier combo with familiar tools

### Why Expo Go + React Native?

**Mobile Framework Choice:**

| Framework | Pros | Cons | Verdict |
|-----------|------|------|---------|
| **Flutter** | Fast, beautiful | Dart learning curve | ⚠️ |
| **Native iOS/Android** | Best performance | 2x codebase | ❌ |
| **React Native (bare)** | Full control | Complex setup | ⚠️ |
| **Expo Go** | Instant testing, easy updates | Some limitations | ✅ **CHOSEN** |

**Why Expo Go Won:**
1. **Instant Testing** - Scan QR code, no build time
2. **Live Reloads** - Changes appear instantly during development
3. **EAS Updates** - Push updates without app store approval
4. **Built-in Modules** - Camera, location, notifications all included
5. **Cross-Platform** - Single codebase for iOS and Android
6. **Easy Deployment** - EAS Build handles native builds
7. **Perfect for Assignments** - Fast iteration, easy to demonstrate

### Server Architecture Highlights

**Server-Authoritative Design:**
```
Client Action → Socket.io → Server Validation → Game Logic → State Update → Broadcast
```

**Why Server-Authoritative?**
- ❌ Clients cannot cheat by manipulating game state
- ✅ Single source of truth (server)
- ✅ Fair gameplay guaranteed
- ✅ Easier to debug and test

**Race Condition Prevention:**
```typescript
// GameManager uses locking mechanism
private moveLocks: Map<string, boolean> = new Map();

// Before processing move
if (this.moveLocks.get(gameId)) {
  return { success: false, error: 'Move in progress' };
}
this.moveLocks.set(gameId, true);

// Process move...

// Always release lock
finally {
  this.moveLocks.delete(gameId);
}
```

**Matchmaking Algorithm:**
1. Players join queue with their ELO rating
2. Server pairs players with similar ELO (±200 range preferred)
3. If no close match after 10s, widens ELO range
4. After 30s, matches with anyone available
5. Game starts immediately upon match

**ELO Rating System:**
- Standard chess ELO formula: `newELO = oldELO + K * (actualScore - expectedScore)`
- K-factor: 32 (higher for faster rating changes in casual games)
- Expected score: `1 / (1 + 10^((opponentElo - playerElo) / 400))`
- Minimum ELO: 0 (can't go negative)
- Initial ELO: 1000

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API and server foundation
- **Socket.io** - Real-time WebSocket communication
- **MongoDB** + **Mongoose** - Database and ODM
- **TypeScript** - Type safety and better DX
- **Railway** - Hosting and deployment

### Frontend (Mobile)
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe React components
- **Socket.io-client** - Real-time server connection
- **React Navigation** - Screen navigation

### DevOps
- **EAS (Expo Application Services)** - Builds and OTA updates
- **GitHub** - Version control and CI/CD
- **MongoDB Atlas** - Managed database hosting

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** (local or [Atlas free tier](https://www.mongodb.com/cloud/atlas/register))
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/SimpliSoni/tictactoe.git
cd tictactoe

# Install server dependencies
cd server
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

### 2. Configure Environment

**Server:** Create `server/.env`
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tictactoe
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
CORS_ORIGIN=*
MATCH_TIMEOUT_SECONDS=30
TURN_TIMEOUT_SECONDS=30
RECONNECT_TIMEOUT_SECONDS=30
INITIAL_ELO=1000
ELO_K_FACTOR=32
```

**Mobile:** Update `mobile/src/config/config.ts`
```typescript
const DEV_CONFIG = {
  SERVER_URL: 'http://192.168.1.10:3000', // Replace with YOUR computer's IP
};
```

> **Finding Your IP:**
> - Windows: `ipconfig` (look for IPv4 Address)
> - Mac/Linux: `ifconfig` or `ip addr`

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas (Recommended)**
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create free cluster (M0)
3. Add database user
4. Whitelist IP: `0.0.0.0/0` (allow all for dev)
5. Get connection string
6. Update `MONGODB_URI` in `server/.env`

### 4. Start the Server

```bash
cd server
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Socket.io initialized
╔════════════════════════════════════════╗
║   🎮 Multiplayer Tic-Tac-Toe Server   ║
╠════════════════════════════════════════╣
║ ✅ Server running on port 3000          ║
║ 📍 Environment: development            ║
║ 🌐 CORS Origin: *                      ║
╚════════════════════════════════════════╝
```

### 5. Start Mobile App

```bash
cd mobile
npm start
```

Scan the QR code with Expo Go app on your phone.

> ⚠️ **Important:** Your phone must be on the same WiFi network as your computer!

### 6. Test Multiplayer

1. **Player 1:** Open app on device 1, tap "Find Match"
2. **Player 2:** Open app on device 2, tap "Find Match"
3. **Play:** You'll be matched! Take turns tapping cells
4. **Win:** Game ends, ELO updates, stats recorded

---

## 📁 Project Structure

```
tictactoe/
├── mobile/                    # React Native mobile app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Board.tsx     # Tic-tac-toe game board
│   │   │   └── ErrorBoundary.tsx
│   │   ├── config/
│   │   │   └── config.ts     # App configuration (API URLs, colors)
│   │   ├── context/
│   │   │   ├── GameContext.tsx     # Game state management
│   │   │   └── NetworkContext.tsx  # Network status tracking
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx      # Main menu
│   │   │   ├── MatchmakingScreen.tsx
│   │   │   ├── GameScreen.tsx      # Active game
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   └── StatsScreen.tsx
│   │   ├── services/
│   │   │   └── socket.ts     # Socket.io client wrapper
│   │   ├── types/
│   │   │   └── game.ts       # TypeScript type definitions
│   │   └── utils/
│   │       └── device.ts     # Device ID generation
│   ├── App.tsx               # App entry point
│   ├── app.json              # Expo configuration
│   ├── eas.json              # EAS Build/Update config
│   └── package.json
│
├── server/                   # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts   # MongoDB connection
│   │   │   └── env.ts        # Environment variables
│   │   ├── controllers/
│   │   │   ├── apiRoutes.ts  # REST API endpoints
│   │   │   └── socketHandlers.ts  # Socket.io events
│   │   ├── models/
│   │   │   ├── User.ts       # User schema
│   │   │   ├── Game.ts       # Game schema
│   │   │   └── Leaderboard.ts
│   │   ├── services/
│   │   │   ├── gameLogic.ts      # Core game rules
│   │   │   ├── gameManager.ts    # Game state management
│   │   │   ├── matchmaking.ts    # Player pairing
│   │   │   └── leaderboard.ts    # ELO calculations
│   │   ├── types/
│   │   │   └── game.ts       # Shared type definitions
│   │   └── index.ts          # Server entry point
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                     # Documentation
├── DEPLOYMENT_CHECKLIST.md   # Step-by-step deployment guide
├── QUICKSTART.md             # Quick setup instructions
└── README.md                 # This file
```

---

## 🚢 Deployment

### Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app/)
   - Sign up with GitHub (no payment method required for trial)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `tictactoe` repository

3. **Configure Root Directory**
   - In project settings, set **Root Directory** to `server`
   - This tells Railway to deploy only the server folder

4. **Set Environment Variables**
   
   Go to **Variables** tab and add:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tictactoe?retryWrites=true&w=majority
   JWT_SECRET=super-secret-production-key-min-32-chars-long
   CORS_ORIGIN=*
   MATCH_TIMEOUT_SECONDS=30
   TURN_TIMEOUT_SECONDS=30
   RECONNECT_TIMEOUT_SECONDS=30
   INITIAL_ELO=1000
   ELO_K_FACTOR=32
   ```

   > ⚠️ **Important:** Use a production MongoDB Atlas connection string!

5. **Deploy**
   - Railway auto-deploys on `git push`
   - Get your deployment URL: `https://your-app.up.railway.app`

6. **Verify Deployment**
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "timestamp": "2025-10-27T12:00:00.000Z"
   }
   ```

### Mobile Deployment (Expo)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Update Production URL**
   
   In `mobile/src/config/config.ts`:
   ```typescript
   const PROD_CONFIG = {
     SERVER_URL: 'https://your-app.up.railway.app',
   };
   ```

4. **Publish Update**
   ```bash
   cd mobile
   eas update --branch production --message "Updated backend URL"
   ```

5. **Build for Stores (Optional)**
   ```bash
   # iOS
   eas build --platform ios

   # Android
   eas build --platform android

   # Both
   eas build --platform all
   ```

---

## 📡 API Documentation

### REST Endpoints

#### Health Check
```http
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-27T12:00:00.000Z"
}
```

#### Get Leaderboard
```http
GET /api/leaderboard?limit=100
```

Response:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "username": "Player123",
      "elo": 1450,
      "stats": {
        "wins": 25,
        "losses": 10,
        "draws": 3,
        "winRate": 65.79
      }
    }
  ]
}
```

#### Get User Stats
```http
GET /api/stats/:userId
```

Response:
```json
{
  "user": {
    "username": "Player123",
    "elo": 1450,
    "stats": {
      "wins": 25,
      "losses": 10,
      "draws": 3,
      "gamesPlayed": 38,
      "winRate": 65.79,
      "currentStreak": 5,
      "longestStreak": 8
    }
  }
}
```

### Socket.io Events

#### Client → Server

```typescript
// Authenticate
socket.emit('auth', {
  deviceId: 'unique-device-id',
  username?: 'OptionalUsername'
});

// Join matchmaking queue
socket.emit('joinQueue');

// Leave matchmaking queue
socket.emit('leaveQueue');

// Make a move (position 0-8)
socket.emit('makeMove', { position: 4 });

// Forfeit game
socket.emit('forfeit');

// Leave game
socket.emit('leaveGame');
```

#### Server → Client

```typescript
// Authentication successful
socket.on('authenticated', (data) => {
  // data: { userId, username, stats, elo }
});

// Entered matchmaking queue
socket.on('queueJoined', (data) => {
  // data: { position, estimatedWaitTime }
});

// Match found
socket.on('matchFound', (data) => {
  // data: { opponent: { username, elo } }
});

// Game started
socket.on('gameStarted', (gameState) => {
  // gameState: { gameId, players, board, currentTurn, ... }
});

// Game state updated (after move)
socket.on('gameUpdate', (gameState) => {
  // Updated gameState
});

// Game ended
socket.on('gameOver', (result) => {
  // result: { winner, reason, eloChange, stats }
});

// Opponent disconnected
socket.on('opponentDisconnected', (data) => {
  // data: { timeoutSeconds: 30 }
});

// Opponent reconnected
socket.on('opponentReconnected');

// Error occurred
socket.on('error', (error) => {
  // error: { message: string }
});
```

---

## 🧪 Testing Guide

See [QUICKSTART.md](./QUICKSTART.md) for comprehensive local testing instructions.

**Quick Test Checklist:**
- [ ] Server connects to MongoDB
- [ ] Mobile app connects to server
- [ ] Two players can be matched
- [ ] Game board updates in real-time
- [ ] Win detection works correctly
- [ ] Draw detection works correctly
- [ ] ELO updates after game
- [ ] Stats update correctly
- [ ] Leaderboard displays rankings
- [ ] Disconnect/reconnect works
- [ ] Forfeit detection works (30s timeout)

---

## 🤝 Contributing

This is an assignment project. Contributions are not being accepted at this time.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Developer

**SimpliSoni** - [GitHub](https://github.com/SimpliSoni)

---

## 🙏 Acknowledgments

- **Lila Games** - For the assignment opportunity
- **Railway** - For generous free tier
- **MongoDB Atlas** - For free database hosting
- **Expo** - For amazing mobile development experience

---

**Built with ❤️ for Lila Games Backend Assignment**
