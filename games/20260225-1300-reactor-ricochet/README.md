# Reactor Ricochet

- Genre: Brick-breaker, Canvas 2D
- Core loop: `aim-deflect-break-shields-charge-pulse-clear-phases`

## Why this genre today
Recent run order was Tower defense lite -> Survival arena -> Platformer -> Top-down shooter -> Puzzle, so the next rotation slot is Brick-breaker.

## Controls
- Keyboard: `A/D` or `Left/Right` move paddle, `Space` launch, `Shift` pulse burst (when charged), `P` pause, `R` restart
- Touch: on-screen Left/Right movement buttons + Launch/Pulse/Pause/Restart buttons

## Lean market research
### Trends (3)
1. Layered brick durability (shield/armor) increases short-session challenge without complicating controls.
2. Skill abilities (charged burst, slow-time, magnet) improve replay depth in classic arcade loops.
3. Three-phase progression (instead of endless only) helps mobile users complete sessions in 3-6 minutes.

### References (2)
- DX-Ball style precision rebound pacing and lane-clearing satisfaction.
- Shatter-style phase transitions and shielded target readability.

### Target audience (1)
- Casual-to-midcore players age 13-39 seeking quick arcade mastery loops on desktop and mobile browsers.

## Improvements vs previous game (Signal Solder)
1. Deterministic tile-logic puzzle loop -> real-time reflex brick-breaker loop with active rebound control.
2. Added combo + charge-pulse ability layer (timing resource management) not present in previous puzzle.
3. Added timed multi-phase pressure and shielded bricks for pacing escalation beyond move-budget optimization.

## Playtest passes (assumed)
- Pass 1 (keyboard): cleared phase 1 and 2, pulse timing helped remove double-shield rows under timer pressure.
- Pass 2 (touch): completed phase 1; on-screen buttons and restart flow were responsive in mobile viewport.

## Improvement checklist
- [x] Canvas 2D only
- [x] Keyboard + touch controls
- [x] Non-duplicate core loop vs latest 5 entries
- [x] >=2 concrete improvements vs immediate previous game
- [x] Required artifacts included

## Known issues
- Ball reflection is deterministic but still angle-sensitive near paddle edges at high speed.
