import type { FontKey } from "./metrics";

/**
 * Ligatures and contextual alternates off, so every glyph maps to exactly one
 * character. ATS parsers read "fi" instead of a ligature glyph, and the editor
 * turns the same features off in CSS so line widths match the PDF.
 */
export const FEATURES = { liga: false, clig: false, calt: false, kern: false };

/** The part of a fontkit font that measuring needs. */
export type ShapingFont = {
  unitsPerEm: number;
  layout(text: string, features?: Record<string, boolean>): { glyphs: { advanceWidth: number }[] };
};

export type Fonts = Record<FontKey, ShapingFont>;

/** Width of `text` in points. */
export type Measure = (text: string, font: FontKey, size: number) => number;

export function createMeasure(fonts: Fonts): Measure {
  const cache = new Map<string, number>();
  return (text, key, size) => {
    if (!text) return 0;
    const cacheKey = `${key}\u0000${text}`;
    let em = cache.get(cacheKey);
    if (em === undefined) {
      const font = fonts[key];
      let units = 0;
      for (const glyph of font.layout(text, FEATURES).glyphs) units += glyph.advanceWidth;
      em = units / font.unitsPerEm;
      cache.set(cacheKey, em);
    }
    return em * size;
  };
}

/**
 * Collapses whitespace the way the PDF prints it, and drops zero-width
 * characters and emoji, which the embedded fonts can't draw.
 */
export const clean = (text: string) =>
  text
    .replace(/[​-‍⁠﻿︎️]|[\u{10000}-\u{10FFFF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export type Run = { text: string; font: FontKey; color?: string; link?: string | null };

/** A same-style stretch of one line, `x` measured from the line start. */
export type Piece = { text: string; run: number; x: number; width: number };
export type Line = { pieces: Piece[]; width: number };

type Seg = { text: string; run: number };
/** An unbreakable stretch of text. `spaceRun` is the run of the space before it, or -1. */
type Box = { segs: Seg[]; spaceRun: number };

const LETTER = /\p{L}/u;
const ALNUM = /[\p{L}\p{N}]/u;
const DIGIT = /\p{N}/u;

/** Break opportunities after hyphens, dashes and slashes, close to what Chrome allows. */
function breaksAfter(prev: string | undefined, c: string, next: string | undefined) {
  if (!next || next === " ") return false;
  if (c === "-") return !!prev && ALNUM.test(prev) && LETTER.test(next);
  if (c === "/") return !DIGIT.test(next) && next !== "/";
  return c === "–" || c === "—";
}

function toBoxes(runs: Run[]): Box[] {
  const chars: { c: string; run: number }[] = [];
  runs.forEach((r, run) => {
    for (const c of r.text.replace(/\s+/g, " ")) chars.push({ c, run });
  });

  const boxes: Box[] = [];
  let box: Box | null = null;
  let pendingSpace = -1;
  for (let i = 0; i < chars.length; i++) {
    const { c, run } = chars[i];
    if (c === " ") {
      if (box) boxes.push(box);
      box = null;
      if (pendingSpace < 0) pendingSpace = run;
      continue;
    }
    if (!box) {
      box = { segs: [], spaceRun: pendingSpace };
      pendingSpace = -1;
    }
    const last = box.segs[box.segs.length - 1];
    if (last && last.run === run) last.text += c;
    else box.segs.push({ text: c, run });
    if (breaksAfter(chars[i - 1]?.c, c, chars[i + 1]?.c)) {
      boxes.push(box);
      box = null;
    }
  }
  if (box) boxes.push(box);
  return boxes;
}

/** Splits a box that is wider than a whole line into character chunks that fit. */
function splitBox(box: Box, max: number, width: (seg: Seg) => number): Box[] {
  const parts: Box[] = [];
  let current: Box = { segs: [], spaceRun: box.spaceRun };
  let used = 0;
  for (const seg of box.segs) {
    for (const c of seg.text) {
      const w = width({ text: c, run: seg.run });
      if (current.segs.length && used + w > max) {
        parts.push(current);
        current = { segs: [], spaceRun: -1 };
        used = 0;
      }
      const last = current.segs[current.segs.length - 1];
      if (last && last.run === seg.run) last.text += c;
      else current.segs.push({ text: c, run: seg.run });
      used += w;
    }
  }
  if (current.segs.length) parts.push(current);
  return parts;
}

/**
 * Greedy line breaking over styled runs, the same strategy browsers use, so
 * lines in the PDF break where they do in the editor.
 */
export function wrap(
  runs: Run[],
  size: number,
  maxWidth: number | ((line: number) => number),
  measure: Measure,
): Line[] {
  const widthAt = typeof maxWidth === "number" ? () => maxWidth : maxWidth;
  const segWidth = (seg: Seg) => measure(seg.text, runs[seg.run].font, size);
  const boxWidth = (box: Box) => box.segs.reduce((sum, seg) => sum + segWidth(seg), 0);

  const lines: Line[] = [];
  let pieces: Piece[] = [];
  let x = 0;

  const flush = () => {
    lines.push({ pieces, width: x });
    pieces = [];
    x = 0;
  };

  /*
   * Spaces between words are drawn as real space characters (never as bare
   * gaps) so text copied from the PDF, or read by an ATS, keeps its spaces.
   */
  const place = (box: Box, space: number) => {
    let gap = space;
    for (const seg of box.segs) {
      const w = segWidth(seg);
      const last = pieces[pieces.length - 1];
      if (gap && last && last.run === box.spaceRun) {
        last.text += " ";
        last.width += gap;
        x += gap;
        gap = 0;
      }
      if (last && last.run === seg.run) {
        last.text += (gap ? " " : "") + seg.text;
        last.width += gap + w;
      } else {
        pieces.push({ text: (gap ? " " : "") + seg.text, run: seg.run, x, width: gap + w });
      }
      x += gap + w;
      gap = 0;
    }
  };

  for (const box of toBoxes(runs)) {
    const w = boxWidth(box);
    let space = pieces.length && box.spaceRun >= 0 ? measure(" ", runs[box.spaceRun].font, size) : 0;
    if (pieces.length && x + space + w > widthAt(lines.length) + 0.01) {
      flush();
      space = 0;
    }
    if (!pieces.length && w > widthAt(lines.length) + 0.01) {
      const parts = splitBox(box, widthAt(lines.length), segWidth);
      parts.forEach((part, i) => {
        if (i > 0) flush();
        place(part, 0);
      });
      continue;
    }
    place(box, space);
  }
  if (pieces.length || !lines.length) flush();
  return lines;
}
