import type { ErrorReason } from "./validate";

export async function checkExternalUrl(
  url: string,
): Promise<ErrorReason | undefined> {
  const parsed = new URL(url);
  if (parsed.hostname === "localhost") return;

  const res = await fetch(parsed, {
    method: "HEAD",
  }).catch(() => undefined);

  if (!res) return "not-found";

  if (!res.ok) {
    if (res.status === 404) return "not-found";

    console.warn(`${url} responded status ${res.status}, is it expected?`);
  }
}
