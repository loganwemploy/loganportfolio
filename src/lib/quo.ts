const QUO_API = "https://api.quo.com/v1";

type SendSmsInput = {
  to: string;
  content: string;
};

type SendSmsResult =
  | { ok: true; id: string; status: string }
  | { ok: false; status: number; error: string };

export async function sendSms({ to, content }: SendSmsInput): Promise<SendSmsResult> {
  const apiKey = process.env.QUO_API_KEY;
  const from = process.env.QUO_FROM_NUMBER_ID;
  if (!apiKey || !from) {
    return { ok: false, status: 500, error: "QUO_API_KEY or QUO_FROM_NUMBER_ID is not set" };
  }

  const res = await fetch(`${QUO_API}/messages`, {
    method: "POST",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ content, from, to: [to] }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, error: body?.message ?? res.statusText };
  }
  return { ok: true, id: body.data?.id, status: body.data?.status };
}
