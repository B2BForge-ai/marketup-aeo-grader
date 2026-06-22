import { BROWSER_HEADERS } from "@/lib/validate-url";

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].replace(/\s+/g, " ")) : "";
}

function extractMetaContent(html: string, attr: string, value: string): string {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(regex);
  if (match) return decodeHtmlEntities(match[1].trim());

  const reverseRegex = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${value}["']`,
    "i"
  );
  const reverseMatch = html.match(reverseRegex);
  return reverseMatch ? decodeHtmlEntities(reverseMatch[1].trim()) : "";
}

export interface WebsiteMeta {
  title: string;
  description: string;
  text: string;
}

export async function fetchWebsiteMeta(url: string): Promise<WebsiteMeta> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: BROWSER_HEADERS,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const title = extractTitle(html);
    const description =
      extractMetaContent(html, "name", "description") ||
      extractMetaContent(html, "property", "og:description") ||
      extractMetaContent(html, "name", "twitter:description");

    const text = [title, description].filter(Boolean).join(" · ");

    return { title, description, text };
  } finally {
    clearTimeout(timer);
  }
}
