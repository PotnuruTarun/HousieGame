# Tambola Multiplayer Game

Real-time multiplayer Tambola (Housie) game built with React, Socket.io, and Express.

## 🚀 Deployment Instructions

### 1. Frontend (Vercel)
- Push the code to a GitHub repository.
- Connect your repo to **Vercel**.
- **Root Directory**: Select `client`.
- **Framework Preset**: `Vite`.
- **Build Command**: `npm run build`.
- **Output Directory**: `dist`.
- **Environment Variables**: Add `VITE_SERVER_URL` pointing to your deployed backend URL.

### 2. Backend (Render / Railway / Render recommended)
- **Vercel is not recommended for Socket.io** backends because serverless functions are stateless and don't support persistent websocket connections.
- Connect your repo to **Render.com** (Web Service).
- **Root Directory**: Select `server`.
- **Build Command**: `npm install`.
- **Start Command**: `node server.js`.
- **Environment Variables**: 
  - Add `MONGODB_URI` (from MongoDB Atlas).
  - Add `PORT` (usually `5000` or Render will set it automatically).

### 3. GitHub
- Initialize git: `git init`.
- Add files: `git add .`.
- Commit: `git commit -m "initial commit"`.
- Create a repo on GitHub and push.

## 🛠️ Tech Stack
- **Frontend**: React, Framer Motion, Lucide Icons, Vite.
- **Backend**: Node.js, Express, Socket.io, Mongoose (MongoDB).
# HousieGame
