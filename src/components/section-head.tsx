"use client";

import { useRef } from "react";
import { gsap, revealLines, useMotion } from "@/lib/gsap";

export function SectionHead({
  label,
  index,
  title,
}: {
  label: string;
  index: string;
  title: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useMotion(root, () => {
    const el = root.current;
    if (!el) return;
    const heading = el.querySelector("h2");
    if (heading) revealLines(heading);
    gsap.from(el.querySelectorAll("[data-meta]"), {
      opacity: 0,
      y: 12,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  return (
    <div ref={root} className="grid gap-6 md:grid-cols-12">
      <p data-meta className="text-[13px] font-medium md:col-span-2">
        {label}
      </p>
      <h2 className="text-[clamp(2.4rem,7vw,7.5rem)] font-semibold leading-[1.1] tracking-tight md:col-span-9">
        {title}
      </h2>
      <p data-meta className="text-[13px] font-medium md:col-span-1 md:text-right">
        [ {index} ]
      </p>
    </div>
  );
}
