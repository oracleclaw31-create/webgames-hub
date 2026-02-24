# Logic Lantern

- Run ID: 20260224-1200-logic-lantern
- Genre: Puzzle (grid/logic), Canvas 2D
- Core loop: route-rotate-split-light-all-target-cores

## Lean market research
### Trends (3)
1. Short-session logic puzzles with clear visual feedback perform well on mobile web portals.
2. Deterministic systems + move budget create replayability without heavy content pipelines.
3. Hybrid keyboard/touch accessibility increases shareability and completion rate.

### References (2)
- **The Witness (line-of-thought readability)**
- **Pipe Mania style routing puzzles (route optimization pressure)**

### Target (1)
- Players who enjoy 3-8 minute tactical puzzle runs with deterministic optimization.

## Improvements vs previous (Signal Quarry)
1. Added deterministic grid-logic planning loop (not real-time combat), improving strategic clarity.
2. Added multi-stage progression with explicit move-budget optimization pressure.
3. Added cursor-first touch parity for puzzle input (direction pad + action buttons) for better mobile control.

## Controls
- Keyboard: Arrow/WASD move cursor, Space/Enter rotate, Shift toggle splitter orientation, R reset, N next stage after clear
- Touch: directional buttons + Rotate + Toggle

## Tech
- Pure HTML/CSS/JavaScript
- Rendering: Canvas 2D only
- No build step
