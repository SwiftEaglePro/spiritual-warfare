import React, { useState } from 'react';
import '../styles/mainmenu.css';

export default function MainMenu({ onJoinGame }) {
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friends] = useState([
    'SwiftEagle',
    'ShadowKnight',
    'NovaStrike',
    'PhoenixRise',
    'VortexMage'
  ]);

  const handleJoin = () => {
    const name = username || 'Player';
    setUsername('');
    onJoinGame(name);
  };

  const handleChangeUsername = () => {
    setTempUsername(username);
    setShowUsernameModal(true);
  };

  const handleSaveUsername = () => {
    setUsername(tempUsername);
    setShowUsernameModal(false);
  };

  return (
    <div className="mainmenu">
      <div className="mainmenu-content">
        <h1 className="game-title">Battle Arena</h1>
        <p className="subtitle">Multiplayer Sword Combat</p>

        <div className="menu-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            className="name-input"
          />
          <button onClick={handleJoin} className="play-button">
            PLAY
          </button>
          <button onClick={handleChangeUsername} className="secondary-button">
            Change Username
          </button>
        </div>
      </div>

      <div className={`friends-sidebar ${friendsOpen ? 'open' : ''}`}>
        <div
          className="friends-toggle"
          onMouseEnter={() => setFriendsOpen(true)}
          onMouseLeave={() => setFriendsOpen(false)}
          onClick={() => setFriendsOpen(!friendsOpen)}
        >
          👥
        </div>
        {friendsOpen && (
          <div className="friends-list">
            <h3>Friends</h3>
            {friends.map((friend) => (
              <div key={friend} className="friend-item">
                {friend}
              </div>
            ))}
          </div>
        )}
      </div>

      {showUsernameModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Change Username</h2>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="New username"
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={handleSaveUsername}>Save</button>
              <button onClick={() => setShowUsernameModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
