import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PasscodeForm } from "@/components/backoffice/passcode-form";
import { isConfigured, safeNext, SESSION_COOKIE, verifySession } from "@/lib/backoffice";

export const metadata: Metadata = {
  title: "Back office · Sign in",
};

export default async function LoginPage({ searchParams }: PageProps<"/backoffice/login">) {
  const { next } = await searchParams;
  const target = safeNext(Array.isArray(next) ? next[0] : next);

  if (await verifySession((await cookies()).get(SESSION_COOKIE)?.value)) redirect(target);

  return <PasscodeForm next={target} configured={isConfigured()} />;
}
