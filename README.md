# Multiplayer Tic-Tac-Toe

Real-time multiplayer Tic-Tac-Toe with matchmaking, ELO ratings, and leaderboards. Built with React Native, Node.js, Socket.io, and MongoDB.

## Live Demo

Backend API: https://tictactoe-production-dc7d.up.railway.app

Health Check: https://tictactoe-production-dc7d.up.railway.app/api/health

Leaderboard: https://tictactoe-production-dc7d.up.railway.app/api/leaderboard

Mobile App: [Download Tictactoe](https://expo.dev/accounts/simplisoni/projects/mobile/builds/dcc63df9-8e7a-453d-93fa-5aef5465656c)

GitHub: https://github.com/SimpliSoni/tictactoe

Drive (APK and video demo) : https://drive.google.com/drive/folders/1rjv1D8-NmB6vddEhoSrXJb7hygIGQP3P?usp=drive_link 

### Try It Now

Download the app direclty at :
https://expo.dev/accounts/simplisoni/projects/mobile/builds/dcc63df9-8e7a-453d-93fa-5aef5465656c

---

## Features

### Gameplay
- Real-time multiplayer with instant synchronization
- Server-authoritative game logic prevents cheating
- Automatic matchmaking based on skill ratings
- Reconnection support with 30-second timeout
- Auto-forfeit on prolonged disconnection

### Player System
- ELO rating system using chess-style calculations
- Stats tracking: wins, losses, draws, streaks, win rate
- Global leaderboard with rankings
- Device-based authentication, no signup required

### Technical
- Race condition prevention with move locking
- Production deployment on Railway with MongoDB Atlas
- Cross-platform support for iOS and Android
- Comprehensive error handling and recovery

---

## Tech Stack

Backend:
- Node.js with Express and TypeScript
- Socket.io for real-time communication
- MongoDB with Mongoose ODM
- Deployed on Railway

Mobile:
- React Native with Expo and TypeScript
- Socket.io-client
- React Navigation

Database:
- MongoDB Atlas free tier

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- MongoDB local instance or Atlas account at https://www.mongodb.com/cloud/atlas/register
- Expo Go app on mobile device from https://expo.dev/client

### Installation

Clone repository:
```bash
git clone https://github.com/SimpliSoni/tictactoe.git
cd tictactoe
```

Install server dependencies:
```bash
cd server
npm install
```

Install mobile dependencies:
```bash
cd ../mobile
npm install
```

### Configuration

Create server/.env file:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tictactoe
JWT_SECRET=your-secret-key-minimum-32-characters
CORS_ORIGIN=*
MATCH_TIMEOUT_SECONDS=30
TURN_TIMEOUT_SECONDS=30
RECONNECT_TIMEOUT_SECONDS=30
INITIAL_ELO=1000
ELO_K_FACTOR=32
```

Update mobile/src/config/config.ts:
```typescript
const DEV_CONFIG = {
  SERVER_URL: 'http://YOUR_LOCAL_IP:3000',
};
```

Find your local IP:
- Windows: ipconfig (look for IPv4 Address)
- Mac/Linux: ifconfig or ip addr

### Running Locally

Start MongoDB:
```bash
mongod
```

Start server:
```bash
cd server
npm run dev
```

Start mobile app:
```bash
cd mobile
npm start
```

Scan QR code with Expo Go. Device must be on same WiFi network as computer.

---

## Project Structure

```
tictactoe/
├── mobile/
│   ├── src/
│   │   ├── components/          Board, ErrorBoundary
│   │   ├── config/              App configuration
│   │   ├── context/             Game and Network state
│   │   ├── screens/             Home, Game, Leaderboard, Stats
│   │   ├── services/            Socket.io client
│   │   ├── types/               TypeScript definitions
│   │   └── utils/               Helper functions
│   ├── App.tsx
│   ├── app.json                 Expo configuration
│   └── eas.json                 EAS Build configuration
│
├── server/
│   ├── src/
│   │   ├── config/              Database and environment
│   │   ├── controllers/         API routes and socket handlers
│   │   ├── models/              MongoDB schemas
│   │   ├── services/            Game logic, matchmaking, ELO
│   │   ├── types/               Type definitions
│   │   └── index.ts             Server entry point
│   └── tsconfig.json
│
└── docs/
```

---

## Deployment

### Backend on Railway

1. Create account at https://railway.app 
2. Create new project from GitHub repository
3. Set root directory to "server" in project settings
4. Add environment variables in Variables tab:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tictactoe
JWT_SECRET=production-secret-key-min-32-chars
CORS_ORIGIN=*
MATCH_TIMEOUT_SECONDS=30
TURN_TIMEOUT_SECONDS=30
RECONNECT_TIMEOUT_SECONDS=30
INITIAL_ELO=1000
ELO_K_FACTOR=32
```

5. Railway auto-deploys on git push
6. Verify with: curl https://your-app.up.railway.app/api/health

### Mobile on Expo

Install EAS CLI:
```bash
npm install -g eas-cli
```

Login to Expo:
```bash
eas login
```

Update production URL in mobile/src/config/config.ts:
```typescript
const PROD_CONFIG = {
  SERVER_URL: 'https://your-app.up.railway.app',
};
```

Publish update:
```bash
cd mobile
eas update --branch production --message "Production release"
```

Build for app stores (optional):
```bash
eas build --platform all
```

---

## API Documentation

### REST Endpoints

Health Check:
```
GET /api/health
```

Leaderboard:
```
GET /api/leaderboard?limit=100
```

User Stats:
```
GET /api/stats/:userId
```

### Socket.io Events

Client to Server:
- auth: Authenticate with deviceId and optional username
- joinQueue: Enter matchmaking queue
- leaveQueue: Exit matchmaking queue
- makeMove: Submit move (position 0-8)
- forfeit: Surrender current game
- leaveGame: Exit game session

Server to Client:
- authenticated: Authentication successful
- queueJoined: Entered matchmaking
- matchFound: Opponent found
- gameStarted: Game session created
- gameUpdate: Board state changed
- gameOver: Game concluded
- opponentDisconnected: Opponent lost connection
- opponentReconnected: Opponent reconnected
- error: Error occurred

---

## Architecture Decisions

### Why Custom Server Instead of Nakama

Nakama was evaluated but rejected:
- Requires 2GB+ RAM minimum
- Incompatible with free hosting tiers
- Complex Docker-based setup
- Overkill for project requirements

Custom solution runs on Railway free tier (512MB RAM) with full control.

### Why Railway

Railway free tier provides:
- $5 monthly credit, no credit card required
- Automatic GitHub deployment
- Built-in WebSocket support
- Simple environment variable management
- Monorepo support for deploying server folder only


### Why MongoDB

Reasons for choosing MongoDB:
- familiarity
- Easy horizontal scaling with sharding

### Why Expo

Benefits of Expo:
- Instant testing via QR code
- Live reload during development
- Over-the-air updates without app store approval
- Built-in cross-platform modules
- Single codebase for iOS and Android

---

## Architecture Highlights

Server-Authoritative Design:
```
Client Request → Socket.io → Server Validation → Game Logic → State Update → Broadcast
```

All game rules enforced server-side to prevent cheating.

Race Condition Prevention:
```typescript
private moveLocks: Map<string, boolean> = new Map();

if (this.moveLocks.get(gameId)) {
  return { success: false, error: 'Move in progress' };
}
this.moveLocks.set(gameId, true);
// Process move
this.moveLocks.delete(gameId);
```

Matchmaking Algorithm:
1. Match players within ±200 ELO range
2. Widen range after 10 seconds
3. Match with anyone after 30 seconds

ELO System:
- Formula: newELO = oldELO + K × (actualScore - expectedScore)
- K-factor: 32 for faster rating changes
- Initial rating: 1000
- Minimum rating: 0



## Developer

SimpliSoni - https://github.com/SimpliSoni

--- 
Built with ❤️ for Lila Games Backend Assignment