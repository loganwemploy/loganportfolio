import type { Bullet, Entry, ResumeDoc, Section, SectionKind, SkillRow } from "./types";
import { newId } from "./types";

/**
 * Every reorderable list in a resume has a key:
 *   "sections" · "contacts" · "entries:<sectionId>" · "rows:<sectionId>"
 *   "paras:<sectionId>" · "items:<sectionId>" · "bullets:<entryId>"
 * Items can move between lists of the same kind (a bullet from one job to another).
 */
export type ItemKind = "section" | "contact" | "entry" | "row" | "para" | "item" | "bullet";

type HasId = { id: string };

const PREFIX_KIND: Record<string, ItemKind> = {
  entries: "entry",
  rows: "row",
  paras: "para",
  items: "item",
  bullets: "bullet",
};

export function listKind(key: string): ItemKind | null {
  if (key === "sections") return "section";
  if (key === "contacts") return "contact";
  return PREFIX_KIND[key.split(":")[0]] ?? null;
}

export function findEntry(doc: ResumeDoc, entryId: string) {
  for (const section of doc.sections) {
    if (section.kind !== "entries") continue;
    const entry = section.entries.find((e) => e.id === entryId);
    if (entry) return { section, entry };
  }
  return null;
}

export function listOf(doc: ResumeDoc, key: string): HasId[] | null {
  if (key === "sections") return doc.sections;
  if (key === "contacts") return doc.header.contacts;
  const [prefix, id] = key.split(":");
  if (prefix === "bullets") return findEntry(doc, id)?.entry.bullets ?? null;
  const section = doc.sections.find((s) => s.id === id);
  if (!section) return null;
  if (prefix === "entries" && section.kind === "entries") return section.entries;
  if (prefix === "rows" && section.kind === "skills") return section.rows;
  if (prefix === "paras" && section.kind === "summary") return section.paragraphs;
  if (prefix === "items" && section.kind === "list") return section.items;
  return null;
}

/** Plain text items (bullets, list items, paragraphs) can also move between those kinds of list. */
const TEXT_KINDS: ItemKind[] = ["bullet", "item", "para"];

export function canMove(from: ItemKind, to: ItemKind) {
  return from === to || (TEXT_KINDS.includes(from) && TEXT_KINDS.includes(to));
}

/** Sets a text field (title, dates, label…) on an item in a list. Returns false if nothing changed. */
export function setText(doc: ResumeDoc, key: string, id: string, field: string, value: string): boolean {
  const item = listOf(doc, key)?.find((x) => x.id === id) as Record<string, unknown> | undefined;
  if (!item || typeof item[field] !== "string" || item[field] === value) return false;
  item[field] = value;
  return true;
}

/** Moves an item to `toIndex` (an insertion point in the target list as it is now). */
export function moveItem(
  doc: ResumeDoc,
  fromKey: string,
  id: string,
  toKey: string,
  toIndex: number,
): boolean {
  const fromKind = listKind(fromKey);
  const toKind = listKind(toKey);
  if (!fromKind || !toKind || !canMove(fromKind, toKind)) return false;
  const from = listOf(doc, fromKey);
  const to = listOf(doc, toKey);
  if (!from || !to) return false;
  const index = from.findIndex((x) => x.id === id);
  if (index < 0) return false;
  let target = Math.max(0, Math.min(toIndex, to.length));
  if (from === to) {
    if (target === index || target === index + 1) return false;
    if (target > index) target -= 1;
  }
  const [item] = from.splice(index, 1);
  to.splice(target, 0, item);
  return true;
}

export function moveBy(doc: ResumeDoc, key: string, id: string, delta: number): boolean {
  const list = listOf(doc, key);
  if (!list) return false;
  const i = list.findIndex((x) => x.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return false;
  const [item] = list.splice(i, 1);
  list.splice(j, 0, item);
  return true;
}

export function removeFrom(doc: ResumeDoc, key: string, id: string): number {
  const list = listOf(doc, key);
  if (!list) return -1;
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) list.splice(i, 1);
  return i;
}

export function insertInto(doc: ResumeDoc, key: string, index: number, item: HasId) {
  const list = listOf(doc, key);
  if (!list) return;
  list.splice(Math.max(0, Math.min(index, list.length)), 0, item);
}

export function blankBullet(): Bullet {
  return { id: newId("b"), text: "" };
}

export function blankEntry(): Entry {
  return { id: newId("e"), title: "", org: "", dates: "", location: "", bullets: [blankBullet()] };
}

export function blankSection(kind: SectionKind, title: string): Section {
  const id = newId("s");
  switch (kind) {
    case "summary":
      return { id, kind, title, paragraphs: [blankBullet()] };
    case "entries":
      return { id, kind, title, entries: [blankEntry()] };
    case "skills":
      return { id, kind, title, rows: [{ id: newId("r"), label: "", value: "" }] };
    case "list":
      return { id, kind, title, items: [blankBullet()] };
  }
}

/** Key of a section's own list (its paragraphs, entries, rows or items). */
export function childKey(section: Section): string {
  switch (section.kind) {
    case "summary":
      return `paras:${section.id}`;
    case "entries":
      return `entries:${section.id}`;
    case "skills":
      return `rows:${section.id}`;
    case "list":
      return `items:${section.id}`;
  }
}

export function blankChild(section: Section): Bullet | Entry | SkillRow {
  if (section.kind === "entries") return blankEntry();
  if (section.kind === "skills") return { id: newId("r"), label: "", value: "" };
  return blankBullet();
}

export const SECTION_PRESETS: { kind: SectionKind; title: string; label: string }[] = [
  { kind: "summary", title: "Summary", label: "Summary" },
  { kind: "entries", title: "Experience", label: "Experience" },
  { kind: "entries", title: "Selected Projects", label: "Projects" },
  { kind: "skills", title: "Skills", label: "Skills" },
  { kind: "entries", title: "Education", label: "Education" },
  { kind: "list", title: "Certifications", label: "Certifications" },
  { kind: "list", title: "Highlights", label: "Bullet list" },
];

export const KIND_LABEL: Record<SectionKind, string> = {
  summary: "Paragraphs",
  entries: "Entries",
  skills: "Skill rows",
  list: "Bullet list",
};

export function cloneDoc<T>(value: T): T {
  return structuredClone(value);
}
