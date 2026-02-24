# Tempo Forge

- Genre: Rhythm timing / forging (Canvas 2D)
- Core loop: cue-read-press-hold-release-judge-build-heat-forge-blades
- Session: ~2-5 minutes

## Controls
- Keyboard: hold/release `Space` on rhythm cues, `R` restart.
- Touch: hold/release `FORGE` button (or press directly on canvas), `RESTART` to restart.

## Gameplay Rules
- Follow pattern steps in order: `TAP`, `HOLD n`, `RELEASE`.
- Timing judgment uses a beat window; tighter hits give better score and combo.
- Keep forge heat up and integrity intact; misses damage integrity and reduce heat.
- Fill blade meter and finish patterns to forge blades and accelerate tempo.

## Improvements vs previous game (20260224-1601-tether-crash)
1. Replaced physics collision combat with deterministic rhythm windows (tap/hold/release), adding clearer skill measurement.
2. Added explicit pattern-memory + timing execution loop instead of freeform sling routing.
3. Added dual failure pressures (`heat decay` + `integrity`) for strategic pacing beyond single timer demolition.

## Lean Market Research
### Trends (3)
1. Browser rhythm games with short rounds and instant retry are favored for repeat sessions.
2. Press/hold/release mechanics improve expression on both keyboard and touch.
3. Clear judgment tiers (`Perfect/Great/Good/Miss`) correlate with stronger retention feedback loops.

### References (2)
1. itch.io HTML5 rhythm tag browsing patterns (short-run score attack loops).
2. CrazyGames music/rhythm category patterns (readable judgment feedback and escalating BPM pressure).

### Target Persona (1)
- A mobile+desktop commuter player who wants 3-minute high-focus runs with visible mastery progression.
