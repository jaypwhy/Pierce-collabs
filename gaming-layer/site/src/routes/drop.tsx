import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

const ALLOWED_EXT = [".txt", ".md", ".json", ".csv"];
const MAX_BYTES = 2 * 1024 * 1024;
const SESSION_KEY = "team-drop-key";

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

type DropFile = { name: string; size: number; mtime: string };

function suggestKey(): string {
  const a = WORDS_A[Math.floor(Math.random() * WORDS_A.length)];
  const b = WORDS_B[Math.floor(Math.random() * WORDS_B.length)];
  return `${a}-${b}`;
}

function extAllowed(name: string): boolean {
  const lower = String(name || "").toLowerCase();
  return ALLOWED_EXT.some((e) => lower.endsWith(e));
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, type: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

async function call(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  const res = await fetch("/api/drop", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error(`server returned ${res.status}`);
  return res.json();
}

export const Route = createFileRoute("/drop")({
  component: DropPage,
});

function DropPage() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [freshKey, setFreshKey] = useState("");
  const [files, setFiles] = useState<DropFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pasteName, setPasteName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const sessionKey = () => {
    try {
      return sessionStorage.getItem(SESSION_KEY) || "";
    } catch {
      return "";
    }
  };

  const refresh = useCallback(async (key: string) => {
    try {
      const res = await call("list", { key });
      if (res.ok) {
        setFiles(res.files as DropFile[]);
        return true;
      }
      setMessage({ kind: "err", text: res.error || "Could not read the folder." });
      return false;
    } catch {
      setMessage({ kind: "err", text: "Could not reach the server. Refresh and try again." });
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const st = await call("status");
        setHasKey(!!st.hasKey);
        const stored = sessionKey();
        if (st.hasKey && stored) {
          const ok = await refresh(stored);
          if (ok) {
            setUnlocked(true);
            return;
          }
          try {
            sessionStorage.removeItem(SESSION_KEY);
          } catch {
            /* ignore */
          }
        }
      } catch {
        setHasKey(true);
        setMessage({ kind: "err", text: "Could not reach the server. Refresh and try again." });
      }
    })();
  }, [refresh]);

  const unlock = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setBusy(true);
    setMessage(null);
    const ok = await refresh(key);
    setBusy(false);
    if (ok) {
      try {
        sessionStorage.setItem(SESSION_KEY, key);
      } catch {
        /* ignore */
      }
      setUnlocked(true);
      setKeyInput("");
    }
  };

  const mint = async (custom?: string) => {
    setBusy(true);
    setMessage(null);
    const currentKey = unlocked ? sessionKey() : keyInput.trim();
    try {
      const res = await call("mint", { currentKey, custom: custom || "" });
      if (!res.ok || !res.key) {
        setMessage({ kind: "err", text: res.error || "Could not create a DropKey." });
        return;
      }
      try {
        sessionStorage.setItem(SESSION_KEY, res.key);
      } catch {
        /* ignore */
      }
      setFreshKey(res.key);
      setHasKey(true);
      setUnlocked(true);
      setCustomKey("");
      await refresh(res.key);
    } catch {
      setMessage({ kind: "err", text: "Could not reach the server. Refresh and try again." });
    } finally {
      setBusy(false);
    }
  };

  const upload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setMessage(null);
    const payload: { name: string; contentBase64: string }[] = [];
    const rejected: string[] = [];
    for (const f of Array.from(list)) {
      if (!extAllowed(f.name)) {
        rejected.push(`${f.name} — only .txt, .md, .json, .csv are accepted`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        rejected.push(`${f.name} — ${fmtSize(f.size)} is over the 2 MB limit`);
        continue;
      }
      const buf = new Uint8Array(await f.arrayBuffer());
      payload.push({ name: f.name, contentBase64: bytesToBase64(buf) });
    }
    let saved: string[] = [];
    try {
      if (payload.length > 0) {
        const res = await call("upload", { key: sessionKey(), files: payload });
        if (res.error) setMessage({ kind: "err", text: res.error });
        saved = (res.saved as string[]) || [];
        rejected.push(...((res.errors as string[]) || []));
      }
    } catch {
      setMessage({ kind: "err", text: "Could not reach the server. Refresh and try again." });
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (saved.length > 0) {
      setMessage({
        kind: rejected.length ? "err" : "ok",
        text: `Saved ${saved.join(", ")}.` + (rejected.length ? ` Not saved: ${rejected.join("; ")}` : ""),
      });
    } else if (rejected.length) {
      setMessage({ kind: "err", text: `Nothing saved. ${rejected.join("; ")}` });
    }
    await refresh(sessionKey());
  };

  const saveText = async () => {
    if (!pasteText.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await call("saveText", {
        key: sessionKey(),
        name: pasteName,
        text: pasteText,
      });
      if (res.ok && res.name) {
        setMessage({ kind: "ok", text: `Saved ${res.name}.` });
        setPasteName("");
        setPasteText("");
        await refresh(sessionKey());
      } else {
        setMessage({ kind: "err", text: res.error || "Could not save that text." });
      }
    } catch {
      setMessage({ kind: "err", text: "Could not reach the server. Refresh and try again." });
    } finally {
      setBusy(false);
    }
  };

  const download = async (name: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await call("download", { key: sessionKey(), name });
      if (!res.ok || !res.contentBase64) {
        setMessage({ kind: "err", text: res.error || "Could not fetch that file." });
        return;
      }
      const url = URL.createObjectURL(base64ToBlob(res.contentBase64, "text/plain;charset=utf-8"));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setMessage({ kind: "err", text: "Could not reach the server. Refresh and try again." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (name: string) => {
    if (!window.confirm(`Delete ${name} from the folder?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await call("delete", { key: sessionKey(), name });
      if (res.ok) {
        setMessage({ kind: "ok", text: `Deleted ${name}.` });
        await refresh(sessionKey());
      } else {
        setMessage({ kind: "err", text: res.error || "Could not delete that file." });
      }
    } catch {
      setMessage({ kind: "err", text: "Could not reach the server. Refresh and try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Internal — not linked from the site
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Send files to the team</h1>
        <p className="mt-3 leading-relaxed text-slate-600">
          Drop files here and the team picks them up from the shared folder. Plain text only for now —
          .txt, .md, .json, .csv, up to 2 MB each.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold">Your DropKey</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter it once per visit. You can mint a new one any time — the old key stops working
            immediately, so tell the team the new one.
          </p>

          {hasKey === null ? (
            <p className="mt-3 text-sm text-slate-400">checking…</p>
          ) : unlocked ? (
            <p className="mt-3 text-sm font-medium text-emerald-700">Unlocked for this visit.</p>
          ) : hasKey ? (
            <>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") unlock();
                }}
                placeholder="albatross-shoebill"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
              <button
                type="button"
                onClick={unlock}
                disabled={busy || !keyInput.trim()}
                className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Unlock
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No DropKey exists yet. Create the first one — it is shown once, so save it.
            </p>
          )}

          {freshKey ? (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                Your new DropKey
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-emerald-900">{freshKey}</p>
              <p className="mt-1 text-xs text-emerald-800">Save it now — it is not shown again.</p>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => mint()}
              disabled={busy || (!unlocked && hasKey === true && !keyInput.trim())}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Create a new DropKey
            </button>
            <button
              type="button"
              onClick={() => setCustomKey(suggestKey())}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
            >
              suggest one
            </button>
            <input
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="or type your own"
              className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            <button
              type="button"
              onClick={() => mint(customKey.trim())}
              disabled={
                busy ||
                customKey.trim().length < 6 ||
                (!unlocked && hasKey === true && !keyInput.trim())
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-40"
            >
              use this key
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Replacing an existing key needs the current one, so nobody can lock you out.
          </p>
        </section>

        {message ? (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              message.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        {unlocked ? (
          <>
            <section className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6">
              <h2 className="text-sm font-semibold">Upload files</h2>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".txt,.json,.md,.csv,text/plain,application/json,text/markdown,text/csv"
                onChange={(e) => upload(e.target.files)}
                disabled={busy}
                className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
              />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold">…or paste it</h2>
              <input
                value={pasteName}
                onChange={(e) => setPasteName(e.target.value)}
                placeholder="file name, e.g. strategies.txt"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
              <textarea
                rows={8}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="paste the text here"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-slate-900"
              />
              <button
                type="button"
                onClick={saveText}
                disabled={busy || !pasteText.trim()}
                className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Save this text
              </button>
            </section>

            <section className="mt-10 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">In the folder ({files.length})</h2>
                <button
                  type="button"
                  onClick={() => refresh(sessionKey())}
                  disabled={busy}
                  className="text-xs font-medium text-slate-500 underline"
                >
                  refresh
                </button>
              </div>
              {files.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">Nothing here yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {files.map((f) => (
                    <li key={f.name} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate" title={f.name}>
                        {f.name}
                      </span>
                      <span className="shrink-0 text-slate-400">
                        {fmtSize(f.size)} · {f.mtime}
                      </span>
                      <span className="shrink-0 space-x-2">
                        <button
                          type="button"
                          onClick={() => download(f.name)}
                          disabled={busy}
                          className="text-xs font-medium text-slate-700 underline"
                        >
                          download
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(f.name)}
                          disabled={busy}
                          className="text-xs font-medium text-rose-700 underline"
                        >
                          delete
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <p className="mt-6 text-sm text-slate-400">
            Uploads and the file list appear once the DropKey is entered.
          </p>
        )}
      </main>
    </div>
  );
}
