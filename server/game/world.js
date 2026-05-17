export const WORLD = {
  width: 1800,
  height: 1000,
  spawnPoints: [
    { x: 100, y: 100 },
    { x: 1700, y: 100 },
    { x: 100, y: 900 },
    { x: 1700, y: 900 },
    { x: 900, y: 500 }
  ],
  obstacles: [
    // Center walls
    { x: 800, y: 400, width: 200, height: 50 },
    { x: 800, y: 550, width: 200, height: 50 },
    // Corners
    { x: 50, y: 50, width: 150, height: 150 },
    { x: 1600, y: 50, width: 150, height: 150 },
    { x: 50, y: 800, width: 150, height: 150 },
    { x: 1600, y: 800, width: 150, height: 150 },
    // Mid obstacles
    { x: 400, y: 300, width: 100, height: 300 },
    { x: 1300, y: 400, width: 100, height: 300 },
    { x: 600, y: 700, width: 300, height: 100 },
    { x: 900, y: 200, width: 100, height: 150 }
  ],
  teamZones: [
    { x: 50, y: 50, width: 300, height: 300, team: 'red', color: '#ff4444' },
    { x: 1450, y: 50, width: 300, height: 300, team: 'blue', color: '#4444ff' },
    { x: 700, y: 650, width: 400, height: 300, team: 'free-for-all', color: '#ffff44' }
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
  baseMoveSpeed: 5,
  attackCooldown: 500,
  attackRange: 40,
  attackDuration: 100,
  respawnDelay: 3000,
  tickRate: 20,
  worldTickInterval: 50
};
