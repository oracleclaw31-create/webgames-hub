# Circuit Weaver

Canvas 2D grid-logic puzzle. Rotate pipe tiles to connect the source to all three target terminals before the move limit expires.

## Controls
- Keyboard: Arrow keys or WASD move cursor, `Space` or `R` rotate tile, `Enter` continue after clear, `Esc` restart level.
- Touch: Tap a tile to select/rotate, or use on-screen Up/Down/Left/Right + Rotate + Restart buttons.

## Core Loop
1. Inspect current wiring state and powered terminals.
2. Move cursor to a key tile.
3. Rotate tile to alter current routing.
4. Clear all terminals before moves reach zero.
5. Progress through 3 levels; failure restarts current level.

## Tech
- HTML
- CSS
- Vanilla JavaScript
- Canvas 2D only
