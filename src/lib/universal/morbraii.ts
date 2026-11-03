/**
 * The `morbraii` adapter — Morbraii's cross-communication layer.
 *
 * Morbraii takes one message and gets it out through whichever node a person
 * can receive on: timed vibration, light, tone, a 2×3 Braille cell, ASL
 * handshapes or plain text. This adapter answers with what Morbraii's own page
 * plays, because it is backed by Morbraii's own code, copied in:
 *
 *   · ./morbrai-core.ts  — the letter table, both timing profiles, the pitch
 *     map and the Morse / Braille encoders (verbatim from
 *     /home/team/shared/site/src/lib/morbrai.ts)
 *   · ./morbrai-signs.ts — the 26 ASL handshapes (verbatim from
 *     /home/team/shared/site/src/asl-signs.tsx)
 *
 * So a schedule answered here is the rhythm the page plays: one letter table,
 * one token walk, one set of gaps, one Hz map. Nothing in this file restates a
 * dot length, a gap width or a frequency.
 *
 * Live: nodes, encode, schedule. Identity is still planned and says so.
 */
import {
  GAP_UNITS,
  MORBRAI_DEFAULT_UNIT,
  MORBRAI_UNIT_CHOICES,
  STANDARD_DEFAULT_WPM,
  WPM_CHOICES,
  buildTiming,
  byLetter,
  encodeMessage,
  noteOf,
  tokenize,
  vibrationPattern,
  type ProfileId,
  type Schedule,
  type Timing,
} from "./morbrai-core";
import { ASL, type SignSpec } from "./morbrai-signs";
import {
  badRequest,
  bodyNumber,
  bodyString,
  fail,
  ok,
  type Reply,
  type ServiceAdapter,
} from "./envelope";

/* ------------------------------------------------------------------ */
/* NODES — what Morbraii can output, and the honest limit of each.     */
/* ------------------------------------------------------------------ */
export type NodeId = "vibration" | "light" | "tone" | "braille" | "handshapes" | "text";

export type NodeSpec = {
  id: NodeId;
  name: string;
  /** What comes out of this node. */
  output: string;
  /** What the message survives as on this channel. */
  carries: string;
  /** The limit of this channel, stated plainly. */
  limit: string;
};

export const NODES: NodeSpec[] = [
  {
    id: "vibration",
    name: "Vibration",
    output: "A timed buzz pattern per letter: on/off durations, no pitch.",
    carries: "Rhythm — dot, dash, element gap, letter gap, word gap.",
    limit:
      "The web Vibration API is on/off only, so this is durations and not frequencies. Frequency-tuned haptics need native access to the phone's actuator, and Morbraii does not claim otherwise.",
  },
  {
    id: "light",
    name: "Light",
    output: "The same rhythm as flashes, in one of three selectable colour sets.",
    carries: "Rhythm, with a dot and a dash told apart by colour as well as by length.",
    limit:
      "The colour sets differ in brightness as well as hue; the white dot / red dash set is the one to use where hue is hard to judge.",
  },
  {
    id: "tone",
    name: "Tone",
    output:
      "Two deliveries of one rhythm: discrete pings (on/off keying, standard) and a sustained carrier (ours, not ITU) that dips instead of falling silent.",
    carries: "Rhythm and pitch — every letter owns one note in the pitch map.",
    limit:
      "The pitch ladder climbs to G7 ≈ 3136 Hz, which age-related high-frequency loss can make inaudible — which is exactly why the page has a register control and a hearing check.",
  },
  {
    id: "braille",
    name: "Braille cell",
    output: "One six-dot Grade-1 cell per letter, read by touch.",
    carries: "The letter itself, not the rhythm.",
    limit: "Grade 1, dots 1-6 only: no contractions, no capital or number signs.",
  },
  {
    id: "handshapes",
    name: "Handshapes",
    output: "One ASL handshape per letter — the American one-handed manual alphabet.",
    carries: "The letter itself, as fingerspelling.",
    limit:
      "Fingerspelling, not ASL grammar. BSL is a two-handed alphabet and is not shown. J and Z are motion letters, not frozen shapes. Nothing here reads your hand or a camera.",
  },
  {
    id: "text",
    name: "Text",
    output: "The letters themselves, A-Z and single spaces.",
    carries: "The message as typed, normalised to A-Z.",
    limit: "Digits and punctuation are dropped before encoding — the letter table is A-Z only.",
  },
];

export const NODE_IDS: NodeId[] = NODES.map((n) => n.id);

/* Light colour sets, as named on Morbraii's own light panel. */
export const COLOUR_SETS = [
  { id: "cyanAmber", label: "Cyan dot / amber dash", note: "The original pair. Amber is the brighter of the two." },
  {
    id: "blueMagenta",
    label: "Blue dot / magenta dash",
    note: "Darker blue against a lighter magenta — reads by brightness too.",
  },
  {
    id: "whiteRed",
    label: "White dot / red dash",
    note: "Highest contrast in brightness — the one to try if hue is hard to judge.",
  },
];

/* Carrier levels, the same numbers the page's sustained voice uses. */
export const CARRIER = {
  swell: 0.1,
  dipRatio: 0.18,
  dipDb: Math.round(20 * Math.log10(0.18) * 10) / 10, // ≈ -14.9 dB
  rampMs: 20,
  releaseMs: 120,
};

/* ------------------------------------------------------------------ */
/* PROFILES — two timing grids, both real, one of them ours.           */
/* ------------------------------------------------------------------ */
export const PROFILES = [
  {
    id: "standard" as ProfileId,
    label: "Standard Morse (ITU)",
    detail:
      "The true 1 : 3 : 1 : 3 : 7 unit grid at 5 / 8 / 12 wpm. What a learner acquires here reads on any real Morse channel.",
    itu: true,
    gapsInUnits: GAP_UNITS.standard,
    wpm: WPM_CHOICES,
    defaultWpm: STANDARD_DEFAULT_WPM,
  },
  {
    id: "morbrai" as ProfileId,
    label: "Morbraii spacing (ours, not ITU)",
    detail:
      "Letters identical to standard (dot 1 unit, dash 3) with exaggerated boundaries so they can be felt: element 2, letter 6, word 14 units.",
    itu: false,
    gapsInUnits: GAP_UNITS.morbrai,
    unitMs: MORBRAI_UNIT_CHOICES,
    defaultUnitMs: MORBRAI_DEFAULT_UNIT,
  },
];

const asProfile = (raw: string | undefined): ProfileId | undefined =>
  raw === "standard" || raw === "morbrai" ? raw : undefined;

const asNode = (raw: string | undefined): NodeId | undefined =>
  raw !== undefined && (NODE_IDS as string[]).includes(raw) ? (raw as NodeId) : undefined;

/* A timing object, or the sentence explaining why not. Standard is paced in
   wpm, Morbraii spacing in a unit length — the same two choices the page
   offers, so an API caller cannot pick a grid the site cannot show. */
function resolveTiming(
  profileRaw: string | undefined,
  wpmRaw: number | undefined,
  unitRaw: number | undefined,
): { timing: Timing } | { error: string } {
  const profile = asProfile(profileRaw) ?? "standard";

  if (profile === "standard") {
    const wpm = wpmRaw ?? STANDARD_DEFAULT_WPM;
    if (!(WPM_CHOICES as readonly number[]).includes(wpm)) {
      return { error: `standard profile is paced in wpm: use one of ${WPM_CHOICES.join(", ")}.` };
    }
    return { timing: buildTiming("standard", Math.round(1200 / wpm)) };
  }

  const unitMs = unitRaw ?? MORBRAI_DEFAULT_UNIT;
  if (!(MORBRAI_UNIT_CHOICES as readonly number[]).includes(unitMs)) {
    return {
      error: `morbrai profile is paced by unit length in ms: use one of ${MORBRAI_UNIT_CHOICES.join(", ")}.`,
    };
  }
  return { timing: buildTiming("morbrai", unitMs) };
}

/* ------------------------------------------------------------------ */
/* The timed element list — the schedule flattened to one line per     */
/* element, each with the gap that follows it and which boundary that  */
/* gap is. Built by walking the schedule's own elements, so it cannot  */
/* drift from the page's rhythm.                                       */
/* ------------------------------------------------------------------ */
export type TimelineElement = {
  atMs: number;
  letter: string;
  symbol: "." | "-";
  durationMs: number;
  gapAfterMs: number;
  gapAfter: "element" | "letter" | "word" | "none";
  hz: number;
  braille: number[];
};

function gapKind(gapMs: number, timing: Timing): TimelineElement["gapAfter"] {
  if (gapMs === 0) return "none";
  if (gapMs === timing.elementGapMs) return "element";
  if (gapMs === timing.letterGapMs) return "letter";
  if (gapMs === timing.wordGapMs) return "word";
  return "none";
}

function timelineOf(schedule: Schedule, timing: Timing): TimelineElement[] {
  const out: TimelineElement[] = [];
  for (const letter of schedule.letters) {
    let at = letter.startMs;
    for (const element of letter.elements) {
      out.push({
        atMs: at,
        letter: letter.letter,
        symbol: element.symbol,
        durationMs: element.durationMs,
        gapAfterMs: element.gapAfterMs,
        gapAfter: gapKind(element.gapAfterMs, timing),
        hz: letter.hz,
        braille: letter.braille,
      });
      at += element.durationMs + element.gapAfterMs;
    }
  }
  return out;
}

/* The whole message as one continuous on/off list for the Vibration API.
   Same boundary arithmetic as the page's players: a letter followed by a
   letter costs one letter gap, a space owns the whole word gap, and the last
   token adds no trailing gap. */
function wholePattern(schedule: Schedule, timing: Timing): number[] {
  const pattern: number[] = [];
  schedule.tokens.forEach((tok, i) => {
    if (tok === " ") {
      pattern.push(timing.wordGapMs);
      return;
    }
    pattern.push(...vibrationPattern(byLetter(tok).morse, timing));
    const next = schedule.tokens[i + 1];
    if (next !== undefined && next !== " ") pattern.push(timing.letterGapMs);
  });
  return pattern;
}

/* Light steps: the same elements as flashes, and every gap as an off step. */
function lightSteps(timeline: TimelineElement[]) {
  const steps: {
    atMs: number;
    durationMs: number;
    on: boolean;
    colour: "dot" | "dash" | null;
    letter: string | null;
    symbol: "." | "-" | null;
  }[] = [];
  for (const el of timeline) {
    steps.push({
      atMs: el.atMs,
      durationMs: el.durationMs,
      on: true,
      colour: el.symbol === "." ? "dot" : "dash",
      letter: el.letter,
      symbol: el.symbol,
    });
    if (el.gapAfterMs > 0) {
      steps.push({
        atMs: el.atMs + el.durationMs,
        durationMs: el.gapAfterMs,
        on: false,
        colour: null,
        letter: null,
        symbol: null,
      });
    }
  }
  return steps;
}

type Handshape = { letter: string; sign: SignSpec; motion: "j" | "z" | null };

function handshapesOf(schedule: Schedule): Handshape[] {
  return schedule.letters.map((l) => ({
    letter: l.letter,
    sign: ASL[l.letter],
    motion: ASL[l.letter]?.trace ?? null,
  }));
}

/* What the requested node itself emits, on top of the representations every
   encode answers with. */
function nodeOutput(id: NodeId, schedule: Schedule, timing: Timing, timeline: TimelineElement[]) {
  switch (id) {
    case "vibration":
      return {
        unit: "ms",
        letters: schedule.letters.map((l) => ({
          letter: l.letter,
          pattern: vibrationPattern(l.morse, timing),
        })),
        pattern: wholePattern(schedule, timing),
        note: "On/off durations only. Feed one letter's pattern to navigator.vibrate, or the whole list for the message in one call.",
      };
    case "light":
      return {
        steps: lightSteps(timeline),
        colourSets: COLOUR_SETS,
        note: "A dot flashes in the set's dot colour, a dash in its dash colour; every gap is an off step of the same length.",
      };
    case "tone":
      return {
        deliveries: [
          {
            id: "discrete",
            label: "Discrete pings",
            detail: "A short ping per dot and dash, silence in every gap — on/off keying, standard.",
            keyed: timeline,
          },
          {
            id: "carrier",
            label: "Sustained carrier",
            detail:
              "One tone that never goes silent: it swells while a dot or dash sounds and dips in the gaps, so a boundary is heard as a drop in energy rather than as silence.",
            swell: CARRIER.swell,
            dipRatio: CARRIER.dipRatio,
            dipDb: CARRIER.dipDb,
            rampMs: CARRIER.rampMs,
            releaseMs: CARRIER.releaseMs,
          },
        ],
        pitches: schedule.letters.map((l) => ({ letter: l.letter, note: noteOf(l.letter), hz: l.hz })),
        note: "The carrier is ours and is not ITU; the discrete pings are what transfers to a real Morse channel.",
      };
    case "braille":
      return {
        grade: 1,
        cells: schedule.letters.map((l) => ({ letter: l.letter, dots: l.braille })),
        note: "Dots numbered 1-2-3 down the left column and 4-5-6 down the right, as the page's cell draws them.",
      };
    case "handshapes":
      return {
        sequence: handshapesOf(schedule),
        note: "ASL one-handed fingerspelling. Nothing here reads a hand or a camera.",
      };
    case "text":
      return { text: schedule.text, tokens: schedule.tokens };
  }
}

const HONESTY = [
  "Standard Morse is ITU: dot 1, dash 3, element gap 1, letter gap 3, word gap 7, at 5 / 8 / 12 wpm.",
  "Morbraii spacing is ours, explicitly not ITU: the letters are identical to standard and only the boundaries are exaggerated (element 2, letter 6, word 14 units).",
  "The web Vibration API is on/off only — durations, not frequencies.",
  "The manual alphabet is ASL, one-handed. BSL is two-handed and is not shown. J and Z are motion letters.",
  "This is fingerspelling, not ASL grammar. Nothing on this service reads your hand, a camera or a microphone.",
  "No claim is made that any of this improves learning, retention or instrument skill — none of that is measured.",
];

/* ------------------------------------------------------------------ */
/* The adapter.                                                        */
/* ------------------------------------------------------------------ */
function nodesReply(): Reply {
  return ok("morbraii", "nodes", {
    nodes: NODES,
    profiles: PROFILES,
    pitchMap: { description: "Every letter A-Z owns one equal-temperament pitch in C major; A=C4, O=C6, Z=G7.", letterNote: "letter -> note -> Hz via the pitch map." },
    honesty: HONESTY,
  });
}

function encodeReply(body: Record<string, unknown>): Reply {
  const raw = bodyString(body, "text");
  if (raw === undefined || raw.trim() === "") {
    return badRequest("morbraii", "encode", 'encode needs text: { "text": "MIRACLE" }.');
  }
  if (!tokenize(raw).length) {
    return badRequest("morbraii", "encode", `"${raw}" has no A-Z letters to encode.`);
  }

  const profileRaw = bodyString(body, "profile");
  if (profileRaw !== undefined && !asProfile(profileRaw)) {
    return badRequest("morbraii", "encode", `unknown profile "${profileRaw}" — use standard or morbrai.`);
  }
  const nodeRaw = bodyString(body, "node");
  if (nodeRaw !== undefined && !asNode(nodeRaw)) {
    return badRequest("morbraii", "encode", `unknown node "${nodeRaw}" — use one of ${NODE_IDS.join(", ")}.`);
  }

  const timing = resolveTiming(profileRaw, bodyNumber(body, "wpm"), bodyNumber(body, "unitMs"));
  if ("error" in timing) return badRequest("morbraii", "encode", timing.error);

  const node = asNode(nodeRaw) ?? "vibration";
  const schedule = encodeMessage(raw, timing.timing);
  const timeline = timelineOf(schedule, timing.timing);
  const profile = PROFILES.find((p) => p.id === timing.timing.profile)!;

  return ok("morbraii", "encode", {
    text: schedule.text,
    tokens: schedule.tokens,
    node,
    profile: {
      id: timing.timing.profile,
      label: profile.label,
      itu: profile.itu,
      detail: profile.detail,
      unitMs: timing.timing.unitMs,
      wpm: Math.round(timing.timing.wpm * 100) / 100,
      dotMs: timing.timing.dotMs,
      dashMs: timing.timing.dashMs,
      elementGapMs: timing.timing.elementGapMs,
      letterGapMs: timing.timing.letterGapMs,
      wordGapMs: timing.timing.wordGapMs,
      gapsInUnits: profile.gapsInUnits,
    },
    morse: schedule.letters.map((l) => ({ letter: l.letter, morse: l.morse })),
    braille: schedule.letters.map((l) => ({ letter: l.letter, dots: l.braille })),
    pitches: schedule.letters.map((l) => ({ letter: l.letter, note: noteOf(l.letter), hz: l.hz })),
    handshapes: handshapesOf(schedule),
    schedule,
    timeline,
    output: nodeOutput(node, schedule, timing.timing, timeline),
    honesty: HONESTY,
  });
}

function scheduleReply(body: Record<string, unknown>): Reply {
  const raw = bodyString(body, "text");
  if (raw === undefined || raw.trim() === "") {
    return badRequest("morbraii", "schedule", 'schedule needs text: { "text": "MIRACLE" }.');
  }
  if (!tokenize(raw).length) {
    return badRequest("morbraii", "schedule", `"${raw}" has no A-Z letters to encode.`);
  }

  const profileRaw = bodyString(body, "profile");
  if (profileRaw !== undefined && !asProfile(profileRaw)) {
    return badRequest("morbraii", "schedule", `unknown profile "${profileRaw}" — use standard or morbrai.`);
  }

  const timing = resolveTiming(profileRaw, bodyNumber(body, "wpm"), bodyNumber(body, "unitMs"));
  if ("error" in timing) return badRequest("morbraii", "schedule", timing.error);

  const schedule = encodeMessage(raw, timing.timing);
  return ok("morbraii", "schedule", {
    text: schedule.text,
    tokens: schedule.tokens,
    profile: {
      id: timing.timing.profile,
      unitMs: timing.timing.unitMs,
      wpm: Math.round(timing.timing.wpm * 100) / 100,
      dotMs: timing.timing.dotMs,
      dashMs: timing.timing.dashMs,
      elementGapMs: timing.timing.elementGapMs,
      letterGapMs: timing.timing.letterGapMs,
      wordGapMs: timing.timing.wordGapMs,
    },
    totalMs: schedule.totalMs,
    elements: timelineOf(schedule, timing.timing),
  });
}

export const morbraiiAdapter: ServiceAdapter = {
  name: "morbraii",
  status: "live",
  actions: ["nodes", "encode", "schedule", "identity"],
  blurb:
    "Morbraii — cross-communication: one message out as vibration, light, tone, Braille or ASL handshapes. Identity is still planned.",
  call: (action, input) => {
    switch (action) {
      case "nodes":
        return nodesReply();
      case "encode":
        return encodeReply(input.body);
      case "schedule":
        return scheduleReply(input.body);
      default:
        // identity — real on Morbraii's roadmap, not built here yet. The
        // service itself is live, so the message says which parts are not.
        return fail(
          "morbraii",
          action,
          "not_connected",
          "morbraii's identity layer is not built yet — nodes, encode and schedule are live.",
          503,
        );
    }
  },
};
