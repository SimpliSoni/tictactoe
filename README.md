# Tic-Tac-Toe Mobile Game (Assignment)

A real-time multiplayer Tic-Tac-Toe game built with React Native (Expo), Node.js/Express, Socket.IO, and MongoDB.

## Project Structure

```
tictactoe/
├── server/          # Backend API & Socket.IO server (TypeScript)
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── mobile/          # React Native mobile app (Expo + TypeScript)
│   ├── .setup/      # Example files (App.example.tsx)
│   └── README.md    # Mobile setup instructions
│
└── README.md        # This file
```

## Prerequisites

Install these on your development machine:

1. **Node.js** (LTS version) - [nodejs.org](https://nodejs.org/)
2. **Git** - [git-scm.com](https://git-scm.com/)
3. **VS Code** (recommended) - [code.visualstudio.com](https://code.visualstudio.com/)
4. **Expo Go** app on your phone (iOS/Android) - Install from App Store / Play Store

## Quick Start

### 1. Clone and Install Server Dependencies

```powershell
# Clone the repo
git clone https://github.com/SimpliSoni/tictactoe.git
cd tictactoe

# Install server dependencies
cd server
npm install
```

### 2. Set Up MongoDB Atlas (Free Tier - No Credit Card)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free M0 cluster
3. Create a database user (e.g., `gameUser` with a strong password)
4. Allow network access from anywhere (0.0.0.0/0) for testing
5. Get your connection string:
   ```
   mongodb+srv://gameUser:<password>@cluster0.xxxxx.mongodb.net/tictactoe?retryWrites=true&w=majority
   ```

### 3. Configure Environment Variables

Create `server/.env` (copy from `.env.example`):

```env
MONGODB_URI=mongodb+srv://gameUser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/tictactoe?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_key_here
PORT=3000
```

**⚠️ NEVER commit your `.env` file to Git!**

### 4. Run Server Locally (Optional Test)

```powershell
# In server/ folder
npm run dev
```

Visit `http://localhost:3000/` - you should see: **"Tic-Tac-Toe Server is live!"**

### 5. Deploy Server to Railway

1. Go to [railway.app](https://railway.app/) and sign in with GitHub
2. Create **New Project** → **Deploy from GitHub repo**
3. Select your `tictactoe` repository
4. **Important:** Choose **Monorepo** and select the `server` directory
5. Add environment variables in Railway dashboard:
   - `MONGODB_URI` = (your MongoDB Atlas connection string)
   - `JWT_SECRET` = (a strong random string)
6. Wait for deployment to complete
7. Copy your public Railway URL (e.g., `https://your-project.up.railway.app`)

**Test the deployed server:** Open the Railway URL in your browser - you should see the "Server is live!" message.

#### Troubleshooting Railway Deployment

If Railway shows **"Script start.sh not found"** or **"Could not determine how to build"**:

- **Solution 1:** Railway should auto-detect `package.json`. Ensure:
  - `server/package.json` has `"start": "node dist/index.js"`
  - `server/package.json` has `"build": "tsc"`
  - The `engines` field specifies Node version (already added)

- **Solution 2:** Railway will run `npm install` and `npm run build`, then `npm start`. Check that:
  - `tsconfig.json` outputs to `dist/`
  - No syntax errors in TypeScript files

- **Solution 3:** Check Railway logs for specific errors (click "Deployments" → latest deployment → "View Logs")

### 6. Set Up Mobile App

```powershell
# Navigate to mobile folder
cd ../mobile

# Initialize Expo project (requires empty folder)
npx create-expo-app . --template blank-ts

# Install dependencies
npx expo install socket.io-client @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

### 7. Configure Mobile App

1. Open `mobile/App.tsx`
2. Copy the contents from `mobile/.setup/App.example.tsx`
3. Update the `SERVER_URL` constant:
   ```typescript
   const SERVER_URL = 'https://your-project.up.railway.app';
   ```

### 8. Run Mobile App

```powershell
# In mobile/ folder
npx expo start
```

**On your phone:**
1. Open **Expo Go** app
2. Scan the QR code from the terminal
3. The app should show:
   - **Status:** Connected with ID: [socket-id]
   - **Server says:** Welcome to the server!

🎉 **Success!** Your mobile app is now connected to your live cloud backend.

## Development Workflow

### Server Development
```powershell
cd server
npm run dev        # Run with auto-reload (TypeScript)
npm run build      # Compile TypeScript to JavaScript
npm start          # Run compiled JavaScript
```

### Mobile Development
```powershell
cd mobile
npx expo start     # Start Expo dev server
```

## Project Status

- ✅ Server setup (Express + Socket.IO)
- ✅ Mobile scaffold (Expo + React Native)
- ✅ Real-time connection test (Hello World)
- ⏳ Game logic (coming next)
- ⏳ User authentication (coming next)
- ⏳ Leaderboard (coming next)

## Security Notes

- Never commit `.env` files with real credentials
- Restrict MongoDB network access after initial testing
- Use strong, unique values for `JWT_SECRET`
- Keep dependencies updated (`npm audit`)

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js (HTTP server)
- Socket.IO (real-time communication)
- MongoDB + Mongoose (database)
- JWT (authentication)

**Frontend:**
- React Native + Expo
- TypeScript
- Socket.IO Client
- React Navigation

**Deployment:**
- Railway (server hosting)
- MongoDB Atlas (database hosting)
- Expo Go (mobile testing)

## Next Steps

Once you confirm the connection works:

1. Implement game state management (board, turns, win detection)
2. Add user authentication (JWT)
3. Create game rooms and matchmaking
4. Build the UI (game board, buttons, animations)
5. Add leaderboard functionality
6. Test multiplayer gameplay

## License

ISC

## Author

SimpliSoni
