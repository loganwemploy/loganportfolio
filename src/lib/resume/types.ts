/** A single line of text that can be reordered: a bullet, paragraph, list item or contact. */
export type Bullet = { id: string; text: string };

/** A job, project or school. `location` doubles as a URL slot for projects. */
export type Entry = {
  id: string;
  title: string;
  org: string;
  dates: string;
  location: string;
  bullets: Bullet[];
};

export type SkillRow = { id: string; label: string; value: string };

type SectionBase = { id: string; title: string; hidden?: boolean };

export type SummarySection = SectionBase & { kind: "summary"; paragraphs: Bullet[] };
export type EntriesSection = SectionBase & { kind: "entries"; entries: Entry[] };
export type SkillsSection = SectionBase & { kind: "skills"; rows: SkillRow[] };
export type ListSection = SectionBase & { kind: "list"; items: Bullet[] };

export type Section = SummarySection | EntriesSection | SkillsSection | ListSection;
export type SectionKind = Section["kind"];

export type ResumeTheme = {
  font: "sans" | "serif";
  accent: string;
  size: "standard" | "compact";
  margin: "narrow" | "normal" | "wide";
  align: "left" | "center";
};

export const DEFAULT_THEME: ResumeTheme = {
  font: "sans",
  accent: "#1d1d1b",
  size: "standard",
  margin: "normal",
  align: "left",
};

export type ResumeHeader = { name: string; headline: string; contacts: Bullet[] };

export type ResumeDoc = {
  id: string;
  /** Short label for the variant, e.g. "Frontend Developer". Also used in the PDF file name. */
  name: string;
  /** The kind of role this version is aimed at. Shown on the hub, never printed. */
  target: string;
  /** Private notes and reminders for this version. Never printed. */
  notes: string;
  /** Id of the built-in variant this one started from, so it can be reset. */
  seed?: string;
  createdAt: string;
  updatedAt: string;
  theme: ResumeTheme;
  header: ResumeHeader;
  sections: Section[];
};

export type VersionKind = "generated" | "manual" | "restore";

export type ResumeVersion = {
  id: string;
  createdAt: string;
  label: string;
  kind: VersionKind;
  pages?: number;
  snapshot: ResumeDoc;
};

export type StudioState = {
  v: 1;
  resumes: ResumeDoc[];
  versions: Record<string, ResumeVersion[]>;
  /** Built-in variants the user deleted, so they aren't added back on the next load. */
  removedSeeds: string[];
};

export const ACCENTS = [
  { name: "Ink", value: "#1d1d1b" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Teal", value: "#0f5e66" },
  { name: "Forest", value: "#24543f" },
  { name: "Wine", value: "#7b2d3b" },
  { name: "Plum", value: "#4b2c5e" },
  { name: "Rust", value: "#9a4416" },
] as const;

export function newId(prefix = "x") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const DOMAIN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;
const PHONE = /^[\d\s().+-]+$/;

/** Turns contact-ish text into a link target: email, phone, or a bare domain/URL. */
export function linkFor(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (EMAIL.test(t)) return `mailto:${t}`;
  const digits = t.replace(/\D/g, "");
  if (PHONE.test(t) && digits.length >= 10) {
    return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
  }
  if (DOMAIN.test(t)) return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  return null;
}

export function pdfFileName(doc: ResumeDoc) {
  const base = `${doc.header.name || "Resume"} Resume ${doc.name}`;
  return `${base.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}.pdf`;
}
