# Reactor Drift

- Genre: Physics action (Canvas 2D)
- Core loop: `charge-tractor-sling-debris-chain-reactor-stabilize`

## Lean market research
### Trends (3)
1. Short-session physics skill games (2-5 min loops) perform well on browser portals.
2. Charge/release mechanics with visible risk-reward increase retention.
3. Keyboard + touch parity is now expected for frictionless web distribution.

### References (2)
- Orbital Bullet-style momentum readability (physics clarity)
- Nova Drift-style motion + reactive control mastery

### Target (1)
Desktop/mobile players who want intense 3-8 minute action runs with high mechanical expression.

## Controls
- Keyboard: WASD/Arrow move, Space hold charge, Shift sling, R restart.
- Touch: virtual stick + Charge + Sling buttons.

## Improvements vs previous (20260225-1815-quarantine-orbit)
1. Switched from swarm kiting survival to reactor stabilization via physics manipulation.
2. Added tractor charge + manual sling chain system (higher execution depth).
3. Added multi-reactor heat management objective instead of single survive pressure.

## Quality check (assumed 2 playtests)
- Pass 1: Tractor pull felt too weak at mid-range → increased pull scaling by charge.
- Pass 2: Early fail spikes from heat snowballing → added stability bonus window (+3s) to allow recovery.

## Files
- `index.html`, `style.css`, `script.js`, `thumbnail.png`, `RESULT.txt`
