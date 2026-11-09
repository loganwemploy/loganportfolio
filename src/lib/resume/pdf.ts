import type { PDFFont } from "pdf-lib";
import { FONT_KEYS, loadFontkit, loadFonts, type Fontkit, type FontSet } from "./fonts";
import { layoutResume } from "./layout";
import { removePrivateProject } from "./privacy";
import { hexToRgb, PAGE, type FontKey } from "./metrics";
import { FEATURES } from "./text";
import { pdfFileName, type ResumeDoc } from "./types";

type PdfLib = typeof import("pdf-lib");

export type PdfResult = { bytes: Uint8Array; pages: number };

/**
 * Draws the laid-out resume with pdf-lib. Fonts are embedded as subsets with
 * ligatures off, so every word is real, selectable text that ATS parsers and
 * copy-paste read correctly. Emails, phone numbers and URLs become links.
 */
export async function renderPdf(doc: ResumeDoc, lib: PdfLib, kit: Fontkit, fonts: FontSet): Promise<PdfResult> {
  doc = removePrivateProject(doc);
  const { PDFDocument, PDFString, rgb, pushGraphicsState, popGraphicsState, setCharacterSpacing } = lib;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(kit);

  const embedded = {} as Record<FontKey, PDFFont>;
  for (const key of FONT_KEYS) {
    embedded[key] = await pdf.embedFont(fonts.bytes[key], { subset: true, features: FEATURES });
  }

  const layout = layoutResume(doc, fonts.measure);
  const { ascent, descent } = layout.m;
  const colors = new Map<string, ReturnType<typeof rgb>>();
  const color = (hex: string) => {
    let c = colors.get(hex);
    if (!c) {
      const [r, g, b] = hexToRgb(hex);
      c = rgb(r / 255, g / 255, b / 255);
      colors.set(hex, c);
    }
    return c;
  };

  for (const ops of layout.pages) {
    const page = pdf.addPage([PAGE.width, PAGE.height]);
    for (const op of ops) {
      const y = PAGE.height - op.y;
      if (op.kind === "rule") {
        page.drawLine({
          start: { x: op.x1, y },
          end: { x: op.x2, y },
          thickness: op.thickness,
          color: color(op.color),
        });
        continue;
      }
      if (op.tracking) page.pushOperators(pushGraphicsState(), setCharacterSpacing(op.tracking));
      page.drawText(op.text, { x: op.x, y, size: op.size, font: embedded[op.font], color: color(op.color) });
      if (op.tracking) page.pushOperators(popGraphicsState());
      if (op.link) {
        const annot = pdf.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [op.x, y - descent * op.size, op.x + op.width, y + ascent * op.size],
          Border: [0, 0, 0],
          A: { Type: "Action", S: "URI", URI: PDFString.of(op.link) },
        });
        page.node.addAnnot(pdf.context.register(annot));
      }
    }
  }

  const name = doc.header.name.trim() || "Resume";
  const headline = doc.header.headline.trim();
  pdf.setTitle(`${name} – Resume`, { showInWindowTitleBar: true });
  pdf.setAuthor(name);
  if (headline) pdf.setSubject(headline);
  pdf.setCreator("Resume Studio");
  pdf.setProducer("Resume Studio (pdf-lib)");
  pdf.setLanguage("en-US");

  return { bytes: await pdf.save(), pages: layout.pages.length };
}

export async function buildPdf(doc: ResumeDoc): Promise<PdfResult> {
  const [lib, kit, fonts] = await Promise.all([import("pdf-lib"), loadFontkit(), loadFonts(doc.theme.font)]);
  return renderPdf(doc, lib, kit, fonts);
}

/** Builds the PDF and hands it to the browser as a download. */
export async function downloadPdf(doc: ResumeDoc, fileName = pdfFileName(doc)): Promise<PdfResult> {
  const result = await buildPdf(doc);
  const url = URL.createObjectURL(new Blob([new Uint8Array(result.bytes)], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return result;
}
