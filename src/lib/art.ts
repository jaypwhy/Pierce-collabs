/**
 * The Art Integration App's media engine.
 *
 * Plain canvas 2D, no libraries. Each of the eight media is its own routine
 * rather than a recoloured brush: graphite scatters grain, ink and acrylic lay
 * opaque strokes, watercolour lives on a wet layer that dries lighter, pastel
 * scatters against a paper tooth and smears, gesso primes, sculpt edits a
 * height field and shades it, and the pottery wheel is a lathed vessel that
 * spins on its own canvas rather than a flat surface.
 */

export type MediumId =
  | "graphite"
  | "ink"
  | "watercolour"
  | "acrylic"
  | "pastel"
  | "gesso"
  | "sculpt"
  | "pottery";

export type Medium = {
  id: MediumId;
  name: string;
  blurb: string;
  hint: string;
  colours: string[];
  size: number;
  minSize: number;
  maxSize: number;
};

export const MEDIA: Medium[] = [
  {
    id: "graphite",
    name: "Graphite",
    blurb: "Soft pencil, builds up",
    hint: "Drag slowly for a dark line, quickly for a light one. Go over it again to build tone.",
    colours: ["#3a3a3a", "#555555", "#7a7a7a", "#a0a0a0"],
    size: 14,
    minSize: 4,
    maxSize: 44,
  },
  {
    id: "ink",
    name: "Ink",
    blurb: "Crisp, opaque black",
    hint: "Constant width, hard edge, no fade. It sits on top of everything under it.",
    colours: ["#0b0b0c", "#161a1d", "#1c2430"],
    size: 10,
    minSize: 2,
    maxSize: 26,
  },
  {
    id: "watercolour",
    name: "Watercolour",
    blurb: "Wet, blooms, dries lighter",
    hint: "Laid down wet: it blooms where it overlaps, blends on contact, and dries a little lighter.",
    colours: ["#2f6f8f", "#3f7f4f", "#a8443a", "#8a5a9e", "#d9a03a", "#1f2a44"],
    size: 52,
    minSize: 16,
    maxSize: 110,
  },
  {
    id: "acrylic",
    name: "Acrylic",
    blurb: "Flat, opaque, covers",
    hint: "Bold and flat. It covers whatever is underneath completely.",
    colours: ["#c0392b", "#e0a800", "#1f6f8b", "#2e7d4f", "#1b1b1b", "#f2f0eb"],
    size: 22,
    minSize: 6,
    maxSize: 60,
  },
  {
    id: "pastel",
    name: "Pastel",
    blurb: "Chalky, grainy, smudges",
    hint: "Grainy against the paper's tooth — and it smears as you drag through what's already there.",
    colours: ["#e8a0b4", "#9fc4e8", "#c9d98a", "#f0c98a", "#b39ddb", "#7d6b5d"],
    size: 24,
    minSize: 8,
    maxSize: 60,
  },
  {
    id: "gesso",
    name: "Gesso",
    blurb: "White primer, matte",
    hint: "Opaque matte primer. It covers everything and preps the surface for paint over it.",
    colours: ["#f6f3ea", "#efe9dc", "#e4dccb"],
    size: 46,
    minSize: 16,
    maxSize: 110,
  },
  {
    id: "sculpt",
    name: "Sculpt",
    blurb: "Push and pull relief",
    hint: "Push to raise, pull to sink. The light comes from the top left, so the piece reads as raised from the page.",
    colours: [],
    size: 44,
    minSize: 14,
    maxSize: 100,
  },
  {
    id: "pottery",
    name: "Pottery wheel",
    blurb: "A vessel that spins",
    hint: "Drag sideways to widen or narrow the wall, up and down to raise the pot. The wheel slows while you shape.",
    colours: ["#b4674a", "#8f5a3c", "#c98a63", "#6f7b6a", "#d9cdbd", "#3f4a52"],
    size: 1,
    minSize: 1,
    maxSize: 1,
  },
];

export function mediumById(id: MediumId): Medium {
  return MEDIA.find((m) => m.id === id) ?? MEDIA[0]!;
}

const W = 1200;
const H = 800;
const HW = 400; // relief height field, scaled up to the canvas
const HH = 267;
const FOOT_Y = 700;
const POT_ROWS = 64;

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const x = c.getContext("2d");
  if (!x) throw new Error("2D canvas is not available");
  return x;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
}

function shade(hex: string, f: number): string {
  const [r, g, b] = hexToRgb(hex);
  const c = (v: number) => Math.round(clamp(v * f, 0, 255));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function defaultProfile(): number[] {
  const keys: [number, number][] = [
    [0, 78],
    [0.1, 96],
    [0.3, 132],
    [0.45, 148],
    [0.62, 128],
    [0.78, 88],
    [0.9, 74],
    [1, 92],
  ];
  const out: number[] = [];
  for (let i = 0; i < POT_ROWS; i++) {
    const t = i / (POT_ROWS - 1);
    let a = keys[0]!;
    let b = keys[keys.length - 1]!;
    for (let k = 0; k < keys.length - 1; k++) {
      const lo = keys[k]!;
      const hi = keys[k + 1]!;
      if (t >= lo[0] && t <= hi[0]) {
        a = lo;
        b = hi;
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const u = clamp((t - a[0]) / span, 0, 1);
    const e = u * u * (3 - 2 * u);
    out.push(a[1] + (b[1] - a[1]) * e);
  }
  return out;
}

type UndoEntry =
  | { kind: "paint"; image: ImageData }
  | { kind: "ink"; image: ImageData }
  | { kind: "sculpt"; height: Float32Array; relief: ImageData }
  | { kind: "pottery"; radii: number[]; height: number };

export class ArtEngine {
  medium: MediumId = "graphite";
  colour = "#555555";
  brushSize = 14;
  sculptMode: "push" | "pull" = "push";
  wheelSpeed = 0.5;
  onChange: (() => void) | null = null;

  used = new Set<MediumId>();
  marks = 0;

  private display: HTMLCanvasElement;
  private d: CanvasRenderingContext2D;
  private paint: HTMLCanvasElement;
  private pc: CanvasRenderingContext2D;
  private inkLayer: HTMLCanvasElement;
  private ic: CanvasRenderingContext2D;
  private wet: HTMLCanvasElement;
  private wc: CanvasRenderingContext2D;
  private relief: HTMLCanvasElement;
  private rc: CanvasRenderingContext2D;
  private reliefImg: ImageData;
  private height: Float32Array;
  private scratch: HTMLCanvasElement;
  private sc: CanvasRenderingContext2D;
  private tooth: Uint8Array;

  private dirty = true;
  private raf = 0;
  private lastFrame = 0;
  private drawing = false;
  private lx = 0;
  private ly = 0;
  private lt = 0;
  private wetActive = false;

  private radii: number[] = defaultProfile();
  private potHeight = 470;
  private spin = 0;
  private potDrag: {
    row: number;
    x: number;
    y: number;
    radii: number[];
    height: number;
  } | null = null;

  private undo: UndoEntry[] = [];

  constructor(display: HTMLCanvasElement) {
    this.display = display;
    display.width = W;
    display.height = H;
    this.d = ctx2d(display);

    this.paint = makeCanvas(W, H);
    this.pc = ctx2d(this.paint);
    this.inkLayer = makeCanvas(W, H);
    this.ic = ctx2d(this.inkLayer);
    this.wet = makeCanvas(W, H);
    this.wc = ctx2d(this.wet);
    this.relief = makeCanvas(HW, HH);
    this.rc = ctx2d(this.relief);
    this.reliefImg = this.rc.createImageData(HW, HH);
    this.height = new Float32Array(HW * HH);
    this.scratch = makeCanvas(12, 12);
    this.sc = ctx2d(this.scratch);

    this.tooth = new Uint8Array(256 * 256);
    for (let i = 0; i < this.tooth.length; i++) this.tooth[i] = Math.random() * 256;

    display.addEventListener("pointerdown", this.onDown);
    display.addEventListener("pointermove", this.onMove);
    display.addEventListener("pointerup", this.onUp);
    display.addEventListener("pointercancel", this.onUp);
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.display.removeEventListener("pointerdown", this.onDown);
    this.display.removeEventListener("pointermove", this.onMove);
    this.display.removeEventListener("pointerup", this.onUp);
    this.display.removeEventListener("pointercancel", this.onUp);
    this.onChange = null;
  }

  setMedium(id: MediumId) {
    this.medium = id;
    this.dirty = true;
  }

  setColour(hex: string) {
    this.colour = hex;
  }

  setSize(n: number) {
    this.brushSize = n;
  }

  setSculptMode(mode: "push" | "pull") {
    this.sculptMode = mode;
  }

  setWheelSpeed(v: number) {
    this.wheelSpeed = v;
  }

  hasUndo(): boolean {
    return this.undo.length > 0;
  }

  undoOne(): boolean {
    const entry = this.undo.pop();
    if (!entry) return false;
    if (entry.kind === "paint") this.pc.putImageData(entry.image, 0, 0);
    else if (entry.kind === "ink") this.ic.putImageData(entry.image, 0, 0);
    else if (entry.kind === "sculpt") {
      this.height.set(entry.height);
      this.reliefImg.data.set(entry.relief.data);
      this.rc.putImageData(this.reliefImg, 0, 0);
    } else {
      this.radii = entry.radii.slice();
      this.potHeight = entry.height;
    }
    this.wc.clearRect(0, 0, W, H);
    this.wetActive = false;
    this.dirty = true;
    this.onChange?.();
    return true;
  }

  clearAll() {
    this.pushUndo();
    this.pc.clearRect(0, 0, W, H);
    this.ic.clearRect(0, 0, W, H);
    this.wc.clearRect(0, 0, W, H);
    this.wetActive = false;
    this.height.fill(0);
    this.reliefImg.data.fill(0);
    this.rc.putImageData(this.reliefImg, 0, 0);
    this.radii = defaultProfile();
    this.potHeight = 470;
    this.marks = 0;
    this.used.clear();
    this.dirty = true;
    this.onChange?.();
  }

  /** A small JPEG of what is on screen right now, for the saved-piece list. */
  snapshot(width: number, height: number): string {
    const c = makeCanvas(width, height);
    const x = ctx2d(c);
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, width, height);
    x.drawImage(this.display, 0, 0, width, height);
    return c.toDataURL("image/jpeg", 0.7);
  }

  // ---------------------------------------------------------------- pointers

  private point(e: PointerEvent): [number, number] {
    const r = this.display.getBoundingClientRect();
    const x = ((e.clientX - r.left) / Math.max(1, r.width)) * W;
    const y = ((e.clientY - r.top) / Math.max(1, r.height)) * H;
    return [clamp(x, 0, W), clamp(y, 0, H)];
  }

  private onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    try {
      this.display.setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety */
    }
    const [x, y] = this.point(e);
    this.begin(x, y);
  };

  private onMove = (e: PointerEvent) => {
    if (!this.drawing) return;
    e.preventDefault();
    const coalesced =
      typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    const list = coalesced.length > 0 ? coalesced : [e];
    for (const ev of list) {
      const [x, y] = this.point(ev);
      this.move(x, y);
    }
  };

  private onUp = (e: PointerEvent) => {
    if (!this.drawing) return;
    this.drawing = false;
    try {
      this.display.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    this.end();
  };

  // ----------------------------------------------------------------- strokes

  private begin(x: number, y: number) {
    this.used.add(this.medium);
    this.pushUndo();
    this.drawing = true;
    this.lx = x;
    this.ly = y;
    this.lt = performance.now();

    if (this.medium === "watercolour") {
      this.wc.clearRect(0, 0, W, H);
      this.wetActive = true;
      this.dabWater(x, y, 0);
    } else if (this.medium === "pottery") {
      this.startPot(x, y);
    } else if (this.medium === "sculpt") {
      this.pushHeight(x, y);
    } else if (this.medium === "graphite") {
      this.dabGraphite(x, y, 0);
    } else if (this.medium === "pastel") {
      this.dabPastel(x, y, 0);
    } else if (this.medium === "acrylic") {
      this.strokeAcrylic(x, y, x, y);
    } else if (this.medium === "gesso") {
      this.strokeGesso(x, y, x, y);
    } else {
      this.strokeInk(x, y, x, y);
    }
    this.dirty = true;
  }

  private move(x: number, y: number) {
    if (!this.drawing) return;
    const now = performance.now();
    const dx = x - this.lx;
    const dy = y - this.ly;
    const dist = Math.hypot(dx, dy);
    const dt = Math.max(1, now - this.lt);
    const speed = clamp(dist / dt, 0, 2.2);

    if (this.medium === "pottery") {
      this.shapePot(x, y);
    } else if (this.medium === "ink") {
      this.strokeInk(this.lx, this.ly, x, y);
      this.marks += 1;
    } else if (this.medium === "acrylic") {
      this.strokeAcrylic(this.lx, this.ly, x, y);
      this.marks += 1;
    } else if (this.medium === "gesso") {
      this.strokeGesso(this.lx, this.ly, x, y);
      this.marks += 1;
    } else if (this.medium === "sculpt") {
      const steps = Math.max(1, Math.ceil(dist / Math.max(3, this.brushSize * 0.25)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        this.pushHeight(this.lx + dx * t, this.ly + dy * t);
      }
    } else {
      const step = Math.max(1.4, this.brushSize * 0.12);
      const steps = clamp(Math.ceil(dist / step), 1, 80);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = this.lx + dx * t;
        const py = this.ly + dy * t;
        if (this.medium === "graphite") this.dabGraphite(px, py, speed);
        else if (this.medium === "watercolour") this.dabWater(px, py, speed);
        else this.dabPastel(px, py, speed);
      }
    }

    this.lx = x;
    this.ly = y;
    this.lt = now;
    this.dirty = true;
  }

  private end() {
    if (this.wetActive) this.dryWater();
    this.potDrag = null;
    this.dirty = true;
    this.onChange?.();
  }

  // ---------------------------------------------------------------- graphite

  private dabGraphite(x: number, y: number, speed: number) {
    const c = this.pc;
    c.globalCompositeOperation = "source-over";
    c.fillStyle = this.colour;
    const fade = 1 - Math.min(0.7, speed * 0.55);
    const n = 4 + Math.round(this.brushSize * 0.4);
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.2) continue; // broken edge
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6) * this.brushSize * 0.55;
      c.globalAlpha = (0.05 + Math.random() * 0.08) * fade;
      c.beginPath();
      c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.6 + Math.random() * 1.1, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    this.marks += 1;
  }

  // --------------------------------------------------------------------- ink

  private strokeInk(x0: number, y0: number, x1: number, y1: number) {
    const c = this.ic;
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.strokeStyle = this.colour;
    c.lineWidth = this.brushSize;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }

  // ---------------------------------------------------------------- acrylic

  private strokeAcrylic(x0: number, y0: number, x1: number, y1: number) {
    const c = this.pc;
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.strokeStyle = this.colour;
    c.lineWidth = this.brushSize;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();

    // bristles: a little tone variation, still fully opaque so it covers
    const ang = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    const nx = Math.cos(ang);
    const ny = Math.sin(ang);
    const bristles = 5;
    c.lineWidth = Math.max(1, this.brushSize * 0.13);
    for (let i = 0; i < bristles; i++) {
      const off = (i / (bristles - 1) - 0.5) * this.brushSize * 0.86;
      c.strokeStyle = shade(this.colour, i % 2 === 0 ? 1.09 : 0.9);
      c.beginPath();
      c.moveTo(x0 + nx * off, y0 + ny * off);
      c.lineTo(x1 + nx * off, y1 + ny * off);
      c.stroke();
    }
  }

  // ------------------------------------------------------------------ gesso

  private strokeGesso(x0: number, y0: number, x1: number, y1: number) {
    const c = this.pc;
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.strokeStyle = this.colour;
    c.lineWidth = this.brushSize;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();

    // chalky tooth at the edge, so it reads matte rather than glossy
    const ang = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    const nx = Math.cos(ang);
    const ny = Math.sin(ang);
    c.fillStyle = shade(this.colour, 0.93);
    for (let i = 0; i < 10; i++) {
      const t = Math.random();
      const off = (Math.random() < 0.5 ? -1 : 1) * this.brushSize * (0.42 + Math.random() * 0.14);
      c.globalAlpha = 0.25 + Math.random() * 0.3;
      c.beginPath();
      c.arc(
        x0 + (x1 - x0) * t + nx * off,
        y0 + (y1 - y0) * t + ny * off,
        0.8 + Math.random() * 2,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    c.globalAlpha = 1;
  }

  // ------------------------------------------------------------ watercolour

  private dabWater(x: number, y: number, speed: number) {
    const c = this.wc;
    c.globalCompositeOperation = "multiply";
    c.globalAlpha = 1;
    const r = this.brushSize * (0.55 + Math.random() * 0.22) * (1 + speed * 0.08);

    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(this.colour, 0.1));
    g.addColorStop(0.55, rgba(this.colour, 0.055));
    g.addColorStop(1, rgba(this.colour, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();

    // pigment pooling at the wet edge
    if (Math.random() < 0.3) {
      const a = Math.random() * Math.PI * 2;
      const px = x + Math.cos(a) * r * (0.85 + Math.random() * 0.2);
      const py = y + Math.sin(a) * r * (0.85 + Math.random() * 0.2);
      const pr = r * (0.22 + Math.random() * 0.2);
      const g2 = c.createRadialGradient(px, py, 0, px, py, pr);
      g2.addColorStop(0, rgba(this.colour, 0.14));
      g2.addColorStop(1, rgba(this.colour, 0));
      c.fillStyle = g2;
      c.beginPath();
      c.arc(px, py, pr, 0, Math.PI * 2);
      c.fill();
    }
    this.marks += 1;
  }

  private dryWater() {
    const c = this.pc;
    c.globalCompositeOperation = "multiply";
    c.globalAlpha = 0.92; // dries lighter
    c.filter = "blur(3px)"; // and its edges soften
    c.drawImage(this.wet, 0, 0);
    c.filter = "none";
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    this.wc.clearRect(0, 0, W, H);
    this.wetActive = false;
  }

  // ----------------------------------------------------------------- pastel

  private dabPastel(x: number, y: number, speed: number) {
    const c = this.pc;
    c.globalCompositeOperation = "source-over";
    c.fillStyle = this.colour;
    const n = 16 + Math.round(this.brushSize * 0.7);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.55) * this.brushSize * 0.62;
      const gx = x + Math.cos(a) * r;
      const gy = y + Math.sin(a) * r;
      const ti = (((Math.floor(gy) % 256) + 256) % 256) * 256 + (((Math.floor(gx) % 256) + 256) % 256);
      if (this.tooth[ti]! < 96) continue; // the paper's tooth refuses some of it
      c.globalAlpha = 0.16 + Math.random() * 0.3;
      c.fillRect(gx, gy, 1 + Math.random() * 2.2, 1 + Math.random() * 2.2);
    }
    c.globalAlpha = 1;

    // smudge: pick up what is already there and drag it along
    if (Math.random() < 0.5) {
      const sx = Math.round(clamp(x - 5, 0, W - 12));
      const sy = Math.round(clamp(y - 5, 0, H - 12));
      this.sc.clearRect(0, 0, 12, 12);
      this.sc.drawImage(this.paint, sx, sy, 12, 12, 0, 0, 12, 12);
      c.globalAlpha = 0.12 + speed * 0.05;
      c.drawImage(this.scratch, 0, 0, 12, 12, x - 8, y - 8, 16, 16);
      c.globalAlpha = 1;
    }
    this.marks += 1;
  }

  // ----------------------------------------------------------------- sculpt

  private pushHeight(x: number, y: number) {
    const sign = this.sculptMode === "push" ? 1 : -1;
    const hx = (x / W) * HW;
    const hy = (y / H) * HH;
    const R = Math.max(3, this.brushSize * 0.36);
    const x0 = Math.max(0, Math.floor(hx - R));
    const x1 = Math.min(HW - 1, Math.ceil(hx + R));
    const y0 = Math.max(0, Math.floor(hy - R));
    const y1 = Math.min(HH - 1, Math.ceil(hy + R));

    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const d2 = ((xx - hx) * (xx - hx) + (yy - hy) * (yy - hy)) / (R * R);
        if (d2 > 1) continue;
        const w = Math.exp(-d2 * 2.2);
        const i = yy * HW + xx;
        this.height[i] = clamp((this.height[i] ?? 0) + 0.5 * sign * w, -4, 4);
      }
    }
    this.shadeRect(
      Math.max(0, x0 - 2),
      Math.max(0, y0 - 2),
      Math.min(HW - 1, x1 + 2),
      Math.min(HH - 1, y1 + 2),
    );
    this.marks += 1;
  }

  private shadeRect(x0: number, y0: number, x1: number, y1: number) {
    const data = this.reliefImg.data;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const hl = this.height[y * HW + Math.max(0, x - 1)] ?? 0;
        const hr = this.height[y * HW + Math.min(HW - 1, x + 1)] ?? 0;
        const hu = this.height[Math.max(0, y - 1) * HW + x] ?? 0;
        const hd = this.height[Math.min(HH - 1, y + 1) * HW + x] ?? 0;
        const dx = (hr - hl) * 0.5;
        const dy = (hd - hu) * 0.5;
        // light from the top left: slopes facing it catch it, the far side falls into shadow
        const s = (dx + dy) * 0.95;
        const a = Math.min(1, Math.abs(s) * 2.4);
        const o = (y * HW + x) * 4;
        if (s > 0) {
          data[o] = 255;
          data[o + 1] = 252;
          data[o + 2] = 244;
          data[o + 3] = a * 235;
        } else {
          data[o] = 30;
          data[o + 1] = 25;
          data[o + 2] = 20;
          data[o + 3] = a * 225;
        }
      }
    }
    this.rc.putImageData(this.reliefImg, 0, 0);
    this.dirty = true;
  }

  // ---------------------------------------------------------------- pottery

  private startPot(x: number, y: number) {
    const t = (FOOT_Y - y) / this.potHeight;
    const row = clamp(Math.round(t * (POT_ROWS - 1)), 0, POT_ROWS - 1);
    this.potDrag = { row, x, y, radii: this.radii.slice(), height: this.potHeight };
  }

  private shapePot(x: number, y: number) {
    const drag = this.potDrag;
    if (!drag) return;
    const dx = x - drag.x;
    const dy = y - drag.y;
    const startR = drag.radii[drag.row] ?? 100;
    const target = clamp(startR + dx * 0.7, 24, 300);
    const delta = target - startR;
    const sigma = POT_ROWS * 0.14;
    for (let i = 0; i < POT_ROWS; i++) {
      const w = Math.exp(-Math.pow((i - drag.row) / sigma, 2));
      this.radii[i] = clamp((drag.radii[i] ?? 100) + delta * w, 20, 320);
    }
    this.potHeight = clamp(drag.height - dy * 0.85, 240, 620);
    this.marks += 1;
  }

  private bodyPath(
    d: CanvasRenderingContext2D,
    cx: number,
    rowY: (i: number) => number,
  ) {
    d.beginPath();
    d.moveTo(cx - (this.radii[0] ?? 80), rowY(0));
    for (let i = 1; i < POT_ROWS; i++) d.lineTo(cx - (this.radii[i] ?? 80), rowY(i));
    for (let i = POT_ROWS - 1; i >= 0; i--) d.lineTo(cx + (this.radii[i] ?? 80), rowY(i));
    d.closePath();
  }

  private drawWheel() {
    const d = this.d;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalAlpha = 1;
    d.globalCompositeOperation = "source-over";
    d.filter = "none";

    const bg = d.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#fbfaf7");
    bg.addColorStop(1, "#e9e3d8");
    d.fillStyle = bg;
    d.fillRect(0, 0, W, H);

    const cx = W / 2;
    const footY = FOOT_Y;
    const topY = footY - this.potHeight;
    const tilt = 0.22;
    const rowY = (i: number) => footY - (i / (POT_ROWS - 1)) * this.potHeight;
    const maxR = Math.max(...this.radii);
    const clay = this.colour;

    // the wheel head, turning under the vessel
    const wheelR = maxR * 1.35 + 70;
    d.fillStyle = "#d3cec3";
    d.beginPath();
    d.ellipse(cx, footY + 24, wheelR, wheelR * tilt * 0.85, 0, 0, Math.PI * 2);
    d.fill();
    d.fillStyle = "rgba(0,0,0,0.05)";
    d.beginPath();
    d.ellipse(cx, footY + 30, wheelR * 0.9, wheelR * tilt * 0.76, 0, 0, Math.PI * 2);
    d.fill();
    d.strokeStyle = "rgba(70,58,44,0.22)";
    d.lineWidth = 5;
    for (let k = 0; k < 10; k++) {
      const th = (k / 10) * Math.PI * 2 + this.spin * 0.9;
      d.beginPath();
      d.moveTo(cx + Math.cos(th) * wheelR * 0.3, footY + 24 + Math.sin(th) * wheelR * 0.3 * tilt * 0.85);
      d.lineTo(cx + Math.cos(th) * wheelR * 0.9, footY + 24 + Math.sin(th) * wheelR * 0.9 * tilt * 0.85);
      d.stroke();
    }

    // the vessel body, one lathed strip at a time
    for (let i = 0; i < POT_ROWS - 1; i++) {
      const r0 = this.radii[i] ?? 80;
      const r1 = this.radii[i + 1] ?? 80;
      const y0 = rowY(i);
      const y1 = rowY(i + 1);
      const half = Math.max(r0, r1, 1);
      const g = d.createLinearGradient(cx - half, 0, cx + half, 0);
      g.addColorStop(0, shade(clay, 0.4));
      g.addColorStop(0.12, shade(clay, 0.72));
      g.addColorStop(0.3, shade(clay, 1.22));
      g.addColorStop(0.46, shade(clay, 1.04));
      g.addColorStop(0.62, shade(clay, 0.84));
      g.addColorStop(0.85, shade(clay, 0.55));
      g.addColorStop(1, shade(clay, 0.36));
      d.fillStyle = g;
      d.beginPath();
      d.moveTo(cx - r0, y0);
      d.lineTo(cx + r0, y0);
      d.lineTo(cx + r1, y1);
      d.lineTo(cx - r1, y1);
      d.closePath();
      d.fill();
    }

    // grounding shadow up the body, clipped to the vessel
    d.save();
    this.bodyPath(d, cx, rowY);
    d.clip();
    const vg = d.createLinearGradient(0, topY, 0, footY);
    vg.addColorStop(0, "rgba(255,255,255,0.16)");
    vg.addColorStop(0.7, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.3)");
    d.fillStyle = vg;
    d.fillRect(cx - maxR, topY, maxR * 2, this.potHeight);

    // throwing rings
    d.globalAlpha = 0.1;
    d.strokeStyle = "#2f2015";
    d.lineWidth = 1.6;
    for (let k = 1; k < 26; k++) {
      const i = Math.round((k / 26) * (POT_ROWS - 1));
      const r = this.radii[i] ?? 80;
      d.beginPath();
      d.ellipse(cx, rowY(i), r, r * tilt, 0, 0, Math.PI);
      d.stroke();
    }

    // the surface turning: speckles carried round the front of the pot
    d.globalAlpha = 1;
    d.fillStyle = "rgba(44,30,18,0.16)";
    d.beginPath();
    const cols = 30;
    for (let c = 0; c < cols; c++) {
      const th = (c / cols) * Math.PI * 2 + this.spin;
      const st = Math.sin(th);
      if (st < 0.03) continue;
      const ct = Math.cos(th);
      for (let i = 0; i < POT_ROWS; i += 2) {
        const r = this.radii[i] ?? 80;
        const x = cx + ct * r;
        const y = rowY(i) + st * r * tilt;
        const s = 1.4 + 2.6 * st;
        d.rect(x - s / 2, y - s / 2, s, s);
      }
    }
    d.fill();
    d.restore();

    // rim and foot
    const rr = this.radii[POT_ROWS - 1] ?? 92;
    const wall = Math.max(6, rr * 0.08);
    d.fillStyle = shade(clay, 1.18);
    d.beginPath();
    d.ellipse(cx, topY, rr, rr * tilt, 0, 0, Math.PI * 2);
    d.fill();
    d.fillStyle = shade(clay, 0.32);
    d.beginPath();
    d.ellipse(cx, topY, Math.max(4, rr - wall), Math.max(2, (rr - wall) * tilt), 0, 0, Math.PI * 2);
    d.fill();
    d.fillStyle = shade(clay, 0.52);
    d.beginPath();
    d.ellipse(
      cx,
      topY + 3,
      Math.max(3, rr - wall * 1.3),
      Math.max(2, (rr - wall * 1.3) * tilt),
      0,
      Math.PI,
      Math.PI * 2,
    );
    d.fill();

    const r0 = this.radii[0] ?? 78;
    d.fillStyle = shade(clay, 0.86);
    d.beginPath();
    d.ellipse(cx, footY, r0, r0 * tilt, 0, 0, Math.PI);
    d.fill();
  }

  // ------------------------------------------------------------------ frame

  private frame = (t: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = this.lastFrame ? Math.min(0.06, (t - this.lastFrame) / 1000) : 0.016;
    this.lastFrame = t;

    if (this.medium === "pottery") {
      this.spin += dt * (1.4 + this.wheelSpeed * 5.2) * (this.potDrag ? 0.35 : 1);
      this.drawWheel();
      return;
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.composite();
  };

  private composite() {
    const d = this.d;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.filter = "none";
    d.globalAlpha = 1;
    d.globalCompositeOperation = "source-over";
    d.fillStyle = "#ffffff";
    d.fillRect(0, 0, W, H);
    d.drawImage(this.paint, 0, 0);
    d.imageSmoothingEnabled = true;
    d.drawImage(this.relief, 0, 0, W, H);
    if (this.wetActive) {
      d.globalCompositeOperation = "multiply";
      d.drawImage(this.wet, 0, 0);
      d.globalCompositeOperation = "source-over";
    }
    d.drawImage(this.inkLayer, 0, 0);
  }

  private pushUndo() {
    if (this.medium === "ink") {
      this.undo.push({ kind: "ink", image: this.ic.getImageData(0, 0, W, H) });
    } else if (this.medium === "sculpt") {
      this.undo.push({
        kind: "sculpt",
        height: this.height.slice(),
        relief: new ImageData(new Uint8ClampedArray(this.reliefImg.data), HW, HH),
      });
    } else if (this.medium === "pottery") {
      this.undo.push({ kind: "pottery", radii: this.radii.slice(), height: this.potHeight });
    } else {
      this.undo.push({ kind: "paint", image: this.pc.getImageData(0, 0, W, H) });
    }
    if (this.undo.length > 6) this.undo.shift();
  }
}
