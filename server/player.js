import { GAME_CONFIG, WORLD } from './config.js';

export class Player {
  constructor(id, username) {
    this.id = id;
    this.username = username;
    this.team = null;
    this.color = null;
    
    // Pick non-colliding spawn
    const spawn = this.pickSpawnPoint();
    this.position = { x: spawn.x, y: spawn.y };
    
    this.velocity = { x: 0, y: 0 };
    this.health = GAME_CONFIG.baseHealth;
    this.maxHealth = GAME_CONFIG.baseHealth;
    this.coins = 0;
    this.kills = 0;
    this.deaths = 0;
    this.isAlive = true;
    this.lastAttackTime = 0;
    this.respawnTime = null;
    this.moveDirection = { up: false, down: false, left: false, right: false };
  }

  pickSpawnPoint() {
    const candidates = [...WORLD.spawnPoints];
    while (candidates.length > 0) {
      const idx = Math.floor(Math.random() * candidates.length);
      const [sp] = candidates.splice(idx, 1);
      if (!this.checkCollision(sp.x, sp.y)) return sp;
    }
    return WORLD.spawnPoints[0];
  }

  checkCollision(x, y) {
    const radius = 15;
    if (x - radius < 0 || x + radius > WORLD.width || y - radius < 0 || y + radius > WORLD.height) {
      return true;
    }
    for (const obs of WORLD.obstacles) {
      if (x + radius > obs.x && x - radius < obs.x + obs.width &&
          y + radius > obs.y && y - radius < obs.y + obs.height) {
        return true;
      }
    }
    return false;
  }

  update(deltaMs) {
    if (!this.isAlive) return;

    const speed = GAME_CONFIG.baseMoveSpeed;
    let newX = this.position.x;
    let newY = this.position.y;

    if (this.moveDirection.up) newY -= speed;
    if (this.moveDirection.down) newY += speed;
    if (this.moveDirection.left) newX -= speed;
    if (this.moveDirection.right) newX += speed;

    if (!this.checkCollision(newX, newY)) {
      this.position.x = newX;
      this.position.y = newY;
    }
  }

  takeDamage(dmg) {
    if (!this.isAlive) return;
    this.health -= dmg;
    if (this.health <= 0) {
      this.isAlive = false;
      this.deaths++;
      this.respawnTime = Date.now() + GAME_CONFIG.respawnDelay;
    }
  }

  respawn() {
    const spawn = this.pickSpawnPoint();
    this.position = { x: spawn.x, y: spawn.y };
    this.health = this.maxHealth;
    this.isAlive = true;
    this.respawnTime = null;
  }

  getState() {
    return {
      id: this.id,
      username: this.username,
      position: this.position,
      team: this.team,
      color: this.color,
      health: this.health,
      maxHealth: this.maxHealth,
      coins: this.coins,
      kills: this.kills,
      deaths: this.deaths,
      isAlive: this.isAlive
    };
  }
}
