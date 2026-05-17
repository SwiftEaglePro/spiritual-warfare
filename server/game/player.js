import { GAME_CONFIG, EQUIPMENT } from './world.js';

export class Player {
  constructor(id, username, spawnPoint) {
    this.id = id;
    this.username = username;
    this.position = { x: spawnPoint.x, y: spawnPoint.y };
    this.velocity = { x: 0, y: 0 };
    this.health = GAME_CONFIG.baseHealth;
    this.maxHealth = GAME_CONFIG.baseHealth;
    this.team = null;
    this.coins = 0;
    this.kills = 0;
    this.deaths = 0;
    this.equipment = {
      sword: 'Sword of The Spirit',
      helmet: 'Helmet of Salvation',
      breastplate: 'Breastplate of Righteousness',
      belt: 'Belt of Truth',
      shield: 'Shield of Faith',
      boots: 'Gospel of Peace'
    };
    this.isAlive = true;
    this.lastAttackTime = 0;
    this.respawnTime = null;
    this.moveDirection = { up: false, down: false, left: false, right: false };
  }

  updateEquipment(itemName) {
    if (!EQUIPMENT[itemName]) return false;

    const slot = this.getEquipmentSlot(itemName);
    this.equipment[slot] = itemName;

    this.updateStats();
    return true;
  }

  getEquipmentSlot(itemName) {
    const slots = {
      'Sword of The Spirit': 'sword',
      'Helmet of Salvation': 'helmet',
      'Breastplate of Righteousness': 'breastplate',
      'Belt of Truth': 'belt',
      'Shield of Faith': 'shield',
      'Gospel of Peace': 'boots'
    };
    return slots[itemName];
  }

  updateStats() {
    this.maxHealth = GAME_CONFIG.baseHealth;

    Object.values(this.equipment).forEach(itemName => {
      const item = EQUIPMENT[itemName];
      if (item?.stats?.health) {
        this.maxHealth += item.stats.health;
      }
    });

    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }

  update(deltaTime, obstacles) {
    if (!this.isAlive) return;

    this.updatePosition(deltaTime, obstacles);
  }

  updatePosition(deltaTime, obstacles) {
    const moveSpeed = GAME_CONFIG.baseMoveSpeed;
    let newX = this.position.x;
    let newY = this.position.y;

    if (this.moveDirection.up) newY -= moveSpeed;
    if (this.moveDirection.down) newY += moveSpeed;
    if (this.moveDirection.left) newX -= moveSpeed;
    if (this.moveDirection.right) newX += moveSpeed;

    if (!this.checkCollision(newX, newY, obstacles)) {
      this.position.x = newX;
      this.position.y = newY;
    }
  }

  checkCollision(x, y, obstacles) {
    const radius = 15;

    if (x - radius < 0 || x + radius > 1800 || y - radius < 0 || y + radius > 1000) {
      return true;
    }

    for (const obs of obstacles) {
      if (x + radius > obs.x && x - radius < obs.x + obs.width &&
          y + radius > obs.y && y - radius < obs.y + obs.height) {
        return true;
      }
    }

    return false;
  }

  takeDamage(damage) {
    if (!this.isAlive) return;

    let totalDamage = damage;

    Object.values(this.equipment).forEach(itemName => {
      const item = EQUIPMENT[itemName];
      if (item?.stats?.defense) {
        totalDamage -= item.stats.defense * 0.5;
      }
    });

    totalDamage = Math.max(1, totalDamage);
    this.health -= totalDamage;

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    this.health = 0;
    this.deaths++;
    this.respawnTime = Date.now() + GAME_CONFIG.respawnDelay;
  }

  respawn(spawnPoint) {
    this.isAlive = true;
    this.health = this.maxHealth;
    this.position = { x: spawnPoint.x, y: spawnPoint.y };
    this.respawnTime = null;
  }

  canAttack() {
    return Date.now() - this.lastAttackTime >= GAME_CONFIG.attackCooldown;
  }

  attack() {
    if (!this.canAttack() || !this.isAlive) return false;
    this.lastAttackTime = Date.now();
    return true;
  }

  addCoins(amount) {
    this.coins += amount;
  }

  getState() {
    return {
      id: this.id,
      username: this.username,
      position: this.position,
      health: this.health,
      maxHealth: this.maxHealth,
      team: this.team,
      coins: this.coins,
      kills: this.kills,
      deaths: this.deaths,
      equipment: this.equipment,
      isAlive: this.isAlive
    };
  }
}
