const URL_ERROR =
  "无法访问该官网 URL，请确保输入了正确的网址（如 www.example.com）且网站当前可公开访问。";

export function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function validateWebsiteUrl(
  raw: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(normalizeWebsiteUrl(raw));
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: URL_ERROR };
    }
  } catch {
    return { ok: false, error: URL_ERROR };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    let res = await fetch(parsed.href, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "MarketUP-GEO-Grader/1.0" },
    });

    if (res.status === 405 || res.status === 501) {
      res = await fetch(parsed.href, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "MarketUP-GEO-Grader/1.0" },
      });
    }

    if (res.ok || (res.status >= 300 && res.status < 400)) {
      return { ok: true, url: parsed.href };
    }

    return { ok: false, error: URL_ERROR };
  } catch {
    return { ok: false, error: URL_ERROR };
  } finally {
    clearTimeout(timer);
  }
}
