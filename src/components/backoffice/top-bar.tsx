import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/backoffice/actions";

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink text-butter">
      <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-5">
        <Link
          href="/backoffice"
          aria-label="Back office home"
          className="flex shrink-0 items-center gap-3 rounded-lg px-1.5 py-1"
        >
          <span className="display text-[20px] leading-none">LW</span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-butter/60 md:inline">
            Back office
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
        <form action={signOut} className="shrink-0">
          <button
            type="submit"
            className="rounded-full px-3 py-1.5 text-[12px] text-butter/70 transition-colors hover:bg-white/10 hover:text-butter"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
