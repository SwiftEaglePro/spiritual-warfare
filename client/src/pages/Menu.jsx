import { useState } from 'react';
import '../styles/menu.css';

export default function Menu({ onJoin }) {
  const [name, setName] = useState('');

  const handleJoin = () => {
    if (name.trim()) {
      onJoin(name);
    }
  };

  return (
    <div className="menu">
      <div className="menu-box">
        <h1>⚔️ SPIRITUAL WARFARE ⚔️</h1>
        <p>3D Multiplayer Battle Arena</p>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button onClick={handleJoin}>JOIN GAME</button>
      </div>
    </div>
  );
}
