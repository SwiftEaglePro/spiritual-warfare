export const WORLD = {
  width: 1800,
  height: 1000,
  spawnPoints: [
    { x: 150, y: 150 },
    { x: 1650, y: 150 },
    { x: 150, y: 850 },
    { x: 1650, y: 850 },
    { x: 900, y: 500 }
  ],
  obstacles: [
    { x: 800, y: 400, width: 200, height: 50 },
    { x: 800, y: 550, width: 200, height: 50 },
    { x: 50, y: 50, width: 150, height: 150 },
    { x: 1600, y: 50, width: 150, height: 150 },
    { x: 50, y: 800, width: 150, height: 150 },
    { x: 1600, y: 800, width: 150, height: 150 }
  ]
};

export const EQUIPMENT = {
  'Sword of The Spirit': { cost: 100, stats: { damage: 10 } },
  'Helmet of Salvation': { cost: 80, stats: { defense: 5 } },
  'Breastplate of Righteousness': { cost: 120, stats: { defense: 8 } },
  'Belt of Truth': { cost: 60, stats: { health: 15 } },
  'Shield of Faith': { cost: 100, stats: { defense: 7 } },
  'Gospel of Peace': { cost: 50, stats: { speed: 10 } }
};

export const GAME_CONFIG = {
  baseHealth: 100,
  baseDamage: 25,
  baseMoveSpeed: 6,
  attackCooldown: 500,
  attackRange: 50,
  respawnDelay: 3000,
  tickRate: 20,
  gameTickMs: 50
};
