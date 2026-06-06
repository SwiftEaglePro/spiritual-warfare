import { useState, useCallback } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import Menu from './pages/Menu';
import Lobby from './pages/Lobby';
import Arena from './pages/Arena';
import './styles/app.css';

export default function App() {
  const [page, setPage] = useState('menu');
  const [username, setUsername] = useState('Player');
  const socket = useGameSocket();

  const handleJoin = useCallback((name) => {
    setUsername(name);
    socket.connect(name);
    setPage('lobby');
  }, [socket]);

  const handleStartGame = useCallback(() => {
    socket.send({ type: 'start-game' });
    setPage('arena');
  }, [socket]);

  const handleBackToMenu = useCallback(() => {
    socket.disconnect();
    setPage('menu');
  }, [socket]);

  return (
    <div className="app">
      {page === 'menu' && <Menu onJoin={handleJoin} />}
      {page === 'lobby' && <Lobby socket={socket} gameState={socket.gameState} onStart={handleStartGame} />}
      {page === 'arena' && <Arena socket={socket} gameState={socket.gameState} playerId={socket.playerId} onBack={handleBackToMenu} />}
    </div>
  );
}
