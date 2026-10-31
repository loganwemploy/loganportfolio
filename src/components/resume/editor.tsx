"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { TopBar } from "@/components/backoffice/top-bar";
import { loadedFonts, loadFonts, subscribeFonts } from "@/lib/resume/fonts";
import { layoutResume } from "@/lib/resume/layout";
import { blankSection, SECTION_PRESETS } from "@/lib/resume/ops";
import { downloadPdf } from "@/lib/resume/pdf";
import { seedDoc } from "@/lib/resume/seeds";
import {
  addVersion,
  deleteVersion,
  getStudio,
  MAX_VERSIONS,
  renameVersion,
  replaceDoc,
  restoreSnapshot,
  updateDoc,
  useSaveError,
  useStudio,
} from "@/lib/resume/store";
import {
  ACCENTS,
  pdfFileName,
  type ResumeDoc,
  type ResumeTheme,
  type ResumeVersion,
  type SectionKind,
  type VersionKind,
} from "@/lib/resume/types";
import { errorText, formatWhen, plural } from "./format";
import { firstField, focusField, Sheet, type Change, type DragItem, type DropTarget, type EditApi } from "./sheet";

type Status = { tone: "info" | "ok" | "error"; text: string };
type History = { past: ResumeDoc[]; future: ResumeDoc[] };

/** Undo steps kept per editing session. */
const UNDO_LIMIT = 100;
/** Typing in one field within this many ms of the last keystroke undoes as one step. */
const MERGE_MS = 1500;
const EMPTY: ResumeVersion[] = [];

const TONE: Record<Status["tone"], string> = {
  info: "text-ink/70",
  ok: "text-[#1f6b3a]",
  error: "text-[#a3330c]",
};

const KIND_BADGE: Record<VersionKind, { label: string; className: string }> = {
  generated: { label: "PDF", className: "bg-butter text-ink" },
  manual: { label: "Saved", className: "bg-ink text-butter" },
  restore: { label: "Auto", className: "bg-ink/10 text-ink/70" },
};

export function ResumeEditor({ id }: { id: string }) {
  const studio = useStudio();
  const saveError = useSaveError();
  const doc = studio?.resumes.find((d) => d.id === id) ?? null;
  const versions = studio?.versions[id] ?? EMPTY;

  const [history, setHistory] = useState<History>({ past: [], future: [] });
  const lastEdit = useRef<{ key: string | null; at: number }>({ key: null, at: 0 });
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [dimmed, setDimmed] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const dimTimer = useRef(0);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);

  /* ---------- changes and undo ---------- */

  const current = useCallback(() => getStudio().resumes.find((d) => d.id === id) ?? null, [id]);

  const remember = useCallback((before: ResumeDoc, key: string | null = null) => {
    const now = Date.now();
    const merge = key !== null && lastEdit.current.key === key && now - lastEdit.current.at < MERGE_MS;
    lastEdit.current = { key, at: now };
    setHistory((h) => ({ past: merge ? h.past : [...h.past, before].slice(-UNDO_LIMIT), future: [] }));
  }, []);

  const change: Change = useCallback(
    (recipe, mergeKey) => {
      const before = current();
      if (before && updateDoc(id, recipe)) remember(before, mergeKey ?? null);
    },
    [id, current, remember],
  );

  const undo = () => {
    const prev = history.past.at(-1);
    const now = current();
    if (!prev || !now) return;
    lastEdit.current = { key: null, at: 0 };
    replaceDoc(id, prev);
    setHistory({ past: history.past.slice(0, -1), future: [...history.future, now] });
  };

  const redo = () => {
    const next = history.future.at(-1);
    const now = current();
    if (!next || !now) return;
    lastEdit.current = { key: null, at: 0 };
    replaceDoc(id, next);
    setHistory({ past: [...history.past, now], future: history.future.slice(0, -1) });
  };

  /* ---------- drag and drop ---------- */

  const startDrag = useCallback((item: DragItem) => {
    setDrag(item);
    // Fade the item a moment later, so the browser's drag image isn't faded too.
    window.clearTimeout(dimTimer.current);
    dimTimer.current = window.setTimeout(() => setDimmed(item.id), 0);
  }, []);

  const endDrag = useCallback(() => {
    window.clearTimeout(dimTimer.current);
    setDrag(null);
    setDimmed(null);
    setDrop(null);
  }, []);

  const edit: EditApi = useMemo(
    () => ({ change, drag, dimmed, drop, startDrag, endDrag, setDrop }),
    [change, drag, dimmed, drop, startDrag, endDrag],
  );

  /* ---------- fonts and pagination (same engine as the PDF) ---------- */

  const family = doc?.theme.font ?? "sans";
  const fonts = useSyncExternalStore(
    subscribeFonts,
    () => loadedFonts(family),
    () => null,
  );

  useEffect(() => {
    let live = true;
    loadFonts(family).then(
      () => {
        if (live) setFontError(null);
      },
      (err: unknown) => {
        if (live) setFontError(errorText(err));
      },
    );
    return () => {
      live = false;
    };
  }, [family]);

  const layout = useMemo(() => (doc && fonts ? layoutResume(doc, fonts.measure) : null), [doc, fonts]);
  const breaks = useMemo(() => (layout ? new Map(layout.breaks.map((b) => [b.id, b.page])) : null), [layout]);
  const pages = layout?.pages.length ?? null;

  /* ---------- actions ---------- */

  const generate = async () => {
    const d = current();
    if (!d || busy) return;
    setBusy(true);
    setStatus({ tone: "info", text: "Building your PDF…" });
    try {
      const result = await downloadPdf(d);
      addVersion(id, "generated", undefined, result.pages);
      setStatus({
        tone: "ok",
        text: `Downloaded ${pdfFileName(d)} (${plural(result.pages, "page")}). It's saved in Versions.`,
      });
    } catch (err) {
      setStatus({ tone: "error", text: `Couldn't build the PDF: ${errorText(err)}` });
    } finally {
      setBusy(false);
    }
  };

  const saveVersion = (label?: string) => {
    const v = addVersion(id, "manual", label);
    if (v) setStatus({ tone: "ok", text: `Saved version “${v.label}”.` });
  };

  const restore = (v: ResumeVersion) => {
    const before = current();
    if (!before) return;
    restoreSnapshot(id, v.snapshot, `Before restoring “${v.label}”`);
    remember(before);
    setStatus({ tone: "ok", text: `Restored “${v.label}”. What you had before is saved in Versions.` });
  };

  const downloadVersion = async (v: ResumeVersion) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await downloadPdf(v.snapshot);
      setStatus({ tone: "ok", text: `Downloaded “${v.label}” (${plural(result.pages, "page")}).` });
    } catch (err) {
      setStatus({ tone: "error", text: `Couldn't build the PDF: ${errorText(err)}` });
    } finally {
      setBusy(false);
    }
  };

  const removeVersion = (v: ResumeVersion) => {
    if (!window.confirm(`Delete the version “${v.label}”?`)) return;
    deleteVersion(id, v.id);
  };

  const resetToOriginal = () => {
    const before = current();
    const original = before?.seed ? seedDoc(before.seed) : null;
    if (!before || !original) return;
    const ok = window.confirm(
      `Put “${before.name}” back to the original built-in version? What you have now is saved in Versions first.`,
    );
    if (!ok) return;
    restoreSnapshot(id, original, "Before reset to original");
    remember(before);
    setStatus({ tone: "ok", text: "Back to the original. Your edits are saved in Versions." });
  };

  const addSection = (kind: SectionKind, title: string) => {
    const section = blankSection(kind, title);
    change((d) => {
      d.sections.push(section);
    });
    const field = firstField(section);
    if (field) focusField(field);
  };

  const setTheme = <K extends keyof ResumeTheme>(key: K, value: ResumeTheme[K], mergeKey?: string) =>
    change((d) => {
      if (d.theme[key] === value) return false;
      d.theme[key] = value;
    }, mergeKey);

  const setMeta = (field: "name" | "target" | "notes") => (value: string) =>
    change((d) => {
      if (d[field] === value) return false;
      d[field] = value;
    }, `meta:${field}`);

  /* ---------- keyboard shortcuts ---------- */

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "s") {
      e.preventDefault();
      saveVersion();
      return;
    }
    // Plain inputs in the side panel keep the browser's own undo.
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest("input, textarea, select")) return;
    if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((key === "z" && e.shiftKey) || key === "y") {
      e.preventDefault();
      redo();
    }
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  /* ---------- render ---------- */

  if (!studio) {
    return (
      <Shell>
        <p className="p-10 text-ink/60">Loading your resume…</p>
      </Shell>
    );
  }

  if (!doc) {
    return (
      <Shell>
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">That resume isn&apos;t here</h1>
          <p className="mt-3 text-ink/65">
            It may have been deleted, or it was made in another browser. Resumes are saved per browser; a
            backup file moves them.
          </p>
          <Link href="/backoffice" className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-[13px] text-butter">
            Back to all resumes
          </Link>
        </div>
      </Shell>
    );
  }

  const bar = "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors";

  return (
    <div className="flex min-h-screen flex-col bg-[#e6e4de] text-ink">
      <TopBar>
        <Link href="/backoffice" className={`${bar} shrink-0 text-butter/75 hover:bg-white/10 hover:text-butter`}>
          ← Resumes
        </Link>
        <span className="hidden min-w-0 truncate text-[14px] font-semibold sm:block">{doc.name}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <BarIcon label="Undo (Ctrl+Z)" disabled={!history.past.length} onClick={undo}>
            <path d="M6 4 2.5 7.5 6 11M3 7.5h7a3.5 3.5 0 0 1 0 7H8" />
          </BarIcon>
          <BarIcon label="Redo (Ctrl+Shift+Z)" disabled={!history.future.length} onClick={redo}>
            <path d="m10 4 3.5 3.5L10 11M13 7.5H6a3.5 3.5 0 0 0 0 7h2" />
          </BarIcon>
          <span className="hidden px-2 text-[12px] text-butter/60 md:inline" aria-live="polite">
            {pages === null ? "Measuring…" : plural(pages, "page")}
          </span>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className={`${bar} bg-butter px-4 text-ink hover:brightness-95 disabled:opacity-60`}
          >
            {busy ? "Building…" : "Generate PDF"}
          </button>
        </div>
      </TopBar>

      {saveError && (
        <p role="alert" className="bg-[#ffe3d6] px-5 py-3 text-[14px] text-[#7a2e0e]">
          {saveError}
        </p>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        <main id="main" className="min-w-0 flex-1 overflow-x-auto py-10">
          <div className="mx-auto w-max px-24">
            <Sheet doc={doc} edit={edit} measure={fonts?.measure ?? null} breaks={breaks} />
            <p className="mt-6 max-w-[612pt] text-[12px] leading-relaxed text-ink/55">
              Click any text to edit it. Drag the ⠿ handles to reorder; bullets can move between jobs. Enter adds a
              line, Backspace on an empty line removes it. Ctrl+Z undoes, Ctrl+S saves a version. Dashed orange
              lines show where the PDF starts a new page.
            </p>
            {fontError && (
              <p role="alert" className="mt-3 text-[13px] text-[#a3330c]">
                Couldn&apos;t load the resume fonts, so page breaks aren&apos;t shown: {fontError}
              </p>
            )}
          </div>
        </main>

        <aside className="w-full shrink-0 border-t border-ink/10 bg-white lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-[360px] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="space-y-8 p-5">
            <p aria-live="polite" className={`min-h-[1.25em] text-[13px] ${status ? TONE[status.tone] : ""}`}>
              {status?.text}
            </p>

            <Panel title="Details">
              <TextInput label="Name of this version" value={doc.name} onChange={setMeta("name")} />
              <TextInput
                label="Aimed at"
                value={doc.target}
                placeholder="e.g. Senior React roles at fintechs"
                onChange={setMeta("target")}
              />
              <label className="block">
                <span className="panel-label">Private notes (never printed)</span>
                <textarea
                  value={doc.notes}
                  onChange={(e) => setMeta("notes")(e.target.value)}
                  rows={5}
                  className="mt-1.5 w-full resize-y rounded-lg border border-ink/15 px-3 py-2 text-[13px] leading-relaxed focus:border-ink focus:outline-none"
                />
              </label>
            </Panel>

            <Panel title="Look">
              <Segmented
                label="Font"
                value={doc.theme.font}
                options={[
                  { value: "sans", label: "Sans (Inter)" },
                  { value: "serif", label: "Serif" },
                ]}
                onChange={(v) => setTheme("font", v)}
              />
              <div role="group" aria-label="Accent color">
                <span className="panel-label">Accent color</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      title={a.name}
                      aria-label={a.name}
                      aria-pressed={doc.theme.accent.toLowerCase() === a.value}
                      onClick={() => setTheme("accent", a.value)}
                      className="h-7 w-7 rounded-full ring-offset-2 transition-transform hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-ink"
                      style={{ background: a.value }}
                    />
                  ))}
                  <label className="ml-1 flex items-center gap-1.5 text-[12px] text-ink/60">
                    <input
                      type="color"
                      value={doc.theme.accent}
                      onChange={(e) => setTheme("accent", e.target.value, "theme:accent")}
                      className="h-7 w-9 cursor-pointer rounded border border-ink/15 bg-white p-0.5"
                    />
                    Custom
                  </label>
                </div>
              </div>
              <Segmented
                label="Text size"
                value={doc.theme.size}
                options={[
                  { value: "standard", label: "Standard" },
                  { value: "compact", label: "Compact" },
                ]}
                onChange={(v) => setTheme("size", v)}
              />
              <Segmented
                label="Margins"
                value={doc.theme.margin}
                options={[
                  { value: "narrow", label: "Narrow" },
                  { value: "normal", label: "Normal" },
                  { value: "wide", label: "Wide" },
                ]}
                onChange={(v) => setTheme("margin", v)}
              />
              <Segmented
                label="Header"
                value={doc.theme.align}
                options={[
                  { value: "left", label: "Left" },
                  { value: "center", label: "Centered" },
                ]}
                onChange={(v) => setTheme("align", v)}
              />
            </Panel>

            <Panel title="Add a section">
              <div className="flex flex-wrap gap-1.5">
                {SECTION_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => addSection(p.kind, p.title)}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-[12px] font-medium text-ink/80 transition-colors hover:border-ink hover:text-ink"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title={`Versions (${versions.length})`}>
              <SaveVersion onSave={saveVersion} />
              {versions.length ? (
                <ul className="space-y-2">
                  {versions.map((v) => (
                    <VersionRow
                      key={v.id}
                      version={v}
                      busy={busy}
                      onRestore={() => restore(v)}
                      onDownload={() => downloadVersion(v)}
                      onDelete={() => removeVersion(v)}
                      onRename={(label) => renameVersion(id, v.id, label)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-ink/55">
                  No versions yet. Each Generate PDF saves one, and so does Save version.
                </p>
              )}
              <p className="text-[12px] text-ink/45">Keeps the newest {MAX_VERSIONS} per resume.</p>
            </Panel>

            {doc.seed && (
              <Panel title="Start over">
                <button
                  type="button"
                  onClick={resetToOriginal}
                  className="rounded-full border border-ink/15 px-3 py-1.5 text-[12px] font-medium text-ink/80 hover:border-[#a3330c] hover:text-[#a3330c]"
                >
                  Reset to the original
                </button>
              </Panel>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- pieces ---------- */

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar>
        <Link
          href="/backoffice"
          className="rounded-full px-3 py-1.5 text-[12px] font-medium text-butter/75 hover:bg-white/10 hover:text-butter"
        >
          ← Resumes
        </Link>
      </TopBar>
      <main id="main">{children}</main>
    </div>
  );
}

function BarIcon({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full text-butter/80 transition-colors hover:bg-white/10 hover:text-butter disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="panel-label">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 text-[14px] focus:border-ink focus:outline-none"
      />
    </label>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <span className="panel-label">{label}</span>
      <div className="mt-1.5 flex rounded-lg bg-ink/5 p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className="flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium text-ink/60 transition-colors hover:text-ink aria-pressed:bg-white aria-pressed:text-ink aria-pressed:shadow-sm"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SaveVersion({ onSave }: { onSave: (label?: string) => void }) {
  const [label, setLabel] = useState("");
  return (
    <form
      className="flex gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(label.trim() || undefined);
        setLabel("");
      }}
    >
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Name it (optional), e.g. “Sent to Stripe”"
        aria-label="Version name"
        className="min-w-0 flex-1 rounded-lg border border-ink/15 px-3 py-2 text-[13px] focus:border-ink focus:outline-none"
      />
      <button type="submit" className="shrink-0 rounded-lg bg-ink px-3 py-2 text-[12px] font-medium text-butter hover:bg-black">
        Save version
      </button>
    </form>
  );
}

function VersionRow({
  version,
  busy,
  onRestore,
  onDownload,
  onDelete,
  onRename,
}: {
  version: ResumeVersion;
  busy: boolean;
  onRestore: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
}) {
  const badge = KIND_BADGE[version.kind];
  const small = "rounded-md px-2 py-1 text-[12px] font-medium transition-colors";

  return (
    <li className="rounded-xl border border-ink/10 p-3">
      <div className="flex items-center gap-2 text-[11px] text-ink/50">
        <span className={`rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}>
          {badge.label}
        </span>
        <span>
          {formatWhen(version.createdAt)}
          {version.pages ? ` · ${plural(version.pages, "page")}` : ""}
        </span>
      </div>
      <input
        key={version.label}
        type="text"
        defaultValue={version.label}
        aria-label="Version name"
        title="Click to rename"
        onBlur={(e) => {
          const label = e.target.value.trim();
          if (label && label !== version.label) onRename(label);
          else e.target.value = version.label;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = version.label;
            e.currentTarget.blur();
          }
        }}
        className="mt-1 w-full rounded bg-transparent px-1 py-0.5 -mx-1 text-[14px] font-medium hover:bg-ink/5 focus:bg-ink/5 focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap gap-1">
        <button type="button" onClick={onRestore} className={`${small} bg-ink/5 hover:bg-ink hover:text-butter`}>
          Restore
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className={`${small} bg-ink/5 hover:bg-butter disabled:opacity-50`}
        >
          PDF
        </button>
        <button type="button" onClick={onDelete} className={`${small} text-ink/55 hover:bg-[#ffe3d6] hover:text-[#7a2e0e]`}>
          Delete
        </button>
      </div>
    </li>
  );
}
