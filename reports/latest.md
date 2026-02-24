# 20260225-0600-ember-brick

## Genre
Brick-breaker, Canvas 2D

## Core loop
steer-deflect-charge-overdrive-break-sectors

## Recent-5 constraint analysis
Recent five loops:
1. swing-flip-polarity-collide-shatter-maintain-control
2. read-cue-time-lane-hits-build-focus-maintain-stability
3. run-jump-grapple-route-relic-extract
4. sweep-shoot-rescue-escort-extract
5. push-rotate-route-power-core-exit

New loop is rebound-based paddle action with overdrive resource timing, non-duplicate and not lane-dodger/runner.

## Lean market research
- Trends (3): short-session arcade replay loops, classic+modern modifier hybrids, touch parity UX.
- References (2): Shatter, Arkanoid.
- Target (1): 15-35 players seeking 2-6 minute score-chasing runs.

## Quality check (assumed 2 playtests)
- Pass 1: keyboard responsiveness, combo/overdrive loop, state transitions.
- Pass 2: touch hold-and-action reliability, HUD readability on mobile.

Checklist:
- [x] Canvas 2D only
- [x] Keyboard controls
- [x] Touch controls
- [x] 2+ improvements vs previous
- [x] Recent-5 core loop non-duplicate
