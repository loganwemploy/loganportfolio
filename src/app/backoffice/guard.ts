import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/backoffice";

/**
 * The proxy already checks the session. Pages check again so a matcher change
 * can never quietly expose them.
 */
export async function requireSession(path: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySession(token))) {
    redirect(`/backoffice/login?next=${encodeURIComponent(path)}`);
  }
}
