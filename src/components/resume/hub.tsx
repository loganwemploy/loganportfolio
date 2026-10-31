"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { TopBar } from "@/components/backoffice/top-bar";
import { downloadPdf } from "@/lib/resume/pdf";
import { blankDoc } from "@/lib/resume/seeds";
import {
  addDoc,
  addVersion,
  deleteDoc,
  duplicateDoc,
  exportBackup,
  importBackup,
  restoreBuiltIns,
  useSaveError,
  useStudio,
} from "@/lib/resume/store";
import type { ResumeDoc, ResumeVersion } from "@/lib/resume/types";
import { editPath, errorText, formatWhen, plural } from "./format";
import { Sheet } from "./sheet";

type Status = { tone: "info" | "ok" | "error"; text: string };

const EMPTY: ResumeVersion[] = [];

const PILL =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium transition-colors disabled:opacity-50";
const DARK = `${PILL} bg-ink text-butter hover:bg-black`;
const OUTLINE = `${PILL} border border-ink/20 text-ink hover:border-ink hover:bg-white`;

const TONE: Record<Status["tone"], string> = {
  info: "text-ink/70",
  ok: "text-[#1f6b3a]",
  error: "text-[#a3330c]",
};

export function ResumeHub() {
  const studio = useStudio();
  const saveError = useSaveError();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const create = () => {
    const doc = blankDoc();
    addDoc(doc);
    router.push(editPath(doc.id));
  };

  const backup = () => {
    const url = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setStatus({ tone: "ok", text: "Backup downloaded. Keep it somewhere safe; Restore backup brings it back." });
  };

  const restore = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const result = importBackup(await file.text());
      setStatus({
        tone: "ok",
        text: `Restored ${plural(result.resumes, "resume")} and ${plural(result.versions, "saved version")}.`,
      });
    } catch (err) {
      setStatus({ tone: "error", text: errorText(err) });
    }
  };

  const download = async (doc: ResumeDoc) => {
    if (busy) return;
    setBusy(doc.id);
    setStatus({ tone: "info", text: `Building “${doc.name}”…` });
    try {
      const { pages } = await downloadPdf(doc);
      addVersion(doc.id, "generated", undefined, pages);
      setStatus({ tone: "ok", text: `Downloaded “${doc.name}” (${plural(pages, "page")}).` });
    } catch (err) {
      setStatus({ tone: "error", text: `Couldn't build the PDF: ${errorText(err)}` });
    } finally {
      setBusy(null);
    }
  };

  const duplicate = (doc: ResumeDoc) => {
    if (duplicateDoc(doc.id)) setStatus({ tone: "ok", text: `Made a copy of “${doc.name}”.` });
  };

  const remove = (doc: ResumeDoc) => {
    const ok = window.confirm(
      `Delete “${doc.name}” and its version history? This can't be undone unless you have a backup.`,
    );
    if (!ok) return;
    deleteDoc(doc.id);
    setStatus({ tone: "ok", text: `Deleted “${doc.name}”.` });
  };

  const bringBack = () => {
    const count = restoreBuiltIns();
    setStatus({ tone: "ok", text: `Brought back ${plural(count, "built-in resume")}.` });
  };

  const removed = studio?.removedSeeds.length ?? 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-butter">Resumes</span>
        <Link href="/backoffice/applications" className="rounded-full px-3 py-1.5 text-[12px] text-butter/70 hover:bg-white/10 hover:text-butter">
          Applications
        </Link>
      </TopBar>
      <main id="main" className="mx-auto max-w-[1500px] px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/55">Back office</p>
            <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-tight">
              Resumes
            </h1>
            <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink/70">
              One resume for each kind of job. Open one to edit it right on the page and drag lines to
              reorder them, then click Generate PDF. Every PDF you download is saved to that
              resume&apos;s version history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={create} className={DARK}>
              + New resume
            </button>
            <button type="button" onClick={backup} disabled={!studio} className={OUTLINE}>
              Download backup
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={!studio} className={OUTLINE}>
              Restore backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => restore(e.currentTarget)}
            />
          </div>
        </div>

        {saveError && (
          <p role="alert" className="mt-6 rounded-xl bg-[#ffe3d6] px-4 py-3 text-[14px] text-[#7a2e0e]">
            {saveError}
          </p>
        )}
        <p aria-live="polite" className={`mt-6 min-h-[1.5em] text-[14px] ${status ? TONE[status.tone] : ""}`}>
          {status?.text}
        </p>

        {!studio ? (
          <p className="mt-4 text-ink/60">Loading your resumes…</p>
        ) : studio.resumes.length ? (
          <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {studio.resumes.map((doc) => (
              <Card
                key={doc.id}
                doc={doc}
                versions={studio.versions[doc.id] ?? EMPTY}
                busy={busy === doc.id}
                onDownload={() => download(doc)}
                onDuplicate={() => duplicate(doc)}
                onDelete={() => remove(doc)}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-ink/25 p-10 text-center">
            <p className="text-lg font-semibold">No resumes yet</p>
            <p className="mt-2 text-[14px] text-ink/60">Start a blank one, or bring back the built-in versions.</p>
          </div>
        )}

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 pt-6 text-[13px] text-ink/60">
          <p className="max-w-[70ch]">
            Your resumes are saved in this browser only. Use Download backup to keep a copy or move them to
            another computer.
          </p>
          {removed > 0 && (
            <button type="button" onClick={bringBack} className={OUTLINE}>
              Bring back {plural(removed, "deleted built-in resume")}
            </button>
          )}
        </footer>
      </main>
    </div>
  );
}

function Card({
  doc,
  versions,
  busy,
  onDownload,
  onDuplicate,
  onDelete,
}: {
  doc: ResumeDoc;
  versions: ResumeVersion[];
  busy: boolean;
  onDownload: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const href = editPath(doc.id);
  const lastPdf = versions.find((v) => v.kind === "generated");
  const small = "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors";

  return (
    <li className="flex flex-col rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.05)] ring-1 ring-ink/5 transition-shadow hover:shadow-xl">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="mx-auto block">
        <div className="sheet-thumb">
          <Sheet doc={doc} />
        </div>
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <h2 className="text-[17px] font-semibold leading-tight tracking-tight">
          <Link href={href} className="hover:underline">
            {doc.name || "Untitled resume"}
          </Link>
        </h2>
        <p className="mt-1 text-[13px] text-ink/60">{doc.target || "No target role set"}</p>
        <p className="mt-2 text-[12px] text-ink/45">
          Edited {formatWhen(doc.updatedAt)} · {plural(versions.length, "version")}
          {lastPdf ? ` · last PDF ${formatWhen(lastPdf.createdAt)}` : ""}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          <Link href={href} className={`${small} bg-ink text-butter hover:bg-black`}>
            Edit
          </Link>
          <button
            type="button"
            onClick={onDownload}
            disabled={busy}
            className={`${small} bg-butter text-ink hover:brightness-95 disabled:opacity-60`}
          >
            {busy ? "Building…" : "Download PDF"}
          </button>
          <button type="button" onClick={onDuplicate} className={`${small} text-ink/70 hover:bg-ink/5 hover:text-ink`}>
            Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${small} text-ink/70 hover:bg-[#ffe3d6] hover:text-[#7a2e0e]`}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
