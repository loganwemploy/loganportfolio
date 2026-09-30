"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/data";
import { lockScroll, scrollToId } from "@/lib/scroll";
import { LinkedInIcon, PlusIcon } from "./icons";

const links = [
  { id: "home", label: "Home" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Toolkit" },
];

const sectionIds = ["home", "about", "experience", "work", "skills", "contact"];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id === "about" ? "home" : entry.target.id);
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    lockScroll(open);
    return () => lockScroll(false);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    // let the menu release scroll before we move
    requestAnimationFrame(() => scrollToId(id));
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,color,backdrop-filter] duration-500 ${
          solid && !open
            ? "bg-paper/90 text-ink backdrop-blur-md"
            : open
              ? "text-ink"
              : "text-butter"
        }`}
      >
        <div className="mx-auto grid max-w-[1800px] grid-cols-[1fr_auto_1fr] items-center px-5 py-3.5 md:px-8">
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                aria-current={active === link.id ? "true" : undefined}
                className={`link-underline py-1 text-[13px] font-medium ${
                  active === link.id ? "!bg-[length:100%_1px]" : ""
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="justify-self-start py-1 text-[13px] font-medium md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>

          <button
            type="button"
            onClick={() => go("home")}
            aria-label="Logan Wilson, back to top"
            className="flex items-center gap-2.5"
          >
            <span className="display text-[1.7rem] leading-none">LW</span>
            <span className="hidden text-[8px] font-semibold uppercase leading-[1.25] tracking-[0.14em] sm:block">
              Logan
              <br />
              Wilson
              <br />
              Engineer
            </span>
          </button>

          <div className="flex items-center justify-end gap-4">
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Logan Wilson on LinkedIn"
              className="hidden sm:block"
            >
              <LinkedInIcon className="h-[18px] w-[18px]" />
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-2 rounded-full bg-butter px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink transition-transform duration-300 hover:scale-105 md:px-5"
            >
              Let&apos;s talk
              <PlusIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 bg-butter text-ink transition-[clip-path] duration-700 md:hidden ${
          open ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_0_100%_0)]"
        }`}
        aria-hidden={!open}
        inert={!open}
      >
        <nav
          aria-label="Mobile"
          className="flex h-full flex-col justify-center gap-2 px-6 pt-16"
        >
          {links.map((link, i) => (
            <button
              key={link.id}
              type="button"
              onClick={() => go(link.id)}
              className="flex items-baseline gap-4 text-left text-[clamp(2.6rem,13vw,4.5rem)] font-semibold leading-[1.1] tracking-tight"
            >
              <span className="text-[13px] font-medium">[ 0{i} ]</span>
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
