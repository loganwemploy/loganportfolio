import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as pdfLib from "pdf-lib";
import { createFontSet, FONT_KEYS, loadFontkit } from "../src/lib/resume/fonts";
import { fontFile, type FontKey } from "../src/lib/resume/metrics";
import { renderPdf } from "../src/lib/resume/pdf";
import { removePrivateProject } from "../src/lib/resume/privacy";
import { seedDoc, seedDocs } from "../src/lib/resume/seeds";
import {
  addDoc, duplicateDoc, exportBackup, flushSave, getStudio, importBackup,
  restoreSnapshot, updateDoc,
} from "../src/lib/resume/store";
import type { Entry, ResumeDoc } from "../src/lib/resume/types";

const address = "grillmarks.vercel.app";
const privateEntry: Entry = {
  id: "private-entry", title: "Grillmarks", org: "Restaurant recipe reference",
  dates: "2026", location: address,
  bullets: [{ id: "private-bullet", text: "Recipe browser." }],
};

function legacyDoc(id = "restaurant"): ResumeDoc {
  const doc = seedDoc("restaurant")!;
  doc.id = id;
  doc.sections.push({ id: "private-section", kind: "entries", title: "Projects", entries: [privateEntry] });
  return doc;
}

function assertPrivateProjectAbsent(value: unknown) {
  assert.doesNotMatch(JSON.stringify(value), /grill\s*marks/i);
}

test("every built-in template omits the private project", () => {
  const docs = seedDocs();
  assert.equal(docs.length, 9);
  docs.forEach(assertPrivateProjectAbsent);
});

test("cleanup preserves unrelated edits, IDs, formatting and the source snapshot", () => {
  const doc = legacyDoc();
  doc.name = "My custom restaurant resume";
  doc.header.contacts.push({ id: "private-contact", text: `HTTPS://WWW.${address.toUpperCase()}/recipes?x=1#menu` });
  doc.sections.push(
    { id: "summary", kind: "summary", title: "Profile", paragraphs: [{ id: "p", text: `Portfolio: https://${address}` }] },
    { id: "list", kind: "list", title: "Links", items: [{ id: "i", text: address }] },
    { id: "skills", kind: "skills", title: "Skills", rows: [{ id: "r", label: "Web", value: `React, ${address}` }] },
    { id: "hidden", kind: "entries", title: "Hidden", hidden: true, entries: [{ ...privateEntry, title: "Recipe reference" }] },
  );
  const before = structuredClone(doc);
  const cleaned = removePrivateProject(doc);
  assertPrivateProjectAbsent(cleaned);
  assert.deepEqual(doc, before);
  assert.equal(cleaned.id, doc.id);
  assert.equal(cleaned.name, doc.name);
  assert.deepEqual(cleaned.theme, doc.theme);
  assert.deepEqual(cleaned.sections.slice(0, 5), doc.sections.slice(0, 5));
  assert.equal(cleaned.sections.some((s) => s.id === "private-section" || s.id === "hidden"), false);
  assert.deepEqual(removePrivateProject(cleaned), cleaned);
  const unaffected = seedDoc("frontend")!;
  assert.strictEqual(removePrivateProject(unaffected), unaffected);
});

test("saved versions, browser copies, imports, restores and edits stay clean", () => {
  const legacy = legacyDoc();
  const duplicate = legacyDoc("custom-copy");
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  const oldVersion = { id: "v-old", createdAt: legacy.createdAt, label: "Saved version", kind: "manual", snapshot: legacy };
  // Only history needs migration at first, so history alone must be persisted.
  storage.set("resume-studio:docs", JSON.stringify({ v: 1, resumes: seedDocs(), removedSeeds: [] }));
  storage.set("resume-studio:versions", JSON.stringify({ restaurant: [oldVersion] }));
  assertPrivateProjectAbsent(getStudio());
  flushSave();
  assertPrivateProjectAbsent(JSON.parse(storage.get("resume-studio:versions")!));
  assert.equal(getStudio().versions.restaurant[0].id, "v-old");

  importBackup(JSON.stringify({ app: "resume-studio", resumes: [legacy, duplicate], versions: { restaurant: [oldVersion] } }));
  assertPrivateProjectAbsent(getStudio());
  assert.ok(duplicateDoc("custom-copy"));
  restoreSnapshot("restaurant", legacy);
  updateDoc("restaurant", (draft) => { draft.header.contacts.push({ id: "old-link", text: address }); });
  addDoc(legacyDoc("added-copy"));
  assertPrivateProjectAbsent(getStudio());
  assertPrivateProjectAbsent(JSON.parse(exportBackup()));
  assertPrivateProjectAbsent(JSON.parse(storage.get("resume-studio:docs")!));
  assertPrivateProjectAbsent(JSON.parse(storage.get("resume-studio:versions")!));
});

test("all template PDFs and legacy exports omit private links", async () => {
  const kit = await loadFontkit();
  const output = ".next/resume-tests/pdf";
  await mkdir(output, { recursive: true });
  for (const doc of [...seedDocs(), legacyDoc("legacy-export")]) {
    const bytes = Object.fromEntries(await Promise.all(FONT_KEYS.map(async (key) =>
      [key, new Uint8Array(await readFile(`public${fontFile(doc.theme.font, key)}`))],
    ))) as Record<FontKey, Uint8Array>;
    const fonts = createFontSet(doc.theme.font, kit, bytes);
    const result = await renderPdf(doc, pdfLib, kit, fonts);
    const pdf = await pdfLib.PDFDocument.load(result.bytes);
    const links: string[] = [];
    for (const page of pdf.getPages()) {
      for (const ref of page.node.Annots()?.asArray() ?? []) {
        const annotation = pdf.context.lookup(ref, pdfLib.PDFDict);
        const action = annotation.lookup(pdfLib.PDFName.of("A"), pdfLib.PDFDict);
        links.push(action.lookup(pdfLib.PDFName.of("URI"), pdfLib.PDFString).decodeText());
      }
    }
    assertPrivateProjectAbsent(links);
    assert.ok(links.some((link) => link.includes("linkedin.com")), "unrelated contact links survive");
    await writeFile(`${output}/${doc.id}.pdf`, result.bytes);
  }
});
