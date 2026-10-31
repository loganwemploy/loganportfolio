import type { ResumeDoc } from "@/lib/resume/types";

export type DiffGroup = { where: string; added: string[]; removed: string[] };

/** Every printed line of a resume, grouped by where it appears. */
function lines(doc: ResumeDoc): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const push = (where: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    out.set(where, [...(out.get(where) ?? []), t]);
  };
  push("Header", doc.header.name);
  push("Header", doc.header.headline);
  doc.header.contacts.forEach((c) => push("Header", c.text));
  for (const s of doc.sections) {
    const where = (s.title || s.kind) + (s.hidden ? " (hidden)" : "");
    if (s.kind === "summary") s.paragraphs.forEach((p) => push(where, p.text));
    if (s.kind === "list") s.items.forEach((p) => push(where, p.text));
    if (s.kind === "skills") s.rows.forEach((r) => push(where, `${r.label}: ${r.value}`));
    if (s.kind === "entries")
      s.entries.forEach((e) => {
        const head = [e.title, e.org, e.dates, e.location].filter(Boolean).join(" · ");
        push(where, head);
        e.bullets.forEach((b) => push(`${where} › ${e.title || e.org}`, b.text));
      });
  }
  return out;
}

/** What was added to and removed from `base` to get `sent`, by section. */
export function diffResumes(base: ResumeDoc, sent: ResumeDoc): DiffGroup[] {
  const a = lines(base);
  const b = lines(sent);
  const groups: DiffGroup[] = [];
  for (const where of new Set([...b.keys(), ...a.keys()])) {
    const before = a.get(where) ?? [];
    const after = b.get(where) ?? [];
    const added = after.filter((t) => !before.includes(t));
    const removed = before.filter((t) => !after.includes(t));
    if (added.length || removed.length) groups.push({ where, added, removed });
  }
  return groups;
}
