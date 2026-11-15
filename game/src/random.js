// A tiny deterministic random number generator (mulberry32), so a screenshot
// taken with ?seed=N always shows the same map decorations and the same
// wave timings. Nothing here touches Math.random.
export function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickInRange(random, min, max) {
  return min + random() * (max - min);
}

export function pickInt(random, min, max) {
  return Math.floor(pickInRange(random, min, max + 1));
}
