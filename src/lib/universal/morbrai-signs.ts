/* ------------------------------------------------------------------ */
/* ASL manual alphabet — the 26 handshapes and their types, COPIED     */
/* VERBATIM from Morbraii's own module at                              */
/* /home/team/shared/site/src/asl-signs.tsx (Morbraii site,            */
/* 2026-11-03). Only the data half is copied — the drawing components  */
/* stay on the page. Re-copy, never edit a handshape here by hand.     */
/* ------------------------------------------------------------------ */
/* ASL manual alphabet — one-handed American fingerspelling.           */
/*                                                                     */
/* A third representation of a letter, beside the Morse wave and the   */
/* Braille cell. Every handshape is hand-drawn SVG line art built from */
/* the primitives below (palm, four fingers, thumb), never a photo and */
/* never generated imagery: a wrong fingerspelling chart teaches the   */
/* wrong thing to the one person who cannot check it.                  */
/*                                                                     */
/* This is AMERICAN Sign Language. British Sign Language is a          */
/* different, two-handed alphabet; it is not drawn here and must not   */
/* be mixed in. Every shape was checked letter by letter against the   */
/* fetched references in ASL_SOURCES (see also asl_sources.md in      */
/* /home/team/shared).                                                 */
/* ------------------------------------------------------------------ */
export type FingerState =
  | "up" /* straight, extended */
  | "fold" /* curled into the fist: knuckle bump above the palm */
  | "short" /* curled tighter, thumb tucked under it (M, N) */
  | "tip" /* fingertip curled onto the thumb (E) */
  | "hook" /* bent at both joints (X) */
  | "cross"; /* crossed over its neighbour (R) */

export type ThumbState =
  | "none" /* hidden behind the fingers (B, H) */
  | "sideUp" /* straight up alongside the index (A) */
  | "parallel" /* extended the same way as the index (G, Q) */
  | "across" /* lying across the front of the folded fingers (S, I, U, V, W, X, Z) */
  | "acrossHigh" /* across, higher, with the fingertips resting on it (E) */
  | "under" /* tucked under three fingers, base showing (M) */
  | "underHigh" /* tucked under two fingers, base showing (N) */
  | "tipBetween" /* tip poking up between index and middle (T) */
  | "upBetween" /* pointing up between index and middle (K, P) */
  | "out" /* out at right angles to the fingers (L, Y) */
  | "circleF" /* thumb and index tip touching, loop at the index base (F) */
  | "circleD"; /* thumb meeting the middle-finger tips, loop under the index (D) */

export type SignSpec = {
  i: FingerState;
  m: FingerState;
  r: FingerState;
  p: FingerState;
  thumb: ThumbState;
  /** whole-hand rotation in degrees, clockwise (orientation letters only) */
  rot?: number;
  /** J and Z are traced, not held: the drawing carries a motion path */
  trace?: "j" | "z";
  /** drawn by hand where the shape is a ring, not fingers (C, O) */
  custom?: "C" | "O";
  /** what this letter shares with another, or why the flat view is limited */
  note?: string;
  /** per-finger spread angle in degrees, + = to the right (V, W, K, Y) */
  ang?: Partial<Record<"i" | "m" | "r" | "p", number>>;
};

/* The 26 handshapes. Sources for each are in ASL_SOURCES below; the notes
   are the letters where a flat, single frame is not the whole letter. */
export const ASL: Record<string, SignSpec> = {
  A: { i: "fold", m: "fold", r: "fold", p: "fold", thumb: "sideUp" },
  B: { i: "up", m: "up", r: "up", p: "up", thumb: "none" },
  C: { i: "fold", m: "fold", r: "fold", p: "fold", thumb: "none", custom: "C" },
  D: {
    i: "up",
    m: "fold",
    r: "fold",
    p: "fold",
    thumb: "circleD",
    note: "Index up, and the thumb meets the tips of the middle, ring and little fingers to close the loop at its base.",
  },
  E: {
    i: "tip",
    m: "tip",
    r: "tip",
    p: "tip",
    thumb: "acrossHigh",
    note: "E and S are both closed fists: in E the fingertips curl onto the thumb, in S the thumb lies across the fingers. Fingertips-on-thumb is the older, formal E (Wikipedia).",
  },
  F: { i: "fold", m: "up", r: "up", p: "up", thumb: "circleF", ang: { m: -6, r: 4, p: 14 }, note: "Thumb and index tip touching; the other three fingers can be held apart or together (Start ASL)." },
  G: {
    i: "up",
    m: "fold",
    r: "fold",
    p: "fold",
    thumb: "parallel",
    rot: 90,
    note: "Handshape shared with Q, turned the other way up (Wikipedia).",
  },
  H: {
    i: "up",
    m: "up",
    r: "fold",
    p: "fold",
    thumb: "none",
    rot: 90,
    note: "Handshape shared with U, turned sideways (Wikipedia).",
  },
  I: { i: "fold", m: "fold", r: "fold", p: "up", thumb: "across" },
  J: {
    i: "fold",
    m: "fold",
    r: "fold",
    p: "up",
    thumb: "across",
    trace: "j",
    note: "MOTION: J is I with a twist of the wrist, the little finger tracing the curve of the printed J (Wikipedia). No frozen shape is the letter.",
  },
  K: {
    i: "up",
    m: "up",
    r: "fold",
    p: "fold",
    thumb: "upBetween",
    ang: { i: -12, m: 12 },
    note: "Handshape shared with P, which points it down (Wikipedia).",
  },
  L: { i: "up", m: "fold", r: "fold", p: "fold", thumb: "out" },
  M: {
    i: "short",
    m: "short",
    r: "short",
    p: "fold",
    thumb: "under",
    note: "M, N and T are one fist with the thumb under one, two or three fingers (Start ASL). Flat from the front, M and N look almost identical — the difference is how many fingers cover the thumb.",
  },
  N: {
    i: "short",
    m: "short",
    r: "fold",
    p: "fold",
    thumb: "underHigh",
    note: "N is the M fist with the thumb under two fingers instead of three (Start ASL). See the M note: flat from the front the two are nearly the same shape.",
  },
  O: { i: "fold", m: "fold", r: "fold", p: "fold", thumb: "none", custom: "O" },
  P: {
    i: "up",
    m: "up",
    r: "fold",
    p: "fold",
    thumb: "upBetween",
    rot: 180,
    ang: { i: -12, m: 12 },
    note: "The K handshape, middle finger pointing to the floor (Start ASL).",
  },
  Q: {
    i: "up",
    m: "fold",
    r: "fold",
    p: "fold",
    thumb: "parallel",
    rot: 180,
    note: "The G handshape, pointing to the floor (Start ASL).",
  },
  R: { i: "cross", m: "cross", r: "fold", p: "fold", thumb: "across", note: "Index and middle are crossed, not spread." },
  S: {
    i: "fold",
    m: "fold",
    r: "fold",
    p: "fold",
    thumb: "across",
    note: "A and S are the same fist with the thumb in a different place: on the side of the fist for A, across the front for S (Wikipedia).",
  },
  T: {
    i: "fold",
    m: "fold",
    r: "fold",
    p: "fold",
    thumb: "tipBetween",
    note: "The thumb is under the index finger only, its tip showing between index and middle (Start ASL).",
  },
  U: { i: "up", m: "up", r: "fold", p: "fold", thumb: "across", note: "Handshape shared with H, which turns it sideways (Wikipedia)." },
  V: { i: "up", m: "up", r: "fold", p: "fold", thumb: "across", ang: { i: -14, m: 14 } },
  W: { i: "up", m: "up", r: "up", p: "fold", thumb: "across", ang: { i: -18, m: 0, r: 18 } },
  X: { i: "hook", m: "fold", r: "fold", p: "fold", thumb: "across", note: "The index is hooked, not straight." },
  Y: { i: "fold", m: "fold", r: "fold", p: "up", thumb: "out", rot: -10, ang: { p: 38 } },
  Z: {
    i: "up",
    m: "fold",
    r: "fold",
    p: "fold",
    thumb: "across",
    trace: "z",
    note: "MOTION: Z is the index finger moved back and forth, tracing the zig-zag of the printed Z (Wikipedia). No frozen shape is the letter.",
  },
};
