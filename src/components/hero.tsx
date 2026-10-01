"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { heroAside, heroStatement, profile } from "@/lib/data";
import { gsap, SplitText, useMotion } from "@/lib/gsap";
import { FrameButton } from "./frame-button";
import { ScrollCue } from "./scroll-cue";

// Deterministic star field (integer LCG) so server and client markup match.
let seed = 20130101;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const stars = Array.from({ length: 80 }, () => ({
  x: Math.round(rnd() * 1000) / 10,
  y: Math.round(rnd() * 620) / 10,
  size: 1 + Math.round(rnd() * 12) / 10,
  o: 0.25 + Math.round(rnd() * 55) / 100,
  d: 3 + Math.round(rnd() * 40) / 10,
  delay: Math.round(rnd() * 40) / 10,
}));

const HERO_VIDEO =
  "https://servd-orland-park.b-cdn.net/production/uploads/general/2026-10_homepage_banner-1-1.mp4";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  // No looping background video for visitors who prefer reduced motion.
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const showVideo = !videoFailed && !reducedMotion;

  useMotion(root, () => {
    const el = root.current;
    if (!el) return;

    const statement = el.querySelector<HTMLElement>("[data-statement]");
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    tl.from("[data-letter-in]", {
      yPercent: 100,
      rotate: (i: number) => (i ? 16 : -16),
      autoAlpha: 0,
      duration: 1.4,
      stagger: 0.14,
    });

    if (statement) {
      gsap.set(statement, { opacity: 1 });
      SplitText.create(statement, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.1,
            delay: 0.25,
          });
        },
      });
    }

    tl.fromTo(
      "[data-reveal]:not([data-statement]):not([data-sign])",
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" },
      0.5,
    );

    // The call to action is a hanging sign: it starts folded up edge-on at its
    // hook, swings down on the hinge with a pendulum overshoot, then keeps
    // swaying gently. On tall (stacked) layouts it sits below the fold, so the
    // drop waits until it scrolls into view.
    const sign = el.querySelector<HTMLElement>("[data-sign]");
    const swing = el.querySelector<HTMLElement>("[data-sign-swing]");
    const sway = el.querySelector<HTMLElement>("[data-sign-sway]");
    if (sign && swing && sway) {
      gsap.set(sign, { opacity: 1 });
      gsap.set(swing, { autoAlpha: 0, transformPerspective: 900 });

      const lead = sign.getBoundingClientRect().top < window.innerHeight ? 1.1 : 0.1;
      const idle = gsap
        .timeline({ paused: true })
        .to(sway, { rotation: 1.8, duration: 1.4, ease: "sine.out" })
        .to(sway, {
          rotation: -1.8,
          duration: 2.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

      gsap
        .timeline({
          scrollTrigger: { trigger: sign, start: "top 96%" },
        })
        .fromTo(
          swing,
          { rotationX: 86 },
          { rotationX: 0, duration: 2.4, ease: "elastic.out(0.9, 0.55)" },
          lead,
        )
        .to(swing, { autoAlpha: 1, duration: 0.2, ease: "none" }, lead)
        .call(() => idle.play(), undefined, lead + 1.9);
    }

    // The monogram splits apart as the hero scrolls away.
    const scrub = {
      trigger: el,
      start: "top top",
      end: "bottom top",
      scrub: true,
    };
    gsap.to("[data-letter-wrap='0']", {
      xPercent: -80,
      yPercent: 18,
      rotate: -26,
      ease: "none",
      scrollTrigger: scrub,
    });
    gsap.to("[data-letter-wrap='1']", {
      xPercent: 80,
      yPercent: -18,
      rotate: 26,
      ease: "none",
      scrollTrigger: scrub,
    });
    // The scroll hint has done its job once the visitor starts scrolling.
    gsap.to("[data-scroll-cue]", {
      opacity: 0,
      y: 14,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "+=220",
        scrub: true,
      },
    });
    gsap.to("[data-hero-content]", {
      yPercent: -8,
      opacity: 0.25,
      ease: "none",
      scrollTrigger: scrub,
    });
  });

  return (
    <section
      id="home"
      ref={root}
      className="on-ink relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-butter"
    >
      <div className="stars" aria-hidden="true">
        {stars.map((s, i) => (
          <span
            key={i}
            className="star-dot"
            style={
              {
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                "--o": s.o,
                "--d": `${s.d}s`,
                "--delay": `${s.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="horizon" aria-hidden="true" />

      {showVideo ? (
        <div className="hero-video" aria-hidden="true">
          <video
            src={HERO_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            tabIndex={-1}
            onError={() => setVideoFailed(true)}
          />
        </div>
      ) : null}

      <h1 className="sr-only">
        {profile.name}, {profile.role}
      </h1>

      <div
        data-hero-content
        className="relative z-10 mx-auto grid w-full max-w-[1800px] flex-1 grid-cols-1 items-center gap-10 px-5 pb-56 pt-32 md:px-8 md:pt-36 lg:grid-cols-12 lg:pb-56"
      >
        <div className="lg:col-span-4">
          <p data-reveal className="mb-5 text-[13px] font-medium">
            Hi, I&apos;m Logan.
          </p>
          <p
            data-reveal
            data-statement
            className="text-[clamp(1.35rem,2.2vw,2.3rem)] font-medium leading-[1.22] tracking-tight"
          >
            {heroStatement}
          </p>
        </div>

        <div className="flex justify-center lg:col-span-4" aria-hidden="true">
          <div className="w-full max-w-[520px] [container-type:inline-size]">
            <div className="display flex items-end justify-center gap-[0.03em] text-[42cqw] text-butter">
              {["L", "W"].map((letter, i) => (
                <span
                  key={letter}
                  data-letter-wrap={i}
                  className="inline-block will-change-transform"
                >
                  <span data-letter-in className="inline-block">
                    {letter}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 lg:text-right">
          <p
            data-reveal
            className="max-w-[36ch] text-[13px] leading-relaxed text-butter/90 lg:ml-auto"
          >
            {heroAside}
          </p>
        </div>
      </div>

      <div
        data-reveal
        data-sign
        className="absolute inset-x-0 bottom-8 z-10 flex justify-center"
      >
        <FrameButton />
      </div>

      {/* After the sign in the DOM so it stays clickable above its full-width wrapper. */}
      <div
        data-reveal
        className="absolute bottom-8 right-5 z-10 hidden md:right-8 md:block"
      >
        <div data-scroll-cue>
          <ScrollCue />
        </div>
      </div>
    </section>
  );
}
