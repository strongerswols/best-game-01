// Enemies: what walks the ember road. Each enemy carries its type, its
// hit points, its position, how far along the path it has travelled (used
// for "first" targeting), and its chill timer from frost towers.
import { ENEMY_TYPES, PATH_POINTS, waveHpScale } from './config.js';

function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export const PATH_TOTAL_LENGTH = pathLength(PATH_POINTS);

export function createEnemy(kind, wave) {
  const def = ENEMY_TYPES[kind];
  const hp = Math.round(def.hp * waveHpScale(wave));
  return {
    kind,
    name: def.name,
    x: PATH_POINTS[0].x,
    y: PATH_POINTS[0].y,
    waypointIndex: 1,
    hp,
    maxHp: hp,
    speed: def.speed,
    gold: def.gold,
    leak: def.leak,
    radius: def.radius,
    color: def.color,
    dark: def.dark,
    distanceTravelled: 0,
    chillSeconds: 0,
    flash: 0,
    dead: false,
    leaked: false,
  };
}

export function updateEnemy(enemy, dt) {
  if (enemy.dead || enemy.leaked) return;
  if (enemy.flash > 0) enemy.flash -= dt;
  const slow = enemy.chillSeconds > 0 ? 0.55 : 1;
  if (enemy.chillSeconds > 0) enemy.chillSeconds -= dt;
  let remaining = enemy.speed * slow * dt;
  while (remaining > 0 && enemy.waypointIndex < PATH_POINTS.length) {
    const target = PATH_POINTS[enemy.waypointIndex];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= remaining) {
      enemy.x = target.x;
      enemy.y = target.y;
      enemy.distanceTravelled += dist;
      remaining -= dist;
      enemy.waypointIndex += 1;
    } else {
      enemy.x += (dx / dist) * remaining;
      enemy.y += (dy / dist) * remaining;
      enemy.distanceTravelled += remaining;
      remaining = 0;
    }
  }
  if (enemy.waypointIndex >= PATH_POINTS.length) {
    enemy.leaked = true;
  }
}

export function damageEnemy(enemy, amount) {
  enemy.hp -= amount;
  enemy.flash = 0.09;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.dead = true;
  }
}

export function chillEnemy(enemy, seconds) {
  enemy.chillSeconds = Math.max(enemy.chillSeconds, seconds);
}
