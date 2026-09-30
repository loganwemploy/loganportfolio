"use client";

import { useEffect, useRef, useState } from "react";
import { projects, type Project, type ProjectGroup } from "@/lib/data";
import { gsap, revealLogos, useMotion } from "@/lib/gsap";
import { ArrowUpRight, GridIcon, ListIcon, Sparkle } from "./icons";
import { LogoBadge } from "./logo-badge";
import { SectionHead } from "./section-head";

type View = "grid" | "list";
type Filter = "all" | ProjectGroup;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Enterprise", label: "Enterprise" },
  { id: "Independent", label: "Independent" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function CardShell({
  project,
  className,
  children,
}: {
  project: Project;
  className: string;
  children: React.ReactNode;
}) {
  return project.href ? (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={`${project.name}, ${project.category} (opens ${project.domain})`}
    >
      {children}
    </a>
  ) : (
    <div className={className}>{children}</div>
  );
}

function GridCard({ project, index }: { project: Project; index: number }) {
  const len = project.glyph.length;
  return (
    <li className="work-item">
      <CardShell project={project} className="work-card block outline-offset-8">
        <div data-logo-trigger className={`tile tile-${project.tone}`}>
          <span className="absolute left-4 top-4 z-10 text-[10.5px] font-medium uppercase tracking-[0.14em]">
            {project.category}
          </span>
          <span className="absolute right-4 top-4 z-10 text-[11px] font-medium">
            [ {pad(index + 1)} ]
          </span>
          <span
            className="tile-glyph"
            data-len={len >= 4 ? 4 : len}
            aria-hidden="true"
          >
            {project.logo ? (
              // sibling index within a row staggers the slide-in
              <LogoBadge
                logo={project.logo}
                index={index % 3}
                sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 90vw"
                className="tile-logo"
              />
            ) : (
              project.glyph
            )}
          </span>
          {project.href ? (
            <span className="tile-visit z-10 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10.5px] font-medium uppercase tracking-[0.14em]">
              Visit
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight tracking-tight">
              {project.name}
            </h3>
            <p className="mt-1 truncate text-[12.5px] text-ink/55">
              {project.domain}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-ink/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]">
            {project.group}
          </span>
        </div>
        <p className="mt-2.5 text-[14px] leading-relaxed text-ink/75">
          {project.blurb}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.focus.map((f) => (
            <li
              key={f}
              className="rounded-full bg-ink/[0.07] px-2.5 py-1 text-[11px] font-medium"
            >
              {f}
            </li>
          ))}
        </ul>
      </CardShell>
    </li>
  );
}

/** Column template shared by the list header and its rows (desktop). */
const LIST_COLS =
  "md:grid-cols-[4rem_2.75rem_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_2.5rem]";

const markTone = {
  ink: "bg-ink text-butter",
  butter: "bg-butter text-ink ring-1 ring-ink/20",
  white: "bg-white text-ink ring-1 ring-ink/15",
} as const;

/** Round avatar for list rows: company logo, or the project's initials. */
function ListMark({ project }: { project: Project }) {
  const len = project.glyph.length;
  if (project.logo) {
    return (
      <LogoBadge
        logo={project.logo}
        sizes="48px"
        className="h-11 w-11 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.35)]"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid h-11 w-11 place-items-center rounded-full font-display font-black ${markTone[project.tone]} ${
        len >= 4 ? "text-[9px]" : len === 3 ? "text-[11px]" : "text-[15px]"
      }`}
    >
      {project.glyph}
    </span>
  );
}

function ListRow({ project, index }: { project: Project; index: number }) {
  return (
    <li data-logo-trigger className="work-item border-b border-ink/15">
      <CardShell
        project={project}
        className={`group grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-2 py-5 transition-[background-color,padding] duration-500 hover:bg-butter hover:pl-5 focus-visible:bg-butter ${LIST_COLS} md:px-4 md:py-6`}
      >
        <span className="hidden text-[12px] font-medium md:block">
          [ {pad(index + 1)} ]
        </span>
        <ListMark project={project} />
        <span className="min-w-0">
          <span className="block truncate text-[clamp(1.2rem,2.2vw,2.1rem)] font-semibold leading-tight tracking-tight">
            {project.name}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink/55">
            {project.domain} · <span className="md:hidden">{project.category}</span>
            <span className="hidden md:inline">{project.group}</span>
          </span>
        </span>
        <span className="hidden text-[13px] md:block">{project.category}</span>
        <span className="hidden flex-wrap gap-1.5 md:flex">
          {project.focus.map((f) => (
            <span
              key={f}
              className="rounded-full border border-ink/25 px-2.5 py-0.5 text-[11px] font-medium"
            >
              {f}
            </span>
          ))}
        </span>
        <span className="justify-self-end">
          {project.href ? (
            <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125" />
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink/50">
              Private
            </span>
          )}
        </span>
      </CardShell>
    </li>
  );
}

export function Work() {
  const root = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>("grid");
  const [filter, setFilter] = useState<Filter>("all");
  const [barVisible, setBarVisible] = useState(false);

  const shown = projects.filter((p) => filter === "all" || p.group === filter);
  const enterpriseCount = projects.filter((p) => p.group === "Enterprise").length;

  // Floating controls only while the work section is on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setBarVisible(entry.isIntersecting),
      { rootMargin: "-10% 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Re-stagger items whenever the view or filter changes.
  useMotion(
    root,
    () => {
      const el = root.current;
      if (!el) return;
      const items = el.querySelectorAll(".work-item");
      gsap.fromTo(
        items,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.045,
          scrollTrigger: {
            trigger: el.querySelector("[data-collection]"),
            start: "top 88%",
            once: true,
          },
        },
      );

      // company logos slide in while their tile / row is on screen
      return revealLogos(el);
    },
    [view, filter],
  );

  const pill = (active: boolean) =>
    `rounded-full px-2.5 py-2.5 transition-colors duration-300 sm:px-3.5 ${
      active ? "bg-butter text-ink" : "hover:bg-butter/15"
    }`;

  return (
    <section
      id="work"
      ref={root}
      className="relative bg-paper text-ink"
      aria-labelledby="work-heading"
    >
      <div className="mx-auto max-w-[1800px] px-5 pb-40 pt-24 md:px-8 md:pb-48 md:pt-36">
        <div id="work-heading">
          <SectionHead label="Work" index="02" title="Made by Logan." />
        </div>

        <p className="mt-8 max-w-[52ch] text-[15px] leading-relaxed text-ink/75 md:ml-[calc(16.666%+0.5rem)]">
          {projects.length} projects: {enterpriseCount} enterprise builds from my
          time at Capital One, Cooper&apos;s Hawk and IMS, and{" "}
          {projects.length - enterpriseCount} independent products for small
          businesses, nonprofits and founders. Switch between a visual grid and
          a scannable list.
        </p>

        <div data-collection className="mt-14 md:mt-20">
          {view === "grid" ? (
            <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((project, i) => (
                <GridCard key={project.id} project={project} index={i} />
              ))}
            </ul>
          ) : (
            <div>
              <div
                aria-hidden="true"
                className={`hidden ${LIST_COLS} gap-x-4 border-b border-ink px-4 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink/60 md:grid`}
              >
                <span>No.</span>
                <span />
                <span>Project</span>
                <span>Category</span>
                <span>Focus</span>
                <span />
              </div>
              <ul className="border-t border-ink/15 md:border-t-0">
                {shown.map((project, i) => (
                  <ListRow key={project.id} project={project} index={i} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div
        role="toolbar"
        aria-label="Work view controls"
        className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 transition-[opacity,translate] duration-700 ease-[var(--ease-out)] ${
          barVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-24 opacity-0"
        }`}
      >
        <div className="flex items-center gap-0.5 rounded-full bg-ink p-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-butter shadow-[0_18px_50px_-12px_rgba(0,0,0,0.5)] sm:gap-1 sm:text-[11px] sm:tracking-[0.14em]">
          <span
            aria-hidden="true"
            className="mr-1 hidden h-9 w-9 place-items-center rounded-full bg-butter text-ink sm:grid"
          >
            <Sparkle className="h-4 w-4" />
          </span>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={pill(filter === f.id)}
            >
              {f.label}
            </button>
          ))}
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-butter/25" />
          <button
            type="button"
            aria-pressed={view === "grid"}
            aria-label="Grid view"
            onClick={() => setView("grid")}
            className={`${pill(view === "grid")} flex items-center gap-1.5`}
          >
            <GridIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            aria-label="List view"
            onClick={() => setView("list")}
            className={`${pill(view === "list")} flex items-center gap-1.5`}
          >
            <ListIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>
    </section>
  );
}
