"use client";

import type { CSSProperties } from "react";
import { scrollToId } from "@/lib/scroll";
import { Sparkle } from "./icons";

const WORD = "View the work";

function Group() {
  return (
    <span className="frame-group">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="flex items-center gap-[1.4em]">
          <span>{WORD}</span>
          <Sparkle className="h-2.5 w-2.5" />
        </span>
      ))}
    </span>
  );
}

function Strip({
  side,
  reverse,
  duration,
}: {
  side: "top" | "right" | "bottom" | "left";
  reverse?: boolean;
  duration: string;
}) {
  return (
    <span aria-hidden="true" className={`frame-strip frame-${side}`}>
      <span
        className={`frame-track ${reverse ? "rev" : ""}`}
        style={{ "--dur": duration } as CSSProperties}
      >
        <Group />
        <Group />
      </span>
    </span>
  );
}

/**
 * A hanging sign: four independent marquees form a frame around a centre
 * button, which dangles from two cords. The hero animates the wrappers —
 * `data-sign-swing` drops the sign down on its hinge, `data-sign-sway` then
 * keeps it gently swaying. Both pivot from the hook at the top of the cords.
 * Marquee clockwise flow: top →, right ↓, bottom ←, left ↑.
 */
export function FrameButton() {
  return (
    <div data-sign-swing className="sign-swing">
      <div data-sign-sway className="sign-sway">
        <span aria-hidden="true" className="sign-cords">
          <span className="sign-hook" />
          <svg viewBox="0 0 100 50" preserveAspectRatio="none">
            <path d="M12 50 50 0 88 50" vectorEffect="non-scaling-stroke" />
          </svg>
        </span>
        <button
          type="button"
          className="frame"
          aria-label="View my work"
          onClick={() => scrollToId("work")}
        >
          <Strip side="top" reverse duration="18s" />
          <Strip side="right" reverse duration="14s" />
          <Strip side="bottom" duration="18s" />
          <Strip side="left" reverse duration="14s" />
          <span className="frame-core">
            <span className="frame-label">View my work</span>
          </span>
        </button>
      </div>
    </div>
  );
}
