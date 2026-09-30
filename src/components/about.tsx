"use client";

import { useRef } from "react";
import { aboutSegments, pillars, stats } from "@/lib/data";
import { gsap, revealLogos, scrubWords, useMotion } from "@/lib/gsap";
import { LogoBadge } from "./logo-badge";

/** Splits text into `[data-w]` word spans (whitespace stays plain text). */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((token, i) =>
        token === "" ? null : /^\s+$/.test(token) ? (
          token
        ) : (
          <span key={i} data-w>
            {token}
          </span>
        ),
      )}
    </>
  );
}

function Statement() {
  return (
    <>
      {aboutSegments.map((segment, i) =>
        "company" in segment ? (
          // name + logo + trailing punctuation stay together on one line
          <span key={i} data-logo-trigger className="whitespace-nowrap">
            <Words text={segment.company} />
            {segment.logo ? (
              <LogoBadge
                logo={segment.logo}
                index={segment.order}
                sizes="48px"
                className="ml-[0.16em] h-[0.62em] w-[0.62em] align-[-0.04em] ring-1 ring-ink/15"
              />
            ) : null}
            {segment.after ? <span data-w>{segment.after}</span> : null}
          </span>
        ) : (
          <Words key={i} text={segment.text} />
        ),
      )}
    </>
  );
}

export function About() {
  const root = useRef<HTMLElement>(null);

  useMotion(root, () => {
    const el = root.current;
    if (!el) return;

    const statement = el.querySelector("[data-statement]");
    if (statement) scrubWords(statement);

    el.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
      const text = node.firstChild;
      if (!text) return;
      const target = Number(node.dataset.count);
      const counter = { value: 0 };
      text.nodeValue = "0";
      gsap.to(counter, {
        value: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => {
          text.nodeValue = String(Math.round(counter.value));
        },
        scrollTrigger: { trigger: node, start: "top 90%", once: true },
      });
    });

    gsap.from(el.querySelectorAll("[data-fade]"), {
      opacity: 0,
      y: 36,
      duration: 0.9,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: el.querySelector("[data-pillars]"), start: "top 85%", once: true },
    });

    // inline company logos slide in as their name reaches the reading zone
    return revealLogos(el, "top 72%", "bottom 18%");
  });

  return (
    <section id="about" ref={root} className="relative bg-butter text-ink">
      <div className="mx-auto max-w-[1800px] px-5 py-24 md:px-8 md:py-36">
        <div className="grid gap-6 md:grid-cols-12 md:gap-8">
          <p className="text-[13px] font-medium md:col-span-2">Who am I?</p>
          <p
            data-statement
            className="text-[clamp(1.7rem,3.9vw,4.1rem)] font-medium leading-[1.14] tracking-tight md:col-span-9"
          >
            <Statement />
          </p>
          <p className="text-[13px] font-medium md:col-span-1 md:text-right">
            [ 00 ]
          </p>
        </div>

        <dl className="mt-20 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-ink/20 pt-10 md:mt-28 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse justify-end">
              <dt className="mt-4 max-w-[24ch] text-[13px] leading-snug text-ink/70">
                {stat.label}
              </dt>
              <dd className="flex items-baseline text-[clamp(2.6rem,6.4vw,6.6rem)] font-semibold leading-none tracking-tight [font-variant-numeric:tabular-nums]">
                {stat.prefix ? <span>{stat.prefix}</span> : null}
                <span data-count={stat.value}>{stat.value}</span>
                {stat.suffix ? <span>{stat.suffix}</span> : null}
              </dd>
            </div>
          ))}
        </dl>

        <div
          data-pillars
          className="mt-24 grid gap-x-8 gap-y-12 md:mt-32 md:grid-cols-2 lg:grid-cols-4"
        >
          {pillars.map((pillar, i) => (
            <div key={pillar.title} data-fade className="border-t border-ink pt-5">
              <p className="text-[13px] font-medium">[ 0{i + 1} ]</p>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">
                {pillar.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ink/75">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
