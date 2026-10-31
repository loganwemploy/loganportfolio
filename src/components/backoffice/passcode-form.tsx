"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/backoffice/actions";
import type { SignInState } from "@/lib/backoffice";

const initial: SignInState = { error: null };

export function PasscodeForm({ next, configured }: { next: string; configured: boolean }) {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <main
      id="main"
      className="grid min-h-screen place-items-center bg-ink px-5 py-16 text-butter"
    >
      <div className="w-full max-w-sm">
        <p className="display text-[44px] leading-none">LW</p>
        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.18em] text-butter/60">
          Back office
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Enter the passcode</h1>

        <form action={action} className="mt-8">
          <input type="hidden" name="next" value={next} />
          <label htmlFor="passcode" className="sr-only">
            Passcode
          </label>
          <input
            id="passcode"
            name="passcode"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            autoFocus
            required
            disabled={!configured}
            aria-invalid={state.error ? true : undefined}
            aria-describedby="passcode-error"
            className="w-full rounded-2xl border border-butter/30 bg-white/5 px-5 py-4 text-center text-3xl tracking-[0.5em] text-butter placeholder:text-butter/25 focus:border-butter focus:outline-none disabled:opacity-50"
            placeholder="••••"
          />
          <button
            type="submit"
            disabled={pending || !configured}
            className="mt-4 w-full rounded-full bg-butter px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {pending ? "Checking…" : "Unlock"}
          </button>
          <p id="passcode-error" role="alert" className="mt-4 min-h-[1.5em] text-center text-[14px] text-[#ffb59a]">
            {configured
              ? state.error
              : "The back office isn't set up. Add BACKOFFICE_PASSCODE and BACKOFFICE_SECRET to the environment."}
          </p>
        </form>

        <Link href="/" className="link-underline mt-10 inline-block text-[13px] text-butter/60">
          ← Back to the site
        </Link>
      </div>
    </main>
  );
}
