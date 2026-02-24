# Pulse Bastion

Canvas 2D tower defense lite where you place/upgrade towers between waves, then defend a single pressure lane.

## Controls
- Keyboard: WASD/Arrow move cursor, Space place, U upgrade, X sell, Enter start wave, R restart.
- Touch: tap grid to place/select, on-screen buttons for place/upgrade/sell/start/restart.

## Core loop
**plan-place-upgrade-hold-lane-economy-cycle**

## Improvements vs Hazard Serve
1. Real strategy layer (build phase + economy + tower upgrades) instead of paddle-only reflex play.
2. Explicit keyboard/touch parity for all management actions (place/upgrade/sell/start).
3. Longer session arc through 6-wave progression with fail-state on lane leaks.
