import type { ResumeTheme } from "./types";

/**
 * US Letter in PDF points (1pt = 1/72in). The editor uses the same numbers in
 * CSS `pt`, so what you see on screen is laid out like the PDF.
 */
export const PAGE = { width: 612, height: 792 } as const;

export type FontKey = "regular" | "semibold" | "bold" | "italic";
export type Family = ResumeTheme["font"];

const FILES: Record<Family, Record<FontKey, string>> = {
  sans: {
    regular: "/fonts/Inter-Regular.ttf",
    semibold: "/fonts/Inter-SemiBold.ttf",
    bold: "/fonts/Inter-Bold.ttf",
    italic: "/fonts/Inter-Italic.ttf",
  },
  serif: {
    regular: "/fonts/SourceSerif4-Regular.ttf",
    semibold: "/fonts/SourceSerif4-SemiBold.ttf",
    bold: "/fonts/SourceSerif4-Bold.ttf",
    italic: "/fonts/SourceSerif4-Italic.ttf",
  },
};

export const fontFile = (family: Family, key: FontKey) => FILES[family][key];

/**
 * Ascender and descender as fractions of the em (OS/2 typo metrics, which both
 * fonts flag for use). The PDF places each baseline with the same half-leading
 * model the browser uses, so lines sit where they do on screen.
 */
const VERTICAL: Record<Family, { ascent: number; descent: number }> = {
  sans: { ascent: 1984 / 2048, descent: 494 / 2048 },
  serif: { ascent: 1036 / 1000, descent: 335 / 1000 },
};

const MARGIN = { narrow: 36, normal: 50, wide: 64 } as const;

/** Printed between contact items. The editor draws the same string in CSS. */
export const CONTACT_SEP = " · ";

export function metrics(theme: ResumeTheme) {
  const compact = theme.size === "compact";
  const margin = MARGIN[theme.margin];
  return {
    margin,
    width: PAGE.width - margin * 2,
    align: theme.align,
    lineHeight: compact ? 1.28 : 1.36,
    nameLineHeight: 1.15,
    size: {
      name: compact ? 21 : 24,
      headline: compact ? 10.5 : 11.5,
      contact: compact ? 9 : 9.5,
      heading: compact ? 10 : 10.5,
      title: compact ? 10 : 10.5,
      body: compact ? 9.5 : 10,
      meta: compact ? 9 : 9.5,
    },
    gap: {
      headline: compact ? 1 : 2,
      contacts: compact ? 3 : 4,
      header: compact ? 10 : 14,
      section: compact ? 10 : 14,
      heading: compact ? 5 : 6,
      entry: compact ? 6 : 9,
      bullet: compact ? 1 : 2,
      para: compact ? 4 : 6,
    },
    rule: { pad: 2.5, width: 0.75 },
    /** Letter spacing for section headings, in em. */
    tracking: 0.08,
    bulletIndent: 11,
    bulletX: 2,
    /** Space between a left column (title, company) and its right column (dates, location). */
    columnGap: 12,
    color: {
      text: "#232323",
      muted: "#575757",
      accent: theme.accent,
      rule: mix(theme.accent, "#ffffff", 0.5),
    },
    ...VERTICAL[theme.font],
  };
}

export type Metrics = ReturnType<typeof metrics>;

/** Distance from the top of a line box to its baseline (CSS half-leading model). */
export function baselineIn(m: Metrics, size: number, lineHeight: number) {
  return ((lineHeight - m.ascent - m.descent) * size) / 2 + m.ascent * size;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, "$&$&") : h.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blends `hex` toward `other`; `amount` is the share of `other` (0–1). */
export function mix(hex: string, other: string, amount: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(other);
  return `#${a
    .map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, "0"))
    .join("")}`;
}
