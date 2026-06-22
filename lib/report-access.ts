import { randomBytes } from "crypto";

export function generateReportAccessToken(): string {
  return randomBytes(32).toString("hex");
}

export function buildReportViewUrl(accessToken: string): string {
  const base = getAppBaseUrl();
  return `${base}/report/${accessToken}`;
}

export function getAppBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
