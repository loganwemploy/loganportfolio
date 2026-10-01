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

    // Parallax: the oversized image slides ±9% of its own height (≈ ±11% of
    // the frame) against the scroll, staying inside the 12.5% it overhangs.
    const band = el.querySelector<HTMLElement>("[data-parallax]");
    const img = el.querySelector<HTMLElement>("[data-parallax-img]");
    if (band && img) {
      gsap.fromTo(
        img,
        { yPercent: -9 },
        {
          yPercent: 9,
          ease: "none",
          scrollTrigger: {
            trigger: band,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }

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
        {/* Full-bleed band. The image is taller than its frame and drifts inside it as the page scrolls. */}
        <div
          data-parallax
          className="relative mt-20 h-[clamp(300px,46vw,760px)] overflow-hidden md:mt-28"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote animated GIF; next/image would freeze it */}
          <img
          style={{filter: "saturate(0.15)"}}
            data-parallax-img
            src="https://i.makeagif.com/media/7-04-2022/zSW_4r.gif"
            alt="Skills"
            loading="lazy"
            draggable={false}
            className="absolute inset-x-0 -top-[12.5%] h-[125%] w-full object-cover will-change-transform"
          />
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
