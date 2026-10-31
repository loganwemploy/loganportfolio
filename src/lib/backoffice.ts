/*
 * Back office sign-in. The session cookie holds the time it was issued plus an
 * HMAC of that time and the passcode, keyed with BACKOFFICE_SECRET. It can't
 * be forged without the secret, and changing the passcode signs everyone out.
 *
 * Used by the proxy and by server actions, so it sticks to Web Crypto.
 */

export const SESSION_COOKIE = "backoffice_session";
export const SESSION_PATH = "/backoffice";
/** 30 days, in seconds. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type SignInState = { error: string | null };

const encoder = new TextEncoder();

function config() {
  const passcode = process.env.BACKOFFICE_PASSCODE?.trim();
  const secret = process.env.BACKOFFICE_SECRET?.trim();
  return passcode && secret && secret.length >= 32 ? { passcode, secret } : null;
}

export const isConfigured = () => config() !== null;

async function sign(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
  return Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPasscode(input: string): Promise<boolean> {
  const c = config();
  if (!c) return false;
  // Compare MACs rather than the raw strings, so timing reveals nothing about the passcode.
  const [given, expected] = await Promise.all([
    sign(c.secret, `passcode:${input}`),
    sign(c.secret, `passcode:${c.passcode}`),
  ]);
  return same(given, expected);
}

export async function createSession(now = Date.now()): Promise<string | null> {
  const c = config();
  if (!c) return null;
  const issued = Math.floor(now / 1000).toString(36);
  return `${issued}.${await sign(c.secret, `session:${issued}:${c.passcode}`)}`;
}

export async function verifySession(token: string | undefined, now = Date.now()): Promise<boolean> {
  const c = config();
  if (!c || !token) return false;
  const [issued, mac, extra] = token.split(".");
  if (!issued || !mac || extra !== undefined || !/^[0-9a-z]{1,12}$/.test(issued)) return false;
  const age = Math.floor(now / 1000) - Number.parseInt(issued, 36);
  if (age < -60 || age > SESSION_MAX_AGE) return false;
  return same(mac, await sign(c.secret, `session:${issued}:${c.passcode}`));
}

/** Where to send someone after they sign in: back office pages only, never another site. */
export function safeNext(value: unknown): string {
  if (typeof value !== "string") return SESSION_PATH;
  if (!/^\/backoffice(?:[/?#]|$)/.test(value) || value.startsWith("/backoffice/login")) return SESSION_PATH;
  return value;
}
