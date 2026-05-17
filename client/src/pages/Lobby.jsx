import React, { useEffect, useRef, useState } from 'react';
import '../styles/lobby.css';

export default function Lobby({ socket, gameState, onStartGame, username }) {
  const canvasRef = useRef(null);
  const [playerPosition, setPlayerPosition] = useState({ x: 300, y: 300 });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const keysPressed = useRef({});

  const TEAM_ZONES = [
    { x: 50, y: 50, width: 300, height: 300, team: 'red', color: '#ff4444', label: 'RED TEAM' },
    { x: 1450, y: 50, width: 300, height: 300, team: 'blue', color: '#4444ff', label: 'BLUE TEAM' },
    { x: 700, y: 650, width: 400, height: 300, team: 'free-for-all', color: '#ffff44', label: 'FREE-FOR-ALL' }
  ];

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

  useEffect(() => {
    const gameLoop = () => {
      const moveSpeed = 5;
      let newX = playerPosition.x;
      let newY = playerPosition.y;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) newY -= moveSpeed;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) newY += moveSpeed;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) newX -= moveSpeed;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) newX += moveSpeed;

      newX = Math.max(15, Math.min(1800 - 15, newX));
      newY = Math.max(15, Math.min(1000 - 15, newY));

      setPlayerPosition({ x: newX, y: newY });

      socket.send({
        type: 'player-move',
        direction: {
          up: keysPressed.current['w'] || keysPressed.current['arrowup'],
          down: keysPressed.current['s'] || keysPressed.current['arrowdown'],
          left: keysPressed.current['a'] || keysPressed.current['arrowleft'],
          right: keysPressed.current['d'] || keysPressed.current['arrowright']
        }
      });

      const foundZone = TEAM_ZONES.find(zone =>
        playerPosition.x > zone.x && playerPosition.x < zone.x + zone.width &&
        playerPosition.y > zone.y && playerPosition.y < zone.y + zone.height
      );

      if (foundZone && foundZone.team !== selectedTeam) {
        setSelectedTeam(foundZone.team);
        socket.send({ type: 'assign-team', team: foundZone.team });
      }

      draw();
    };

    const interval = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(interval);
  }, [playerPosition, socket, selectedTeam]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    TEAM_ZONES.forEach(zone => {
      ctx.fillStyle = zone.color;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

      ctx.fillStyle = zone.color;
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(zone.label, zone.x + zone.width / 2, zone.y + zone.height / 2);
    });

    ctx.fillStyle = selectedTeam === 'red' ? '#00ff00' : '#ffffff';
    ctx.beginPath();
    ctx.arc(playerPosition.x, playerPosition.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = selectedTeam === 'red' ? '#00ff00' : '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(username, playerPosition.x, playerPosition.y - 30);
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1>Team Selection Lobby</h1>
        <p>Move into a colored zone to select your team</p>
      </div>

      <div className="lobby-content">
        <canvas
          ref={canvasRef}
          width={1800}
          height={1000}
          style={{ width: '100%', height: 'auto', backgroundColor: '#16213e', border: '2px solid #00ff00' }}
        />
      </div>

      <div className="lobby-info">
        <div className="team-status">
          {selectedTeam ? (
            <span className="selected-team">Team: {selectedTeam.toUpperCase()}</span>
          ) : (
            <span className="no-team">No team selected</span>
          )}
        </div>
        <button
          onClick={onStartGame}
          disabled={!selectedTeam}
          className="start-button"
        >
          START GAME
        </button>
      </div>
    </div>
  );
}
