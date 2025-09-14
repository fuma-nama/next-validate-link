export async function isExternalUrlValid(url: string): Promise<boolean> {
  const parsed = new URL(url);
  if (parsed.hostname === "localhost") return true;

  const res = await fetch(parsed, {
    method: "HEAD",
  }).catch(() => undefined);

  if (!res) return false;

  if (!res.ok) {
    if (res.status === 404) return false;
    console.warn(`${url} responded status ${res.status}, is it expected?`);
  }

  return true;
}
