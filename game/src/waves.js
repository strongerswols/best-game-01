// Waves: the schedule that sends enemies down the road. A wave is a queue
// of spawn events built from the groups in config; the spawner drips them
// out on their timers and reports when the wave is fully spawned and the
// field is clear.
import { buildWaveGroups } from './config.js';
import { createEnemy } from './enemies.js';

export function createWaveSpawner(wave) {
  const queue = [];
  let time = 0.5;
  for (const group of buildWaveGroups(wave)) {
    for (let i = 0; i < group.count; i += 1) {
      queue.push({ kind: group.kind, at: time });
      time += group.gap;
    }
    time += 1.0;
  }
  return { wave, queue, index: 0, elapsed: 0, done: false };
}

export function updateWaveSpawner(spawner, enemies, dt) {
  if (spawner.done) return;
  spawner.elapsed += dt;
  while (spawner.index < spawner.queue.length && spawner.queue[spawner.index].at <= spawner.elapsed) {
    const event = spawner.queue[spawner.index];
    enemies.push(createEnemy(event.kind, spawner.wave));
    spawner.index += 1;
  }
  if (spawner.index >= spawner.queue.length) spawner.done = true;
}

export function countRemaining(spawner, enemies) {
  const queued = spawner ? spawner.queue.length - spawner.index : 0;
  const alive = enemies.filter((e) => !e.dead && !e.leaked).length;
  return queued + alive;
}
