import { useSyncExternalStore } from "react";
import { cloneDoc } from "./ops";
import { removePrivateProject } from "./privacy";
import { seedDoc, SEED_IDS } from "./seeds";
import {
  DEFAULT_THEME,
  newId,
  type Bullet,
  type Entry,
  type ResumeDoc,
  type ResumeVersion,
  type Section,
  type StudioState,
  type VersionKind,
} from "./types";

/*
 * Resumes and their version history live in this browser's localStorage,
 * under two keys so typing only rewrites the (small) resumes, never the
 * history. Use Backup on the hub to keep a copy somewhere safe.
 */
const DOCS_KEY = "resume-studio:docs";
const VERSIONS_KEY = "resume-studio:versions";
export const MAX_VERSIONS = 50;
const SAVE_DELAY = 300;

let state: StudioState | null = null;
let saveError: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let dirtyDocs = false;
let dirtyVersions = false;
let wired = false;
const listeners = new Set<() => void>();

const now = () => new Date().toISOString();
const isString = (v: unknown): v is string => typeof v === "string";
const str = (v: unknown, fallback = "") => (isString(v) ? v : fallback);
const id = (v: unknown, prefix: string) => (isString(v) && v ? v : newId(prefix));

/* ---------- validation (stored data and imported backups) ---------- */

function bulletsOf(raw: unknown, prefix = "b"): Bullet[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => b && typeof b === "object")
    .map((b: Record<string, unknown>) => ({ id: id(b.id, prefix), text: str(b.text) }));
}

function entryOf(raw: Record<string, unknown>): Entry {
  return {
    id: id(raw.id, "e"),
    title: str(raw.title),
    org: str(raw.org),
    dates: str(raw.dates),
    location: str(raw.location),
    bullets: bulletsOf(raw.bullets),
  };
}

function sectionOf(raw: unknown): Section | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const base = { id: id(s.id, "s"), title: str(s.title), ...(s.hidden === true ? { hidden: true } : {}) };
  switch (s.kind) {
    case "summary":
      return { ...base, kind: "summary", paragraphs: bulletsOf(s.paragraphs) };
    case "list":
      return { ...base, kind: "list", items: bulletsOf(s.items) };
    case "skills":
      return {
        ...base,
        kind: "skills",
        rows: Array.isArray(s.rows)
          ? s.rows
              .filter((r) => r && typeof r === "object")
              .map((r: Record<string, unknown>) => ({ id: id(r.id, "r"), label: str(r.label), value: str(r.value) }))
          : [],
      };
    case "entries":
      return {
        ...base,
        kind: "entries",
        entries: Array.isArray(s.entries)
          ? s.entries.filter((e) => e && typeof e === "object").map((e) => entryOf(e as Record<string, unknown>))
          : [],
      };
    default:
      return null;
  }
}

export function normalizeDoc(raw: unknown): ResumeDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (!isString(d.id) || !d.id || !Array.isArray(d.sections)) return null;
  const header = (d.header && typeof d.header === "object" ? d.header : {}) as Record<string, unknown>;
  const theme = (d.theme && typeof d.theme === "object" ? d.theme : {}) as Partial<ResumeDoc["theme"]>;
  return removePrivateProject({
    id: d.id,
    name: str(d.name, "Untitled resume"),
    target: str(d.target),
    notes: str(d.notes),
    ...(isString(d.seed) ? { seed: d.seed } : {}),
    createdAt: str(d.createdAt, now()),
    updatedAt: str(d.updatedAt, now()),
    theme: {
      font: theme.font === "serif" ? "serif" : "sans",
      accent: isString(theme.accent) && /^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : DEFAULT_THEME.accent,
      size: theme.size === "compact" ? "compact" : "standard",
      margin: theme.margin === "narrow" || theme.margin === "wide" ? theme.margin : "normal",
      align: theme.align === "center" ? "center" : "left",
    },
    header: { name: str(header.name), headline: str(header.headline), contacts: bulletsOf(header.contacts, "c") },
    sections: d.sections.map(sectionOf).filter((s): s is Section => s !== null),
  });
}

function versionsOf(raw: unknown): ResumeVersion[] {
  if (!Array.isArray(raw)) return [];
  const kinds: VersionKind[] = ["generated", "manual", "restore"];
  return raw.flatMap((v) => {
    if (!v || typeof v !== "object") return [];
    const r = v as Record<string, unknown>;
    const snapshot = normalizeDoc(r.snapshot);
    if (!snapshot) return [];
    return [
      {
        id: id(r.id, "v"),
        createdAt: str(r.createdAt, now()),
        label: str(r.label),
        kind: kinds.includes(r.kind as VersionKind) ? (r.kind as VersionKind) : "manual",
        ...(typeof r.pages === "number" ? { pages: r.pages } : {}),
        snapshot,
      },
    ];
  });
}

/* ---------- persistence ---------- */

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function load(): StudioState {
  const docs = (read(DOCS_KEY) ?? {}) as Record<string, unknown>;
  const stored = (read(VERSIONS_KEY) ?? {}) as Record<string, unknown>;
  const resumes = Array.isArray(docs.resumes)
    ? docs.resumes.map(normalizeDoc).filter((d): d is ResumeDoc => d !== null)
    : [];
  if (JSON.stringify(resumes) !== JSON.stringify(docs.resumes ?? [])) dirtyDocs = true;
  const removedSeeds = Array.isArray(docs.removedSeeds) ? docs.removedSeeds.filter(isString) : [];

  // First visit, or a built-in resume added since the last visit.
  for (const seed of SEED_IDS) {
    if (removedSeeds.includes(seed) || resumes.some((d) => d.id === seed)) continue;
    const doc = seedDoc(seed);
    if (doc) {
      resumes.push(doc);
      dirtyDocs = true;
    }
  }

  // One-time wording fixes for resumes saved before a built-in line changed.
  // Only exact matches are touched. Privacy cleanup also applies to saved versions.
  const RENAMES: Record<string, string> = {
    "SoloLearn JavaScript Certification": "SoloLearn JavaScript Certification (2018)",
    "Node.js Developer Certification (Wes Bos)": "Node.js Developer Certification (Wes Bos, 2018)",
  };
  for (const doc of resumes) {
    for (const s of doc.sections) {
      if (s.kind !== "list") continue;
      for (const item of s.items) {
        const next = RENAMES[item.text.trim()];
        if (next) {
          item.text = next;
          dirtyDocs = true;
        }
      }
    }
  }

  const versions: Record<string, ResumeVersion[]> = {};
  for (const doc of resumes) {
    const list = versionsOf(stored[doc.id]);
    if (list.length) versions[doc.id] = list;
    if (JSON.stringify(list) !== JSON.stringify(stored[doc.id] ?? [])) dirtyVersions = true;
  }
  return { v: 1, resumes, versions, removedSeeds };
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Drops the oldest saved versions across all resumes. Returns false if there was nothing to drop. */
function trimVersions(): boolean {
  if (!state) return false;
  const all = Object.entries(state.versions).flatMap(([docId, list]) => list.map((v) => ({ docId, v })));
  if (!all.length) return false;
  all.sort((a, b) => a.v.createdAt.localeCompare(b.v.createdAt));
  const drop = new Set(all.slice(0, Math.max(1, Math.ceil(all.length / 4))).map((x) => x.v.id));
  const versions: Record<string, ResumeVersion[]> = {};
  for (const [docId, list] of Object.entries(state.versions)) {
    const kept = list.filter((v) => !drop.has(v.id));
    if (kept.length) versions[docId] = kept;
  }
  state = { ...state, versions };
  return true;
}

export function flushSave() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!state || (!dirtyDocs && !dirtyVersions)) return;
  const before = saveError;
  let trimmed = false;
  try {
    // Storage full: give up the oldest history before giving up the resumes.
    // Versions are written first so trimming them frees room for the resumes.
    for (;;) {
      try {
        if (dirtyVersions) {
          write(VERSIONS_KEY, state.versions);
          dirtyVersions = false;
        }
        if (dirtyDocs) {
          write(DOCS_KEY, { v: 1, resumes: state.resumes, removedSeeds: state.removedSeeds });
          dirtyDocs = false;
        }
        break;
      } catch (err) {
        if (!trimVersions()) throw err;
        trimmed = true;
        dirtyVersions = true;
      }
    }
    saveError = null;
  } catch {
    saveError =
      "Your browser's storage is full, so the latest changes aren't saved. Download a backup from the resume hub.";
  }
  if (trimmed || saveError !== before) emit();
}

function scheduleSave() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(flushSave, SAVE_DELAY);
}

function emit() {
  listeners.forEach((listener) => listener());
}

function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("pagehide", flushSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushSave();
  });
  // Another tab saved: pick up its changes unless this tab has unsaved ones.
  window.addEventListener("storage", (e) => {
    if ((e.key !== DOCS_KEY && e.key !== VERSIONS_KEY) || dirtyDocs || dirtyVersions) return;
    state = load();
    if (dirtyDocs || dirtyVersions) scheduleSave();
    emit();
  });
}

function ensure(): StudioState {
  if (!state) {
    state = load();
    if (dirtyDocs || dirtyVersions) scheduleSave();
  }
  return state;
}

function commit(next: StudioState, what: { docs?: boolean; versions?: boolean }) {
  state = next;
  if (what.docs) dirtyDocs = true;
  if (what.versions) dirtyVersions = true;
  scheduleSave();
  emit();
}

/* ---------- React ---------- */

function subscribe(listener: () => void) {
  wire();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** All resumes and versions, or null during server rendering and hydration. */
export function useStudio(): StudioState | null {
  return useSyncExternalStore(subscribe, ensure, () => null);
}

export function useSaveError(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => saveError,
    () => null,
  );
}

export const getStudio = ensure;

/* ---------- resumes ---------- */

/** Applies `recipe` to a copy of the resume. Return false from it to cancel. */
export function updateDoc(docId: string, recipe: (draft: ResumeDoc) => void | boolean): boolean {
  const s = ensure();
  const i = s.resumes.findIndex((d) => d.id === docId);
  if (i < 0) return false;
  const draft = cloneDoc(s.resumes[i]);
  if (recipe(draft) === false) return false;
  draft.id = docId;
  draft.updatedAt = now();
  const resumes = s.resumes.slice();
  resumes[i] = removePrivateProject(draft);
  commit({ ...s, resumes }, { docs: true });
  return true;
}

/** Puts a resume back to an earlier state (undo, redo). */
export function replaceDoc(docId: string, doc: ResumeDoc) {
  updateDoc(docId, (draft) => {
    Object.assign(draft, cloneDoc(doc), { id: docId });
  });
}

/** Adds a resume after `afterId`, or at the end. */
export function addDoc(doc: ResumeDoc, afterId?: string) {
  const s = ensure();
  const resumes = s.resumes.slice();
  const at = afterId ? resumes.findIndex((d) => d.id === afterId) : -1;
  resumes.splice(at < 0 ? resumes.length : at + 1, 0, removePrivateProject(doc));
  commit({ ...s, resumes }, { docs: true });
}

export function duplicateDoc(docId: string): string | null {
  const source = ensure().resumes.find((d) => d.id === docId);
  if (!source) return null;
  const stamp = now();
  const copy: ResumeDoc = { ...cloneDoc(source), id: newId("r"), name: `${source.name} (copy)`, createdAt: stamp, updatedAt: stamp };
  addDoc(copy, docId);
  return copy.id;
}

export function deleteDoc(docId: string) {
  const s = ensure();
  const doc = s.resumes.find((d) => d.id === docId);
  if (!doc) return;
  const versions = { ...s.versions };
  delete versions[docId];
  const builtIn = SEED_IDS.includes(docId);
  commit(
    {
      ...s,
      resumes: s.resumes.filter((d) => d.id !== docId),
      versions,
      removedSeeds: builtIn ? [...new Set([...s.removedSeeds, docId])] : s.removedSeeds,
    },
    { docs: true, versions: true },
  );
}

/** Brings back built-in resumes that were deleted. Returns how many came back. */
export function restoreBuiltIns(): number {
  const s = ensure();
  const back = s.removedSeeds
    .filter((seed) => !s.resumes.some((d) => d.id === seed))
    .map((seed) => seedDoc(seed))
    .filter((d): d is ResumeDoc => d !== null);
  commit({ ...s, resumes: [...s.resumes, ...back], removedSeeds: [] }, { docs: true });
  return back.length;
}

/* ---------- versions ---------- */

const contentOf = (doc: ResumeDoc) =>
  JSON.stringify({ theme: doc.theme, header: doc.header, sections: doc.sections });

export const DEFAULT_LABEL: Record<VersionKind, string> = {
  generated: "Downloaded PDF",
  manual: "Saved version",
  restore: "Before restoring",
};

/**
 * Saves a snapshot of the resume as it is now. If the newest version already
 * has the same content, that version is reused (and relabeled if asked).
 */
export function addVersion(docId: string, kind: VersionKind, label?: string, pages?: number): ResumeVersion | null {
  const s = ensure();
  const doc = s.resumes.find((d) => d.id === docId);
  if (!doc) return null;
  const list = s.versions[docId] ?? [];
  const latest = list[0];
  if (latest && contentOf(latest.snapshot) === contentOf(doc)) {
    const keepLabel = !label || (kind === "generated" && latest.kind !== "generated");
    const updated: ResumeVersion = {
      ...latest,
      label: keepLabel ? latest.label : label,
      kind: kind === "generated" ? "generated" : latest.kind,
      pages: pages ?? latest.pages,
    };
    commit({ ...s, versions: { ...s.versions, [docId]: [updated, ...list.slice(1)] } }, { versions: true });
    return updated;
  }
  const version: ResumeVersion = {
    id: newId("v"),
    createdAt: now(),
    label: label?.trim() || DEFAULT_LABEL[kind],
    kind,
    ...(pages ? { pages } : {}),
    snapshot: cloneDoc(doc),
  };
  commit({ ...s, versions: { ...s.versions, [docId]: [version, ...list].slice(0, MAX_VERSIONS) } }, { versions: true });
  return version;
}

function editVersions(docId: string, fn: (list: ResumeVersion[]) => ResumeVersion[]) {
  const s = ensure();
  const list = fn(s.versions[docId] ?? []);
  const versions = { ...s.versions };
  if (list.length) versions[docId] = list;
  else delete versions[docId];
  commit({ ...s, versions }, { versions: true });
}

export function renameVersion(docId: string, versionId: string, label: string) {
  editVersions(docId, (list) => list.map((v) => (v.id === versionId ? { ...v, label } : v)));
}

export function deleteVersion(docId: string, versionId: string) {
  editVersions(docId, (list) => list.filter((v) => v.id !== versionId));
}

/**
 * Restores a version's layout and content (name, target and notes stay as
 * they are). The current state is saved as a version first.
 */
export function restoreSnapshot(docId: string, snapshot: ResumeDoc, label = DEFAULT_LABEL.restore) {
  addVersion(docId, "restore", label);
  updateDoc(docId, (draft) => {
    const copy = cloneDoc(snapshot);
    draft.theme = copy.theme;
    draft.header = copy.header;
    draft.sections = copy.sections;
  });
}

/* ---------- backup ---------- */

export function exportBackup(): string {
  flushSave();
  const s = ensure();
  return JSON.stringify(
    { app: "resume-studio", v: 1, exportedAt: now(), resumes: s.resumes, versions: s.versions, removedSeeds: s.removedSeeds },
    null,
    1,
  );
}

/** Merges a backup: resumes with the same id are replaced, others added. Versions are merged. */
export function importBackup(text: string): { resumes: number; versions: number } {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a Resume Studio backup (it isn't valid JSON).");
  }
  if (!data || data.app !== "resume-studio" || !Array.isArray(data.resumes)) {
    throw new Error("That file isn't a Resume Studio backup.");
  }
  const incoming = data.resumes.map(normalizeDoc).filter((d): d is ResumeDoc => d !== null);
  const s = ensure();
  const resumes = s.resumes.slice();
  for (const doc of incoming) {
    const i = resumes.findIndex((d) => d.id === doc.id);
    if (i >= 0) resumes[i] = doc;
    else resumes.push(doc);
  }
  const rawVersions = (data.versions && typeof data.versions === "object" ? data.versions : {}) as Record<string, unknown>;
  const versions = { ...s.versions };
  let count = 0;
  for (const doc of incoming) {
    const list = versionsOf(rawVersions[doc.id]);
    if (!list.length) continue;
    const merged = new Map((versions[doc.id] ?? []).map((v) => [v.id, v]));
    for (const v of list) merged.set(v.id, v);
    versions[doc.id] = [...merged.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_VERSIONS);
    count += list.length;
  }
  const removedSeeds = s.removedSeeds.filter((seed) => !incoming.some((d) => d.id === seed));
  commit({ ...s, resumes, versions, removedSeeds }, { docs: true, versions: true });
  return { resumes: incoming.length, versions: count };
}
