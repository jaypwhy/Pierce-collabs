import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { listDrops, makeDropKey, rotateDropKey, saveDrop } from "~/lib/drop";
import type { DropFile } from "~/lib/drop";

export const Route = createFileRoute("/drop")({
  loader: async () => ({ files: await listDrops() }),
  component: DropPage,
});

function DropPage() {
  const { files } = Route.useLoaderData();
  const [key, setKey] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState<DropFile[]>(files);

  async function refresh() {
    try {
      setReceived(await listDrops());
    } catch {
      /* leave the old list up */
    }
  }

  async function send(entries: { name: string; content: string }[]) {
    if (!key.trim()) {
      setLog(["Enter the DropKey first."]);
      return;
    }
    setBusy(true);
    const lines: string[] = [];
    for (const entry of entries) {
      try {
        const result = await saveDrop({
          data: { key: key.trim(), name: entry.name, content: entry.content },
        });
        lines.push(
          result.ok
            ? `Saved ${result.name ?? entry.name} (${String(result.bytes ?? 0)} characters)`
            : `${entry.name || "file"}: ${result.error ?? "failed"}`,
        );
      } catch {
        lines.push(`${entry.name || "file"}: could not reach the server`);
      }
    }
    setBusy(false);
    setLog(lines);
    await refresh();
  }

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const entries: { name: string; content: string }[] = [];
    for (const file of Array.from(list)) {
      entries.push({ name: file.name, content: await file.text() });
    }
    await send(entries);
  }

  async function mint() {
    if (!key.trim()) {
      setLog(["Enter the current DropKey first — you need it to mint a new one."]);
      return;
    }
    setBusy(true);
    try {
      const result = await rotateDropKey({
        data: { currentKey: key.trim(), newKey: customKey.trim() },
      });
      if (result.ok && result.key) {
        setKey(result.key);
        setCustomKey("");
        setLog([`New DropKey: ${result.key} — it is live now. Old key stopped working.`]);
      } else {
        setLog([result.error ?? "Could not create a new key."]);
      }
    } catch {
      setLog(["Could not reach the server."]);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Internal — not linked from the site
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Send files to the team</h1>
        <p className="mt-3 leading-relaxed text-slate-600">
          Both directions: you drop files here, and the team leaves its notes in the same folder.
          Everything below lands in the shared uploads folder. Plain text only for now — .txt,
          .json, .md, .csv, up to 2 MB each.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold">Your DropKey</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter it once per visit. You can mint a new one any time — the old key stops working
            immediately, so tell the team the new one.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="albatross-shoebill"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void mint()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {busy ? "Working…" : "Create a new DropKey"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCustomKey(makeDropKey())}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-40"
            >
              suggest one
            </button>
            <input
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="or type your own"
              className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6">
          <h2 className="text-sm font-semibold">Upload files</h2>
          <input
            type="file"
            multiple
            accept=".txt,.json,.md,.csv,text/plain,application/json,text/markdown,text/csv"
            onChange={(e) => void onFiles(e.target.files)}
            disabled={busy}
            className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold">…or paste it</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="file name, e.g. strategies.txt"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="paste the text here"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-slate-900"
          />
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => {
              void send([{ name: name || "pasted.txt", content: text }]).then(() => {
                setText("");
                setName("");
              });
            }}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy ? "Sending…" : "Save this text"}
          </button>
        </section>

        {log.length > 0 && (
          <ul className="mt-6 space-y-1 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            {log.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}

        <section className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">In the folder ({received.length})</h2>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-xs font-medium text-slate-500 underline"
            >
              refresh
            </button>
          </div>
          {received.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nothing yet.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {received.map((file) => (
                <li key={file.name} className="flex justify-between gap-4">
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-slate-400">
                    {file.bytes} B · {file.modified}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
