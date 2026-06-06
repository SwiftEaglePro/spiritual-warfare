import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { GameState } from './gamestate.js';
import { EQUIPMENT } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const gameState = new GameState();
const connectedClients = new Map();

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  if (req.url === '/') {
    serveFile(res, path.join(__dirname, '../client/index.html'), 'text/html');
  } else if (req.url.startsWith('/assets/')) {
    const filePath = path.join(__dirname, '../client', req.url);
    serveFile(res, filePath, getContentType(req.url));
  } else if (req.url === '/api/shop') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(EQUIPMENT));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

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

function getContentType(url) {
  if (url.endsWith('.js')) return 'application/javascript';
  if (url.endsWith('.css')) return 'text/css';
  if (url.endsWith('.json')) return 'application/json';
  if (url.endsWith('.html')) return 'text/html';
  return 'text/plain';
}

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  let playerId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(clientId, ws, msg, (pId) => { playerId = pId; });
    } catch (err) {
      console.error('Parse error:', err);
    }
  });

  ws.on('close', () => {
    if (playerId) {
      gameState.removePlayer(playerId);
      broadcast();
    }
    connectedClients.delete(clientId);
  });

  connectedClients.set(clientId, ws);
});

function handleMessage(clientId, ws, msg, setPlayerId) {
  switch (msg.type) {
    case 'join-lobby': {
      const pId = uuidv4();
      gameState.addPlayer(pId, msg.username || 'Player');
      setPlayerId(pId);
      ws.playerId = pId;
      ws.send(JSON.stringify({ type: 'player-id', playerId: pId }));
      console.log(`[JOIN] ${pId} as ${msg.username}`);
      broadcast();
      break;
    }

    case 'player-move': {
      if (!ws.playerId) break;
      const p = gameState.getPlayer(ws.playerId);
      if (p) p.moveDirection = msg.direction;
      break;
    }

    case 'player-attack': {
      if (!ws.playerId) break;
      const result = gameState.processAttack(ws.playerId, msg.targetId);
      if (result) broadcast();
      break;
    }

    case 'assign-team': {
      if (!ws.playerId) break;
      gameState.assignTeam(ws.playerId, msg.team);
      console.log(`[TEAM] ${ws.playerId} -> ${msg.team}`);
      broadcast();
      break;
    }

    case 'start-game': {
      gameState.gameStatus = 'playing';
      broadcast();
      break;
    }
  }
}

function broadcast() {
  const state = gameState.getState();
  const msg = JSON.stringify({ type: 'game-state', ...state });
  connectedClients.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

setInterval(() => {
  gameState.update(50);
  broadcast();
}, 50);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Spiritual Warfare on port ${PORT}`);
});

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
