# Spiritual Warfare

A multiplayer sword combat game. Fight other players in a fantasy setting with biblical-themed equipment, earn coins, and compete on teams or solo.

## Features

- **Multiplayer Combat**: Real-time battles with other players
- **Team System**: Choose from Red Team, Blue Team, or Free-For-All
- **Equipment Shop**: Buy legendary items (Sword of The Spirit, Helmet of Salvation, Breastplate of Righteousness, Belt of Truth, Shield of Faith, Gospel of Peace)
- **Skill-Based Gameplay**: Arena with obstacles, collision detection, and tactical positioning
- **HUD**: Real-time radar, health bars, chat, and score tracking
- **Cross-Platform**: Works on desktop and mobile browsers

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Development

#### Backend
```bash
cd games/battle-arena
npm install
npm start
# Server runs on http://localhost:3000
```

#### Frontend (in a new terminal)
```bash
cd games/battle-arena/client
npm install
npm start
# Dev server runs on http://localhost:5173
```

### Production Build

#### Backend
```bash
cd games/battle-arena
npm install
npm start
```

#### Frontend
```bash
cd games/battle-arena/client
npm run build
# Output in ../public/dist
```

## Deployment

Deploy to Render:

1. Push to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy

## Game Mechanics

### Combat
- Click/Tap on a player to attack
- Damage: 25 HP base (modified by equipment)
- Attack Cooldown: 500ms
- Attack Range: 40 units

### Economy
- Earn 10 coins per kill
- Buy equipment to boost stats
- Equipment provides damage/defense bonuses

### Teams
- Select team in lobby by moving into colored zones
- Team modes earn coins independently
- Leaderboard tracks team scores

## Controls

- **WASD / Arrow Keys**: Move
- **Mouse/Touch Click**: Attack nearby player
- **Enter**: Send chat message

## Architecture

- **Backend**: Node.js HTTP server with WebSocket for real-time sync
- **Frontend**: React with Canvas rendering
- **Game Loop**: 50ms server tick, 60fps client render

## License

MIT
