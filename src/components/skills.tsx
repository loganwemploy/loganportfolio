"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import { marqueeRows, skillGroups } from "@/lib/data";
import { gsap, useMotion } from "@/lib/gsap";
import { Sparkle } from "./icons";
import { SectionHead } from "./section-head";

function BigMarquee({
  words,
  reverse,
  duration,
}: {
  words: string[];
  reverse?: boolean;
  duration: string;
}) {
  const group = (
    <span className="big-marquee-group">
      {words.map((word) => (
        <span key={word} className="flex items-center gap-[0.5em]">
          <span className="display outline-text">{word.toUpperCase()}</span>
          <Sparkle className="h-[0.42em] w-[0.42em] shrink-0 text-ink" />
        </span>
      ))}
    </span>
  );

  return (
    <div
      aria-hidden="true"
      className="big-marquee text-[clamp(3.6rem,11vw,10.5rem)] leading-[1.15]"
    >
      <span
        className={`big-marquee-track ${reverse ? "rev" : ""}`}
        style={{ "--dur": duration } as CSSProperties}
      >
        {group}
        {group}
      </span>
    </div>
  );
}

export function Skills() {
  const root = useRef<HTMLElement>(null);

  useMotion(root, () => {
    const el = root.current;
    if (!el) return;

    // Marquees drift sideways a little faster while the section scrolls.
    el.querySelectorAll<HTMLElement>(".big-marquee").forEach((row, i) => {
      gsap.fromTo(
        row,
        { xPercent: i % 2 ? 6 : -6 },
        {
          xPercent: i % 2 ? -6 : 6,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    gsap.from(el.querySelectorAll("[data-group]"), {
      opacity: 0,
      y: 32,
      duration: 0.9,
      stagger: 0.07,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el.querySelector("[data-groups]"),
        start: "top 85%",
        once: true,
      },
    });
  });

  return (
    <section
      id="skills"
      ref={root}
      className="relative overflow-hidden bg-butter text-ink"
    >
      <div className="py-24 md:py-36">
        <div className="mx-auto max-w-[1800px] px-5 md:px-8">
          <SectionHead label="Toolkit" index="03" title="What's in the bag." />
        </div>

        <div className="mt-16 space-y-1 md:mt-24">
          {marqueeRows.map((row, i) => (
            <BigMarquee
              key={i}
              words={row}
              reverse={i % 2 === 1}
              duration={i % 2 ? "55s" : "48s"}
            />
          ))}
        </div>

        <div
          data-groups
          className="mx-auto mt-20 grid max-w-[1800px] gap-x-10 gap-y-12 px-5 md:mt-28 md:grid-cols-2 md:px-8 lg:grid-cols-3"
        >
          {skillGroups.map((group) => (
            <div key={group.label} data-group className="border-t border-ink pt-4">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em]">
                {group.label}
              </h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-ink/35 px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-300 hover:bg-ink hover:text-butter"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
