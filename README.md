# Spiritual Warfare - 3D Multiplayer Battle Arena

A real-time 3D multiplayer game built with React, Three.js, Node.js, and WebSockets.

## Features

- 3D isometric arena
- Team-based multiplayer (Red, Blue, Free-for-All)
- Real-time movement and combat
- Equipment shop system
- Player tracking and statistics

## Tech Stack

- **Frontend**: React 18, Three.js, Vite
- **Backend**: Node.js, WebSocket (ws library)
- **Build**: Vite for client, standard Node for server

## Setup

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Development mode (starts both server and client)
npm run dev

# Production build
npm run build

# Production server
npm start
```

## Gameplay

- **Lobby**: Select your team and see real-time player counts
- **Arena**: Move with WASD/Arrows, click to attack
- **Coins**: Earn coins by defeating other players
- **Respawn**: Die and respawn after 3 seconds

## Architecture

- `server/server.js` - WebSocket server and HTTP static serving
- `server/gamestate.js` - Game logic and state management
- `server/player.js` - Player entity with movement and collision
- `server/config.js` - World configuration and equipment

- `client/src/main.jsx` - React entry point
- `client/src/App.jsx` - Main component router
- `client/src/pages/Menu.jsx` - Login screen
- `client/src/pages/Lobby.jsx` - Team selection (3D)
- `client/src/pages/Arena.jsx` - Gameplay arena (3D)
- `client/src/hooks/useGameSocket.js` - WebSocket connection hook
