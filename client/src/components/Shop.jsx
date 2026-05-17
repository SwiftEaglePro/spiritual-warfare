import React, { useState } from 'react';
import '../styles/shop.css';

const EQUIPMENT = {
  'Sword of The Spirit': { cost: 100, stats: { damage: 10 }, owned: false },
  'Helmet of Salvation': { cost: 80, stats: { defense: 5 }, owned: false },
  'Breastplate of Righteousness': { cost: 120, stats: { defense: 8 }, owned: false },
  'Belt of Truth': { cost: 60, stats: { health: 15 }, owned: false },
  'Shield of Faith': { cost: 100, stats: { defense: 7 }, owned: false },
  'Gospel of Peace': { cost: 50, stats: { speed: 10 }, owned: false }
};

export default function Shop({ socket, playerCoins, equipment, onClose }) {
  const [purchaseFeedback, setPurchaseFeedback] = useState('');

  const handleBuy = (itemName) => {
    const item = EQUIPMENT[itemName];
    if (playerCoins >= item.cost) {
      socket.send({ type: 'buy-equipment', itemName });
      setPurchaseFeedback(`Purchased ${itemName}!`);
      setTimeout(() => setPurchaseFeedback(''), 2000);
    } else {
      setPurchaseFeedback(`Need ${item.cost - playerCoins} more coins`);
      setTimeout(() => setPurchaseFeedback(''), 2000);
    }
  };

  return (
    <div className="shop-modal">
      <div className="shop-container">
        <div className="shop-header">
          <h2>⚔️ EQUIPMENT SHOP ⚔️</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="shop-coins">
          Coins: <span className="coin-amount">{playerCoins}</span> 💰
        </div>

        <div className="shop-grid">
          {Object.entries(EQUIPMENT).map(([name, item]) => (
            <div
              key={name}
              className={`shop-item ${equipment?.[name] ? 'owned' : ''}`}
              style={{
                borderColor: equipment?.[name] ? '#00ff00' : '#666',
                opacity: equipment?.[name] ? 0.7 : 1
              }}
            >
              <div className="item-name">{name}</div>
              <div className="item-stats">
                {Object.entries(item.stats).map(([stat, value]) => (
                  <div key={stat} className="stat">
                    {stat}: +{value}
                  </div>
                ))}
              </div>
              <div className="item-footer">
                <span className="cost">{item.cost} 💰</span>
                <button
                  className={`buy-btn ${equipment?.[name] ? 'owned' : playerCoins >= item.cost ? 'ready' : 'disabled'}`}
                  onClick={() => handleBuy(name)}
                  disabled={equipment?.[name] || playerCoins < item.cost}
                >
                  {equipment?.[name] ? 'OWNED' : 'BUY'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {purchaseFeedback && (
          <div className="feedback-message">
            {purchaseFeedback}
          </div>
        )}

        <button className="close-shop-btn" onClick={onClose}>Close Shop</button>
      </div>
    </div>
  );
}
