"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export { gsap, ScrollTrigger, SplitText };

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * Runs `build` inside a scoped gsap.matchMedia so every animation is skipped
 * (and everything is cleaned up) when the visitor prefers reduced motion.
 */
export function useMotion(
  scope: RefObject<HTMLElement | null>,
  build: () => void | (() => void),
  dependencies: unknown[] = [],
) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia(scope.current ?? undefined);
      // whatever `build` returns runs as cleanup when the context reverts
      mm.add(MOTION_OK, () => build());
      return () => mm.revert();
    },
    { scope, dependencies, revertOnUpdate: true },
  );
}

/**
 * Slide/iris-reveal every `[data-logo-reveal]` inside `root` while it is on
 * screen, and unveil it again when it leaves. Reveal order comes from the
 * element's `--i` (its sibling index) via CSS transition delays, so the
 * stagger lives in the stylesheet. Elements are only "armed" (hidden) here,
 * so visitors without JS or with reduced motion always see them.
 */
export function revealLogos(root: Element, start = "top 80%", end = "bottom 12%") {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-logo-reveal]"));
  const triggers = nodes.map((node) => {
    node.setAttribute("data-armed", "");
    return ScrollTrigger.create({
      trigger: node.closest<HTMLElement>("[data-logo-trigger]") ?? node,
      start,
      end,
      onToggle: (self) => node.toggleAttribute("data-in", self.isActive),
    });
  });

  return () => {
    triggers.forEach((t) => t.kill());
    nodes.forEach((node) => {
      node.removeAttribute("data-armed");
      node.removeAttribute("data-in");
    });
  };
}

/** Masked line-by-line reveal for a block of text, triggered on scroll. */
export function revealLines(el: Element, start = "top 85%") {
  SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 110,
        duration: 1,
        ease: "power4.out",
        stagger: 0.09,
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
  });
}

/**
 * Words fade up to full opacity as the block scrolls through the viewport.
 * Words are pre-split in React (`[data-w]`) rather than by SplitText so the
 * inline logo badges between them keep a stable DOM identity.
 */
export function scrubWords(el: Element) {
  const words = el.querySelectorAll("[data-w]");
  if (!words.length) return;
  gsap.from(words, {
    opacity: 0.18,
    ease: "none",
    stagger: 0.12,
    scrollTrigger: {
      trigger: el,
      start: "top 82%",
      end: "bottom 55%",
      scrub: true,
    },
  });
}
