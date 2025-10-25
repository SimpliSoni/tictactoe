# 🚀 DEPLOYMENT_CHECKLIST.md

This checklist ensures all steps are covered for deploying the Tic-Tac-Toe application to Railway (Backend) and distributing the Mobile App (Expo).

## 🧱 Phase 1: Backend Deployment Setup (Railway & MongoDB)

- [ ] **Code Check**: Final server code committed to the GitHub repository.
- [ ] **MongoDB Atlas**:
    - [ ] Production cluster created.
    - [ ] Database user created with necessary access.
    - [ ] Network access rules configured (at least `0.0.0.0/0` initially, later restricted).
    - [ ] Connection string copied.
- [ ] **Railway Configuration**:
    - [ ] New project created and linked to the GitHub repo.
    - [ ] **Monorepo Root Directory** set to **`server/`**.

## ⚙️ Phase 2: Environment Variables (Critical for Railway)

All variables from `server/.env.example` must be set in Railway's **Variables** tab.

- [ ] `NODE_ENV`: Set to **`production`**
- [ ] `MONGODB_URI`: Set to the **MongoDB Atlas production connection string**.
- [ ] `JWT_SECRET`: Set to a **strong, unique random string** (min 32 chars).
- [ ] `CORS_ORIGIN`: Set to allow traffic from Expo Go/your production frontend URL(s). (e.g., `*` for initial testing, or specific `exp://...` URLs).
- [ ] `PORT`: Usually omitted (Railway provides this).
- [ ] `MATCH_TIMEOUT_SECONDS`: (Default: `30`)
- [ ] `TURN_TIMEOUT_SECONDS`: (Default: `30`)
- [ ] `RECONNECT_TIMEOUT_SECONDS`: (Default: `30`)
- [ ] `INITIAL_ELO`: (Default: `1000`)
- [ ] `ELO_K_FACTOR`: (Default: `32`)

## ✅ Phase 3: Deployment Verification

- [ ] **Build Check**: Verified build completion in Railway deployment logs.
- [ ] **Server URL**: Copied the final public URL provided by Railway (e.g., `https://your-app.up.railway.app`).
- [ ] **Health Check (CRITICAL)**: Accessed `https://[RAILWAY_URL]/api/health` and verified JSON output shows `"status": "ok"` and `"database": "connected"`.

## 📱 Phase 4: Mobile App Production Config

- [ ] **Mobile Config Update**: Updated `mobile/src/config/config.ts` (the non-`__DEV__` value) to use the **Railway Server URL**.
- [ ] **EAS Update**: Ran `cd mobile` and then `eas update` to publish the new configuration.

## 🏁 Phase 5: Final Testing

- [ ] **Multiplayer Test**: Tested a full game loop between two clients using the **published Expo Go link** to ensure they connect and sync via the **Railway backend**.
- [ ] **Feature Test**: Verified Leaderboard and user Stats are retrieved correctly via API routes on the deployed server.