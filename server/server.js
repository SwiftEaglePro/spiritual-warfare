import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { GameState } from './game/gameState.js';
import { EQUIPMENT } from './game/world.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const gameState = new GameState();
const connectedClients = new Map();
let gameLoopInterval;

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    if (req.url === '/' || !req.url.includes('.')) {
      serveFile(res, path.join(__dirname, '../public/index.html'), 'text/html');
    } else if (req.url.startsWith('/dist/')) {
      const filePath = path.join(__dirname, '..', req.url);
      serveFile(res, filePath, getContentType(req.url));
    } else if (req.url.endsWith('.js')) {
      serveFile(res, path.join(__dirname, '..', req.url), 'application/javascript');
    } else if (req.url.endsWith('.css')) {
      serveFile(res, path.join(__dirname, '..', req.url), 'text/css');
    } else if (req.url === '/api/shop') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(EQUIPMENT));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  } else {
    res.writeHead(405);
    res.end('Method not allowed');
  }
});

function getContentType(url) {
  if (url.endsWith('.js')) return 'application/javascript';
  if (url.endsWith('.css')) return 'text/css';
  if (url.endsWith('.json')) return 'application/json';
  if (url.endsWith('.png')) return 'image/png';
  if (url.endsWith('.jpg')) return 'image/jpeg';
  if (url.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain';
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  let playerId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(clientId, ws, message, (pId) => { playerId = pId; });
    } catch (err) {
      console.error('Message parse error:', err);
    }
  });

  ws.on('close', () => {
    if (playerId) {
      gameState.removePlayer(playerId);
      broadcastGameState();
    }
    connectedClients.delete(clientId);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  connectedClients.set(clientId, ws);
});

function handleMessage(clientId, ws, message, setPlayerId) {
  switch (message.type) {
    case 'join-lobby': {
      const playerId = uuidv4();
      gameState.addPlayer(playerId, message.username || 'Player');
      setPlayerId(playerId);
      ws.playerId = playerId;
      ws.send(JSON.stringify({ type: 'player-id', playerId }));
      broadcastGameState();
      break;
    }

    case 'player-move': {
      const player = gameState.getPlayer(ws.playerId);
      if (player) {
        player.moveDirection = message.direction;
      }
      break;
    }

    case 'player-attack': {
      const result = gameState.processAttack(ws.playerId, message.targetId);
      if (result) {
        broadcastAttackEvent(result);
        broadcastGameState();
      }
      break;
    }

    case 'assign-team': {
      gameState.assignPlayerToTeam(ws.playerId, message.team);
      broadcastGameState();
      break;
    }

    case 'buy-equipment': {
      const player = gameState.getPlayer(ws.playerId);
      const item = EQUIPMENT[message.itemName];
      if (player && item && player.coins >= item.cost) {
        player.coins -= item.cost;
        player.updateEquipment(message.itemName);
        ws.send(JSON.stringify({
          type: 'equipment-purchased',
          itemName: message.itemName,
          coins: player.coins
        }));
        broadcastGameState();
      }
      break;
    }

    case 'change-username': {
      const player = gameState.getPlayer(ws.playerId);
      if (player) {
        player.username = message.username || player.username;
        broadcastGameState();
      }
      break;
    }

    case 'send-chat': {
      broadcastChatMessage(ws.playerId, message.message);
      break;
    }

    case 'start-game': {
      if (gameState.gameStatus === 'lobby') {
        gameState.gameStatus = 'playing';
        broadcastGameState();
      }
      break;
    }
  }
}

function broadcastGameState() {
  const state = gameState.getPublicState();
  const message = JSON.stringify({ type: 'game-state', ...state });
  connectedClients.forEach(ws => {
    if (ws.readyState === 1) ws.send(message);
  });
}

function broadcastAttackEvent(attack) {
  const message = JSON.stringify({ type: 'attack', ...attack });
  connectedClients.forEach(ws => {
    if (ws.readyState === 1) ws.send(message);
  });
}

function broadcastChatMessage(playerId, text) {
  const player = gameState.getPlayer(playerId);
  if (!player) return;
  const message = JSON.stringify({
    type: 'chat-message',
    playerName: player.username,
    message: text
  });
  connectedClients.forEach(ws => {
    if (ws.readyState === 1) ws.send(message);
  });
}

function gameLoop() {
  gameState.update(GAME_CONFIG.worldTickInterval);
  broadcastGameState();
}

const GAME_CONFIG = { worldTickInterval: 50 };

gameLoopInterval = setInterval(gameLoop, GAME_CONFIG.worldTickInterval);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Spiritual Warfare server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

process.on('SIGINT', () => {
  clearInterval(gameLoopInterval);
  server.close();
  process.exit(0);
});
