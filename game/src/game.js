// Emberfall Defense — the game itself: its state machine, economy, lives,
// score and the wave loop. Rendering lives in render.js, input in input.js;
// this file only decides what happens when.
import {
  START_GOLD,
  START_LIVES,
  TOTAL_WAVES,
  TOWER_TYPES,
  waveClearBonus,
} from './config.js';
import { createTower, canPlaceAt, findTowerAt, sellTowerValue, snapToGrid, towerStats, updateProjectiles, updateTowers, upgradeTower, upgradeTowerCost } from './towers.js';
import { createWaveSpawner, countRemaining, updateWaveSpawner } from './waves.js';
import { updateEnemy } from './enemies.js';

export function createGame(sounds) {
  return {
    sounds,
    phase: 'title',
    gold: START_GOLD,
    lives: START_LIVES,
    score: 0,
    wave: 0,
    kills: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    lightning: [],
    particles: [],
    floats: [],
    spawner: null,
    selectedType: 'ember',
    selectedTower: null,
    hover: null,
    hoverValid: false,
    message: '',
    messageTtl: 0,
    waveBanner: '',
    waveBannerTtl: 0,
    stats: { placed: 0, earned: 0, leaked: 0 },
    time: 0,
  };
}

export function resetGame(game) {
  const fresh = createGame(game.sounds);
  fresh.phase = 'building';
  Object.assign(game, fresh);
  game.phase = 'building';
}

export function startFirstWave(game) {
  game.phase = 'building';
  startWave(game);
}

export function startWave(game) {
  if (game.phase !== 'building') return false;
  if (game.wave >= TOTAL_WAVES) return false;
  game.wave += 1;
  game.spawner = createWaveSpawner(game.wave);
  game.phase = 'wave';
  game.waveBanner = `WAVE ${game.wave}`;
  game.waveBannerTtl = 2.0;
  game.sounds.waveHorn();
  return true;
}

export function tryPlaceTower(game, x, y) {
  const def = TOWER_TYPES[game.selectedType];
  if (!def) return false;
  if (game.gold < def.cost) {
    game.message = 'Not enough gold!';
    game.messageTtl = 1.5;
    return false;
  }
  const gx = snapToGrid(x);
  const gy = snapToGrid(y);
  if (!canPlaceAt(gx, gy, game.towers)) {
    game.message = 'Cannot build here!';
    game.messageTtl = 1.5;
    return false;
  }
  game.towers.push(createTower(game.selectedType, gx, gy));
  game.gold -= def.cost;
  game.stats.placed += 1;
  game.sounds.place();
  return true;
}

export function tryUpgradeSelected(game) {
  const tower = game.selectedTower;
  if (!tower) return false;
  const cost = upgradeTowerCost(tower);
  if (cost === null) {
    game.message = 'Already max level!';
    game.messageTtl = 1.5;
    return false;
  }
  if (game.gold < cost) {
    game.message = 'Not enough gold!';
    game.messageTtl = 1.5;
    return false;
  }
  game.gold -= cost;
  upgradeTower(tower);
  game.sounds.upgrade();
  return true;
}

export function trySellSelected(game) {
  const tower = game.selectedTower;
  if (!tower) return false;
  const value = sellTowerValue(tower);
  game.gold += value;
  game.towers = game.towers.filter((t) => t !== tower);
  game.selectedTower = null;
  game.sounds.sell();
  return true;
}

export function selectTowerAt(game, x, y) {
  const tower = findTowerAt(x, y, game.towers);
  game.selectedTower = tower;
  return tower;
}

function burstParticles(game, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.4 + Math.random() * 0.6);
    game.particles.push({
      x, y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      ttl: 0.4, max: 0.4, color, size: 3 + Math.random() * 3,
    });
  }
}

function addFloat(game, x, y, text, color) {
  game.floats.push({ x, y, text, color, ttl: 1.1, max: 1.1 });
}

export function updateGame(game, dt) {
  game.time += dt;
  if (game.messageTtl > 0) game.messageTtl -= dt;
  if (game.waveBannerTtl > 0) game.waveBannerTtl -= dt;

  for (let i = game.particles.length - 1; i >= 0; i -= 1) {
    const p = game.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.ttl -= dt;
    if (p.ttl <= 0) game.particles.splice(i, 1);
  }
  for (let i = game.floats.length - 1; i >= 0; i -= 1) {
    const f = game.floats[i];
    f.y -= 34 * dt;
    f.ttl -= dt;
    if (f.ttl <= 0) game.floats.splice(i, 1);
  }
  for (let i = game.lightning.length - 1; i >= 0; i -= 1) {
    game.lightning[i].ttl -= dt;
    if (game.lightning[i].ttl <= 0) game.lightning.splice(i, 1);
  }

  if (game.phase !== 'wave') return;

  updateWaveSpawner(game.spawner, game.enemies, dt);
  updateTowers(game.towers, game.enemies, game.projectiles, game.lightning, dt, game.sounds);
  updateProjectiles(game.projectiles, game.enemies, game.particles, dt, game.sounds);

  for (const enemy of game.enemies) {
    updateEnemy(enemy, dt);
  }

  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = game.enemies[i];
    if (enemy.dead) {
      game.gold += enemy.gold;
      game.score += 10;
      game.kills += 1;
      game.stats.earned += enemy.gold;
      burstParticles(game, enemy.x, enemy.y, enemy.color, 10, 160);
      addFloat(game, enemy.x, enemy.y, `+${enemy.gold}g`, '#ffc93c');
      game.sounds.coin();
      game.enemies.splice(i, 1);
    } else if (enemy.leaked) {
      game.lives -= enemy.leak;
      game.stats.leaked += 1;
      burstParticles(game, enemy.x, enemy.y, '#ff5a6e', 14, 200);
      addFloat(game, enemy.x, enemy.y, `-${enemy.leak} ❤`, '#ff5a6e');
      game.sounds.leak();
      game.enemies.splice(i, 1);
      if (game.lives <= 0) {
        game.lives = 0;
        game.phase = 'lost';
        game.sounds.lose();
        return;
      }
    }
  }

  if (game.spawner.done && countRemaining(game.spawner, game.enemies) === 0) {
    const bonus = waveClearBonus(game.wave);
    game.gold += bonus;
    game.score += 100;
    addFloat(game, 640, 300, `Wave clear! +${bonus}g`, '#7dff8a');
    if (game.wave >= TOTAL_WAVES) {
      game.score += game.lives * 50;
      game.phase = 'won';
      game.sounds.win();
    } else {
      game.phase = 'building';
      game.message = `Wave ${game.wave} cleared! Build, then press Space.`;
      game.messageTtl = 3;
    }
  }
}

export function towerPanelInfo(game) {
  const tower = game.selectedTower;
  if (!tower) return null;
  const def = TOWER_TYPES[tower.type];
  const stats = towerStats(tower);
  return {
    name: def.name,
    level: tower.level,
    damage: Math.round(stats.damage),
    range: Math.round(stats.range),
    rate: stats.rate.toFixed(1),
    upgradeCost: upgradeTowerCost(tower),
    sellValue: sellTowerValue(tower),
  };
}
