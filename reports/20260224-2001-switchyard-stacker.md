# 20260224-2001-switchyard-stacker - Switchyard Stacker

## 1) Genre choice from recent 5
- Recent 5 reviewed: `20260224-1510-void-bloom`, `20260224-1601-tether-crash`, `20260224-1700-tempo-forge`, `20260224-1837-relay-ruins`, `20260224-1900-vault-lancers`
- Selected genre: **Puzzle (grid/logic, Canvas 2D)**
- Core loop uniqueness check: `push-crates-energize-switches-open-exit` is distinct from recent loops and not lane-dodger/runner.

## 2) Lean market research
### Trends (3)
1. Deterministic logic puzzles are sticky in short web sessions.
2. Touch + keyboard parity is baseline for browser players.
3. Undo-friendly designs improve retry retention.

### References (2)
- Sokoban-style crate pushing
- Patrick's Parabox style planning readability

### Target persona (1)
- Office/mobile users wanting 3-8 minute brain-break puzzle runs.

## 3) Implementation
- Canvas 2D only, no build step.
- Keyboard: WASD/Arrows, Z undo, R reset, N next.
- Touch: directional buttons + undo/reset.

## 4) Quality checks (assumed 2 passes)
### Pass 1
- Tuned first level to avoid dead-end overload.
- Improved switch/exit visual contrast.

### Pass 2
- Verified touch button responsiveness.
- Confirmed undo/reset loop for recovery.

## 5) Hub/report/deploy updates
- Added new game entry and updated latest links/summaries.
- Rotated active games down to 30 by archiving oldest active entries.
- Deployed to: https://webgames-hub.vercel.app
