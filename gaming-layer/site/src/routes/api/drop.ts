import { createFileRoute } from "@tanstack/react-router";
import fs from "node:fs/promises";
import path from "node:path";

const DIR = "/home/team/shared/Documents/Shared/drop";
const KEY_FILE = `${DIR}/.dropkey`;
const ALLOWED_EXT = [".txt", ".md", ".json", ".csv"];
const MAX_BYTES = 2 * 1024 * 1024;

const WORDS_A = [
  "albatross",
  "heron",
  "kestrel",
  "otter",
  "marten",
  "puffin",
  "badger",
  "loon",
  "osprey",
  "shrike",
  "wren",
  "gull",
  "beaver",
  "falcon",
  "magpie",
  "pelican",
  "stoat",
  "tern",
  "ibis",
  "crane",
];
const WORDS_B = [
  "shoebill",
  "driftwood",
  "lantern",
  "copper",
  "harbour",
  "cobble",
  "thicket",
  "tundra",
  "marlin",
  "quartz",
  "willow",
  "basalt",
  "kelp",
  "ripple",
  "spindle",
  "bramble",
  "ember",
  "juniper",
  "moss",
  "reed",
];

function suggestKey(): string {
  const a = WORDS_A[Math.floor(Math.random() * WORDS_A.length)];
  const b = WORDS_B[Math.floor(Math.random() * WORDS_B.length)];
  return `${a}-${b}`;
}

function extAllowed(name: string): boolean {
  const lower = String(name || "").toLowerCase();
  return ALLOWED_EXT.some((e) => lower.endsWith(e));
}

function cleanName(raw: string, fallback = "paste.txt"): string {
  let n = String(raw || "")
    .trim()
    .split(/[\\/]/)
    .pop();
  n = (n || "").replace(/[^A-Za-z0-9._ -]+/g, "_").trim().replace(/^[._\s]+/, "");
  if (n.length > 120) n = n.slice(0, 120);
  if (!n) n = fallback;
  if (!extAllowed(n)) n = n + ".txt";
  return n;
}

async function storedKey(): Promise<string> {
  try {
    return (await fs.readFile(KEY_FILE, "utf8")).trim();
  } catch {
    return "";
  }
}

async function keyOk(key: unknown): Promise<boolean> {
  const stored = await storedKey();
  return stored.length > 0 && stored === String(key ?? "").trim();
}

async function uniquePath(name: string): Promise<string> {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let candidate = path.join(DIR, name);
  let i = 1;
  for (;;) {
    try {
      await fs.access(candidate);
      candidate = path.join(DIR, `${stem}_${i}${ext}`);
      i += 1;
      if (i > 500) throw new Error("too many duplicates");
    } catch {
      return candidate;
    }
  }
}

const badKey = { ok: false, error: "That DropKey does not match." };

export const Route = createFileRoute("/api/drop")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        await fs.mkdir(DIR, { recursive: true });
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        const action = String(body?.action || "");

        if (action === "status") {
          const stored = await storedKey();
          let count = 0;
          try {
            const names = await fs.readdir(DIR);
            count = names.filter((n) => !n.startsWith(".") && extAllowed(n)).length;
          } catch {
            count = 0;
          }
          return Response.json({ ok: true, hasKey: stored.length > 0, count });
        }

        if (action === "mint") {
          const existing = await storedKey();
          const current = String(body?.currentKey ?? "").trim();
          if (existing && current !== existing) {
            return Response.json({
              ok: false,
              error: "Enter the current DropKey first — it is needed to replace it.",
            });
          }
          const custom = String(body?.custom ?? "").trim();
          const next = custom || suggestKey();
          if (next.length < 6) {
            return Response.json({ ok: false, error: "A DropKey needs at least 6 characters." });
          }
          if (/\s/.test(next)) {
            return Response.json({ ok: false, error: "A DropKey cannot contain spaces." });
          }
          await fs.writeFile(KEY_FILE, next + "\n", { mode: 0o600 });
          return Response.json({ ok: true, key: next });
        }

        if (!(await keyOk(body?.key))) return Response.json(badKey);

        if (action === "list") {
          const names = await fs.readdir(DIR);
          const files: { name: string; size: number; mtime: string }[] = [];
          for (const n of names) {
            if (n.startsWith(".") || !extAllowed(n)) continue;
            try {
              const st = await fs.stat(path.join(DIR, n));
              if (!st.isFile()) continue;
              const d = new Date(st.mtime);
              const p = (x: number) => String(x).padStart(2, "0");
              files.push({
                name: n,
                size: st.size,
                mtime: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`,
              });
            } catch {
              /* skip unreadable entry */
            }
          }
          files.sort((a, b) =>
            a.mtime < b.mtime ? 1 : a.mtime > b.mtime ? -1 : a.name.localeCompare(b.name),
          );
          return Response.json({ ok: true, files });
        }

        if (action === "upload") {
          const saved: string[] = [];
          const errors: string[] = [];
          const list: any[] = Array.isArray(body?.files) ? body.files : [];
          for (const f of list) {
            const rawName = String(f?.name || "");
            if (!extAllowed(rawName)) {
              errors.push(`${rawName || "(unnamed)"} — only .txt, .md, .json, .csv are accepted`);
              continue;
            }
            let buf: Buffer;
            try {
              buf = Buffer.from(String(f?.contentBase64 || ""), "base64");
            } catch {
              errors.push(`${rawName} — could not read the file contents`);
              continue;
            }
            if (buf.length === 0) {
              errors.push(`${rawName} — the file is empty`);
              continue;
            }
            if (buf.length > MAX_BYTES) {
              errors.push(`${rawName} — over the 2 MB limit`);
              continue;
            }
            const target = await uniquePath(cleanName(rawName, "upload.txt"));
            await fs.writeFile(target, buf);
            saved.push(path.basename(target));
          }
          return Response.json({ ok: errors.length === 0, saved, errors });
        }

        if (action === "saveText") {
          const text = String(body?.text ?? "");
          if (!text.trim()) return Response.json({ ok: false, error: "The text box is empty." });
          const buf = Buffer.from(text, "utf8");
          if (buf.length > MAX_BYTES) {
            return Response.json({ ok: false, error: "That text is over the 2 MB limit." });
          }
          const target = await uniquePath(cleanName(body?.name, "paste.txt"));
          await fs.writeFile(target, buf);
          return Response.json({ ok: true, name: path.basename(target) });
        }

        if (action === "delete") {
          const name = String(body?.name ?? "");
          if (!name || name.includes("/") || name.includes("\\") || name.startsWith(".")) {
            return Response.json({ ok: false, error: "That file name is not allowed." });
          }
          if (!extAllowed(name)) {
            return Response.json({ ok: false, error: "That file type is not managed here." });
          }
          try {
            await fs.unlink(path.join(DIR, name));
            return Response.json({ ok: true });
          } catch {
            return Response.json({ ok: false, error: "That file is no longer in the folder." });
          }
        }

        if (action === "download") {
          const name = String(body?.name ?? "");
          if (!name || name.includes("/") || name.includes("\\") || name.startsWith(".")) {
            return Response.json({ ok: false, error: "That file name is not allowed." });
          }
          try {
            const buf = await fs.readFile(path.join(DIR, name));
            return Response.json({ ok: true, name, contentBase64: buf.toString("base64") });
          } catch {
            return Response.json({ ok: false, error: "That file is no longer in the folder." });
          }
        }

        return Response.json({ ok: false, error: `Unknown action: ${action}` });
      },
    },
  },
});
