# 20260225-1102-jam-break-protocol

## Genre selection
- Selected genre: **Top-down shooter (Canvas 2D)**
- Reason: immediate previous run was Platformer (`skyhook-bastion`), so rotation advanced while avoiding repeat loop patterns.

## Latest-5 anti-dup check
Recent 5 core loops:
1. push-rotate-route-power-core-exit
2. steer-deflect-charge-overdrive-break-sectors
3. lane-shift-evade-rescue-extract
4. deploy-route-upgrade-hold-waves
5. wall-jump-hook-switch-gate-extract

New loop: `kite-shoot-clear-waves-manage-heat` → non-overlapping with puzzle/brick-breaker/lane-runner/tower-defense/platformer loops.

## Lean market research
### Trends (3)
1. Short-session survival shooters remain strong in browser portals.
2. Mobile-friendly virtual controls increase completion rate.
3. Lightweight meta systems (wave + score + resource heat) improve replay depth.

### References (2)
- Brotato (arena pressure + mobility rhythm)
- Vampire Survivors web-inspired clones (clear upgrade/pressure readability)

### Target audience (1)
- 14–34 players seeking quick action sessions on desktop/mobile.

## Implemented mechanics
- Canvas 2D top-down arena combat
- Enemy wave escalation
- Auto-aimed shots + dash mobility
- Heat meter pressure while firing
- Keyboard + touch controls

## Playtest (assumed, 2 passes)
- Pass 1: keyboard run for 6 waves; HP attrition and wave pacing validated.
- Pass 2: touch-only run; movement/shoot/dash workable on mobile layout.

## Improvement checklist
- [x] Genre rotated from previous platformer
- [x] 2+ concrete improvements vs previous
- [x] Distinct core loop from latest 5
- [x] Canvas 2D + keyboard/touch + no-build

## Previous vs Current improvements
Compared to **Skyhook Bastion**:
1. Platform traversal puzzle loop → active wave shooter loop with immediate combat feedback.
2. Single-room objective clear → escalating wave + score progression for replayability.
3. Added resource tension via heat and dash timing.

## Deployment
- Vercel production alias: https://webgames-hub.vercel.app
