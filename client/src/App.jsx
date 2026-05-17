import React, { useState, useCallback } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import MainMenu from './pages/MainMenu';
import Lobby from './pages/Lobby';
import Arena from './pages/Arena';
import './styles/app.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('menu');
  const [gameState, setGameState] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [username, setUsername] = useState('Player');

  const handleStateUpdate = useCallback((state) => {
    setGameState(state);
  }, []);

  const handleMessage = useCallback((message) => {
    if (message.type === 'chat-message') {
      setChatMessages(prev => [...prev, message]);
    }
  }, []);

  const socket = useGameSocket(handleStateUpdate, handleMessage);

  const handleJoinGame = useCallback((name) => {
    setUsername(name);
    socket.connect(name);
    setCurrentPage('lobby');
  }, [socket]);

  const handleStartGame = useCallback(() => {
    socket.send({ type: 'start-game' });
    setCurrentPage('arena');
  }, [socket]);

  const handleReturnToMenu = useCallback(() => {
    socket.disconnect();
    setCurrentPage('menu');
    setGameState(null);
    setChatMessages([]);
  }, [socket]);

  return (
    <div className="app-container">
      {currentPage === 'menu' && (
        <MainMenu onJoinGame={handleJoinGame} />
      )}
      {currentPage === 'lobby' && (
        <Lobby
          socket={socket}
          gameState={gameState}
          onStartGame={handleStartGame}
          username={username}
        />
      )}
      {currentPage === 'arena' && (
        <Arena
          socket={socket}
          gameState={gameState}
          chatMessages={chatMessages}
          playerId={socket.playerId}
          onReturnToMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
}
