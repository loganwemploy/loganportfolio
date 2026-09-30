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
 * Four independent marquees form a rotating frame around a centre button.
 * Clockwise flow: top →, right ↓, bottom ←, left ↑.
 */
export function FrameButton() {
  return (
    <button
      type="button"
      className="frame"
      aria-label="View the work"
      onClick={() => scrollToId("work")}
    >
      <Strip side="top" reverse duration="18s" />
      <Strip side="right" reverse duration="14s" />
      <Strip side="bottom" duration="18s" />
      <Strip side="left" reverse duration="14s" />
      <span className="frame-core">
        <Sparkle />
      </span>
    </button>
  );
}
