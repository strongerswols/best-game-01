// Mouse and keyboard: every way the player talks to the game. Clicks on
// the shop bar pick a tower kind; clicks on the map place or select;
// the upgrade/sell buttons live on the tower panel; keys mirror it all.
import { canPlaceAt, snapToGrid } from './towers.js';
import { panelButtons, shopCardAt } from './render.js';
import { resetGame, startWave, tryPlaceTower, trySellSelected, tryUpgradeSelected, selectTowerAt } from './game.js';

function canvasPosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export function attachInput(canvas, game) {
  canvas.addEventListener('mousemove', (event) => {
    const pos = canvasPosition(canvas, event);
    game.hover = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    game.hoverValid = canPlaceAt(game.hover.x, game.hover.y, game.towers);
  });

  canvas.addEventListener('mouseleave', () => {
    game.hover = null;
  });

  canvas.addEventListener('click', (event) => {
    game.sounds.unlock();
    const pos = canvasPosition(canvas, event);
    if (game.phase === 'title') {
      game.phase = 'building';
      return;
    }
    if (game.phase === 'won' || game.phase === 'lost') {
      resetGame(game);
      return;
    }
    const shopType = shopCardAt(pos.x, pos.y);
    if (shopType) {
      game.selectedType = shopType;
      game.selectedTower = null;
      return;
    }
    if (game.selectedTower) {
      const buttons = panelButtons();
      if (pos.x >= buttons.upgrade.x && pos.x <= buttons.upgrade.x + buttons.upgrade.w &&
          pos.y >= buttons.upgrade.y && pos.y <= buttons.upgrade.y + buttons.upgrade.h) {
        tryUpgradeSelected(game);
        return;
      }
      if (pos.x >= buttons.sell.x && pos.x <= buttons.sell.x + buttons.sell.w &&
          pos.y >= buttons.sell.y && pos.y <= buttons.sell.y + buttons.sell.h) {
        trySellSelected(game);
        return;
      }
    }
    if (game.phase !== 'building' && game.phase !== 'wave') return;
    const tower = selectTowerAt(game, pos.x, pos.y);
    if (!tower && game.phase === 'building') {
      tryPlaceTower(game, pos.x, pos.y);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    game.sounds.unlock();
    const key = event.key.toLowerCase();
    if (key === 'm') {
      const muted = game.sounds.toggleMute();
      game.message = muted ? 'Sound off' : 'Sound on';
      game.messageTtl = 1.2;
      return;
    }
    if (game.phase === 'title' && (key === ' ' || key === 'enter')) {
      event.preventDefault();
      game.phase = 'building';
      return;
    }
    if ((game.phase === 'won' || game.phase === 'lost') && (key === 'r' || key === ' ' || key === 'enter')) {
      event.preventDefault();
      resetGame(game);
      return;
    }
    if (key === 'r') {
      resetGame(game);
      return;
    }
    if (key === 'p') {
      if (game.phase === 'wave' || game.phase === 'building') {
        game.previousPhase = game.phase;
        game.phase = 'paused';
      } else if (game.phase === 'paused') {
        game.phase = game.previousPhase || 'building';
      }
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      if (game.phase === 'building') startWave(game);
      return;
    }
    if (key === 'escape') {
      game.selectedTower = null;
      return;
    }
    const byKey = { 1: 'ember', 2: 'frost', 3: 'mortar', 4: 'storm' };
    if (byKey[key]) {
      game.selectedType = byKey[key];
      game.selectedTower = null;
    }
  });
}
