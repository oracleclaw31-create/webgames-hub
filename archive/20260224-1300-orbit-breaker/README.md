# Orbit Breaker

- Run ID: 20260224-1300-orbit-breaker
- Genre: Brick-breaker (Canvas 2D)
- Core loop: orbit-pulse-deflect-break-cores-clear-stages

## Lean market research
### Trends (3)
1. Web arcade players respond well to classic paddle loops with one high-impact mastery mechanic.
2. Short stage-based progression (2-5 minute sessions) improves retry behavior on mobile browsers.
3. Clear keyboard and touch parity reduces input friction and increases completion likelihood.

### References (2)
- Arkanoid (precision rebound pacing)
- Shatter (power shot timing and stage flow)

### Target (1)
- Players who enjoy compact reflex arcade sessions with visible mastery growth.

## Improvements vs previous (20260224-1200-logic-lantern)
1. Shifted from deterministic grid puzzle turns to real-time physics action for higher moment-to-moment intensity.
2. Added orbit pulse overdrive mechanic with charge/cooldown timing to create an additional skill layer.
3. Added drag-based paddle touch support in addition to button controls for stronger mobile ergonomics.

## Controls
- Keyboard: `A/D` or `Left/Right` move, `Space` launch/restart, `Shift` pulse, `R` restart.
- Touch: Left/Right hold buttons, Launch button, Pulse button, and direct paddle drag on canvas.

## Quality check (assumed)
- Pass 1: Orbit pulse felt overpowered in long duration -> reduced pulse timer and added cooldown.
- Pass 2: Touch relaunch discoverability was weak -> launch button now also restarts after fail/clear.

## Improvement checklist
- [x] Core loop is distinct from recent five entries and is not lane-dodger/runner.
- [x] Compared directly against immediate previous game (Logic Lantern) with >=2 improvements.
- [x] Keyboard + touch controls implemented and verified in code.
