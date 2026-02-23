# Overclock Outpost

Canvas 2D tower-defense-lite game with keyboard and touch support.

## Run Info
- Run ID: `20260224-0601-overclock-outpost`
- Genre: Tower defense lite
- Core loop: `place-aim-manage-heat-overclock-vent-hold-wave`

## Controls
- Keyboard: `Arrow Keys/WASD` move build cursor, `Space` build/sell, `E` overclock selected turret, `Q` vent selected turret, `Enter` start wave, `R` restart.
- Touch: Tap canvas cell to select, use movement arrows, and tap action buttons (`Build/Sell`, `Overclock`, `Vent`, `Start Wave`, `Restart`).

## Why this genre now
Based on the latest 5 entries in `games.json`, the cycle after brick-breaker prioritizes tower defense lite. This implementation avoids recent loop duplication by emphasizing active thermal management (overclock + manual vent) instead of lane-only economy defense.

## Improvements vs previous game (`20260224-0500-flux-bricks`)
1. Added strategic pre-wave planning and sustained wave management instead of single-ball rebound flow.
2. Added a new heat system with risk/reward overclock decisions and manual vent recovery.
3. Added touch action panel with discrete tactical commands plus cursor movement support.

## Lean market research
### Trend points (3)
1. Hybrid strategy loops with one active intervention mechanic improve engagement in short browser sessions.
2. Defensive games with clear between-wave preparation windows are easier to onboard on mobile web.
3. Resource pressure + visible system state (like heat bars) increases replay through decision-driven failures.

### References (2)
- **Bloons TD 6** (clear wave pacing and readable tower interactions).
- **Kingdom Rush** (compact tactical decision density and upgrade timing).

### Target audience (1)
- Players who enjoy tactical wave defense with short 3-8 minute sessions and direct intervention moments.

## Playtest process (assumed 2 passes)
- Pass 1 (keyboard): build placement validation, wave start/completion flow, overclock/vent effectiveness.
- Pass 2 (touch): cell selection accuracy, touch button responsiveness, repeated movement button hold behavior.

## Improvement checklist
- [x] Distinct core loop vs recent five entries.
- [x] At least 2 improvements over previous game.
- [x] Keyboard and touch controls implemented.
