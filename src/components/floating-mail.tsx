"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/data";
import { MailIcon } from "./icons";

export function FloatingMail() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={`mailto:${profile.email}`}
      aria-label="Email Logan"
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-5 right-5 z-40 hidden h-12 w-12 place-items-center rounded-full bg-ink text-butter shadow-[0_14px_40px_-10px_rgba(0,0,0,0.55)] ring-1 ring-butter/25 transition-[opacity,scale,translate] duration-500 ease-[var(--ease-out)] hover:scale-110 md:grid ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <MailIcon className="h-5 w-5" />
    </a>
  );
}
