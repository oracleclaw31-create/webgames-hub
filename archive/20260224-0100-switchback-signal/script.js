(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");

  const buttons = {
    left: document.getElementById("leftBtn"),
    right: document.getElementById("rightBtn"),
    jump: document.getElementById("jumpBtn"),
    dash: document.getElementById("dashBtn"),
    act: document.getElementById("actBtn")
  };

  const WORLD_W = 2460;
  const FLOOR_Y = 500;
  const GRAVITY = 2000;

  const state = {
    keys: {
      left: false,
      right: false,
      jump: false,
      dash: false,
      action: false
    },
    player: null,
    cameraX: 0,
    relays: [],
    platforms: [],
    drones: [],
    spikes: [],
    crumbleBlocks: [],
    timer: 0,
    bestTime: Infinity,
    running: true,
    win: false,
    message: ""
  };

  function makePlayer() {
    return {
      x: 70,
      y: 420,
      w: 30,
      h: 42,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      dashTimer: 0,
      dashCooldown: 0,
      actionHeld: false,
      respawnX: 70,
      respawnY: 420
    };
  }

  function initWorld() {
    state.player = makePlayer();
    state.timer = 0;
    state.running = true;
    state.win = false;
    state.message = "Activate 3 relays, then enter the open hatch.";

    state.platforms = [
      { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
      { x: 250, y: 440, w: 140, h: 18 },
      { x: 460, y: 388, w: 120, h: 18 },
      { x: 660, y: 340, w: 160, h: 18 },
      { x: 920, y: 390, w: 140, h: 18 },
      { x: 1120, y: 334, w: 130, h: 18 },
      { x: 1360, y: 402, w: 120, h: 18 },
      { x: 1570, y: 352, w: 140, h: 18 },
      { x: 1810, y: 304, w: 120, h: 18 },
      { x: 2040, y: 378, w: 150, h: 18 },
      { x: 2270, y: 440, w: 150, h: 18 }
    ];

    state.crumbleBlocks = [
      { x: 760, y: 284, w: 90, h: 14, active: true, timer: 0, cooldown: 0 },
      { x: 1680, y: 250, w: 90, h: 14, active: true, timer: 0, cooldown: 0 }
    ];

    state.relays = [
      { x: 530, y: 350, active: false, charge: 0 },
      { x: 1210, y: 296, active: false, charge: 0 },
      { x: 2100, y: 340, active: false, charge: 0 }
    ];

    state.drones = [
      { x: 980, y: 250, r: 14, minX: 920, maxX: 1190, vx: 90 },
      { x: 1900, y: 220, r: 14, minX: 1760, maxX: 2180, vx: -105 }
    ];

    state.spikes = [
      { x: 690, y: 500, w: 100, h: 18 },
      { x: 1460, y: 500, w: 110, h: 18 },
      { x: 2180, y: 500, w: 120, h: 18 }
    ];
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRectHit(circle, rect) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function activePlatforms() {
    const out = state.platforms.slice();
    for (let i = 0; i < state.crumbleBlocks.length; i += 1) {
      const c = state.crumbleBlocks[i];
      if (c.active) {
        out.push({ x: c.x, y: c.y, w: c.w, h: c.h });
      }
    }
    return out;
  }

  function respawn() {
    const p = state.player;
    p.x = p.respawnX;
    p.y = p.respawnY;
    p.vx = 0;
    p.vy = 0;
    p.dashTimer = 0;
    p.dashCooldown = 0.2;
    state.message = "Signal loss. Respawned at checkpoint.";
  }

  function updatePlayer(dt) {
    const p = state.player;
    const moveSpeed = 250;

    if (state.keys.left) {
      p.vx = -moveSpeed;
      p.facing = -1;
    } else if (state.keys.right) {
      p.vx = moveSpeed;
      p.facing = 1;
    } else {
      p.vx *= 0.74;
      if (Math.abs(p.vx) < 4) {
        p.vx = 0;
      }
    }

    if (state.keys.jump) {
      p.jumpBuffer = 0.12;
    } else {
      p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    }

    p.coyote = p.onGround ? 0.1 : Math.max(0, p.coyote - dt);

    if (p.jumpBuffer > 0 && p.coyote > 0) {
      p.vy = -660;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuffer = 0;
    }

    if (state.keys.dash && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      p.dashTimer = 0.14;
      p.dashCooldown = 0.8;
      p.vy = Math.min(p.vy, 40);
    }

    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = p.facing * 610;
      p.vy *= 0.65;
    } else {
      p.vy += GRAVITY * dt;
    }

    p.dashCooldown = Math.max(0, p.dashCooldown - dt);

    p.x += p.vx * dt;
    const plats = activePlatforms();
    for (let i = 0; i < plats.length; i += 1) {
      const plat = plats[i];
      if (overlap(p, plat)) {
        if (p.vx > 0) {
          p.x = plat.x - p.w;
        } else if (p.vx < 0) {
          p.x = plat.x + plat.w;
        }
        p.vx = 0;
      }
    }

    p.y += p.vy * dt;
    p.onGround = false;
    for (let i = 0; i < plats.length; i += 1) {
      const plat = plats[i];
      if (!overlap(p, plat)) {
        continue;
      }
      if (p.vy >= 0 && p.y + p.h - p.vy * dt <= plat.y + 8) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
      } else if (p.vy < 0) {
        p.y = plat.y + plat.h;
        p.vy = 25;
      }
    }

    p.x = Math.max(0, Math.min(WORLD_W - p.w, p.x));

    if (p.y > canvas.height + 120) {
      respawn();
    }

    for (let i = 0; i < state.spikes.length; i += 1) {
      if (overlap(p, state.spikes[i])) {
        respawn();
        break;
      }
    }

    for (let i = 0; i < state.drones.length; i += 1) {
      const d = state.drones[i];
      if (circleRectHit(d, p)) {
        respawn();
        break;
      }
    }
  }

  function updateCrumble(dt) {
    const p = state.player;
    for (let i = 0; i < state.crumbleBlocks.length; i += 1) {
      const c = state.crumbleBlocks[i];
      if (!c.active) {
        c.cooldown = Math.max(0, c.cooldown - dt);
        if (c.cooldown <= 0) {
          c.active = true;
        }
        continue;
      }
      const topRect = { x: c.x, y: c.y - 2, w: c.w, h: c.h + 4 };
      if (overlap(p, topRect) && p.onGround) {
        c.timer += dt;
        if (c.timer > 0.45) {
          c.active = false;
          c.timer = 0;
          c.cooldown = 2.3;
        }
      } else {
        c.timer = Math.max(0, c.timer - dt * 1.4);
      }
    }
  }

  function updateDrones(dt) {
    for (let i = 0; i < state.drones.length; i += 1) {
      const d = state.drones[i];
      d.x += d.vx * dt;
      if (d.x < d.minX) {
        d.x = d.minX;
        d.vx = Math.abs(d.vx);
      }
      if (d.x > d.maxX) {
        d.x = d.maxX;
        d.vx = -Math.abs(d.vx);
      }
    }
  }

  function updateRelays(dt) {
    const p = state.player;
    let nearRelay = null;
    for (let i = 0; i < state.relays.length; i += 1) {
      const r = state.relays[i];
      const dx = (p.x + p.w * 0.5) - r.x;
      const dy = (p.y + p.h * 0.5) - r.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 72 && !r.active) {
        nearRelay = r;
        break;
      }
    }

    if (nearRelay && state.keys.action) {
      nearRelay.charge += dt;
      if (nearRelay.charge >= 0.85) {
        nearRelay.active = true;
        nearRelay.charge = 1;
        state.message = "Relay stabilized.";
      }
    } else if (nearRelay && !state.keys.action) {
      nearRelay.charge = Math.max(0, nearRelay.charge - dt * 0.6);
    }
  }

  function exitOpen() {
    for (let i = 0; i < state.relays.length; i += 1) {
      if (!state.relays[i].active) {
        return false;
      }
    }
    return true;
  }

  function update(dt) {
    if (!state.running) {
      return;
    }
    state.timer += dt;
    updatePlayer(dt);
    updateCrumble(dt);
    updateDrones(dt);
    updateRelays(dt);

    const p = state.player;
    const open = exitOpen();
    const exitRect = { x: 2360, y: 398, w: 62, h: 102 };
    if (open && overlap(p, exitRect)) {
      state.running = false;
      state.win = true;
      state.bestTime = Math.min(state.bestTime, state.timer);
      state.message = "Extraction complete. Press R to run again.";
    }

    state.cameraX = Math.max(0, Math.min(WORLD_W - canvas.width, p.x - canvas.width * 0.45));
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#12304f");
    g.addColorStop(1, "#081421");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.07)";
    for (let i = 0; i < 16; i += 1) {
      const x = ((i * 170 - state.cameraX * 0.35) % (canvas.width + 220)) - 110;
      const y = 50 + (i % 5) * 24;
      ctx.fillRect(x, y, 80, 4);
    }
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(-state.cameraX, 0);

    for (let i = 0; i < state.platforms.length; i += 1) {
      const p = state.platforms[i];
      ctx.fillStyle = p.y >= FLOOR_Y ? "#18324a" : "#30587e";
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    for (let i = 0; i < state.crumbleBlocks.length; i += 1) {
      const c = state.crumbleBlocks[i];
      if (!c.active) {
        continue;
      }
      const alpha = 1 - Math.min(0.8, c.timer * 1.5);
      ctx.fillStyle = `rgba(255, 188, 120, ${alpha.toFixed(3)})`;
      ctx.fillRect(c.x, c.y, c.w, c.h);
    }

    for (let i = 0; i < state.spikes.length; i += 1) {
      const s = state.spikes[i];
      ctx.fillStyle = "#ff6f86";
      const spikes = Math.floor(s.w / 12);
      for (let j = 0; j < spikes; j += 1) {
        const sx = s.x + j * 12;
        ctx.beginPath();
        ctx.moveTo(sx, s.y);
        ctx.lineTo(sx + 6, s.y - s.h);
        ctx.lineTo(sx + 12, s.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    for (let i = 0; i < state.drones.length; i += 1) {
      const d = state.drones[i];
      ctx.fillStyle = "#ffb454";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#411";
      ctx.stroke();
    }

    for (let i = 0; i < state.relays.length; i += 1) {
      const r = state.relays[i];
      ctx.fillStyle = r.active ? "#8cf4d6" : "#6d89a5";
      ctx.fillRect(r.x - 14, r.y - 42, 28, 42);
      ctx.fillStyle = "#0e2235";
      ctx.fillRect(r.x - 10, r.y - 38, 20, 18);
      if (!r.active && r.charge > 0) {
        ctx.fillStyle = "#8cf4d6";
        ctx.fillRect(r.x - 10, r.y - 18, 20 * r.charge, 5);
      }
    }

    const exitIsOpen = exitOpen();
    ctx.fillStyle = exitIsOpen ? "#8cf4d6" : "#59728f";
    ctx.fillRect(2360, 398, 62, 102);
    ctx.fillStyle = exitIsOpen ? "#102d2f" : "#1d2934";
    ctx.fillRect(2378, 432, 24, 34);

    const p = state.player;
    ctx.fillStyle = p.dashTimer > 0 ? "#fff5aa" : "#d7f0ff";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#234760";
    ctx.fillRect(p.x + (p.facing > 0 ? 18 : 6), p.y + 12, 7, 7);

    ctx.restore();
  }

  function medalText() {
    if (!state.win) {
      return "-";
    }
    if (state.timer < 52) {
      return "S";
    }
    if (state.timer < 70) {
      return "A";
    }
    return "B";
  }

  function drawHud() {
    const activeCount = state.relays.filter((r) => r.active).length;
    const status = state.running ? "RUNNING" : (state.win ? "CLEAR" : "STOP");
    hud.textContent = `Relays ${activeCount}/3 | Time ${state.timer.toFixed(1)}s | Best ${Number.isFinite(state.bestTime) ? `${state.bestTime.toFixed(1)}s` : "-"} | Medal ${medalText()} | Dash CD ${state.player.dashCooldown.toFixed(2)} | ${status} | ${state.message}`;
  }

  function draw() {
    drawSky();
    drawWorld();

    if (!state.running && state.win) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(260, 180, 440, 170);
      ctx.strokeStyle = "#8cf4d6";
      ctx.strokeRect(260, 180, 440, 170);
      ctx.fillStyle = "#dff8ef";
      ctx.font = "32px Trebuchet MS, sans-serif";
      ctx.fillText("Signal Restored", 352, 236);
      ctx.font = "20px Trebuchet MS, sans-serif";
      ctx.fillText(`Time ${state.timer.toFixed(1)}s  Medal ${medalText()}`, 350, 275);
      ctx.fillText("Press R or tap Activate to restart", 305, 312);
    }

    drawHud();
  }

  function setButtonState(name, on) {
    state.keys[name] = on;
    const btn = buttons[name === "action" ? "act" : name];
    if (btn) {
      btn.classList.toggle("on", on);
    }
  }

  function bindTouchButton(btn, key, hold = true) {
    const press = (ev) => {
      ev.preventDefault();
      if (!state.running && key === "action") {
        initWorld();
        return;
      }
      setButtonState(key, true);
      if (!hold) {
        setTimeout(() => setButtonState(key, false), 110);
      }
    };

    const release = (ev) => {
      ev.preventDefault();
      if (hold) {
        setButtonState(key, false);
      }
    };

    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("pointerleave", release);
  }

  window.addEventListener("keydown", (ev) => {
    if (ev.repeat) {
      return;
    }
    if (ev.key === "a" || ev.key === "ArrowLeft") {
      setButtonState("left", true);
    } else if (ev.key === "d" || ev.key === "ArrowRight") {
      setButtonState("right", true);
    } else if (ev.key === " " || ev.key === "w" || ev.key === "ArrowUp") {
      setButtonState("jump", true);
    } else if (ev.key === "Shift") {
      setButtonState("dash", true);
    } else if (ev.key === "e") {
      setButtonState("action", true);
    } else if (ev.key === "r") {
      initWorld();
    }
  });

  window.addEventListener("keyup", (ev) => {
    if (ev.key === "a" || ev.key === "ArrowLeft") {
      setButtonState("left", false);
    } else if (ev.key === "d" || ev.key === "ArrowRight") {
      setButtonState("right", false);
    } else if (ev.key === " " || ev.key === "w" || ev.key === "ArrowUp") {
      setButtonState("jump", false);
    } else if (ev.key === "Shift") {
      setButtonState("dash", false);
    } else if (ev.key === "e") {
      setButtonState("action", false);
    }
  });

  bindTouchButton(buttons.left, "left", true);
  bindTouchButton(buttons.right, "right", true);
  bindTouchButton(buttons.jump, "jump", false);
  bindTouchButton(buttons.dash, "dash", false);
  bindTouchButton(buttons.act, "action", true);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  initWorld();
  requestAnimationFrame(frame);
})();
