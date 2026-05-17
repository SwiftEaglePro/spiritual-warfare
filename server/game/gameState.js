import { WORLD, GAME_CONFIG } from './world.js';
import { Player } from './player.js';

export class GameState {
  constructor() {
    this.players = new Map();
    this.gameStatus = 'lobby'; // 'lobby', 'team-selection', 'playing', 'ended'
    this.teams = {
      red: { score: 0, players: [] },
      blue: { score: 0, players: [] },
      'free-for-all': { score: 0, players: [] }
    };
    this.allPlayers = [];
  }

  addPlayer(id, username) {
    const spawnPoint = WORLD.spawnPoints[this.players.size % WORLD.spawnPoints.length];
    const player = new Player(id, username, spawnPoint);
    this.players.set(id, player);
    this.allPlayers.push(player);
    return player;
  }

  removePlayer(id) {
    const player = this.players.get(id);
    if (player && player.team) {
      const teamPlayers = this.teams[player.team].players;
      const idx = teamPlayers.indexOf(id);
      if (idx > -1) teamPlayers.splice(idx, 1);
    }
    this.players.delete(id);
    const allIdx = this.allPlayers.findIndex(p => p.id === id);
    if (allIdx > -1) this.allPlayers.splice(allIdx, 1);
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  assignPlayerToTeam(playerId, team) {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    if (player.team) {
      const teamPlayers = this.teams[player.team].players;
      const idx = teamPlayers.indexOf(playerId);
      if (idx > -1) teamPlayers.splice(idx, 1);
    }

    player.team = team;
    this.teams[team].players.push(playerId);
    return true;
  }

  update(deltaTime) {
    this.allPlayers.forEach(player => {
      if (player.isAlive) {
        player.update(deltaTime, WORLD.obstacles);
      } else if (player.respawnTime && Date.now() >= player.respawnTime) {
        const spawnPoint = WORLD.spawnPoints[Math.floor(Math.random() * WORLD.spawnPoints.length)];
        player.respawn(spawnPoint);
      }
    });
  }

  processAttack(attackerId, targetId) {
    const attacker = this.getPlayer(attackerId);
    const target = this.getPlayer(targetId);

    if (!attacker || !target || !attacker.isAlive || !target.isAlive) return null;
    if (!attacker.canAttack()) return null;

    const distance = Math.hypot(
      attacker.position.x - target.position.x,
      attacker.position.y - target.position.y
    );

    if (distance > GAME_CONFIG.attackRange) return null;

    if (attacker.team && target.team && attacker.team === target.team && attacker.team !== 'free-for-all') {
      return null;
    }

    attacker.attack();
    target.takeDamage(GAME_CONFIG.baseDamage);

    if (!target.isAlive) {
      attacker.kills++;
      attacker.addCoins(10);
      this.updateTeamScores();
    }

    return {
      attackerId,
      targetId,
      damage: GAME_CONFIG.baseDamage,
      targetHealth: target.health
    };
  }

  updateTeamScores() {
    this.teams.red.score = 0;
    this.teams.blue.score = 0;
    this.teams['free-for-all'].score = 0;

    this.allPlayers.forEach(player => {
      if (player.team) {
        this.teams[player.team].score += player.kills;
      }
    });
  }

  getState() {
    const playerStates = Array.from(this.players.values()).map(p => p.getState());
    return {
      gameStatus: this.gameStatus,
      players: playerStates,
      teams: this.teams,
      world: { width: WORLD.width, height: WORLD.height },
      obstacles: WORLD.obstacles
    };
  }

  getPublicState() {
    return {
      gameStatus: this.gameStatus,
      players: Array.from(this.players.values()).map(p => p.getState()),
      teams: {
        red: this.teams.red.score,
        blue: this.teams.blue.score,
        'free-for-all': this.teams['free-for-all'].score
      }
    };
  }
}
