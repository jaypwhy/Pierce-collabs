/**
 * Sip Drip — the 8-bit clicker engine. Plain canvas, no framework, no local score.
 *
 * The engine owns pixels, sound and input; the React route owns the network and
 * feeds every server snapshot back in through `setSnapshot`, so the number on
 * screen is always the UPayU bridge's number.
 */
import { piAlgoDollars } from "./upayu";
import type { Snapshot } from "./upayu";

const VIEW_W = 240;
const VIEW_H = 150;

/** Points a single SIP is worth. The bridge clamps and records it. */
export const SIP_POINTS = 5;

/** Fallback rungs while the bridge has not answered yet — the same Pi Algo rungs. */
const FALLBACK_LADDER = [1, 10, 100, 1000].map((points) => ({
  points,
  dollars: piAlgoDollars(points),
}));

type Popup = {
  x: number;
  y: number;
  life: number;
  max: number;
  text: string;
  color: string;
  size: number;
};

type Bubble = { x: number; y: number; speed: number };

export type SipDripHandlers = {
  onSip: () => void;
  onDrip: () => void;
};

export type SipDripGame = {
  setSnapshot: (snapshot: Snapshot) => void;
  tapSip: () => void;
  tapDrip: () => void;
  flash: (message: string, ok?: boolean) => void;
  destroy: () => void;
};

/* ------------------------------------------------------------------ sound */

let muted = false;
export function setMuted(value: boolean): void {
  muted = value;
}

let audioCtx: AudioContext | null = null;

function getAudio(): AudioContext | null {
  if (typeof window === "undefined" || muted) return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function beep(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "square",
  vol = 0.045,
): void {
  const ac = getAudio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function sipSound(): void {
  beep(720 + Math.random() * 90, 0, 0.05, "square", 0.035);
  beep(1080, 0.03, 0.05, "square", 0.02);
}

function dripSound(): void {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => beep(n, i * 0.055, 0.07, "triangle", 0.05));
}

function errorSound(): void {
  beep(150, 0, 0.13, "sawtooth", 0.04);
  beep(110, 0.12, 0.12, "sawtooth", 0.04);
}

/* ----------------------------------------------------------------- engine */

const CUP = { x: 100, y: 24, w: 40, h: 48 };

const SIP_BTN = { x: 8, y: 84, w: 132, h: 24 };
const DRIP_BTN = { x: 148, y: 84, w: 84, h: 24 };

export function createSipDripGame(
  canvas: HTMLCanvasElement,
  handlers: SipDripHandlers,
): SipDripGame {
  const buffer = document.createElement("canvas");
  buffer.width = VIEW_W;
  buffer.height = VIEW_H;
  const ctx = buffer.getContext("2d");
  const display = canvas.getContext("2d");
  if (!ctx || !display) {
    return {
      setSnapshot: () => undefined,
      tapSip: () => undefined,
      tapDrip: () => undefined,
      flash: () => undefined,
      destroy: () => undefined,
    };
  }

  const state = {
    points: 0,
    dollars: 0,
    lifetime: 0,
    dripPoints: 25,
    cooldownMs: 60_000,
    lastDripAt: 0,
    ladder: FALLBACK_LADDER,
    popups: [] as Popup[],
    bubbles: [] as Bubble[],
    sipPress: 0,
    dripPress: 0,
    dropAnim: 0,
    message: "",
    messageOk: true,
    messageUntil: 0,
    time: 0,
  };

  let raf = 0;
  let last = performance.now();
  let destroyed = false;

  /* -------------------------------------------------------------- helpers */

  function text(
    str: string,
    x: number,
    y: number,
    color: string,
    size = 8,
    align: CanvasTextAlign = "left",
  ): void {
    ctx!.font = `${size}px "Courier New", ui-monospace, monospace`;
    ctx!.textAlign = align;
    ctx!.textBaseline = "top";
    ctx!.fillStyle = color;
    ctx!.fillText(str, Math.round(x), Math.round(y));
  }

  function dripRemaining(): number {
    if (!state.lastDripAt) return 0;
    return Math.max(0, state.lastDripAt + state.cooldownMs - Date.now());
  }

  function nextRung() {
    return state.ladder.find((rung) => state.points < rung.points) ?? null;
  }

  function progress(): number {
    const rung = nextRung();
    if (!rung) return 1;
    return Math.min(1, Math.max(0, state.points / rung.points));
  }

  function spawnPopup(textValue: string, color: string, size: number, x: number, y: number): void {
    state.popups.push({
      x,
      y,
      life: 900,
      max: 900,
      text: textValue,
      color,
      size,
    });
    if (state.popups.length > 14) state.popups.shift();
  }

  function flash(message: string, ok = true): void {
    state.message = message;
    state.messageOk = ok;
    state.messageUntil = Date.now() + 2600;
  }

  function tapSip(): void {
    state.sipPress = 110;
    spawnPopup(`+${SIP_POINTS}`, "#7cf0b8", 9, CUP.x + CUP.w / 2 + (Math.random() * 16 - 8), CUP.y - 2);
    sipSound();
    handlers.onSip();
  }

  function tapDrip(): void {
    const remaining = dripRemaining();
    if (remaining > 0) {
      state.dripPress = 140;
      errorSound();
      flash(`DRIP IN ${Math.ceil(remaining / 1000)}S`, false);
      return;
    }
    state.dripPress = 140;
    state.dropAnim = 420;
    spawnPopup(`+${state.dripPoints}`, "#ffd166", 10, CUP.x + CUP.w / 2, CUP.y - 4);
    dripSound();
    handlers.onDrip();
  }

  /* ---------------------------------------------------------------- input */

  function toView(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * VIEW_W,
      y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * VIEW_H,
    };
  }

  function inRect(x: number, y: number, r: { x: number; y: number; w: number; h: number }): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    const { x, y } = toView(event);
    if (inRect(x, y, SIP_BTN)) tapSip();
    else if (inRect(x, y, DRIP_BTN)) tapDrip();
  }

  canvas.addEventListener("pointerdown", onPointerDown);

  /* --------------------------------------------------------------- resize */

  function resize(): void {
    const width = canvas.clientWidth || VIEW_W;
    const scale = Math.max(1, Math.min(4, Math.floor(width / VIEW_W) || 1));
    const w = VIEW_W * scale;
    const h = VIEW_H * scale;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    display!.imageSmoothingEnabled = false;
  }

  const observer =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  observer?.observe(canvas);
  resize();

  /* ----------------------------------------------------------------- draw */

  function button(
    r: { x: number; y: number; w: number; h: number },
    label: string,
    color: string,
    pressed: boolean,
    dim: boolean,
  ): void {
    const oy = pressed ? 1 : 0;
    ctx!.fillStyle = "#05070d";
    ctx!.fillRect(r.x + 2, r.y + 2, r.w, r.h);
    ctx!.fillStyle = dim ? "#2a3247" : color;
    ctx!.fillRect(r.x, r.y + oy, r.w, r.h);
    ctx!.fillStyle = dim ? "#3a445e" : "rgba(255,255,255,0.45)";
    ctx!.fillRect(r.x, r.y + oy, r.w, 2);
    ctx!.fillRect(r.x, r.y + oy, 2, r.h);
    ctx!.fillStyle = "rgba(0,0,0,0.35)";
    ctx!.fillRect(r.x, r.y + oy + r.h - 2, r.w, 2);
    ctx!.fillRect(r.x + r.w - 2, r.y + oy, 2, r.h);
    text(label, r.x + r.w / 2, r.y + oy + r.h / 2 - 4, dim ? "#8d99b8" : "#0b0d16", 8, "center");
  }

  function drawCup(): void {
    const p = progress();
    const liquidMax = CUP.h - 8;
    const liquidH = Math.max(0, Math.round(p * liquidMax));
    const bottom = CUP.y + CUP.h - 4;

    // handle
    ctx!.fillStyle = "#7f93b8";
    ctx!.fillRect(CUP.x + CUP.w - 1, CUP.y + 12, 6, 2);
    ctx!.fillRect(CUP.x + CUP.w + 4, CUP.y + 12, 2, 16);
    ctx!.fillRect(CUP.x + CUP.w - 1, CUP.y + 26, 6, 2);

    // interior
    ctx!.fillStyle = "#101a2c";
    ctx!.fillRect(CUP.x + 2, CUP.y + 2, CUP.w - 4, CUP.h - 4);

    // liquid with a wobbling top edge
    if (liquidH > 1) {
      const top = bottom - liquidH;
      for (let x = CUP.x + 3; x < CUP.x + CUP.w - 3; x += 1) {
        const wobble = Math.round(Math.sin(state.time / 260 + x * 0.35) * 1.2);
        ctx!.fillStyle = "#2fbf87";
        ctx!.fillRect(x, top + wobble, 1, bottom - (top + wobble));
        ctx!.fillStyle = "#7cf0b8";
        ctx!.fillRect(x, top + wobble, 1, 1);
      }
    }

    // bubbles
    if (liquidH > 8) {
      if (state.bubbles.length < 9 && Math.random() < 0.06) {
        state.bubbles.push({
          x: CUP.x + 5 + Math.random() * (CUP.w - 10),
          y: bottom - 2,
          speed: 0.02 + Math.random() * 0.03,
        });
      }
      ctx!.fillStyle = "#a9ffe0";
      for (const b of state.bubbles) {
        ctx!.fillRect(Math.round(b.x), Math.round(b.y), 1, 2);
      }
    }

    // walls
    ctx!.fillStyle = "#cfe6ff";
    ctx!.fillRect(CUP.x, CUP.y, CUP.w, 2);
    ctx!.fillRect(CUP.x, CUP.y, 2, CUP.h);
    ctx!.fillRect(CUP.x + CUP.w - 2, CUP.y, 2, CUP.h);
    ctx!.fillRect(CUP.x, CUP.y + CUP.h - 2, CUP.w, 2);
    ctx!.fillStyle = "#4a5a7d";
    ctx!.fillRect(CUP.x + 2, CUP.y + CUP.h, CUP.w - 4, 2);

    // the drip droplet
    if (state.dropAnim > 0) {
      const t = 1 - state.dropAnim / 420;
      const y = Math.round(6 + t * (CUP.y - 8));
      ctx!.fillStyle = "#ffd166";
      ctx!.fillRect(CUP.x + CUP.w / 2 - 1, y, 3, 4);
      ctx!.fillRect(CUP.x + CUP.w / 2, y + 4, 1, 2);
    }
  }

  function draw(): void {
    // backdrop
    ctx!.fillStyle = "#0b0d16";
    ctx!.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx!.fillStyle = "#151a2c";
    for (let y = 4; y < VIEW_H; y += 8) {
      for (let x = 4; x < VIEW_W; x += 8) ctx!.fillRect(x, y, 1, 1);
    }

    // header
    text("SIP DRIP", 8, 5, "#7cf0b8", 8);
    text("UPayU", VIEW_W - 8, 5, "#6a7ba3", 8, "right");

    drawCup();

    // left column: the live bridge balance
    text("POINTS", 8, 30, "#6a7ba3", 8);
    text(state.points.toLocaleString("en-US"), 8, 40, "#eaf4ff", 10);
    text(`$${(state.points / 100).toFixed(2)}`, 8, 56, "#7cf0b8", 8);
    text(`SETTLED $${state.dollars.toFixed(2)}`, 8, 66, "#4a5a7d", 8);

    // right column: drip state and next rung
    const remaining = dripRemaining();
    text(`DRIP +${state.dripPoints}`, VIEW_W - 8, 30, "#ffd166", 8, "right");
    text(
      remaining > 0 ? `${Math.ceil(remaining / 1000)}S` : "READY",
      VIEW_W - 8,
      40,
      remaining > 0 ? "#8d99b8" : "#ffd166",
      10,
      "right",
    );
    const rung = nextRung();
    text(
      rung ? `NEXT ${rung.points} PTS` : "TOP RUNG",
      VIEW_W - 8,
      58,
      "#6a7ba3",
      8,
      "right",
    );

    // buttons
    button(SIP_BTN, `SIP +${SIP_POINTS}`, "#7cf0b8", state.sipPress > 0, false);
    button(
      DRIP_BTN,
      remaining > 0 ? `DRIP ${Math.ceil(remaining / 1000)}S` : `DRIP +${state.dripPoints}`,
      "#ffd166",
      state.dripPress > 0,
      remaining > 0,
    );

    // progress toward the next rung
    const p = progress();
    const barX = 8;
    const barY = 116;
    const barW = VIEW_W - 16;
    ctx!.fillStyle = "#1b2237";
    ctx!.fillRect(barX, barY, barW, 6);
    ctx!.fillStyle = "#2fbf87";
    ctx!.fillRect(barX, barY, Math.round(barW * p), 6);
    ctx!.fillStyle = "#7cf0b8";
    ctx!.fillRect(barX, barY, Math.round(barW * p), 1);

    // footer: message or hint
    const showMessage = Date.now() < state.messageUntil && state.message;
    if (showMessage) {
      text(state.message.slice(0, 34), VIEW_W / 2, 130, state.messageOk ? "#7cf0b8" : "#ff7b7b", 8, "center");
    } else {
      text("SPACE = SIP    D = DRIP", VIEW_W / 2, 130, "#4a5a7d", 8, "center");
    }

    // floating points
    for (const popup of state.popups) {
      const alpha = Math.max(0, Math.min(1, popup.life / popup.max));
      ctx!.globalAlpha = alpha;
      text(popup.text, popup.x, popup.y, popup.color, popup.size, "center");
      ctx!.globalAlpha = 1;
    }
  }

  /* --------------------------------------------------------------- update */

  function update(dt: number): void {
    state.time += dt;
    if (state.sipPress > 0) state.sipPress -= dt;
    if (state.dripPress > 0) state.dripPress -= dt;
    if (state.dropAnim > 0) state.dropAnim = Math.max(0, state.dropAnim - dt);

    for (const popup of state.popups) {
      popup.life -= dt;
      popup.y -= (dt / 1000) * 26;
    }
    state.popups = state.popups.filter((popup) => popup.life > 0);

    const liquidTop = CUP.y + CUP.h - 4 - Math.round(progress() * (CUP.h - 8));
    for (const bubble of state.bubbles) bubble.y -= bubble.speed * dt;
    state.bubbles = state.bubbles.filter((bubble) => bubble.y > liquidTop);
  }

  function frame(now: number): void {
    if (destroyed) return;
    const dt = Math.min(64, now - last);
    last = now;
    update(dt);
    draw();
    display!.imageSmoothingEnabled = false;
    display!.clearRect(0, 0, canvas.width, canvas.height);
    display!.drawImage(buffer, 0, 0, canvas.width, canvas.height);
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);

  return {
    setSnapshot(snapshot: Snapshot) {
      state.points = snapshot.account.points;
      state.dollars = snapshot.account.dollars;
      state.lifetime = snapshot.account.lifetimePoints;
      state.dripPoints = snapshot.drip.points;
      state.cooldownMs = snapshot.drip.cooldownMs;
      state.lastDripAt = snapshot.account.lastDripAt
        ? Date.parse(snapshot.account.lastDripAt)
        : 0;
      if (snapshot.ladder.length) state.ladder = snapshot.ladder;
    },
    tapSip,
    tapDrip,
    flash,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointerDown);
      observer?.disconnect();
    },
  };
}
