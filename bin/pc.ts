#!/usr/bin/env bun
/**
 * `pc` — the Pierce Collabs CLI.
 *
 * It talks to /api/v1 over HTTP and nothing else, so the same command works
 * against the working site, the live site or a local instance (`--api <url>`).
 * Every service answers in one envelope, so this file formats envelopes rather
 * than knowing each service.
 *
 *   pc services · balance · sip · drip · convert <points> · ladder · art list
 *   pc morbraii nodes · pc morbraii encode "MIRACLE" · pc morbraii schedule "MIRACLE"
 *   pc ruhbi ledger  (planned — says so, exits 3)
 *
 * Flags: --json, --api <url>, --help. Exit: 0 ok · 1 error · 2 bad usage · 3 not connected.
 */

const DEFAULT_API = "https://d6fba97f0124d530d64629080c843c5e-dev.cto.site";

const EXIT_OK = 0;
const EXIT_ERROR = 1;
const EXIT_USAGE = 2;
const EXIT_NOT_CONNECTED = 3;

type Envelope =
  | { ok: true; service: string; action: string; data: any }
  | { ok: false; service: string; action: string; error: { code: string; message: string } };

type Flags = {
  json: boolean;
  help: boolean;
  api: string;
  values: Record<string, string>;
};

const VALUE_FLAGS = new Set([
  "api",
  "points",
  "note",
  "name",
  "media",
  "thumb",
  "body",
  "text",
  "profile",
  "node",
  "wpm",
  "unit",
]);

class UsageError extends Error {}

function parseArgs(argv: string[]): { flags: Flags; words: string[] } {
  const flags: Flags = {
    json: false,
    help: false,
    api: process.env.PC_API?.trim() || DEFAULT_API,
    values: {},
  };
  const words: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      words.push(...argv.slice(i + 1));
      break;
    }
    if (arg === "--json") {
      flags.json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
      if (!VALUE_FLAGS.has(name)) throw new UsageError(`Unknown flag --${name}.`);
      let value: string;
      if (eq !== -1) {
        value = arg.slice(eq + 1);
      } else {
        value = argv[i + 1];
        if (value === undefined) throw new UsageError(`--${name} needs a value.`);
        i++;
      }
      if (name === "api") flags.api = value;
      else flags.values[name] = value;
      continue;
    }
    words.push(arg);
  }

  return { flags, words };
}

type Command = {
  /** The words that select this command, e.g. ["art", "list"]. */
  words: string[];
  method: "GET" | "POST";
  path: string;
  service: string;
  action: string;
  usage: string;
  summary: string;
  /** The request body for a POST, or undefined for a GET. */
  body?: (flags: Flags, rest: string[]) => Record<string, unknown>;
};

const COMMANDS: Command[] = [
  {
    words: ["services"],
    method: "GET",
    path: "/api/v1/services",
    service: "registry",
    action: "services",
    usage: "pc services",
    summary: "Every service in the ecosystem, with its status and actions.",
  },
  {
    words: ["balance"],
    method: "GET",
    path: "/api/v1/upayu/balance",
    service: "upayu",
    action: "balance",
    usage: "pc balance",
    summary: "Points, Pi Algo dollars and the saved pieces on the one account.",
  },
  {
    words: ["sip"],
    method: "POST",
    path: "/api/v1/upayu/sip",
    service: "upayu",
    action: "sip",
    usage: "pc sip [--points 5] [--note \"...\"]",
    summary: "Points into the account — +5 by default.",
    body: (flags) => ({
      points: Number(flags.values.points ?? 5),
      note: flags.values.note ?? "pc sip",
    }),
  },
  {
    words: ["drip"],
    method: "POST",
    path: "/api/v1/upayu/drip",
    service: "upayu",
    action: "drip",
    usage: "pc drip",
    summary: "The base-income drip: +25 points, one per 60-second cooldown.",
    body: () => ({}),
  },
  {
    words: ["convert"],
    method: "POST",
    path: "/api/v1/upayu/convert",
    service: "upayu",
    action: "convert",
    usage: "pc convert <points>",
    summary: "Convert points to dollars at the Pi Algo: floor(π × 100 × points²).",
    body: (flags, rest) => {
      const raw = rest[0] ?? flags.values.points;
      const points = Number(raw);
      if (raw === undefined || !Number.isFinite(points) || points < 1) {
        throw new UsageError("convert needs a number of points: pc convert <points>");
      }
      return { points };
    },
  },
  {
    words: ["ladder"],
    method: "GET",
    path: "/api/v1/upayu/ladder",
    service: "upayu",
    action: "ladder",
    usage: "pc ladder",
    summary: "The pi ladder — the same rule at 1, 10, 100 and 1,000 points.",
  },
  {
    words: ["art", "list"],
    method: "GET",
    path: "/api/v1/art/pieces",
    service: "art",
    action: "list",
    usage: "pc art list",
    summary: "Every saved piece, newest first.",
  },
  {
    words: ["art", "save"],
    method: "POST",
    path: "/api/v1/art/save",
    service: "art",
    action: "save",
    usage: "pc art save --name \"Vase\" --media \"Pottery wheel\" [--thumb <data-url>]",
    summary: "Save a piece; it earns its points into the same account.",
    body: (flags) => {
      const name = flags.values.name;
      const media = flags.values.media;
      if (!name || !media) throw new UsageError("art save needs --name and --media.");
      return { name, media, thumb: flags.values.thumb };
    },
  },
  {
    words: ["ruhbi", "ledger"],
    method: "GET",
    path: "/api/v1/ruhbi/ledger",
    service: "ruhbi",
    action: "ledger",
    usage: "pc ruhbi ledger",
    summary: "Planned — the RUHBI ledger does not exist yet.",
  },
  {
    words: ["morbraii", "nodes"],
    method: "GET",
    path: "/api/v1/morbraii/nodes",
    service: "morbraii",
    action: "nodes",
    usage: "pc morbraii nodes",
    summary: "What Morbraii can output — every node, what it carries and its limit.",
  },
  {
    words: ["morbraii", "encode"],
    method: "POST",
    path: "/api/v1/morbraii/encode",
    service: "morbraii",
    action: "encode",
    usage:
      'pc morbraii encode "TEXT" [--profile standard|morbrai] [--node vibration|light|tone|braille|handshapes|text] [--wpm 5|8|12] [--unit 100|150|200|240]',
    summary: "A message in: Morse, Braille cells, pitches, handshapes and the timed schedule out.",
    body: (flags, rest) => morbraiiBody("encode", flags, rest),
  },
  {
    words: ["morbraii", "schedule"],
    method: "POST",
    path: "/api/v1/morbraii/schedule",
    service: "morbraii",
    action: "schedule",
    usage: 'pc morbraii schedule "TEXT" [--profile standard|morbrai] [--wpm 5|8|12] [--unit 100|150|200|240]',
    summary: "The timed element list — when every dot and dash sounds and which gap follows it.",
    body: (flags, rest) => morbraiiBody("schedule", flags, rest),
  },
  {
    words: ["morbraii", "identity"],
    method: "GET",
    path: "/api/v1/morbraii/identity",
    service: "morbraii",
    action: "identity",
    usage: "pc morbraii identity",
    summary: "Planned — Morbraii's identity layer is not built yet.",
  },
  {
    words: ["mission", "complete"],
    method: "POST",
    path: "/api/v1/mission/complete",
    service: "mission",
    action: "complete",
    usage: "pc mission complete [--body '<json>']",
    summary: "Planned — there is no task list to complete against yet.",
    body: (flags) => parseJsonFlag(flags),
  },
  {
    words: ["acorn-tap", "deposit"],
    method: "POST",
    path: "/api/v1/acorn-tap/deposit",
    service: "acorn-tap",
    action: "deposit",
    usage: "pc acorn-tap deposit [--body '<json>']",
    summary: "Planned — nothing here moves money yet.",
    body: (flags) => parseJsonFlag(flags),
  },
];

const SERVICE_NAMES = ["upayu", "art", "sip-drip", "ruhbi", "morbraii", "mission", "acorn-tap"];

function parseJsonFlag(flags: Flags): Record<string, unknown> {
  const raw = flags.values.body;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    throw new UsageError("--body must be a JSON object.");
  }
}

/** The body Morbraii's encode and schedule both take: text plus the grid. */
function morbraiiBody(action: string, flags: Flags, rest: string[]): Record<string, unknown> {
  const text = rest.join(" ").trim() || flags.values.text;
  if (!text) throw new UsageError(`${action} needs text: pc morbraii ${action} "MIRACLE"`);
  const body: Record<string, unknown> = { text };
  if (flags.values.profile) body.profile = flags.values.profile;
  if (flags.values.node) body.node = flags.values.node;
  if (flags.values.wpm !== undefined) body.wpm = Number(flags.values.wpm);
  if (flags.values.unit !== undefined) body.unitMs = Number(flags.values.unit);
  return body;
}

function findCommand(words: string[]): Command | undefined {
  return COMMANDS.find((command) => command.words.every((word, i) => words[i] === word));
}

/**
 * Anything the table does not know: `pc <service> <action> [json]` goes straight
 * at /api/v1/<service>/<action>, so a new adapter works here before its
 * subcommand exists. A JSON argument means POST, otherwise GET.
 */
function genericCommand(words: string[]): Command | undefined {
  const [service, action] = words;
  if (!service || !SERVICE_NAMES.includes(service)) return undefined;
  if (!action || action.startsWith("-")) return undefined;
  const json = words[2];
  return {
    words: [service, action],
    method: json ? "POST" : "GET",
    path: `/api/v1/${service}/${action}`,
    service,
    action,
    usage: `pc ${service} ${action}${json ? " <json>" : ""}`,
    summary: `${service} · ${action}`,
    body: json
      ? () => {
          try {
            return JSON.parse(json) as Record<string, unknown>;
          } catch {
            throw new UsageError("That argument must be a JSON object.");
          }
        }
      : undefined,
  };
}

function money(dollars: number): string {
  return `$${Math.round(dollars).toLocaleString("en-US")}`;
}

function count(points: number): string {
  return points.toLocaleString("en-US");
}

function formatServices(data: any): string {
  const lines = [`${data.count} services · ${data.live} live · ${data.planned} planned`, ""];
  for (const service of data.services) {
    const actions = service.actions.length ? service.actions.join(", ") : "uses upayu";
    lines.push(`${service.name.padEnd(11)} ${service.status.padEnd(8)} ${actions}`);
    lines.push(`${" ".repeat(12)}${service.blurb}`);
  }
  return lines.join("\n");
}

function formatBalance(data: any): string {
  const drip = data.drip.ready
    ? `ready (+${data.drip.points})`
    : `ready in ${Math.ceil(data.drip.remainingMs / 1000)}s`;
  return [
    "UPayU balance",
    `  points    ${count(data.points)}`,
    `  Pi Algo   ${money(data.dollarValue)}   (${data.conversion.formula})`,
    `  settled   ${money(data.dollars)}`,
    `  total     ${money(data.totalValue)}`,
    `  pieces    ${data.pieces}`,
    `  drip      ${drip}`,
  ].join("\n");
}

function formatChange(data: any): string {
  const lines = [data.message ?? "Done."];
  if (typeof data.points === "number") {
    lines.push(`points ${count(data.points)} · Pi Algo ${money(data.dollarValue)} · pieces ${data.pieces}`);
  }
  return lines.join("\n");
}

function formatLadder(data: any): string {
  const lines = [`Pi Algo — ${data.formula}`, ""];
  for (const rung of data.rungs) {
    lines.push(`${count(rung.points).padStart(6)} pts  ${money(rung.dollars)}`);
  }
  return lines.join("\n");
}

function formatPieces(data: any): string {
  if (!data.count) return "No pieces saved yet — the art studio is at /art.";
  const lines = [`${data.count} ${data.count === 1 ? "piece" : "pieces"}`, ""];
  for (const piece of data.pieces) {
    lines.push(`${piece.name} — ${piece.media} · ${count(piece.points)} pts · ${piece.at.slice(0, 10)}`);
  }
  return lines.join("\n");
}

function formatArtSaved(data: any): string {
  return [data.message ?? "Saved.", `${data.piece?.name ?? "Piece"} · points ${count(data.points)}`].join("\n");
}

function formatMorbraiiNodes(data: any): string {
  const lines = [
    `${data.nodes.length} nodes — one message, whichever one a person can receive on`,
    "",
  ];
  for (const node of data.nodes) {
    lines.push(`${node.id.padEnd(11)} ${node.name}`);
    lines.push(`${" ".repeat(12)}${node.output}`);
    lines.push(`${" ".repeat(12)}carries: ${node.carries}`);
    lines.push(`${" ".repeat(12)}limit:   ${node.limit}`);
    lines.push("");
  }
  for (const profile of data.profiles) {
    lines.push(`${profile.id.padEnd(11)} ${profile.label}`);
    lines.push(`${" ".repeat(12)}${profile.detail}`);
  }
  return lines.join("\n");
}

function formatMorbraiiTimeline(elements: any[]): string[] {
  return elements.map(
    (el) =>
      `  ${String(el.atMs).padStart(6)} ms  ${el.letter}  ${el.symbol === "." ? "·" : "▬"} ${String(el.durationMs).padStart(4)} ms` +
      (el.gapAfter === "none"
        ? "  no gap after"
        : `  gap ${String(el.gapAfterMs).padStart(4)} ms (${el.gapAfter})`) +
      `  ${el.hz} Hz`,
  );
}

function formatMorbraiiSchedule(data: any): string {
  const p = data.profile;
  return [
    `${data.text} · ${p.id} · unit ${p.unitMs} ms · ${p.wpm} wpm · ${data.elements.length} elements · ${data.totalMs} ms`,
    `  dot ${p.dotMs} · dash ${p.dashMs} · element gap ${p.elementGapMs} · letter gap ${p.letterGapMs} · word gap ${p.wordGapMs}`,
    "",
    ...formatMorbraiiTimeline(data.elements),
  ].join("\n");
}

function formatMorbraiiEncode(data: any): string {
  const p = data.profile;
  const lines = [
    `${data.text} · ${p.label} · unit ${p.unitMs} ms · ${p.wpm} wpm · ${data.schedule.letters.length} letters · ${data.schedule.totalMs} ms · node ${data.node}`,
    `  dot ${p.dotMs} · dash ${p.dashMs} · element gap ${p.elementGapMs} · letter gap ${p.letterGapMs} · word gap ${p.wordGapMs}`,
    "",
  ];
  for (const letter of data.morse) {
    const pitch = data.pitches.find((x: any) => x.letter === letter.letter);
    const braille = data.braille.find((x: any) => x.letter === letter.letter);
    const shape = data.handshapes.find((x: any) => x.letter === letter.letter);
    lines.push(
      `  ${letter.letter}  ${letter.morse.padEnd(5)} braille ${braille.dots.join("·").padEnd(11)} ${pitch.note.padEnd(3)} ${String(pitch.hz).padStart(7)} Hz` +
        (shape?.motion ? `  (${shape.motion.toUpperCase()} — motion letter)` : ""),
    );
  }
  lines.push("", ...formatMorbraiiTimeline(data.timeline));
  const out = data.output;
  if (data.node === "vibration") lines.push("", `  vibration pattern: [${out.pattern.join(", ")}] ms`);
  if (data.node === "light") lines.push("", `  ${out.steps.length} light steps · colour sets: ${out.colourSets.map((c: any) => c.id).join(", ")}`);
  if (data.node === "tone")
    lines.push(
      "",
      `  pitches: ${out.pitches.map((x: any) => `${x.letter}=${x.note}`).join(" ")}`,
      `  carrier: swell ${out.deliveries[1].swell} · dip ${out.deliveries[1].dipRatio} (${out.deliveries[1].dipDb} dB) · never silent`,
    );
  if (data.node === "braille")
    lines.push("", `  cells: ${out.cells.map((c: any) => `${c.letter} ${c.dots.join("·")}`).join("   ")}`);
  if (data.node === "handshapes")
    lines.push("", `  handshapes: ${out.sequence.map((s: any) => s.letter).join(" ")}`);
  if (data.node === "text") lines.push("", `  text: ${out.text}`);
  return lines.join("\n");
}

function format(command: Command, data: any): string {
  if (command.service === "registry") return formatServices(data);
  if (command.service === "morbraii") {
    if (command.action === "nodes") return formatMorbraiiNodes(data);
    if (command.action === "encode") return formatMorbraiiEncode(data);
    if (command.action === "schedule") return formatMorbraiiSchedule(data);
  }
  if (command.action === "balance") return formatBalance(data);
  if (command.action === "ladder") return formatLadder(data);
  if (command.action === "list") return formatPieces(data);
  if (command.action === "save") return formatArtSaved(data);
  if (command.action === "sip" || command.action === "drip" || command.action === "convert") {
    return formatChange(data);
  }
  return JSON.stringify(data, null, 2);
}

function rootHelp(): string {
  return [
    "pc — the Pierce Collabs CLI",
    "",
    "Usage: pc <command> [flags]",
    "",
    ...COMMANDS.map((command) => `  ${command.usage.padEnd(52)} ${command.summary}`),
    "",
    "Flags:",
    "  --json          raw envelope, for scripts and other agents",
    "  --api <url>     target instance (default: the working site)",
    "  --help          this list, or help for one command",
    "",
    "Exit: 0 ok · 1 error · 2 bad usage · 3 service not connected",
  ].join("\n");
}

function commandHelp(command: Command): string {
  return [
    `pc ${command.words.join(" ")} — ${command.summary}`,
    "",
    `Usage: ${command.usage}`,
    "",
    `${command.method} ${command.path}`,
    "",
    "Flags: --json · --api <url> · --help",
  ].join("\n");
}

async function request(command: Command, flags: Flags, rest: string[]): Promise<Envelope> {
  const url = `${flags.api.replace(/\/+$/, "")}${command.path}`;
  const init: RequestInit = {
    method: command.method,
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  };
  if (command.method === "POST") {
    init.headers = { ...init.headers, "content-type": "application/json" };
    init.body = JSON.stringify(command.body ? command.body(flags, rest) : {});
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new Error(`Could not reach ${flags.api} — ${(error as Error).message}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as Envelope;
  } catch {
    throw new Error(`${command.method} ${command.path} answered ${response.status}, not an envelope.`);
  }
}

async function main(): Promise<number> {
  let parsed: { flags: Flags; words: string[] };
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`${error.message}\n\n${rootHelp()}`);
      return EXIT_USAGE;
    }
    throw error;
  }

  const { flags, words } = parsed;

  if (!words.length) {
    console.log(rootHelp());
    return flags.help ? EXIT_OK : EXIT_USAGE;
  }

  const command = findCommand(words) ?? genericCommand(words);

  if (!command) {
    if (words[0] === "sip-drip") {
      console.error("sip-drip has no actions of its own — use `pc sip` and `pc drip`.");
      return EXIT_USAGE;
    }
    console.error(`No such command: ${words.join(" ")}\n\n${rootHelp()}`);
    return EXIT_USAGE;
  }

  if (flags.help) {
    console.log(commandHelp(command));
    return EXIT_OK;
  }

  const rest = words.slice(command.words.length);

  let envelope: Envelope;
  try {
    envelope = await request(command, flags, rest);
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`${error.message}\n\nUsage: ${command.usage}`);
      return EXIT_USAGE;
    }
    console.error((error as Error).message);
    return EXIT_ERROR;
  }

  if (flags.json) {
    console.log(JSON.stringify(envelope, null, 2));
  } else if (envelope.ok) {
    console.log(format(command, envelope.data));
  } else {
    console.error(envelope.error.message);
  }

  if (envelope.ok) return EXIT_OK;
  return envelope.error.code === "not_connected" ? EXIT_NOT_CONNECTED : EXIT_ERROR;
}

export {};

process.exit(await main());
