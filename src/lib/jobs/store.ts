import { useSyncExternalStore } from "react";
import { normalizeDoc } from "@/lib/resume/store";
import { newId, type ResumeDoc } from "@/lib/resume/types";

/*
 * Job applications live in this browser's localStorage, like the resumes.
 * Use Export on the Applications page to keep a copy somewhere safe.
 */
const KEY = "resume-studio:applications";

export const STATUSES = [
  "Saved",
  "Applied",
  "Screening",
  "Interviewing",
  "Offer",
  "Accepted",
  "Rejected",
  "Withdrawn",
  "No response",
] as const;
export type Status = (typeof STATUSES)[number];

export const WORK_TYPES = ["", "Remote", "Hybrid", "On-site"] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export type StatusChange = { status: Status; at: string };

export type Application = {
  id: string;
  company: string;
  title: string;
  link: string;
  location: string;
  workType: WorkType;
  salary: string;
  /** Where the posting was found: LinkedIn, Indeed, referral... */
  source: string;
  /** YYYY-MM-DD */
  appliedOn: string;
  status: Status;
  history: StatusChange[];
  description: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  /** YYYY-MM-DD */
  followUpOn: string;
  /** 1-5, how much you want this job */
  interest: number;
  /** The resume exactly as it was sent. */
  resume: { docId: string; versionId: string; label: string; attachedAt: string; snapshot: ResumeDoc } | null;
  /** What the sent resume is compared with: "seed:<id>" (the built-in standard) or a resume id. */
  compareWith: string;
  createdAt: string;
  updatedAt: string;
};

let apps: Application[] | null = null;
const listeners = new Set<() => void>();
const now = () => new Date().toISOString();
const today = () => new Date().toLocaleDateString("en-CA");
const s = (v: unknown) => (typeof v === "string" ? v : "");

function normalize(raw: unknown): Application | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const status = STATUSES.includes(r.status as Status) ? (r.status as Status) : "Applied";
  const res = r.resume as Record<string, unknown> | null | undefined;
  const snapshot = res ? normalizeDoc(res.snapshot) : null;
  return {
    id: s(r.id) || newId("job"),
    company: s(r.company),
    title: s(r.title),
    link: s(r.link),
    location: s(r.location),
    workType: WORK_TYPES.includes(r.workType as WorkType) ? (r.workType as WorkType) : "",
    salary: s(r.salary),
    source: s(r.source),
    appliedOn: s(r.appliedOn),
    status,
    history: Array.isArray(r.history)
      ? r.history
          .filter((h) => h && STATUSES.includes(h.status))
          .map((h) => ({ status: h.status as Status, at: s(h.at) }))
      : [],
    description: s(r.description),
    notes: s(r.notes),
    contactName: s(r.contactName),
    contactEmail: s(r.contactEmail),
    followUpOn: s(r.followUpOn),
    interest: typeof r.interest === "number" ? Math.min(5, Math.max(0, r.interest)) : 0,
    resume:
      res && snapshot
        ? { docId: s(res.docId), versionId: s(res.versionId), label: s(res.label), attachedAt: s(res.attachedAt), snapshot }
        : null,
    compareWith: s(r.compareWith),
    createdAt: s(r.createdAt) || now(),
    updatedAt: s(r.updatedAt) || now(),
  };
}

function load(): Application[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.map(normalize).filter((a): a is Application => a !== null) : [];
  } catch {
    return [];
  }
}

let saveError: string | null = null;
function commit(next: Application[]) {
  apps = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    saveError = null;
  } catch {
    saveError = "Your browser's storage is full, so the latest changes aren't saved. Export a backup.";
  }
  listeners.forEach((l) => l());
}

function ensure() {
  if (!apps) apps = load();
  return apps;
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      apps = load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useApplications(): Application[] | null {
  return useSyncExternalStore(subscribe, ensure, () => null);
}
export function useJobsSaveError() {
  return useSyncExternalStore(subscribe, () => saveError, () => null);
}

export function addApplication(): string {
  const stamp = now();
  const app: Application = {
    id: newId("job"),
    company: "",
    title: "",
    link: "",
    location: "",
    workType: "",
    salary: "",
    source: "",
    appliedOn: today(),
    status: "Applied",
    history: [{ status: "Applied", at: stamp }],
    description: "",
    notes: "",
    contactName: "",
    contactEmail: "",
    followUpOn: "",
    interest: 0,
    resume: null,
    compareWith: "",
    createdAt: stamp,
    updatedAt: stamp,
  };
  commit([app, ...ensure()]);
  return app.id;
}

export function updateApplication(id: string, patch: Partial<Application>) {
  commit(
    ensure().map((a) => {
      if (a.id !== id) return a;
      const next = { ...a, ...patch, id, updatedAt: now() };
      if (patch.status && patch.status !== a.status) {
        next.history = [...a.history, { status: patch.status, at: now() }];
      }
      return next;
    }),
  );
}

export function deleteApplication(id: string) {
  commit(ensure().filter((a) => a.id !== id));
}

export function duplicateApplication(id: string): string | null {
  const src = ensure().find((a) => a.id === id);
  if (!src) return null;
  const stamp = now();
  const copy = { ...structuredClone(src), id: newId("job"), title: `${src.title} (copy)`, createdAt: stamp, updatedAt: stamp };
  commit([copy, ...ensure()]);
  return copy.id;
}

export function exportApplications() {
  return JSON.stringify({ app: "resume-studio-applications", v: 1, exportedAt: now(), applications: ensure() }, null, 1);
}

/** Merges a backup: same id replaced, others added. Returns how many were read. */
export function importApplications(text: string): number {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (data?.app !== "resume-studio-applications" || !Array.isArray(data.applications)) {
    throw new Error("That file isn't an Applications backup.");
  }
  const incoming = data.applications.map(normalize).filter((a): a is Application => a !== null);
  const map = new Map(ensure().map((a) => [a.id, a]));
  for (const a of incoming) map.set(a.id, a);
  commit([...map.values()]);
  return incoming.length;
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
export function applicationsCsv(list: Application[]) {
  const head = ["Applied", "Company", "Title", "Status", "Location", "Work type", "Salary", "Source", "Link", "Resume", "Contact", "Contact email", "Follow up", "Interest", "Notes", "Description"];
  const rows = list.map((a) => [
    a.appliedOn, a.company, a.title, a.status, a.location, a.workType, a.salary, a.source, a.link,
    a.resume ? `${a.resume.snapshot.name} - ${a.resume.label}` : "", a.contactName, a.contactEmail,
    a.followUpOn, a.interest ? String(a.interest) : "", a.notes, a.description,
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
