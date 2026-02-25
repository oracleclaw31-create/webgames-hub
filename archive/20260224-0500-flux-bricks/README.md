# Flux Bricks

Canvas 2D brick-breaker with keyboard and touch parity.

## Run Info
- Run ID: `20260224-0500-flux-bricks`
- Genre: Brick-breaker
- Core loop: `position-pulse-curve-break-chain-clear-stage`

## Controls
- Keyboard: `Arrow Left/Right` (or `A/D`) move, `Space` magnet pulse, `R` restart.
- Touch: Left/Right hold buttons, Magnet pulse button, Restart button, optional paddle drag on canvas.

## Why this genre now
Last 5 entries in `games.json` include platformer/top-down shooter/puzzle-rhythm/tower-defense loops. This run picks brick-breaker with a curve-control skill layer and avoids lane-dodger/runner continuity.

## Improvements vs previous game (`20260224-0400-lumen-lock`)
1. Added continuous physics-based action with analog paddle positioning instead of discrete tile cursor navigation.
2. Added real-time magnet pulse cooldown skill expression and combo-based score pressure for deeper replay.
3. Added direct dual touch model (buttons + drag) for stronger mobile ergonomics.

## Lean market research
### Trend points (3)
1. Hybrid casual action loops with one advanced mechanic improve retention in short web sessions.
2. Touch-first overlays plus optional drag controls reduce mobile control friction.
3. High-clarity score/chaining feedback supports repeat attempts in 2-5 minute play windows.

### References (2)
- **Arkanoid** (paddle precision and rebound mastery).
- **Peggle** (shot shaping and combo excitement feel).

### Target audience (1)
- Players who want fast arcade runs with clear mastery progression on desktop and mobile.

## Playtest process (assumed 2 passes)
- Pass 1 (keyboard): movement responsiveness, rebound readability, cooldown timing, stage clear progression.
- Pass 2 (touch): hold buttons reliability, drag override behavior, restart accessibility, HUD legibility.

## Improvement checklist
- [x] Distinct core loop vs recent five entries.
- [x] Two-plus improvements over immediately previous game.
- [x] Keyboard and touch controls both verified in implementation.
