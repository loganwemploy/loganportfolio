"use client";

import { useRef } from "react";
import { roles } from "@/lib/data";
import { gsap, revealLines, useMotion } from "@/lib/gsap";
import { SectionHead } from "./section-head";

export function Experience() {
  const root = useRef<HTMLElement>(null);

  useMotion(root, () => {
    const el = root.current;
    if (!el) return;

    el.querySelectorAll<HTMLElement>("[data-role]").forEach((row) => {
      const company = row.querySelector("[data-company]");
      if (company) revealLines(company, "top 88%");

      gsap.from(row.querySelectorAll("[data-fade]"), {
        opacity: 0,
        y: 28,
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: row, start: "top 80%", once: true },
      });

      gsap.fromTo(
        row.querySelector("[data-rule]"),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: row, start: "top 88%", once: true },
        },
      );
    });
  });

  return (
    <section
      id="experience"
      ref={root}
      className="on-ink relative bg-ink text-butter"
    >
      <div className="mx-auto max-w-[1800px] px-5 py-24 md:px-8 md:py-36">
        <SectionHead label="Experience" index="01" title="Where I've shipped." />

        <ol className="mt-16 md:mt-24">
          {roles.map((role, i) => (
            <li key={role.id} data-role className="relative">
              <span
                data-rule
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px origin-left bg-butter/30"
              />
              <div className="grid gap-8 py-10 md:grid-cols-12 md:gap-10 md:py-14">
                <div className="md:col-span-5">
                  <div className="md:sticky md:top-28">
                    <p data-fade className="text-[13px] font-medium text-butter/60">
                      [ 0{i + 1} ]
                    </p>
                    <h3
                      data-company
                      className="mt-4 text-[clamp(1.9rem,3.3vw,3.4rem)] font-semibold leading-[1.15] tracking-tight"
                    >
                      {role.company}
                    </h3>
                    <p data-fade className="mt-4 text-lg font-medium">
                      {role.title}
                    </p>
                    <p data-fade className="mt-1 text-[13px] text-butter/65">
                      {role.dates} · {role.location}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <ul className="space-y-4">
                    {role.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        data-fade
                        className="relative pl-6 text-[15px] leading-relaxed text-butter/90 before:absolute before:left-0 before:top-[0.7em] before:h-px before:w-3.5 before:bg-butter"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <ul data-fade className="mt-7 flex flex-wrap gap-2">
                    {role.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-butter/30 px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.12em] text-butter/80"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
