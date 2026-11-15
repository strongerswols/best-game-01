// Emberfall Defense — bootstrap. Wires the canvas, the game state, input,
// rendering and sound together, runs the fixed-timestep loop, and exposes
// the hooks the screenshot modes and the play-test use:
//   ?shot=start|play|boss|end&seed=N  — deterministic screenshot states
//   ?autoplay=1                       — a simple bot that plays the whole
//                                       game (place towers, start waves)
//   window.__shotReady               — true once a shot frame is drawn
//   window.__gameErrors              — every uncaught error, for testing
import { CANVAS_HEIGHT, CANVAS_WIDTH, PLAY_BOTTOM, PLAY_TOP } from './config.js';
import { createSeededRandom, pickInt } from './random.js';
import { createSoundBank } from './audio.js';
import { attachInput } from './input.js';
import { createGame, resetGame, startWave, updateGame } from './game.js';
import { renderGame } from './render.js';
import { applyShotMode } from './shots.js';
import { canPlaceAt, createTower, snapToGrid, upgradeTower, upgradeTowerCost } from './towers.js';

window.__gameErrors = [];
window.addEventListener('error', (event) => {
  window.__gameErrors.push(String(event.message || event.error || 'unknown error'));
});

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;
const random = createSeededRandom(seed);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sounds = createSoundBank();
const game = createGame(sounds);
game.bestScore = 0;

// Meadow decorations: trees and rocks scattered by the seeded RNG, kept
// off the ember road and out of the HUD and shop bars.
const decorations = [];
for (let i = 0; i < 46; i += 1) {
  const x = pickInt(random, 20, CANVAS_WIDTH - 20);
  const y = pickInt(random, PLAY_TOP + 10, PLAY_BOTTOM - 10);
  let nearRoad = false;
  for (let s = 1; s < 6; s += 1) {
    const ax = [0, 300, 300, 920, 920][s - 1];
    const ay = [170, 170, 500, 500, 170][s - 1];
    const bx = [300, 300, 920, 920, 1260][s - 1];
    const by = [170, 500, 500, 170, 170][s - 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((x - ax) * dx + (y - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) < 52) {
      nearRoad = true;
      break;
    }
  }
  if (!nearRoad) decorations.push({ kind: random() < 0.6 ? 'tree' : 'rock', x, y });
}

attachInput(canvas, game);

const shotMode = applyShotMode(game, params);

// In autoplay mode the bot starts on the build screen instead of the
// title, so the whole loop can run with no input.
if (params.get('autoplay') === '1' && !shotMode) {
  game.phase = 'building';
}

// Autoplay bot: places towers on good grass spots, upgrades the first
// tower when rich, and starts each wave as soon as the field is clear.
// Used by the headless play-test to prove the full loop is winnable.
const autoplaySpots = [
  ['ember', 200, 280], ['ember', 400, 80], ['frost', 200, 400],
  ['mortar', 520, 280], ['ember', 820, 400], ['storm', 1020, 280],
  ['frost', 600, 400], ['mortar', 820, 80], ['ember', 1080, 400],
  ['storm', 760, 80], ['mortar', 400, 600], ['frost', 1020, 600],
];
let autoplayIndex = 0;
function autoplayTick() {
  if (game.phase !== 'building') return;
  if (autoplayIndex < autoplaySpots.length) {
    const [type, x, y] = autoplaySpots[autoplayIndex];
    const cost = { ember: 50, frost: 75, mortar: 120, storm: 200 }[type];
    if (game.gold >= cost && canPlaceAt(snapToGrid(x), snapToGrid(y), game.towers)) {
      game.towers.push(createTower(type, snapToGrid(x), snapToGrid(y)));
      game.gold -= cost;
      game.stats.placed += 1;
    }
    autoplayIndex += 1;
    return;
  }
  // Every spot tried: spend spare gold on the cheapest available upgrade,
  // then retry the spots (unplaced ones may be affordable now) and go.
  for (const tower of game.towers) {
    const cost = upgradeTowerCost(tower);
    if (cost !== null && game.gold >= cost) {
      game.gold -= cost;
      upgradeTower(tower);
      return;
    }
  }
  autoplayIndex = 0;
  startWave(game);
}

let last = performance.now();
let accumulator = 0;
const STEP = 1 / 60;
let framesDrawn = 0;

function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    if (game.phase === 'wave' || game.phase === 'building') {
      if (params.get('autoplay') === '1') autoplayTick();
      updateGame(game, STEP);
    }
    accumulator -= STEP;
  }
  renderGame(ctx, game, decorations);
  framesDrawn += 1;
  if (shotMode && framesDrawn >= 3) {
    window.__shotReady = true;
    document.title = `SHOT-READY errors=${window.__gameErrors.length}`;
  }
  if (params.get('autoplay') === '1') {
    if ((game.phase === 'won' || game.phase === 'lost') && !window.__autoplayResult) {
      window.__autoplayResult = `AUTOPLAY-RESULT phase=${game.phase} wave=${game.wave} score=${game.score} kills=${game.kills} lives=${game.lives} errors=${window.__gameErrors.length}`;
      document.title = window.__autoplayResult;
      resetGame(game); // proves the restart works; the bot then plays a fresh run
    } else if (window.__autoplayResult) {
      document.title = window.__autoplayResult;
    } else {
      document.title = `AUTOPLAY phase=${game.phase} wave=${game.wave} score=${game.score} errors=${window.__gameErrors.length}`;
    }
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Synchronous full-game simulation for the headless play-test only
// (?simtest=1): the bot plays the whole game on a fixed clock at load
// time and writes the outcome into the title, so a headless dump can
// prove the loop reaches a win or a loss with no uncaught errors.
if (params.get('simtest') === '1' && !shotMode) {
  game.phase = 'building';
  const maxSteps = 60 * 60 * 20; // 20 game-minutes at most
  for (let i = 0; i < maxSteps; i += 1) {
    autoplayTick();
    updateGame(game, STEP);
    if (game.phase === 'won' || game.phase === 'lost') break;
  }
  window.__simtestResult = `SIMTEST phase=${game.phase} wave=${game.wave} score=${game.score} kills=${game.kills} lives=${game.lives} gold=${game.gold} towers=${game.towers.length} errors=${window.__gameErrors.length}`;
  document.title = window.__simtestResult;
  renderGame(ctx, game, decorations);
}
