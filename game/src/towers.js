// Towers: placement on the grass, targeting, firing and projectiles.
// A tower remembers what it cost in total, so selling refunds 70% of the
// real investment and upgrades stay honest.
import {
  GRID,
  MAX_TOWER_LEVEL,
  PATH_POINTS,
  PATH_WIDTH,
  PLAY_BOTTOM,
  PLAY_TOP,
  SELL_REFUND,
  TOWER_TYPES,
  UPGRADE_DAMAGE_BONUS,
  UPGRADE_RANGE_BONUS,
  upgradeCost,
} from './config.js';
import { chillEnemy, damageEnemy } from './enemies.js';

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function snapToGrid(value) {
  return Math.round(value / GRID) * GRID;
}

export function towerStats(tower) {
  const def = TOWER_TYPES[tower.type];
  const levelBonus = tower.level - 1;
  return {
    range: def.range * (1 + UPGRADE_RANGE_BONUS * levelBonus),
    damage: def.damage * (1 + UPGRADE_DAMAGE_BONUS * levelBonus),
    rate: def.rate,
  };
}

export function canPlaceAt(x, y, towers) {
  if (x < 30 || x > 1250 || y < PLAY_TOP + 20 || y > PLAY_BOTTOM - 20) return false;
  for (let i = 1; i < PATH_POINTS.length; i += 1) {
    const a = PATH_POINTS[i - 1];
    const b = PATH_POINTS[i];
    if (distanceToSegment(x, y, a.x, a.y, b.x, b.y) < PATH_WIDTH / 2 + 24) return false;
  }
  for (const tower of towers) {
    if (Math.hypot(tower.x - x, tower.y - y) < 44) return false;
  }
  return true;
}

export function createTower(type, x, y) {
  const def = TOWER_TYPES[type];
  return {
    type,
    x,
    y,
    level: 1,
    invested: def.cost,
    cooldown: 0,
    angle: -Math.PI / 2,
    flash: 0,
  };
}

export function upgradeTowerCost(tower) {
  if (tower.level >= MAX_TOWER_LEVEL) return null;
  return upgradeCost(tower.type, tower.level);
}

export function upgradeTower(tower) {
  const cost = upgradeTowerCost(tower);
  if (cost === null) return false;
  tower.invested += cost;
  tower.level += 1;
  return cost;
}

export function sellTowerValue(tower) {
  return Math.floor(tower.invested * SELL_REFUND);
}

export function findTowerAt(x, y, towers) {
  for (const tower of towers) {
    if (Math.hypot(tower.x - x, tower.y - y) <= 26) return tower;
  }
  return null;
}

function pickTarget(tower, stats, enemies) {
  let best = null;
  for (const enemy of enemies) {
    if (enemy.dead || enemy.leaked) continue;
    const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    if (dist > stats.range + enemy.radius) continue;
    if (!best || enemy.distanceTravelled > best.distanceTravelled) best = enemy;
  }
  return best;
}

// Storm towers strike instantly and the bolt jumps between nearby enemies.
export function chainStorm(tower, stats, firstTarget, enemies, lightning) {
  damageEnemy(firstTarget, stats.damage);
  lightning.push({ from: { x: tower.x, y: tower.y }, to: { x: firstTarget.x, y: firstTarget.y }, ttl: 0.12, max: 0.12 });
  const def = TOWER_TYPES.storm;
  const hit = new Set([firstTarget]);
  let current = firstTarget;
  for (let jump = 1; jump < def.chain; jump += 1) {
    let next = null;
    let nextDist = Infinity;
    for (const enemy of enemies) {
      if (enemy.dead || enemy.leaked || hit.has(enemy)) continue;
      const dist = Math.hypot(enemy.x - current.x, enemy.y - current.y);
      if (dist < 120 && dist < nextDist) {
        next = enemy;
        nextDist = dist;
      }
    }
    if (!next) break;
    hit.add(next);
    lightning.push({ from: { x: current.x, y: current.y }, to: { x: next.x, y: next.y }, ttl: 0.12, max: 0.12 });
    damageEnemy(next, stats.damage);
    current = next;
  }
}

export function updateTowers(towers, enemies, projectiles, lightning, dt, sounds) {
  for (const tower of towers) {
    if (tower.flash > 0) tower.flash -= dt;
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;
    const stats = towerStats(tower);
    const target = pickTarget(tower, stats, enemies);
    if (!target) continue;
    tower.cooldown = 1 / stats.rate;
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    tower.flash = 0.08;
    if (tower.type === 'storm') {
      chainStorm(tower, stats, target, enemies, lightning);
      sounds.shoot('storm');
    } else {
      const def = TOWER_TYPES[tower.type];
      projectiles.push({
        x: tower.x,
        y: tower.y,
        target,
        kind: tower.type,
        damage: stats.damage,
        splash: def.splash || 0,
        slowFactor: def.slowFactor || 0,
        slowSeconds: def.slowSeconds || 0,
        speed: tower.type === 'mortar' ? 340 : 520,
      });
      sounds.shoot(tower.type);
    }
  }
}

export function updateProjectiles(projectiles, enemies, particles, dt, sounds) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const p = projectiles[i];
    if (!p.target || p.target.dead || p.target.leaked) {
      projectiles.splice(i, 1);
      continue;
    }
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (dist <= step + p.target.radius * 0.5) {
      if (p.splash > 0) {
        for (const enemy of enemies) {
          if (enemy.dead || enemy.leaked) continue;
          if (Math.hypot(enemy.x - p.target.x, enemy.y - p.target.y) <= p.splash + enemy.radius) {
            damageEnemy(enemy, p.damage);
          }
        }
        for (let k = 0; k < 10; k += 1) {
          particles.push({
            x: p.target.x, y: p.target.y,
            vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220,
            ttl: 0.35, max: 0.35, color: '#c07bff', size: 4,
          });
        }
      } else {
        damageEnemy(p.target, p.damage);
        if (p.slowFactor > 0) chillEnemy(p.target, p.slowSeconds);
      }
      sounds.hit();
      projectiles.splice(i, 1);
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  }
}
