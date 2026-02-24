# 20260224-2300-storm-salvager - Storm Salvager

## 1) Genre choice from recent 5
- Selected genre: **Survival arena (Canvas 2D)**
- Recent 5 core loops checked:
  - jump-dash-activate-relays-extract
  - escort-drone-seal-rifts-kite-fire-extract
  - push-crates-energize-switches-open-exit
  - charge-launch-angle-control-break-shield-waves
  - place-upgrade-switch-target-priority-hold-waves
- Chosen loop **move-sweep-emp-activate-beacons-survive** is non-duplicative.

## 2) Lean market research
### Trends (3)
1. 3~6분 생존형 세션이 웹 아케이드에서 재방문율이 높음.
2. 키보드+터치 동시 지원이 모바일/데스크톱 유지율 개선에 도움.
3. 단순 이동+스킬 쿨다운 운영 구조가 온보딩에 유리.

### References (2)
- Brotato류의 짧은 생존 루프
- Vampire Survivors류의 밀집 압박 회피 리듬

### Target (1)
- 짧고 반복 가능한 실시간 액션을 원하는 캐주얼/코어 중간층.

## 3) Implementation
- Canvas 2D only, no-build 정적 파일 구성.
- Keyboard: WASD/Arrow, Space(Sweep), Shift(EMP), E(Activate)
- Touch: D-pad + Sweep/EMP/Activate 버튼.

## 4) Quality checks (assumed 2 playtests)
- Pass 1: 조작/충돌/비컨 활성화/승패 판정 점검.
- Pass 2: 터치 패리티/EMP 쿨다운 가시성/HUD 가독성 점검.

## 5) Previous vs Current improvements
1. Iron Bulwark의 타워 배치 중심 루프에서 즉시 반응형 생존 액션으로 전환.
2. Sweep+EMP의 이중 능력 운용과 3개 비컨 활성화 멀티목표를 추가.

## 6) Paths
- Game folder: `/home/ubuntu/.openclaw/workspace/webgames-hub/games/20260224-2300-storm-salvager/`
- Thumbnail: `/home/ubuntu/.openclaw/workspace/webgames-hub/games/20260224-2300-storm-salvager/thumbnail.png`
- Report: `/home/ubuntu/.openclaw/workspace/webgames-hub/reports/20260224-2300-storm-salvager.md`

## 7) Summary lines
- EN: Storm Salvager is a Canvas 2D survival arena where players activate three beacons while balancing close-range sweep and EMP cooldown management.
- KR: Storm Salvager는 근접 스윕과 EMP 쿨다운을 운영하며 3개의 비컨을 활성화하는 Canvas 2D 생존 아레나 게임입니다.
