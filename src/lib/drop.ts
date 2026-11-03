import { createServerFn } from "@tanstack/react-start";

export type DropResult = {
  ok: boolean;
  name?: string;
  bytes?: number;
  error?: string;
};

export type KeyResult = { ok: boolean; key?: string; error?: string };

export type DropFile = { name: string; bytes: number; modified: string };

const KEY_FILE = "/home/team/shared/.drop-key";
const UPLOAD_DIR = "/home/team/shared/uploads";
const MAX_BYTES = 2_000_000;

// Two-word keys, in the same shape as the owner's: albatross-shoebill.
const BIRDS = [
  "albatross",
  "shoebill",
  "kestrel",
  "petrel",
  "heron",
  "plover",
  "gannet",
  "curlew",
  "warbler",
  "fulmar",
  "bittern",
  "tern",
  "osprey",
  "merlin",
  "godwit",
  "sandpiper",
  "dunlin",
  "redshank",
  "shearwater",
  "skua",
  "puffin",
  "auklet",
  "crake",
  "avocet",
];

/** A fresh two-word DropKey. Safe on client and server. */
export function makeDropKey(): string {
  const a = BIRDS[Math.floor(Math.random() * BIRDS.length)] ?? "albatross";
  let b = BIRDS[Math.floor(Math.random() * BIRDS.length)] ?? "shoebill";
  if (b === a) b = BIRDS[(BIRDS.indexOf(a) + 1) % BIRDS.length] ?? "shoebill";
  return `${a}-${b}`;
}

type DropInput = { key: string; name: string; content: string };

export const saveDrop = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as DropInput)
  .handler(async ({ data }): Promise<DropResult> => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    let expected = "";
    try {
      expected = (await fs.readFile(KEY_FILE, "utf8")).trim();
    } catch {
      return { ok: false, error: "Drop is not configured on this server." };
    }
    if (!expected || (data?.key ?? "").trim() !== expected) {
      return { ok: false, error: "Wrong DropKey." };
    }
    const content = data?.content ?? "";
    if (typeof content !== "string" || content.length === 0) {
      return { ok: false, error: "Nothing to save — the file is empty." };
    }
    if (content.length > MAX_BYTES) {
      return { ok: false, error: "Too big (2 MB max per file)." };
    }

    const raw = (data?.name ?? "").trim() || "untitled.txt";
    const safe = path
      .basename(raw)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 120);
    if (!safe) return { ok: false, error: "Bad file name." };

    const finalName = safe.includes(".") ? safe : `${safe}.txt`;

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, finalName), content, "utf8");

    return { ok: true, name: finalName, bytes: content.length };
  });

type RotateInput = { currentKey: string; newKey?: string };

/** Mint a new DropKey. Requires the current one, so only a holder can rotate it. */
export const rotateDropKey = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as RotateInput)
  .handler(async ({ data }): Promise<KeyResult> => {
    const fs = await import("node:fs/promises");

    let expected = "";
    try {
      expected = (await fs.readFile(KEY_FILE, "utf8")).trim();
    } catch {
      return { ok: false, error: "Drop is not configured on this server." };
    }
    if (!expected || (data?.currentKey ?? "").trim() !== expected) {
      return { ok: false, error: "That isn't the current DropKey." };
    }

    const requested = (data?.newKey ?? "").trim().toLowerCase();
    if (requested && !/^[a-z0-9][a-z0-9-]{4,38}[a-z0-9]$/.test(requested)) {
      return {
        ok: false,
        error: "Keys are 6–40 characters: lowercase letters, numbers and dashes.",
      };
    }
    const next = requested || makeDropKey();

    try {
      await fs.writeFile(KEY_FILE, `${next}\n`, "utf8");
    } catch {
      return { ok: false, error: "Could not save the new key." };
    }
    return { ok: true, key: next };
  });

export const listDrops = createServerFn({ method: "GET" }).handler(
  async (): Promise<DropFile[]> => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    try {
      const names = await fs.readdir(UPLOAD_DIR);
      const out: DropFile[] = [];
      for (const name of names) {
        if (name.startsWith(".")) continue;
        const stat = await fs.stat(path.join(UPLOAD_DIR, name));
        if (!stat.isFile()) continue;
        out.push({
          name,
          bytes: stat.size,
          modified: stat.mtime.toISOString().slice(0, 16).replace("T", " "),
        });
      }
      return out.sort((a, b) => b.modified.localeCompare(a.modified));
    } catch {
      return [];
    }
  },
);
