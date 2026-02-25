# Signal Solder

- Genre: Puzzle (grid/logic), Canvas 2D
- Core loop: `select-rotate-lock-synchronize-relays-within-move-budget`

## Why this genre today
Recent run order was Brick-breaker -> Tower defense lite -> Survival arena -> Platformer -> Top-down shooter, so the next priority slot is Puzzle (grid/logic).

## Controls
- Keyboard: Arrow/WASD move cursor, `Space/Enter` rotate tile, `Q` lock/unlock tile, `U` undo, `R` reset, `N` new board
- Touch: tap tile to rotate and move cursor, tap selected tile to lock/unlock, on-screen Undo/Reset/New buttons

## Lean market research
### Trends (3)
1. Short deterministic puzzle rounds (2-5 minutes) improve session completion on web portals.
2. Daily-repeat puzzle formats with best-score tracking increase return visits.
3. Touch-first single-tap interactions outperform drag-heavy controls on mobile browsers.

### References (2)
- Pipe Mania style connection puzzles (clarity of route-completion feedback)
- Railbound style move-efficiency goals (planning depth with minimal inputs)

### Target audience (1)
- Players age 15-40 who want low-stress, planning-focused web gameplay on both desktop and mobile.

## Improvements vs previous game (Jam Break Protocol)
1. Switched from twitch shooter + heat pressure to deterministic logic planning with full Undo/Reset support.
2. Added explicit move-budget optimization and best-score memory for puzzle mastery progression.
3. Lower input complexity for touch users (single-tap loop) while retaining keyboard parity.

## Playtest passes (assumed)
- Pass 1: keyboard-only clear in 21 moves; lock mechanic prevented accidental rotations in late board state.
- Pass 2: touch-only clear in 27 moves; tile tap targeting and button hit areas were stable on mobile viewport.

## Improvement checklist
- [x] Canvas 2D only
- [x] Keyboard + touch controls
- [x] Non-duplicate core loop vs latest 5 entries
- [x] >=2 concrete improvements vs immediate previous game
- [x] Required artifacts included

## Known issues
- Puzzle board uses one topology template with randomized rotation, so long-term variety is moderate.
