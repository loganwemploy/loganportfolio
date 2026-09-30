"use client";

import { useRef } from "react";
import { credentials, profile } from "@/lib/data";
import { gsap, useMotion } from "@/lib/gsap";
import { scrollToId } from "@/lib/scroll";
import { ArrowDown, ArrowUpRight, PlusIcon } from "./icons";
import { SectionHead } from "./section-head";

export function Contact() {
  const root = useRef<HTMLElement>(null);

  useMotion(root, () => {
    const el = root.current;
    if (!el) return;

    gsap.from(el.querySelectorAll("[data-fade]"), {
      opacity: 0,
      y: 30,
      duration: 0.9,
      stagger: 0.09,
      ease: "power3.out",
      scrollTrigger: { trigger: el.querySelector("[data-cta]"), start: "top 85%", once: true },
    });

    gsap.fromTo(
      el.querySelector("[data-giant]"),
      { yPercent: 35 },
      {
        yPercent: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el.querySelector("[data-giant]"),
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      },
    );
  });

  const button =
    "group inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] transition-transform duration-300 hover:scale-[1.04]";

  return (
    <section
      id="contact"
      ref={root}
      className="on-ink relative overflow-hidden bg-ink text-butter"
    >
      <div className="mx-auto max-w-[1800px] px-5 pt-24 md:px-8 md:pt-36">
        <SectionHead label="Contact" index="04" title="Let's make it move." />

        <div data-cta className="mt-16 grid gap-14 md:mt-24 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <a
              data-fade
              href={`mailto:${profile.email}`}
              className="link-underline inline-block break-all pb-1 text-[clamp(1.35rem,3.5vw,3.3rem)] font-medium tracking-tight"
            >
              {profile.email}
            </a>
            <p
              data-fade
              className="mt-7 max-w-[48ch] text-[15px] leading-relaxed text-butter/75"
            >
              Building something that handles payments, sensitive data or heavy
              traffic, or need a product taken from idea to production? Send a
              note and I&apos;ll get back to you.
            </p>
            <div data-fade className="mt-9 flex flex-wrap gap-3">
              <a
                href={`mailto:${profile.email}`}
                className={`${button} bg-butter text-ink`}
              >
                Email me
                <PlusIcon className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`${button} border border-butter/40 hover:bg-butter hover:text-ink`}
              >
                LinkedIn
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href={profile.resume}
                download
                className={`${button} border border-butter/40 hover:bg-butter hover:text-ink`}
              >
                Résumé (PDF)
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>

          <dl className="space-y-9 md:col-span-5">
            <div data-fade className="border-t border-butter/30 pt-4">
              <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-butter/60">
                Education
              </dt>
              <dd className="mt-3">
                <p className="text-xl font-semibold tracking-tight">
                  {credentials.education.school}
                </p>
                <p className="mt-1 text-[14px] text-butter/75">
                  {credentials.education.detail}
                </p>
              </dd>
            </div>
            <div data-fade className="border-t border-butter/30 pt-4">
              <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-butter/60">
                Certifications · {credentials.certifications.range}
              </dt>
              <dd className="mt-3 space-y-1 text-[15px]">
                {credentials.certifications.items.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </dd>
            </div>
            <div data-fade className="border-t border-butter/30 pt-4">
              <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-butter/60">
                Ongoing monthly training
              </dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {credentials.training.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-butter/30 px-3 py-1 text-[11px] font-medium text-butter/80"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div
        data-giant
        aria-hidden="true"
        className="display outline-text mt-24 select-none whitespace-nowrap text-center text-[8.4vw] leading-[1] md:mt-32"
      >
        LOGAN WILSON
      </div>

      <footer className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-5 py-6 text-[12px] text-butter/65 md:px-8 md:pr-24">
        <p>
          © {new Date().getFullYear()} {profile.name} · {profile.location}
        </p>
        <button
          type="button"
          onClick={() => scrollToId("home")}
          className="link-underline py-1"
        >
          Back to top ↑
        </button>
      </footer>
    </section>
  );
}
