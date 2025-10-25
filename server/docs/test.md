# COMPREHENSIVE DEVELOPMENT PROMPT: Custom Multiplayer Tic-Tac-Toe

## Context
I'm building a **server-authoritative multiplayer Tic-Tac-Toe game** for a LILA Engineering job assignment. Due to deployment constraints (no credit card for cloud platforms), I'm building a **custom lightweight stack** that demonstrates strong backend fundamentals while being deployable on free tiers.

## Tech Stack (LOCKED IN - Free Tier Compatible)
- **Backend:** Node.js + Express + Socket.io (TypeScript)
- **Database:** MongoDB Atlas (Free 512MB tier)
- **Mobile:** React Native + Expo (TypeScript)
- **Deployment:** 
  - Backend: Railway.app (Free $5 monthly credit, no CC)
  - Database: MongoDB Atlas (Free tier, no CC)
  - Mobile: Expo Go (Free shareable link)

## Assignment Requirements (FROM PDF)
✅ Server-authoritative multiplayer mode (CRITICAL)
✅ Matchmaking mechanism (search/create games)
✅ Deploy server and game to cloud
✅ Handle multiple simultaneous games (BONUS)
✅ Leaderboard system (BONUS)
✅ Share deployed link + source code
✅ README with design choices and architecture

---

## What I Need From You

### PHASE 1: Backend Server (Node.js + Socket.io)

**Please provide COMPLETE, PRODUCTION-READY code for:**

#### 1.1 Project Structure
```
server/
├── src/
│   ├── index.ts                 # Express + Socket.io server
│   ├── config/
│   │   ├── database.ts          # MongoDB connection
│   │   └── env.ts               # Environment variables
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   ├── Game.ts              # Game schema
│   │   └── Leaderboard.ts       # Leaderboard schema
│   ├── services/
│   │   ├── gameLogic.ts         # Tic-Tac-Toe logic
│   │   ├── matchmaking.ts       # Queue & pairing
│   │   ├── gameManager.ts       # Active games manager
│   │   └── leaderboard.ts       # Rankings & stats
│   ├── controllers/
│   │   ├── socketHandlers.ts   # Socket.io events
│   │   └── apiRoutes.ts         # REST endpoints
│   └── types/
│       └── game.ts              # TypeScript interfaces
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

#### 1.2 Core Features to Implement

**A) Server-Authoritative Game Logic**
- Tic-Tac-Toe game state management
- Move validation (legal moves only)
- Win detection (rows, cols, diagonals)
- Draw detection
- Turn management
- **CRITICAL:** All logic server-side, never trust client

**B) Matchmaking System**
```typescript
// Queue-based matchmaking
interface MatchmakingQueue {
  addPlayer(socketId: string, userId: string): void;
  removePlayer(socketId: string): void;
  findMatch(): [Player, Player] | null;
  createPrivateGame(hostId: string): string; // room code
  joinPrivateGame(playerId: string, roomCode: string): boolean;
}
```

**C) Game Manager**
```typescript
// Manage multiple simultaneous games
interface GameManager {
  createGame(player1: Player, player2: Player): Game;
  getGame(gameId: string): Game | null;
  makeMove(gameId: string, playerId: string, position: number): MoveResult;
  endGame(gameId: string): void;
  getActiveGames(): Game[];
}
```

**D) Real-time Communication (Socket.io)**
```typescript
// Socket events to implement
interface SocketEvents {
  // Client -> Server
  'auth': (token: string) => void;
  'joinQueue': () => void;
  'leaveQueue': () => void;
  'makeMove': (position: number) => void;
  'createPrivateGame': () => void;
  'joinPrivateGame': (roomCode: string) => void;
  'leaveGame': () => void;
  
  // Server -> Client
  'authenticated': (user: User) => void;
  'matchFound': (game: Game) => void;
  'gameUpdate': (state: GameState) => void;
  'opponentMove': (position: number) => void;
  'gameOver': (result: GameResult) => void;
  'error': (message: string) => void;
  'opponentDisconnected': () => void;
}
```

**E) Leaderboard System**
```typescript
interface LeaderboardService {
  updateStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void>;
  calculateELO(winner: User, loser: User): Promise<void>; // Optional but impressive
  getTopPlayers(limit: number): Promise<LeaderboardEntry[]>;
  getUserRank(userId: string): Promise<number>;
  getUserStats(userId: string): Promise<UserStats>;
}
```

**F) MongoDB Schemas**
```typescript
// User Schema
interface User {
  _id: ObjectId;
  deviceId: string;           // For guest auth
  username: string;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    gamesPlayed: number;
  };
  elo: number;               // Rating (start at 1000)
  createdAt: Date;
  lastActive: Date;
}

// Game Schema
interface Game {
  _id: ObjectId;
  gameId: string;
  players: {
    X: { userId: string, socketId: string },
    O: { userId: string, socketId: string }
  };
  board: (null | 'X' | 'O')[];  // 9 cells
  currentTurn: 'X' | 'O';
  status: 'active' | 'completed' | 'abandoned';
  winner: 'X' | 'O' | 'draw' | null;
  moves: Array<{
    player: 'X' | 'O',
    position: number,
    timestamp: Date
  }>;
  createdAt: Date;
  completedAt?: Date;
}

// Leaderboard Schema (denormalized for fast queries)
interface LeaderboardEntry {
  _id: ObjectId;
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  elo: number;
  rank: number;
  winRate: number;          // Calculated field
  updatedAt: Date;
}
```

#### 1.3 Critical Implementation Requirements

**Server-Authoritative Validation:**
```typescript
// Example of what I need
function validateMove(game: Game, playerId: string, position: number): boolean {
  // 1. Check if it's player's turn
  // 2. Check if position is valid (0-8)
  // 3. Check if cell is empty
  // 4. Check if game is still active
  // NEVER trust client input
}
```

**Disconnection Handling:**
```typescript
// Handle player disconnect
socket.on('disconnect', () => {
  // 1. Find active game for this socket
  // 2. Notify opponent
  // 3. Give 30 seconds to reconnect
  // 4. If no reconnect, forfeit game
  // 5. Update stats
});
```

**Edge Cases to Handle:**
- Two players disconnect simultaneously
- Invalid moves sent by client
- Player tries to move on opponent's turn
- Game state corruption (defensive programming)
- Database write failures
- Socket reconnection mid-game

#### 1.4 Environment Variables
```bash
# .env.example
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:19000
```

#### 1.5 Deployment Configuration
```json
// railway.json (if needed)
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### PHASE 2: Mobile App (React Native + Expo)

**Please provide COMPLETE, PRODUCTION-READY code for:**

#### 2.1 Project Structure
```
mobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── MatchmakingScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── LeaderboardScreen.tsx
│   │   └── GameOverScreen.tsx
│   ├── components/
│   │   ├── TicTacToeBoard.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── services/
│   │   ├── socket.ts            # Socket.io client
│   │   └── api.ts               # REST API calls
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── GameContext.tsx
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   └── useGame.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── storage.ts           # AsyncStorage
├── App.tsx
├── app.json
├── package.json
└── tsconfig.json
```

#### 2.2 Socket.io Client Integration
```typescript
// Example structure I need
class SocketService {
  socket: Socket | null;
  
  connect(serverUrl: string, token: string): void;
  disconnect(): void;
  
  // Emit events
  joinQueue(): void;
  makeMove(position: number): void;
  leaveGame(): void;
  
  // Listen to events
  onMatchFound(callback: (game: Game) => void): void;
  onGameUpdate(callback: (state: GameState) => void): void;
  onGameOver(callback: (result: GameResult) => void): void;
  onError(callback: (error: string) => void): void;
}
```

#### 2.3 Screen Implementations

**A) HomeScreen**
- Welcome message
- "Find Match" button (joins queue)
- "View Leaderboard" button
- Display user stats (W/L/D)
- Username input (if first time)

**B) MatchmakingScreen**
- "Searching for opponent..." animation
- Cancel button (leave queue)
- Show queue status (optional)
- Transition to GameScreen when match found

**C) GameScreen** (MOST IMPORTANT)
- 3x3 Tic-Tac-Toe board
- Current player indicator (You: X, Opponent: O)
- Turn indicator ("Your turn" / "Opponent's turn")
- Opponent info card
- Disable moves when not your turn
- Real-time move updates
- Timer per turn (optional but nice)
- "Forfeit" button

**D) GameOverScreen**
- Win/Loss/Draw message
- Final board state
- Stats update display
- "Play Again" button (re-queue)
- "Go Home" button

**E) LeaderboardScreen**
- Top 50 players list
- Rank, Username, Wins, Losses, ELO
- Current user highlight
- Pull to refresh
- User's global rank at top

#### 2.4 TicTacToeBoard Component
```typescript
interface TicTacToeBoardProps {
  board: (null | 'X' | 'O')[];
  onCellPress: (position: number) => void;
  disabled: boolean;
  playerSymbol: 'X' | 'O';
}

// Requirements:
// - 3x3 grid layout
// - Touch feedback
// - Disable all cells when not your turn
// - Animate X and O appearance
// - Highlight winning cells (if win)
// - Responsive sizing
```

#### 2.5 Authentication Flow
```typescript
// Simple guest authentication
// Generate unique device ID
// Store in AsyncStorage
// Send to server on connect
// Server creates/retrieves user
```

#### 2.6 Environment Configuration
```typescript
// app.config.js
export default {
  expo: {
    name: "TicTacToe Multiplayer",
    slug: "tictactoe-mp",
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:3000",
      socketUrl: process.env.SOCKET_URL || "http://localhost:3000"
    }
  }
};
```

---

### PHASE 3: Integration & Real-time Flow

**Document the complete data flow:**

```
1. User opens app
   → Generate/retrieve device ID
   → Connect to Socket.io server
   → Authenticate with device ID
   → Load user stats

2. User clicks "Find Match"
   → Emit 'joinQueue' event
   → Show MatchmakingScreen
   → Server adds to queue
   → Server pairs with another player
   → Server emits 'matchFound' to both
   → Navigate to GameScreen

3. Game Play
   → User taps cell
   → Validate locally (UX only)
   → Emit 'makeMove' event
   → Server validates move
   → Server updates game state
   → Server emits 'gameUpdate' to both players
   → Both clients update board
   → Repeat until game over

4. Game Over
   → Server detects win/draw
   → Server updates MongoDB (stats, leaderboard)
   → Server emits 'gameOver' to both
   → Show GameOverScreen
   → Update local stats display

5. Disconnection
   → Socket disconnects
   → Server waits 30s for reconnection
   → If reconnect: resume game
   → If no reconnect: forfeit, notify opponent
```

---

### PHASE 4: Deployment

#### 4.1 MongoDB Atlas Setup (No CC Required)
```markdown
1. Go to mongodb.com/cloud/atlas
2. Sign up with email (no CC needed)
3. Create FREE M0 cluster (512MB)
4. Choose AWS, any region close to you
5. Create database user
6. Whitelist IP: 0.0.0.0/0 (allow all)
7. Get connection string
8. Format: mongodb+srv://user:pass@cluster.mongodb.net/tictactoe
```

#### 4.2 Railway.app Deployment (No CC Required)
```markdown
1. Go to railway.app
2. Sign in with GitHub
3. New Project → Deploy from GitHub repo
4. Select your backend repo
5. Add environment variables:
   - MONGODB_URI
   - JWT_SECRET
   - NODE_ENV=production
   - PORT=3000
6. Deploy automatically
7. Get public URL: https://your-app.railway.app
8. Test with Postman
```

#### 4.3 Expo Deployment
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure
eas build:configure

# Update app.config.js with production API URL
export API_URL=https://your-app.railway.app

# Publish to Expo Go
eas update --branch production

# Generate shareable link
# Will get: exp://exp.host/@yourusername/tictactoe-mp
```

---

### PHASE 5: Documentation

#### 5.1 README.md Structure
```markdown
# Multiplayer Tic-Tac-Toe

## 🎮 Live Demo
- **Mobile App:** [Expo Go Link]
- **Backend API:** https://your-app.railway.app
- **Demo Video:** [YouTube/Loom link]

## 📋 Assignment Completion
✅ Server-authoritative multiplayer
✅ Matchmaking system (queue-based)
✅ Deployed to cloud (Railway + MongoDB Atlas)
✅ Multiple simultaneous games
✅ Leaderboard system with ELO ratings
✅ Mobile app (React Native + Expo)

## 🏗️ Architecture

### Tech Stack
- Backend: Node.js, Express, Socket.io, TypeScript
- Database: MongoDB Atlas
- Mobile: React Native, Expo, TypeScript
- Real-time: WebSockets (Socket.io)

### System Design
[ASCII diagram of architecture]

### Key Design Decisions
1. **Why custom backend vs Nakama?**
   - Full control over game logic
   - Demonstrates backend fundamentals
   - Lighter deployment footprint
   - Better for free tier constraints

2. **Queue-based Matchmaking**
   - Simple FIFO queue
   - O(1) matching time
   - Scales to hundreds of concurrent users

3. **Server-Authoritative Model**
   - All game logic on server
   - Client sends move requests
   - Server validates and broadcasts
   - Prevents cheating

4. **ELO Rating System**
   - K-factor of 32
   - Initial rating: 1000
   - Updates after each game
   - Fair skill-based rankings

### Data Flow
[Diagram of client-server communication]

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Expo Go app on phone

### Backend
\`\`\`bash
cd server
npm install
cp .env.example .env
# Edit .env with MongoDB URI
npm run dev
\`\`\`

### Mobile
\`\`\`bash
cd mobile
npm install
# Edit app.config.js with backend URL
npx expo start
# Scan QR code with Expo Go
\`\`\`

## 🧪 Testing
- Run server: `npm test`
- Test matchmaking: Open 2 phones
- Check MongoDB: See game records

## 📊 Database Schema
[Schema diagrams]

## 🎯 Future Improvements
- Friend invites
- Game history/replays
- Chat system
- Tournament mode
- AI opponent (single player)

## 👨‍💻 Author
[Your name] - LILA Backend Assignment
```

#### 5.2 Architecture Diagram (ASCII)
```
┌─────────────────────────────────────┐
│         Mobile Clients              │
│   (React Native + Socket.io)        │
└──────────────┬──────────────────────┘
               │ WebSocket
               │ (Socket.io)
               ↓
┌──────────────────────────────────────┐
│      Node.js Backend Server          │
│                                      │
│  ┌─────────────────────────────┐    │
│  │   Express REST API          │    │
│  │   - /health                 │    │
│  │   - /leaderboard            │    │
│  │   - /stats/:userId          │    │
│  └─────────────────────────────┘    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │   Socket.io Handlers        │    │
│  │   - auth                    │    │
│  │   - joinQueue               │    │
│  │   - makeMove                │    │
│  │   - disconnect              │    │
│  └─────────────────────────────┘    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │   Game Services             │    │
│  │   - MatchmakingQueue        │    │
│  │   - GameManager             │    │
│  │   - GameLogic               │    │
│  │   - LeaderboardService      │    │
│  └─────────────────────────────┘    │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│       MongoDB Atlas                  │
│                                      │
│  Collections:                        │
│  - users (auth, stats, elo)         │
│  - games (active & completed)       │
│  - leaderboard (rankings)           │
└──────────────────────────────────────┘
```

---

## Critical Requirements (DO NOT SKIP)

### ✅ Server-Authoritative (HIGHEST PRIORITY)
```typescript
// WRONG - Client decides winner
if (checkWin(board)) {
  socket.emit('gameWon', { winner: 'me' });
}

// CORRECT - Server validates and decides
socket.emit('makeMove', { position: 5 });
// Server checks move, updates state, broadcasts result
```

### ✅ Error Handling
Every function must handle errors:
```typescript
try {
  const game = await Game.findById(gameId);
  if (!game) throw new Error('Game not found');
  // ... logic
} catch (error) {
  console.error('Error:', error);
  socket.emit('error', { message: 'Something went wrong' });
}
```

### ✅ TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### ✅ No Hardcoded Values
```typescript
// WRONG
const API_URL = "http://localhost:3000";

// CORRECT
const API_URL = process.env.API_URL || "http://localhost:3000";
```

---

## Testing Checklist

Before deployment, test:
- [ ] 2 players can match via queue
- [ ] Moves sync in real-time
- [ ] Win detection works (all 8 cases)
- [ ] Draw detection works
- [ ] Leaderboard updates after game
- [ ] Disconnection handled gracefully
- [ ] Can play 3+ simultaneous games
- [ ] No crashes on invalid moves
- [ ] Mobile app handles network errors
- [ ] Stats persist across sessions

---

## Questions to Answer in Code Comments

1. **How do you prevent race conditions** when two players move simultaneously?
2. **How do you handle socket reconnection** mid-game?
3. **Why use ELO vs simple win rate** for leaderboard?
4. **How do you clean up abandoned games** (memory leaks)?
5. **What's your strategy for scaling** to 1000+ concurrent games?

---

## Deliverables

Please provide:

### 1. Complete Backend Code
- All TypeScript files
- package.json with dependencies
- .env.example
- Database models
- Socket handlers
- Game logic with tests

### 2. Complete Mobile Code
- All screens
- Components
- Socket integration
- Navigation setup
- package.json

### 3. Deployment Files
- Railway configuration
- MongoDB Atlas setup guide
- Expo build config
- Environment variable list

### 4. Documentation
- Comprehensive README
- Architecture diagram
- API documentation (if REST endpoints)
- Setup instructions

### 5. Testing Guide
- How to test locally with 2 players
- Edge cases tested
- Known limitations

---

## My Context

- **Experience:** 
  - Node.js: [Intermediate/Advanced]
  - React Native: [Beginner/Intermediate]
  - Socket.io: [Beginner]
  - MongoDB: [Intermediate]
  - TypeScript: [Intermediate]

- **Time Available:** 5-6 days

- **Deployment Constraint:** 
  - ❌ No credit card available
  - ✅ Must use Railway free tier
  - ✅ Must use MongoDB Atlas free tier
  - ✅ Must use Expo free tier

---

## Success Criteria

This submission must:
1. ✅ Be fully deployed and accessible via link
2. ✅ Support 2+ simultaneous games without issues
3. ✅ Be completely server-authoritative
4. ✅ Have working matchmaking
5. ✅ Have functional leaderboard
6. ✅ Have professional documentation
7. ✅ Handle edge cases gracefully
8. ✅ Show strong engineering fundamentals
9. ✅ Be impressive enough to get hired

---

## Let's Build This!

Start with **PHASE 1: Backend Server**.

Give me:
1. ✅ Complete package.json with all dependencies
2. ✅ Complete tsconfig.json
3. ✅ Full server setup (index.ts)
4. ✅ MongoDB models (User, Game, Leaderboard)
5. ✅ Game logic service (moves, win detection)
6. ✅ Matchmaking service (queue, pairing)
7. ✅ Game manager (multiple games)
8. ✅ Socket.io event handlers
9. ✅ REST API routes (leaderboard, stats)
10. ✅ Error handling throughout

**Make it production-ready, well-commented, and impressive.**

let's go , complete phase 1