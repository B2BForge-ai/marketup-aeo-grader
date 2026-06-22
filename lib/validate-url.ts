const URL_ERROR =
  "无法访问该官网 URL，请确保输入了正确的网址（如 www.example.com）且网站当前可公开访问。";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

export function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isReachableStatus(status: number): boolean {
  return status >= 200 && status < 400;
}

async function probeUrl(
  url: string,
  method: "HEAD" | "GET",
  signal: AbortSignal
): Promise<boolean> {
  const res = await fetch(url, {
    method,
    signal,
    redirect: "follow",
    headers: BROWSER_HEADERS,
  });
  return isReachableStatus(res.status);
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
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    let reachable = false;

    try {
      reachable = await probeUrl(parsed.href, "HEAD", controller.signal);
    } catch {
      reachable = false;
    }

    if (!reachable) {
      try {
        reachable = await probeUrl(parsed.href, "GET", controller.signal);
      } catch {
        reachable = false;
      }
    }

    if (!reachable) {
      return { ok: false, error: URL_ERROR };
    }

    return { ok: true, url: parsed.href };
  } catch {
    return { ok: false, error: URL_ERROR };
  } finally {
    clearTimeout(timer);
  }
}

export { BROWSER_HEADERS };
