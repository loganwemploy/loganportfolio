"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPasscode,
  createSession,
  isConfigured,
  safeNext,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SESSION_PATH,
  type SignInState,
} from "@/lib/backoffice";

// A short passcode needs a brake on guessing. This lives in server memory,
// so it resets on restart; it's there to make guessing slow, not impossible.
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; since: number }>();

async function caller() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  if (!isConfigured()) {
    return {
      error: "The back office isn't set up. Add BACKOFFICE_PASSCODE and BACKOFFICE_SECRET to the environment.",
    };
  }

  const who = await caller();
  const now = Date.now();
  if (failures.size > 1000) {
    for (const [key, r] of failures) if (now - r.since > WINDOW_MS) failures.delete(key);
  }
  let record = failures.get(who);
  if (record && now - record.since > WINDOW_MS) {
    failures.delete(who);
    record = undefined;
  }
  if (record && record.count >= MAX_FAILURES) {
    const minutes = Math.max(1, Math.ceil((record.since + WINDOW_MS - now) / 60_000));
    return { error: `Too many wrong tries. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const passcode = String(form.get("passcode") ?? "").trim();
  if (!passcode || !(await checkPasscode(passcode))) {
    failures.set(who, { count: (record?.count ?? 0) + 1, since: record?.since ?? now });
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { error: "That passcode isn't right." };
  }

  failures.delete(who);
  const token = await createSession();
  if (!token) return { error: "Couldn't start a session. Check the back office settings." };

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: SESSION_PATH,
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  (await cookies()).set(SESSION_COOKIE, "", { path: SESSION_PATH, maxAge: 0 });
  redirect("/backoffice/login");
}
