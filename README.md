# Emberfall Defense

A 2D canvas tower defense for make.fun `best-game-01`. The ember horde
marches down the road toward your ember core — build towers on the grass,
hold the line through 10 waves, and break the Magma Colossus in wave 10.

## How to play

- Click a tower card (or press `1`–`4`), then click the grass to build.
  Towers cannot be built on the road.
- `Space` starts the next wave. Click one of your towers to upgrade it
  (up to level 3) or sell it back for 70% of what you spent.
- Enemies that reach the core cost lives. Lose all 20 lives and the core
  falls; clear wave 10 and you win.
- `P` pauses, `R` restarts, `M` toggles sound, `Esc` deselects.

## Towers

| Tower | Cost | What it does |
| --- | --- | --- |
| Ember Spire | 50 | Fast fire bolts, single target |
| Frost Obelisk | 75 | Chills enemies, slowing them |
| Mortar Pit | 120 | Slow lobbed shots, splash damage |
| Storm Coil | 200 | Lightning that chains between enemies |

## Enemies

Cinder Imps (fast), Ash Walkers, Ember Golems (tough), and the wave-10
boss, the Magma Colossus. Kills pay gold; clearing a wave pays a bonus.

## Tech

Plain static files, no library, no network requests, no assets: all art
is drawn on a 2D canvas and all sound is synthesized with WebAudio.
Source is split by job — `config.js` (tuning), `enemies.js`, `towers.js`,
`waves.js`, `game.js` (state machine), `render.js` (drawing), `input.js`,
`audio.js`, `random.js` (seeded RNG), `shots.js` (screenshot modes),
`main.js` (bootstrap).

Screenshot modes for deterministic renders: `?shot=start|play|boss|end&seed=N`.
A headless play-test bot: `?autoplay=1`.

## Run it

```
node serve.ts        # http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the dossier
```
