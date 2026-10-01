"use client";

import { scrollToId } from "@/lib/scroll";
import { ArrowDown } from "./icons";

/** Small "scroll down" hint for the hero; also jumps to the next section. */
export function ScrollCue() {
  return (
    <button
      type="button"
      className="scroll-cue"
      aria-label="Scroll down"
      onClick={() => scrollToId("about")}
    >
      <span aria-hidden="true" className="scroll-cue-label">
        Scroll
      </span>
      <span className="scroll-cue-ring">
        <ArrowDown />
      </span>
    </button>
  );
}
