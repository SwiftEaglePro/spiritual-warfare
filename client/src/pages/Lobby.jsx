import React, { useEffect, useState } from 'react';
import '../styles/lobby.css';

export default function Lobby({ socket, gameState, onStartGame, username }) {
  const [playerPosition, setPlayerPosition] = useState({ x: 300, y: 300 });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [keysPressed] = useState({});

  const TEAM_ZONES = [
    { x: 50, y: 50, width: 300, height: 300, team: 'red', color: '#ff4444', label: 'RED TEAM' },
    { x: 1450, y: 50, width: 300, height: 300, team: 'blue', color: '#4444ff', label: 'BLUE TEAM' },
    { x: 700, y: 650, width: 400, height: 300, team: 'free-for-all', color: '#ffff44', label: 'FREE-FOR-ALL' }
  ];

  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e) => { keysPressed[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [keysPressed]);

  useEffect(() => {
    const gameLoop = () => {
      const moveSpeed = 5;
      let newX = playerPosition.x;
      let newY = playerPosition.y;

      if (keysPressed['w'] || keysPressed['arrowup']) newY -= moveSpeed;
      if (keysPressed['s'] || keysPressed['arrowdown']) newY += moveSpeed;
      if (keysPressed['a'] || keysPressed['arrowleft']) newX -= moveSpeed;
      if (keysPressed['d'] || keysPressed['arrowright']) newX += moveSpeed;

      newX = Math.max(15, Math.min(1800 - 15, newX));
      newY = Math.max(15, Math.min(1000 - 15, newY));

      setPlayerPosition({ x: newX, y: newY });

      socket.send({
        type: 'player-move',
        direction: {
          up: keysPressed['w'] || keysPressed['arrowup'],
          down: keysPressed['s'] || keysPressed['arrowdown'],
          left: keysPressed['a'] || keysPressed['arrowleft'],
          right: keysPressed['d'] || keysPressed['arrowright']
        }
      });

      const foundZone = TEAM_ZONES.find(zone =>
        newX > zone.x && newX < zone.x + zone.width && newY > zone.y && newY < zone.y + zone.height
      );

      if (foundZone && foundZone.team !== selectedTeam) {
        setSelectedTeam(foundZone.team);
        socket.send({ type: 'assign-team', team: foundZone.team });
      }
    };

    const id = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(id);
  }, [playerPosition, socket, selectedTeam, keysPressed]);

  const counts = {
    red: (gameState?.players || []).filter(p => p.team === 'red').length,
    blue: (gameState?.players || []).filter(p => p.team === 'blue').length,
    'free-for-all': (gameState?.players || []).filter(p => p.team === 'free-for-all').length
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1>Team Selection Lobby</h1>
        <p>Move into a colored zone to select your team</p>
      </div>

      <div className="lobby-content" style={{ position: 'relative', width: '100%', height: '700px' }}>
        {TEAM_ZONES.map(zone => (
          <div key={zone.team}
            style={{
              position: 'absolute', left: zone.x / 18 + '%', top: zone.y / 10 + '%',
              width: (zone.width / 18) + '%', height: (zone.height / 10) + '%',
              backgroundColor: zone.color, opacity: 0.25, border: `2px solid ${zone.color}`
            }}
          >
            <div style={{ textAlign: 'center', marginTop: '40%' }}>{zone.label}</div>
            <div style={{ position: 'absolute', right: 6, bottom: 6, background: 'rgba(0,0,0,0.6)', padding: '6px 8px', borderRadius: 6 }}>{counts[zone.team]}</div>
          </div>
        ))}

        <div style={{ position: 'absolute', left: playerPosition.x / 18 + '%', top: playerPosition.y / 10 + '%', transform: 'translate(-50%,-50%)' }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: selectedTeam === 'red' ? '#ff4444' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{username[0]}</div>
          <div style={{ textAlign: 'center', marginTop: 4 }}>{username}</div>
        </div>
      </div>

      <div className="lobby-info">
        <div className="team-status">
          {selectedTeam ? (
            <span className="selected-team">Team: {selectedTeam.toUpperCase()}</span>
          ) : (
            <span className="no-team">No team selected</span>
          )}
        </div>
        <button onClick={onStartGame} disabled={!selectedTeam} className="start-button">START GAME</button>
      </div>
    </div>
  );
}
