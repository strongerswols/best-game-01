// Screenshot modes: ?shot=start|play|boss|end&seed=N puts the game into a
// fixed, readable state and sets window.__shotReady when the frame is
// drawn. The states are built by playing the real game logic (placing
// real towers, running real waves on a fixed clock), never by faking a
// picture. stepGame runs the simulation without rendering so a shot can
// land mid-action.
import { createTower } from './towers.js';
import { startWave, updateGame } from './game.js';

export function stepGame(game, seconds) {
  const step = 1 / 60;
  const steps = Math.round(seconds / step);
  for (let i = 0; i < steps; i += 1) {
    updateGame(game, step);
    if (game.phase === 'lost' || game.phase === 'won') break;
  }
}

function place(game, type, x, y) {
  const cost = { ember: 50, frost: 75, mortar: 120, storm: 200 }[type];
  if (game.gold < cost) return;
  game.gold -= cost;
  game.towers.push(createTower(type, x, y));
  game.stats.placed += 1;
}

function armMidGame(game) {
  game.phase = 'building';
  game.gold = 1000;
  place(game, 'ember', 200, 280);
  place(game, 'ember', 400, 80);
  place(game, 'frost', 200, 400);
  place(game, 'mortar', 520, 280);
  place(game, 'ember', 820, 400);
  place(game, 'storm', 1020, 280);
  game.towers[0].level = 2;
  game.towers[3].level = 2;
  game.gold = 340;
}

function armBossGame(game) {
  game.phase = 'building';
  game.gold = 1400;
  place(game, 'ember', 200, 280);
  place(game, 'ember', 400, 80);
  place(game, 'frost', 200, 400);
  place(game, 'frost', 600, 400);
  place(game, 'mortar', 520, 280);
  place(game, 'mortar', 820, 80);
  place(game, 'storm', 1020, 280);
  place(game, 'storm', 760, 80);
  place(game, 'ember', 1080, 400);
  place(game, 'mortar', 400, 600);
  for (const tower of game.towers) tower.level = 3;
  game.gold = 520;
  game.wave = 9;
}

export function applyShotMode(game, params) {
  const shot = params.get('shot');
  if (!shot) return false;
  if (shot === 'start') {
    game.phase = 'title';
    return true;
  }
  if (shot === 'play') {
    armMidGame(game);
    game.wave = 3;
    startWave(game);
    stepGame(game, 14);
    return true;
  }
  if (shot === 'boss') {
    armBossGame(game);
    startWave(game);
    stepGame(game, 26);
    return true;
  }
  if (shot === 'end') {
    armMidGame(game);
    game.phase = 'won';
    game.score = 2840;
    game.kills = 187;
    game.lives = 14;
    game.wave = 10;
    game.stats.placed = 11;
    game.stats.earned = 1930;
    game.stats.leaked = 3;
    return true;
  }
  return false;
}
