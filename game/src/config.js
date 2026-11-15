// Emberfall Defense — every number that tunes the game lives here, so the
// balance can be read and changed in one place. No other file hard-codes
// prices, ranges, speeds or wave sizes.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const HUD_HEIGHT = 64;
export const SHOP_HEIGHT = 96;
export const PLAY_TOP = HUD_HEIGHT + 8;
export const PLAY_BOTTOM = CANVAS_HEIGHT - SHOP_HEIGHT - 8;

export const START_GOLD = 200;
export const START_LIVES = 20;
export const TOTAL_WAVES = 10;
export const SELL_REFUND = 0.7;
export const GRID = 40;

// The ember road the invaders march along, from the western portal to the
// ember core on the east edge. Enemies walk waypoint to waypoint.
export const PATH_POINTS = [
  { x: -40, y: 170 },
  { x: 300, y: 170 },
  { x: 300, y: 500 },
  { x: 920, y: 500 },
  { x: 920, y: 170 },
  { x: 1260, y: 170 },
];
export const PATH_WIDTH = 56;
export const BASE_POS = { x: 1218, y: 170 };

export const PALETTE = {
  grassLight: '#7ec850',
  grassDark: '#74bd47',
  path: '#e8c37a',
  pathEdge: '#b98d4f',
  hud: '#1d2b1f',
  hudText: '#fff7d6',
  gold: '#ffc93c',
  heart: '#ff5a6e',
  panel: '#22331f',
  panelEdge: '#4a7a3d',
  text: '#f4ffe8',
  muted: '#b8d0a0',
};

// One entry per tower kind. damage/rate/range are the level-1 values;
// each upgrade adds UPGRADE_DAMAGE_BONUS damage and UPGRADE_RANGE_BONUS range.
export const TOWER_TYPES = {
  ember: {
    key: '1',
    name: 'Ember Spire',
    short: 'Ember',
    cost: 50,
    range: 115,
    damage: 14,
    rate: 2.0,
    color: '#ff8c2e',
    dark: '#c25e10',
    blurb: 'Fast fire bolts',
  },
  frost: {
    key: '2',
    name: 'Frost Obelisk',
    short: 'Frost',
    cost: 75,
    range: 105,
    damage: 7,
    rate: 1.1,
    slowFactor: 0.55,
    slowSeconds: 1.6,
    color: '#5fd4ff',
    dark: '#1d7fb8',
    blurb: 'Chills and slows',
  },
  mortar: {
    key: '3',
    name: 'Mortar Pit',
    short: 'Mortar',
    cost: 120,
    range: 155,
    damage: 34,
    rate: 0.6,
    splash: 62,
    color: '#c07bff',
    dark: '#7a3fc0',
    blurb: 'Splash damage',
  },
  storm: {
    key: '4',
    name: 'Storm Coil',
    short: 'Storm',
    cost: 200,
    range: 135,
    damage: 20,
    rate: 1.2,
    chain: 3,
    color: '#ffe14d',
    dark: '#b89a00',
    blurb: 'Lightning chains',
  },
};
export const TOWER_ORDER = ['ember', 'frost', 'mortar', 'storm'];
export const UPGRADE_DAMAGE_BONUS = 0.65;
export const UPGRADE_RANGE_BONUS = 0.15;
export const MAX_TOWER_LEVEL = 3;

export function upgradeCost(typeKey, level) {
  const base = TOWER_TYPES[typeKey].cost;
  if (level === 1) return Math.round(base * 0.8);
  return Math.round(base * 1.3);
}

// One entry per enemy kind. leak is how many lives the core loses when
// one of these reaches it.
export const ENEMY_TYPES = {
  imp: {
    name: 'Cinder Imp',
    hp: 30,
    speed: 72,
    gold: 6,
    leak: 1,
    radius: 13,
    color: '#ff6b35',
    dark: '#a83a12',
  },
  walker: {
    name: 'Ash Walker',
    hp: 78,
    speed: 46,
    gold: 10,
    leak: 1,
    radius: 16,
    color: '#e85d75',
    dark: '#8f2438',
  },
  golem: {
    name: 'Ember Golem',
    hp: 230,
    speed: 29,
    gold: 24,
    leak: 2,
    radius: 20,
    color: '#b5651d',
    dark: '#5e2f08',
  },
  boss: {
    name: 'Magma Colossus',
    hp: 3800,
    speed: 23,
    gold: 250,
    leak: 10,
    radius: 34,
    color: '#ff2e4d',
    dark: '#7a0d1e',
  },
};

// Wave n (1-based) is built from groups of {kind, count, gapSeconds}.
// hpScale grows the hit points of every enemy in the wave.
export function buildWaveGroups(wave) {
  const groups = [];
  if (wave === 10) {
    groups.push({ kind: 'imp', count: 8, gap: 0.7 });
    groups.push({ kind: 'walker', count: 6, gap: 0.9 });
    groups.push({ kind: 'golem', count: 4, gap: 1.2 });
    groups.push({ kind: 'boss', count: 1, gap: 2.5 });
    groups.push({ kind: 'imp', count: 10, gap: 0.5 });
    return groups;
  }
  const imps = 5 + wave * 2;
  const walkers = wave >= 2 ? 2 + wave : 0;
  const golems = wave >= 4 ? Math.floor((wave - 2) / 2) : 0;
  groups.push({ kind: 'imp', count: imps, gap: Math.max(0.45, 0.9 - wave * 0.04) });
  if (walkers > 0) groups.push({ kind: 'walker', count: walkers, gap: 0.8 });
  if (golems > 0) groups.push({ kind: 'golem', count: golems, gap: 1.4 });
  return groups;
}

export function waveHpScale(wave) {
  return 1 + (wave - 1) * 0.22;
}

export function waveClearBonus(wave) {
  return 35 + wave * 6;
}
