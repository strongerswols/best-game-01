// Every pixel of Emberfall Defense is drawn here: the meadow and ember
// road, towers, enemies, projectiles, particles, the HUD, the shop bar and
// the title / pause / win / lose screens. The palette is bright and
// high-contrast so each screenshot reads at a glance when shrunk.
import {
  BASE_POS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HUD_HEIGHT,
  PALETTE,
  PATH_POINTS,
  PATH_WIDTH,
  PLAY_BOTTOM,
  PLAY_TOP,
  SHOP_HEIGHT,
  TOTAL_WAVES,
  TOWER_ORDER,
  TOWER_TYPES,
} from './config.js';
import { towerStats } from './towers.js';
import { countRemaining } from './waves.js';
import { towerPanelInfo } from './game.js';

const SHOP_CARDS = [
  { type: 'ember', x: 16, w: 296 },
  { type: 'frost', x: 324, w: 296 },
  { type: 'mortar', x: 632, w: 296 },
  { type: 'storm', x: 940, w: 296 },
];

export function shopCardAt(x, y) {
  if (y < CANVAS_HEIGHT - SHOP_HEIGHT + 10 || y > CANVAS_HEIGHT - 10) return null;
  for (const card of SHOP_CARDS) {
    if (x >= card.x && x <= card.x + card.w) return card.type;
  }
  return null;
}

export function panelButtons() {
  return {
    upgrade: { x: 1050, y: 96, w: 104, h: 34 },
    sell: { x: 1162, y: 96, w: 104, h: 34 },
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size, y - size * 0.5, x - size * 0.4, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.4, y - size, x + size, y - size * 0.5, x, y + size * 0.35);
  ctx.fill();
}

function drawCoin(ctx, x, y, radius) {
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87b00';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#a87b00';
  ctx.font = `bold ${Math.round(radius * 1.1)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', x, y + 1);
}

function drawTowerShape(ctx, type, x, y, size, angle, flash) {
  const def = TOWER_TYPES[type];
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#2c2417';
  ctx.beginPath();
  ctx.arc(0, 2, size + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.dark;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.color;
  if (type === 'ember') {
    ctx.beginPath();
    ctx.moveTo(0, -size - 4);
    ctx.lineTo(size * 0.8, size * 0.7);
    ctx.lineTo(-size * 0.8, size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'frost') {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
    ctx.fillStyle = '#dff6ff';
    ctx.fillRect(-size * 0.35, -size * 0.35, size * 0.7, size * 0.7);
  } else if (type === 'mortar') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#3a2c4d';
    ctx.fillRect(0, -5, size + 8, 10);
    ctx.restore();
    ctx.fillStyle = '#3a2c4d';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, size * 0.5);
    ctx.lineTo(-size * 0.2, -size * 0.4);
    ctx.lineTo(size * 0.2, size * 0.5);
    ctx.lineTo(size * 0.6, -size * 0.4);
    ctx.stroke();
    ctx.fillStyle = '#fffbe0';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, flash * 8)})`;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackground(ctx, decorations) {
  ctx.fillStyle = PALETTE.grassLight;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = PALETTE.grassDark;
  const cell = 80;
  for (let gy = 0; gy < CANVAS_HEIGHT / cell; gy += 1) {
    for (let gx = 0; gx < CANVAS_WIDTH / cell; gx += 1) {
      if ((gx + gy) % 2 === 0) ctx.fillRect(gx * cell, gy * cell, cell, cell);
    }
  }
  for (const deco of decorations) {
    if (deco.kind === 'tree') {
      ctx.fillStyle = '#2e6b34';
      ctx.beginPath();
      ctx.arc(deco.x, deco.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f9142';
      ctx.beginPath();
      ctx.arc(deco.x - 4, deco.y - 4, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#9aa08e';
      ctx.beginPath();
      ctx.arc(deco.x, deco.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Ember road.
  ctx.strokeStyle = PALETTE.pathEdge;
  ctx.lineWidth = PATH_WIDTH + 8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
  for (let i = 1; i < PATH_POINTS.length; i += 1) ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.path;
  ctx.lineWidth = PATH_WIDTH;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(185,141,79,0.7)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
  for (let i = 1; i < PATH_POINTS.length; i += 1) ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
  ctx.stroke();
  ctx.setLineDash([]);
  // Spawn portal on the west edge.
  ctx.save();
  ctx.translate(14, 170);
  ctx.fillStyle = '#7a3fc0';
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c07bff';
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#efe0ff';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Ember core on the east edge.
  const pulse = 1 + Math.sin(Date.now() / 300) * 0.06;
  ctx.save();
  ctx.translate(BASE_POS.x, BASE_POS.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(255,140,46,0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8c2e';
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(20, 0);
  ctx.lineTo(0, 26);
  ctx.lineTo(-20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 14);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTowers(ctx, game) {
  if (game.selectedTower) {
    const stats = towerStats(game.selectedTower);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.selectedTower.x, game.selectedTower.y, stats.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  for (const tower of game.towers) {
    drawTowerShape(ctx, tower.type, tower.x, tower.y, 17, tower.angle, tower.flash);
    if (tower.level > 1) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★'.repeat(tower.level - 1), tower.x, tower.y - 26);
    }
  }
  if (game.hover && game.phase === 'building') {
    const gx = game.hover.x;
    const gy = game.hover.y;
    ctx.globalAlpha = 0.55;
    drawTowerShape(ctx, game.selectedType, gx, gy, 17, -Math.PI / 2, 0);
    ctx.globalAlpha = 1;
    const stats = { range: TOWER_TYPES[game.selectedType].range };
    ctx.strokeStyle = game.hoverValid ? 'rgba(125,255,138,0.9)' : 'rgba(255,90,110,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gx, gy, stats.range, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemies(ctx, game) {
  for (const enemy of game.enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    if (enemy.chillSeconds > 0) {
      ctx.fillStyle = 'rgba(95,212,255,0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = enemy.flash > 0 ? '#ffffff' : enemy.dark;
    ctx.beginPath();
    ctx.arc(0, 2, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = enemy.flash > 0 ? '#ffffff' : enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d2b1f';
    const eye = enemy.radius * 0.35;
    ctx.beginPath();
    ctx.arc(-eye, -eye * 0.4, 2.5, 0, Math.PI * 2);
    ctx.arc(eye, -eye * 0.4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (enemy.kind === 'boss') {
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.moveTo(-14, -enemy.radius + 2);
      ctx.lineTo(-7, -enemy.radius - 12);
      ctx.lineTo(0, -enemy.radius + 2);
      ctx.lineTo(7, -enemy.radius - 12);
      ctx.lineTo(14, -enemy.radius + 2);
      ctx.closePath();
      ctx.fill();
    }
    const barW = enemy.radius * 2;
    const barY = -enemy.radius - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-barW / 2, barY, barW, 5);
    ctx.fillStyle = enemy.hp / enemy.maxHp > 0.5 ? '#7dff8a' : '#ff5a6e';
    ctx.fillRect(-barW / 2, barY, barW * Math.max(0, enemy.hp / enemy.maxHp), 5);
    ctx.restore();
  }
}

function drawProjectilesAndEffects(ctx, game) {
  for (const p of game.projectiles) {
    const def = TOWER_TYPES[p.kind];
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.kind === 'mortar' ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const bolt of game.lightning) {
    ctx.strokeStyle = `rgba(255,225,77,${bolt.ttl / bolt.max})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bolt.from.x, bolt.from.y);
    const midX = (bolt.from.x + bolt.to.x) / 2 + (Math.random() - 0.5) * 24;
    const midY = (bolt.from.y + bolt.to.y) / 2 + (Math.random() - 0.5) * 24;
    ctx.lineTo(midX, midY);
    ctx.lineTo(bolt.to.x, bolt.to.y);
    ctx.stroke();
  }
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.ttl / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of game.floats) {
    ctx.globalAlpha = Math.max(0, f.ttl / f.max);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  drawCoin(ctx, 30, 32, 13);
  ctx.textAlign = 'left'; // drawCoin centers its own "G"; re-assert left here
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`${game.gold}`, 50, 33);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`WAVE  ${Math.max(1, game.wave)} / ${TOTAL_WAVES}`, 190, 33);
  drawHeart(ctx, 400, 30, 11, PALETTE.heart);
  ctx.fillStyle = PALETTE.hudText;
  ctx.fillText(`${game.lives}`, 418, 33);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`SCORE ${game.score}`, 490, 33);
  const remaining = game.phase === 'wave' ? countRemaining(game.spawner, game.enemies) : 0;
  ctx.fillStyle = game.phase === 'wave' ? '#ff9d5c' : PALETTE.muted;
  ctx.fillText(game.phase === 'wave' ? `ENEMIES LEFT ${remaining}` : 'PRESS SPACE TO START WAVE', 700, 33);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('M sound · P pause · R restart', CANVAS_WIDTH - 16, 33);
  if (game.waveBannerTtl > 0 && game.waveBanner) {
    ctx.globalAlpha = Math.min(1, game.waveBannerTtl);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.waveBanner, CANVAS_WIDTH / 2, 200);
    ctx.globalAlpha = 1;
  }
  if (game.messageTtl > 0 && game.message) {
    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 19px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, CANVAS_WIDTH / 2, HUD_HEIGHT + 26);
  }
}

function drawShop(ctx, game) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, CANVAS_HEIGHT - SHOP_HEIGHT, CANVAS_WIDTH, SHOP_HEIGHT);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const card of SHOP_CARDS) {
    const def = TOWER_TYPES[card.type];
    const selected = game.selectedType === card.type;
    const y = CANVAS_HEIGHT - SHOP_HEIGHT + 10;
    ctx.fillStyle = selected ? '#3d5a34' : PALETTE.panel;
    roundRect(ctx, card.x, y, card.w, SHOP_HEIGHT - 20, 10);
    ctx.fill();
    ctx.strokeStyle = selected ? PALETTE.gold : PALETTE.panelEdge;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();
    drawTowerShape(ctx, card.type, card.x + 34, y + 38, 15, -Math.PI / 2, 0);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`${def.key}  ${def.name}`, card.x + 60, y + 22);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '14px sans-serif';
    ctx.fillText(def.blurb, card.x + 60, y + 46);
    const affordable = game.gold >= def.cost;
    ctx.fillStyle = affordable ? PALETTE.gold : '#ff8a96';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${def.cost} gold`, card.x + 60, y + 66);
  }
}

function drawTowerPanel(ctx, game) {
  const info = towerPanelInfo(game);
  if (!info) return;
  const x = 1010;
  const y = HUD_HEIGHT + 12;
  ctx.fillStyle = 'rgba(29,43,31,0.94)';
  roundRect(ctx, x, y, 256, 104, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`${info.name}  ★${info.level}`, x + 14, y + 20);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '14px sans-serif';
  ctx.fillText(`Damage ${info.damage} · Range ${info.range} · ${info.rate}/s`, x + 14, y + 44);
  const buttons = panelButtons();
  ctx.fillStyle = info.upgradeCost !== null ? '#3f9142' : '#555';
  roundRect(ctx, buttons.upgrade.x, buttons.upgrade.y, buttons.upgrade.w, buttons.upgrade.h, 7);
  ctx.fill();
  ctx.fillStyle = '#ff8a96';
  roundRect(ctx, buttons.sell.x, buttons.sell.y, buttons.sell.w, buttons.sell.h, 7);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(info.upgradeCost !== null ? `Upgrade ${info.upgradeCost}g` : 'MAX LEVEL', buttons.upgrade.x + buttons.upgrade.w / 2, buttons.upgrade.y + 17);
  ctx.fillText(`Sell +${info.sellValue}g`, buttons.sell.x + buttons.sell.w / 2, buttons.sell.y + 17);
}

function drawTitleScreen(ctx, game) {
  ctx.fillStyle = 'rgba(20,32,18,0.82)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 74px sans-serif';
  ctx.fillText('EMBERFALL', CANVAS_WIDTH / 2, 190);
  ctx.fillStyle = '#ff8c2e';
  ctx.font = 'bold 74px sans-serif';
  ctx.fillText('DEFENSE', CANVAS_WIDTH / 2, 268);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '22px sans-serif';
  ctx.fillText('The ember horde is coming down the road. Build towers, hold the core.', CANVAS_WIDTH / 2, 330);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '19px sans-serif';
  ctx.fillText('Click a tower card, then click the grass to build  ·  1-4 pick a tower', CANVAS_WIDTH / 2, 380);
  ctx.fillText('SPACE starts the next wave  ·  Click a tower to upgrade or sell it', CANVAS_WIDTH / 2, 410);
  ctx.fillText('Survive all 10 waves — the Magma Colossus waits in wave 10.', CANVAS_WIDTH / 2, 440);
  const pulse = 0.65 + Math.sin(Date.now() / 350) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('CLICK OR PRESS SPACE TO PLAY', CANVAS_WIDTH / 2, 520);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '16px sans-serif';
  ctx.fillText('Best score this session: ' + (game.bestScore || 0), CANVAS_WIDTH / 2, 580);
}

function drawPauseScreen(ctx) {
  ctx.fillStyle = 'rgba(20,32,18,0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 330);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '20px sans-serif';
  ctx.fillText('Press P to resume', CANVAS_WIDTH / 2, 390);
}

function drawEndScreen(ctx, game) {
  const won = game.phase === 'won';
  ctx.fillStyle = won ? 'rgba(20,48,22,0.86)' : 'rgba(48,20,22,0.86)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#7dff8a' : '#ff5a6e';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(won ? 'VICTORY!' : 'THE CORE HAS FALLEN', CANVAS_WIDTH / 2, 220);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '24px sans-serif';
  ctx.fillText(
    won
      ? 'All 10 waves broken. The ember core still burns — thanks to you.'
      : `The horde broke through on wave ${game.wave}. Build smarter, try again.`,
    CANVAS_WIDTH / 2,
    290,
  );
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`SCORE ${game.score}   ·   KILLS ${game.kills}   ·   TOWERS BUILT ${game.stats.placed}`, CANVAS_WIDTH / 2, 360);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '20px sans-serif';
  ctx.fillText(`Gold earned ${game.stats.earned}   ·   Enemies leaked ${game.stats.leaked}   ·   Lives left ${game.lives}`, CANVAS_WIDTH / 2, 405);
  const pulse = 0.65 + Math.sin(Date.now() / 350) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', CANVAS_WIDTH / 2, 490);
  ctx.globalAlpha = 1;
}

export function renderGame(ctx, game, decorations) {
  drawBackground(ctx, decorations);
  drawTowers(ctx, game);
  drawEnemies(ctx, game);
  drawProjectilesAndEffects(ctx, game);
  drawHud(ctx, game);
  drawShop(ctx, game);
  drawTowerPanel(ctx, game);
  if (game.phase === 'title') drawTitleScreen(ctx, game);
  else if (game.phase === 'paused') drawPauseScreen(ctx);
  else if (game.phase === 'won' || game.phase === 'lost') drawEndScreen(ctx, game);
}
