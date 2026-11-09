import type { Bullet, ResumeDoc, Section } from "./types";

const PROJECT = /\bgrill\s*marks\b/i;
const URL = /(?:https?:\/\/)?(?:www\.)?\bgrillmarks\.vercel\.app\b(?:[/?#][^\s<>"')\]]*)?/gi;

/** Remove the private project's name and address without rewriting other text. */
function cleanText(text: string): string {
  if (!PROJECT.test(text)) return text;
  return text.replace(URL, "").replace(/\bgrill\s*marks\b/gi, "").replace(/ {2,}/g, " ").trim();
}

function cleanBullets(items: Bullet[]): Bullet[] {
  return items.flatMap((item) => {
    const text = cleanText(item.text);
    return text || text === item.text ? [{ ...item, text }] : [];
  });
}

/**
 * Old browser saves, duplicates and backups can still contain this project.
 * Keep their IDs and unrelated edits; remove the project and any copied links.
 * Also used at PDF export so an older in-memory snapshot cannot disclose it.
 */
export function removePrivateProject(doc: ResumeDoc): ResumeDoc {
  if (!PROJECT.test(JSON.stringify(doc))) return doc;
  return {
    ...doc,
    name: cleanText(doc.name),
    target: cleanText(doc.target),
    notes: cleanText(doc.notes),
    header: {
      name: cleanText(doc.header.name),
      headline: cleanText(doc.header.headline),
      contacts: cleanBullets(doc.header.contacts),
    },
    sections: doc.sections.flatMap((section): Section[] => {
      const base = { ...section, title: cleanText(section.title) };
      switch (section.kind) {
        case "entries": {
          const entries = section.entries
            .filter((entry) => !PROJECT.test(entry.title) && !PROJECT.test(entry.location))
            .map((entry) => ({
              ...entry,
              title: cleanText(entry.title),
              org: cleanText(entry.org),
              dates: cleanText(entry.dates),
              location: cleanText(entry.location),
              bullets: cleanBullets(entry.bullets),
            }));
          // Drop a heading left empty by removal; preserve intentionally blank sections.
          return section.entries.length && !entries.length ? [] : [{ ...base, kind: "entries", entries }];
        }
        case "summary":
          return [{ ...base, kind: "summary", paragraphs: cleanBullets(section.paragraphs) }];
        case "list":
          return [{ ...base, kind: "list", items: cleanBullets(section.items) }];
        case "skills":
          return [{ ...base, kind: "skills", rows: section.rows.flatMap((row) => {
            const label = cleanText(row.label);
            const value = cleanText(row.value);
            return label || value || (!row.label && !row.value) ? [{ ...row, label, value }] : [];
          }) }];
      }
    }),
  };
}
