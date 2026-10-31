import { baselineIn, CONTACT_SEP, metrics, PAGE, type FontKey, type Metrics } from "./metrics";
import { clean, wrap, type Measure, type Run } from "./text";
import { linkFor, type Entry, type ResumeDoc, type Section } from "./types";

export const BULLET = "•";

/** Text drawn with its baseline at `y`, measured down from the top of the page. */
export type TextOp = {
  kind: "text";
  x: number;
  y: number;
  text: string;
  font: FontKey;
  size: number;
  color: string;
  /** Extra space after each character, in points. */
  tracking: number;
  width: number;
  link: string | null;
};

export type RuleOp = {
  kind: "rule";
  x1: number;
  x2: number;
  y: number;
  thickness: number;
  color: string;
};

export type Op = TextOp | RuleOp;

/** A strip of a block that is never split. Op `y` values are relative to its top. */
type Slice = { height: number; ops: Op[] };

/**
 * One block on the page: the header, a section heading, an entry's title rows,
 * a bullet, a paragraph or a skill row. `id` matches the editor's `data-block`
 * attribute so the editor can mark where each new page starts.
 */
type Block = { id: string; before: number; keepWithNext: boolean; slices: Slice[] };

export type PageBreak = { id: string; page: number };
export type Layout = { m: Metrics; pages: Op[][]; breaks: PageBreak[] };

type Ctx = { m: Metrics; measure: Measure };

const EPS = 0.01;
/** Widest the right-hand column (dates, location) may get, as a share of the line. */
export const RIGHT_COLUMN = 0.45;

const moved = (op: Op, dy: number): Op => ({ ...op, y: op.y + dy });
const spacer = (height: number): Slice => ({ height, ops: [] });
const heightOf = (block: Block) => block.slices.reduce((sum, s) => sum + s.height, 0);

function runsOf(text: string, font: FontKey, link?: boolean): Run[] {
  const t = clean(text);
  return t ? [{ text: t, font, link: link ? linkFor(t) : null }] : [];
}

type TextOpts = {
  size: number;
  x: number;
  width: number;
  color: string;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  /** Letter spacing in em. */
  tracking?: number;
};

function textSlices(ctx: Ctx, runs: Run[], o: TextOpts): Slice[] {
  const { m } = ctx;
  const lineHeight = o.lineHeight ?? m.lineHeight;
  const tracking = (o.tracking ?? 0) * o.size;
  const measure: Measure = tracking
    ? (text, font, size) => ctx.measure(text, font, size) + Array.from(text).length * tracking
    : ctx.measure;
  const height = o.size * lineHeight;
  const baseline = baselineIn(m, o.size, lineHeight);

  return wrap(runs, o.size, o.width, measure).map((line) => {
    const free = o.width - line.width;
    const shift = o.align === "center" ? free / 2 : o.align === "right" ? free : 0;
    return {
      height,
      ops: line.pieces.map((piece): TextOp => {
        const run = runs[piece.run];
        return {
          kind: "text",
          x: o.x + shift + piece.x,
          y: baseline,
          text: piece.text,
          font: run.font,
          size: o.size,
          color: run.color ?? o.color,
          tracking,
          width: piece.width,
          link: run.link ?? null,
        };
      }),
    };
  });
}

/**
 * A left column that wraps and a right column sized to its text (capped at
 * RIGHT_COLUMN), baseline-aligned like the editor's `align-items: baseline` row.
 */
function columns(ctx: Ctx, left: Run[], right: Run[], leftSize: number, rightSize: number): Slice | null {
  const { m } = ctx;
  if (!left.length && !right.length) return null;

  let rightWidth = 0;
  let rightSlices: Slice[] = [];
  if (right.length) {
    const natural = Math.max(...wrap(right, rightSize, Infinity, ctx.measure).map((l) => l.width));
    rightWidth = Math.min(natural, m.width * RIGHT_COLUMN);
    rightSlices = textSlices(ctx, right, {
      size: rightSize,
      x: m.margin + m.width - rightWidth,
      width: rightWidth,
      color: m.color.muted,
      align: "right",
    });
  }

  const leftWidth = m.width - (right.length ? rightWidth + m.columnGap : 0);
  const leftSlices = left.length
    ? textSlices(ctx, left, { size: leftSize, x: m.margin, width: leftWidth, color: m.color.text })
    : [];

  const leftBase = left.length ? baselineIn(m, leftSize, m.lineHeight) : 0;
  const rightBase = right.length ? baselineIn(m, rightSize, m.lineHeight) : 0;
  const shared = Math.max(leftBase, rightBase);

  const ops: Op[] = [];
  let height = 0;
  const stack = (slices: Slice[], top: number) => {
    let y = top;
    for (const slice of slices) {
      for (const op of slice.ops) ops.push(moved(op, y));
      y += slice.height;
    }
    height = Math.max(height, y);
  };
  stack(leftSlices, shared - leftBase);
  stack(rightSlices, shared - rightBase);
  return { height, ops };
}

/** Packs contact items into lines without breaking inside an item. */
export function packContacts(measure: Measure, items: string[], size: number, width: number) {
  const sep = measure(CONTACT_SEP, "regular", size);
  const lines: { items: number[]; width: number }[] = [];
  let current: number[] = [];
  let used = 0;
  items.forEach((text, i) => {
    const w = measure(text, "regular", size);
    if (current.length && used + sep + w > width + EPS) {
      lines.push({ items: current, width: used });
      current = [];
      used = 0;
    }
    used += (current.length ? sep : 0) + w;
    current.push(i);
  });
  if (current.length) lines.push({ items: current, width: used });
  return lines;
}

function contactSlices(ctx: Ctx, items: string[]): Slice[] {
  const { m, measure } = ctx;
  const size = m.size.contact;
  const baseline = baselineIn(m, size, m.lineHeight);
  const sepWidth = measure(CONTACT_SEP, "regular", size);
  const op = (x: number, text: string, width: number, link: string | null): TextOp => ({
    kind: "text",
    x,
    y: baseline,
    text,
    font: "regular",
    size,
    color: m.color.muted,
    tracking: 0,
    width,
    link,
  });

  return packContacts(measure, items, size, m.width).map((line) => {
    let x = m.margin + (m.align === "center" ? (m.width - line.width) / 2 : 0);
    const ops: Op[] = [];
    line.items.forEach((index, k) => {
      if (k > 0) {
        ops.push(op(x, CONTACT_SEP, sepWidth, null));
        x += sepWidth;
      }
      const text = items[index];
      const width = measure(text, "regular", size);
      ops.push(op(x, text, width, linkFor(text)));
      x += width;
    });
    return { height: size * m.lineHeight, ops };
  });
}

function headerBlock(ctx: Ctx, doc: ResumeDoc): Block | null {
  const { m } = ctx;
  const base = { x: m.margin, width: m.width, align: m.align };
  const name = runsOf(doc.header.name, "bold");
  const headline = runsOf(doc.header.headline, "semibold");
  const contacts = doc.header.contacts.map((c) => clean(c.text)).filter(Boolean);
  if (!name.length && !headline.length && !contacts.length) return null;

  // The editor always renders all three parts, so the gaps are always there too.
  const slices: Slice[] = [
    ...(name.length
      ? textSlices(ctx, name, { ...base, size: m.size.name, lineHeight: m.nameLineHeight, color: m.color.text })
      : []),
    spacer(m.gap.headline),
    ...(headline.length
      ? textSlices(ctx, headline, { ...base, size: m.size.headline, color: m.color.accent })
      : []),
    spacer(m.gap.contacts),
    ...contactSlices(ctx, contacts),
  ];
  return { id: "header", before: 0, keepWithNext: false, slices };
}

function bulletSlices(ctx: Ctx, text: string): Slice[] {
  const { m, measure } = ctx;
  const size = m.size.body;
  const slices = textSlices(ctx, [{ text, font: "regular" }], {
    size,
    x: m.margin + m.bulletIndent,
    width: m.width - m.bulletIndent,
    color: m.color.text,
  });
  slices[0].ops.unshift({
    kind: "text",
    x: m.margin + m.bulletX,
    y: baselineIn(m, size, m.lineHeight),
    text: BULLET,
    font: "regular",
    size,
    color: m.color.accent,
    tracking: 0,
    width: measure(BULLET, "regular", size),
    link: null,
  });
  return slices;
}

function entryBlocks(ctx: Ctx, entry: Entry, before: number): Block[] {
  const { m } = ctx;
  const head = [
    columns(ctx, runsOf(entry.title, "bold"), runsOf(entry.dates, "regular"), m.size.title, m.size.meta),
    columns(ctx, runsOf(entry.org, "italic"), runsOf(entry.location, "regular", true), m.size.meta, m.size.meta),
  ].filter((s): s is Slice => s !== null);
  const bullets = entry.bullets
    .map((b) => ({ id: b.id, text: clean(b.text) }))
    .filter((b) => b.text);

  const blocks: Block[] = [];
  if (head.length) {
    blocks.push({ id: entry.id, before, keepWithNext: bullets.length > 0, slices: head });
  }
  bullets.forEach((b, i) => {
    blocks.push({
      id: b.id,
      before: i === 0 && !head.length ? before : m.gap.bullet,
      keepWithNext: false,
      slices: bulletSlices(ctx, b.text),
    });
  });
  return blocks;
}

function childBlocks(ctx: Ctx, section: Section): Block[] {
  const { m } = ctx;
  const blocks: Block[] = [];
  const next = (gap: number) => (blocks.length ? gap : m.gap.heading);
  const body = { size: m.size.body, x: m.margin, width: m.width, color: m.color.text };

  switch (section.kind) {
    case "summary":
      for (const p of section.paragraphs) {
        const runs = runsOf(p.text, "regular");
        if (!runs.length) continue;
        blocks.push({ id: p.id, before: next(m.gap.para), keepWithNext: false, slices: textSlices(ctx, runs, body) });
      }
      break;
    case "skills":
      for (const row of section.rows) {
        const label = clean(row.label);
        const value = clean(row.value);
        if (!label && !value) continue;
        const runs: Run[] = [];
        if (label) runs.push({ text: `${label}:`, font: "semibold" });
        if (value) runs.push({ text: label ? ` ${value}` : value, font: "regular" });
        blocks.push({ id: row.id, before: next(m.gap.bullet), keepWithNext: false, slices: textSlices(ctx, runs, body) });
      }
      break;
    case "list":
      for (const item of section.items) {
        const text = clean(item.text);
        if (!text) continue;
        blocks.push({ id: item.id, before: next(m.gap.bullet), keepWithNext: false, slices: bulletSlices(ctx, text) });
      }
      break;
    case "entries":
      for (const entry of section.entries) {
        blocks.push(...entryBlocks(ctx, entry, next(m.gap.entry)));
      }
      break;
  }
  return blocks;
}

function sectionBlocks(ctx: Ctx, section: Section, first: boolean): Block[] {
  const { m } = ctx;
  const children = childBlocks(ctx, section);
  if (!children.length) return [];

  const title = clean(section.title).toUpperCase();
  const slices = title
    ? textSlices(ctx, [{ text: title, font: "bold" }], {
        size: m.size.heading,
        x: m.margin,
        width: m.width,
        color: m.color.accent,
        tracking: m.tracking,
      })
    : [];
  slices.push({
    height: m.rule.pad + m.rule.width,
    ops: [
      {
        kind: "rule",
        x1: m.margin,
        x2: m.margin + m.width,
        y: m.rule.pad + m.rule.width / 2,
        thickness: m.rule.width,
        color: m.color.rule,
      },
    ],
  });
  const heading: Block = {
    id: section.id,
    before: first ? m.gap.header : m.gap.section,
    keepWithNext: true,
    slices,
  };
  return [heading, ...children];
}

/**
 * Places blocks on Letter pages. A block that doesn't fit moves to the next
 * page whole, together with anything it must stay with (a heading with its
 * first entry, an entry's title with its first bullet). Only a block taller
 * than a whole page is split, between lines.
 */
function paginate(blocks: Block[], m: Metrics) {
  const top = m.margin;
  const bottom = PAGE.height - m.margin;
  const room = bottom - top;
  const pages: Op[][] = [[]];
  const breaks: PageBreak[] = [];
  let y = top;
  let fresh = true;

  const newPage = (id: string) => {
    pages.push([]);
    breaks.push({ id, page: pages.length });
    y = top;
    fresh = true;
  };

  blocks.forEach((block, i) => {
    const own = heightOf(block);
    let chain = own;
    for (let j = i; blocks[j].keepWithNext && j + 1 < blocks.length; j++) {
      chain += blocks[j + 1].before + heightOf(blocks[j + 1]);
    }
    if (!fresh) {
      const fits = (h: number) => y + block.before + h <= bottom + EPS;
      if (!fits(chain) && (chain <= room || !fits(own))) newPage(block.id);
      else y += block.before;
    }
    for (const slice of block.slices) {
      if (!fresh && y + slice.height > bottom + EPS) newPage(block.id);
      const page = pages[pages.length - 1];
      for (const op of slice.ops) page.push(moved(op, y));
      y += slice.height;
      fresh = false;
    }
  });

  return { pages, breaks };
}

export function layoutResume(doc: ResumeDoc, measure: Measure): Layout {
  const m = metrics(doc.theme);
  const ctx: Ctx = { m, measure };
  const blocks: Block[] = [];

  const header = headerBlock(ctx, doc);
  if (header) blocks.push(header);

  let first = true;
  for (const section of doc.sections) {
    if (section.hidden) continue;
    const list = sectionBlocks(ctx, section, first);
    if (!list.length) continue;
    blocks.push(...list);
    first = false;
  }

  return { m, ...paginate(blocks, m) };
}
