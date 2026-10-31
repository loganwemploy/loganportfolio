export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const stamp = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatWhen(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : stamp.format(date);
}

export const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const editPath = (id: string) => `/backoffice/resumes/${encodeURIComponent(id)}`;
