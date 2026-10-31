import type { PDFDocument } from "pdf-lib";
import { fontFile, type Family, type FontKey } from "./metrics";
import { createMeasure, type Fonts, type Measure, type ShapingFont } from "./text";

export type Fontkit = Parameters<PDFDocument["registerFontkit"]>[0];

export const FONT_KEYS: readonly FontKey[] = ["regular", "semibold", "bold", "italic"];

/** One family's font files plus a measurer built from them. */
export type FontSet = { family: Family; bytes: Record<FontKey, Uint8Array>; measure: Measure };

export function createFontSet(family: Family, kit: Fontkit, bytes: Record<FontKey, Uint8Array>): FontSet {
  const fonts = {} as Fonts;
  for (const key of FONT_KEYS) fonts[key] = kit.create(bytes[key]) as unknown as ShapingFont;
  return { family, bytes, measure: createMeasure(fonts) };
}

let kitPromise: Promise<Fontkit> | null = null;

/** fontkit is large, so it loads on first use. Its module shape differs between builds. */
export function loadFontkit(): Promise<Fontkit> {
  kitPromise ??= import("@pdf-lib/fontkit").then(
    (mod) => {
      const m = mod as unknown as Fontkit & { default?: Fontkit };
      return m.default ?? m;
    },
    (err: unknown) => {
      kitPromise = null;
      throw err;
    },
  );
  return kitPromise;
}

const pending = new Map<Family, Promise<FontSet>>();
const loaded = new Map<Family, FontSet>();
const listeners = new Set<() => void>();

async function fetchFont(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Couldn't load the font ${path} (HTTP ${res.status}).`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Loads a family's four font files once. Later calls share the same promise. */
export function loadFonts(family: Family): Promise<FontSet> {
  let promise = pending.get(family);
  if (!promise) {
    promise = Promise.all([loadFontkit(), ...FONT_KEYS.map((key) => fetchFont(fontFile(family, key)))]).then(
      ([kit, ...files]) => {
        const bytes = Object.fromEntries(FONT_KEYS.map((key, i) => [key, files[i]])) as Record<FontKey, Uint8Array>;
        const set = createFontSet(family, kit, bytes);
        loaded.set(family, set);
        listeners.forEach((listener) => listener());
        return set;
      },
      (err: unknown) => {
        pending.delete(family);
        throw err;
      },
    );
    pending.set(family, promise);
  }
  return promise;
}

/** The family's fonts if they've finished loading, otherwise null. */
export const loadedFonts = (family: Family) => loaded.get(family) ?? null;

export function subscribeFonts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
