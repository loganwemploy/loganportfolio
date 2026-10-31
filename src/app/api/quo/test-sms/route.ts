import { sendSms } from "@/lib/quo";

// Dev-only smoke test: texts QUO_TEST_TO from the Quo "Primary" line.
// POST so link prefetchers and crawlers can never trigger a send.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const to = process.env.QUO_TEST_TO;
  if (!to) {
    return Response.json({ ok: false, error: "QUO_TEST_TO is not set" }, { status: 500 });
  }

  const result = await sendSms({
    to,
    content: "Test message from the resumelogan site via Quo.",
  });

  return Response.json(result, { status: result.ok ? 200 : result.status });
}
