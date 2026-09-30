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
  build: () => void,
  dependencies: unknown[] = [],
) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia(scope.current ?? undefined);
      mm.add(MOTION_OK, () => {
        build();
      });
      return () => mm.revert();
    },
    { scope, dependencies, revertOnUpdate: true },
  );
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

/** Words fade up to full opacity as the block scrolls through the viewport. */
export function scrubWords(el: Element) {
  SplitText.create(el, {
    type: "words",
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.words, {
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
    },
  });
}
