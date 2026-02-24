# Tether Crash

- Genre: Physics action (Canvas 2D)
- Core loop: thrust-hook-sling-impact-detonate-before-timeout
- Session: ~2-4 minutes

## Controls
- Keyboard: `WASD` or `Arrow Keys` move thrust, hold `Space` grapple, hold `Shift` brake, `R` restart after fail/clear.
- Touch: drag on canvas to thrust direction, hold `GRAPPLE` to tether, hold `BRAKE` to damp speed.

## Rules
- Destroy all unstable cores before timer hits 0.
- High-speed collision deals heavy core damage but also hurts player HP.
- Grapple to anchors or nearby cores to sling into better impact lines.

## Improvements vs previous game (Void Bloom)
1. Added rope-spring tether physics with dynamic lock points (anchors and moving cores) instead of free-kite loop.
2. Collision damage now depends on relative impact speed, creating risk/reward momentum combat.
3. Objective is deterministic core demolition under timer pressure rather than endless wave outscaling.
