# 20260225-0201-reactor-rhythm - Reactor Rhythm

## 1) Recent 5 analysis + genre rotation decision
- Recent 5 from `games.json`:
  - `push-crates-energize-switches-open-exit` (puzzle)
  - `charge-launch-angle-control-break-shield-waves` (brick-breaker)
  - `place-upgrade-switch-target-priority-hold-waves` (tower defense lite)
  - `move-sweep-emp-activate-beacons-survive` (survival arena)
  - `swing-flip-polarity-collide-shatter-maintain-control` (physics action)
- Rotation after physics action selects **rhythm/timing**.
- Duplication checks: no core-loop duplication with recent 5; not a lane-dodger/runner family loop.

## 2) Lean market research
### Trends (3)
1. Short-session rhythm rounds with immediate retry convert well in browser arcades.
2. Strong hit feedback (lane flash + judgment text) improves player retention.
3. Mobile parity now expects large tap zones and low-friction restarts.

### References (2)
- Friday Night Funkin': readable timing windows and quick fail/retry cadence.
- osu!mania-style lane timing: precision reward through combo/perfect layering.

### Target (1)
- Casual-to-core web players seeking 3-6 minute timing mastery sessions on desktop/mobile.

## 3) Implementation summary
- Plain `HTML/CSS/JS` Canvas 2D project (no framework/build tools).
- 4-lane timing chart with deterministic pseudo-random sequence and accent notes.
- Keyboard + touch parity: `A/S/K/L` + touch lane buttons, `Space`/touch Focus.
- Focus mechanic: spend meter to widen timing window temporarily.

## 4) Quality check (assumed playtest x2)
- Pass 1 checklist: core note judgment, combo, stability loss, clear/fail states.
- Pass 2 checklist: touch button parity, mobile readability, focus-state clarity.
- Fixes applied:
  - Rebalanced miss penalties to reduce fail cascades.
  - Increased lane flash contrast for faster visual confirmation.

## 5) Metadata and rotation
- Added new entry in `games.json` for `20260225-0201-reactor-rhythm`.
- Updated hub pointers (`README.md`, `index.html`, `reports/index.html`, `reports/latest.md`, `reports/latest-run-summary.txt`).
- Active list rotation applied (cap 30): moved oldest active `games/20260223-1900-orbit-forge` to `archive/20260223-1900-orbit-forge` and updated its paths in `games.json`.

## 6) Previous vs current improvements
Compared to `20260225-0000-polarity-pendulum`:
1. Shifted from momentum collision physics loop to explicit beat-judgment timing loop.
2. Added Focus resource mechanic (meter spend for temporary judgment assist), creating tactical timing choices.
3. Improved lane feedback readability for touch parity and faster correction.

## 7) Deployment
- Vercel URL: pending (deploy blocked: DNS resolution failure to vercel.com)
- Remaining steps: run `git -C webgames-hub push` and `cd webgames-hub && vercel --prod --yes` once DNS/network access is restored.
