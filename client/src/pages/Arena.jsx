import React, { useEffect, useRef, useState } from 'react';
import Shop from '../components/Shop';
import '../styles/arena.css';

export default function Arena({ socket, gameState, chatMessages, playerId, onReturnToMenu }) {
  const canvasRef = useRef(null);
  const [localPlayer, setLocalPlayer] = useState(null);
  const [chat, setChat] = useState('');
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [showShop, setShowShop] = useState(false);
  const keysPressed = useRef({});
  const canvasScaleRef = useRef({ scaleX: 1, scaleY: 1 });
  const attackFeedbackRef = useRef({});

  const OBSTACLES = [
    { x: 800, y: 400, width: 200, height: 50 },
    { x: 800, y: 550, width: 200, height: 50 },
    { x: 50, y: 50, width: 150, height: 150 },
    { x: 1600, y: 50, width: 150, height: 150 },
    { x: 50, y: 800, width: 150, height: 150 },
    { x: 1600, y: 800, width: 150, height: 150 },
    { x: 400, y: 300, width: 100, height: 300 },
    { x: 1300, y: 400, width: 100, height: 300 },
    { x: 600, y: 700, width: 300, height: 100 },
    { x: 900, y: 200, width: 100, height: 150 }
  ];

  useEffect(() => {
    if (gameState?.players) {
      const player = gameState.players.find(p => p.id === playerId);
      setLocalPlayer(player);
      if (player) {
        setKills(player.kills);
        setDeaths(player.deaths);
      }
    }
  }, [gameState, playerId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getCanvasScale = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { scaleX: 1, scaleY: 1 };
    return {
      scaleX: 1800 / canvas.clientWidth,
      scaleY: 1000 / canvas.clientHeight
    };
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const rect = canvas.getBoundingClientRect();
    const scale = getCanvasScale();
    const x = (e.clientX - rect.left) * scale.scaleX;
    const y = (e.clientY - rect.top) * scale.scaleY;

    for (const player of gameState.players) {
      if (player.id === playerId || !player.isAlive) continue;
      const dist = Math.hypot(player.position.x - x, player.position.y - y);
      if (dist < 20) {
        socket.send({ type: 'player-attack', targetId: player.id });
        attackFeedbackRef.current[player.id] = Date.now();
        return;
      }
    }
  };

  const handleCanvasTouch = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scale = getCanvasScale();
    const x = (touch.clientX - rect.left) * scale.scaleX;
    const y = (touch.clientY - rect.top) * scale.scaleY;

    for (const player of gameState.players) {
      if (player.id === playerId || !player.isAlive) continue;
      const dist = Math.hypot(player.position.x - x, player.position.y - y);
      if (dist < 20) {
        socket.send({ type: 'player-attack', targetId: player.id });
        attackFeedbackRef.current[player.id] = Date.now();
        return;
      }
    }
  };

  useEffect(() => {
    const gameLoop = () => {
      socket.send({
        type: 'player-move',
        direction: {
          up: keysPressed.current['w'] || keysPressed.current['arrowup'],
          down: keysPressed.current['s'] || keysPressed.current['arrowdown'],
          left: keysPressed.current['a'] || keysPressed.current['arrowleft'],
          right: keysPressed.current['d'] || keysPressed.current['arrowright']
        }
      });

      draw();
    };

    const interval = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(interval);
  }, [gameState, socket]);

  const handleSendChat = () => {
    if (chat.trim()) {
      socket.send({ type: 'send-chat', message: chat });
      setChat('');
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    OBSTACLES.forEach(obs => {
      ctx.fillStyle = '#444';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    });

    gameState.players?.forEach(player => {
      const color = player.team === 'red' ? '#ff4444' : player.team === 'blue' ? '#4444ff' : '#ffff44';

      if (!player.isAlive) {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(player.position.x, player.position.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DEAD', player.position.x, player.position.y);
        return;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, 15, 0, Math.PI * 2);
      ctx.fill();

      if (player.id === playerId) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      const now = Date.now();
      if (attackFeedbackRef.current[player.id] && now - attackFeedbackRef.current[player.id] < 200) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        delete attackFeedbackRef.current[player.id];
      }

      ctx.fillStyle = color;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.username, player.position.x, player.position.y - 30);

      const healthBarWidth = 30;
      const healthPercent = player.health / player.maxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(player.position.x - healthBarWidth / 2, player.position.y - 40, healthBarWidth, 4);
      ctx.fillStyle = healthPercent > 0.3 ? '#00ff00' : '#ff0000';
      ctx.fillRect(player.position.x - healthBarWidth / 2, player.position.y - 40, healthBarWidth * healthPercent, 4);
    });
  };

  return (
    <div className="arena-container">
      <div className="arena-wrapper">
        <canvas
          ref={canvasRef}
          width={1800}
          height={1000}
          onClick={handleCanvasClick}
          onTouchEnd={handleCanvasTouch}
          style={{
            width: '100%',
            height: 'auto',
            backgroundColor: '#16213e',
            border: '2px solid #00ff00',
            display: 'block',
            cursor: 'crosshair',
            touchAction: 'none'
          }}
        />
      </div>

      <div className="hud">
        <div className="radar">
          <div className="radar-title">RADAR</div>
          {gameState?.players?.map(player => {
            const scale = 100 / 1800;
            const x = player.position.x * scale;
            const y = player.position.y * scale;
            const color = player.team === 'red' ? 'red' : player.team === 'blue' ? 'blue' : 'yellow';
            return (
              <div
                key={player.id}
                className="radar-dot"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: color,
                  opacity: player.isAlive ? 1 : 0.5,
                  border: player.id === playerId ? '2px solid lime' : 'none'
                }}
              />
            );
          })}
        </div>

        <div className="player-stats">
          {localPlayer && (
            <>
              <h3>{localPlayer.username}</h3>
              <div className="stat-row">
                <span>Health:</span>
                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{ width: `${(localPlayer.health / localPlayer.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
              <div className="stat-row">
                <span>Coins: {localPlayer.coins}</span>
              </div>
              <div className="stat-row">
                <span>K/D: {localPlayer.kills}/{localPlayer.deaths}</span>
              </div>
              <div className="stat-row">
                <span>Status: {localPlayer.isAlive ? '🟢 ALIVE' : '🔴 DEAD'}</span>
              </div>
            </>
          )}
        </div>

        <div className="chat-box">
          <div className="chat-messages">
            {chatMessages.slice(-8).map((msg, i) => (
              <div key={i} className="chat-message">
                <strong>{msg.playerName}:</strong> {msg.message}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Type message..."
            />
            <button onClick={handleSendChat}>Send</button>
          </div>
        </div>

        <div className="controls-hint">
          <div>WASD / Arrows: Move</div>
          <div>Click: Attack</div>
        </div>
      </div>

      <button className="menu-button" onClick={onReturnToMenu}>← Menu</button>
      <button className="shop-button" onClick={() => setShowShop(true)}>⚔️ SHOP</button>

      {showShop && (
        <Shop
          socket={socket}
          playerCoins={localPlayer?.coins || 0}
          equipment={localPlayer?.equipment}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}
