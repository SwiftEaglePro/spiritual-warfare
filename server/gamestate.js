import { Player } from './player.js';

export class GameState {
  constructor() {
    this.players = new Map();
    this.gameStatus = 'lobby';
    this.teamAssignments = { red: [], blue: [], 'free-for-all': [] };
  }

  addPlayer(id, username) {
    const p = new Player(id, username);
    this.players.set(id, p);
    return p;
  }

  removePlayer(id) {
    this.players.delete(id);
    Object.values(this.teamAssignments).forEach(arr => {
      const idx = arr.indexOf(id);
      if (idx > -1) arr.splice(idx, 1);
    });
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  assignTeam(playerId, team) {
    const p = this.getPlayer(playerId);
    if (!p) return false;

    Object.values(this.teamAssignments).forEach(arr => {
      const idx = arr.indexOf(playerId);
      if (idx > -1) arr.splice(idx, 1);
    });

    p.team = team;
    p.color = team === 'red' ? 0xff3333 : team === 'blue' ? 0x3333ff : 0xffff33;
    this.teamAssignments[team].push(playerId);
    return true;
  }

  processAttack(attackerId, targetId) {
    const atk = this.getPlayer(attackerId);
    const tgt = this.getPlayer(targetId);
    if (!atk || !tgt || !atk.isAlive || !tgt.isAlive) return null;

    const dist = Math.hypot(atk.position.x - tgt.position.x, atk.position.y - tgt.position.y);
    if (dist > 50) return null;

    if (atk.team && tgt.team && atk.team === tgt.team && atk.team !== 'free-for-all') {
      return null;
    }

    tgt.takeDamage(25);
    if (!tgt.isAlive) {
      atk.kills++;
      atk.coins += 10;
    }
    return { attackerId, targetId, damage: 25, tgtHealth: tgt.health };
  }

  update(deltaMs) {
    this.players.forEach(p => {
      if (p.isAlive) {
        p.update(deltaMs);
      } else if (p.respawnTime && Date.now() >= p.respawnTime) {
        p.respawn();
      }
    });
  }

  getState() {
    return {
      gameStatus: this.gameStatus,
      players: Array.from(this.players.values()).map(p => p.getState())
    };
  }
}
