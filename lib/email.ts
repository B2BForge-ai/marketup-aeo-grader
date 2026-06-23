import {
  buildOtpEmail,
  buildReportLinkEmail,
} from "@/lib/email-templates";

const DEFAULT_DOMAIN = "email.b2bforge.ai";
const DEFAULT_FROM = "MarketUP GEO <noreply@email.b2bforge.ai>";

export function getMailgunApiKey(): string | undefined {
  return process.env.MAILGUN_API_KEY?.trim() || undefined;
}

export function getMailgunDomain(): string {
  return process.env.MAILGUN_DOMAIN?.trim() || DEFAULT_DOMAIN;
}

export function getMailgunApiBase(): string {
  const custom = process.env.MAILGUN_API_BASE?.trim();
  if (custom) return custom.replace(/\/$/, "");

  const region = process.env.MAILGUN_REGION?.trim().toLowerCase();
  if (region === "eu") return "https://api.eu.mailgun.net";

  return "https://api.mailgun.net";
}

export function getMailgunFromEmail(): string {
  return process.env.MAILGUN_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

export function isEmailConfigured(): boolean {
  return Boolean(getMailgunApiKey());
}

export function isEmailMockMode(): boolean {
  return !isEmailConfigured();
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const apiKey = getMailgunApiKey();
  if (!apiKey) {
    console.log(
      `[Mock Email] 跳过真实发信 → ${params.to} | ${params.subject}`
    );
    return;
  }

  const domain = getMailgunDomain();
  const endpoint = `${getMailgunApiBase()}/v3/${domain}/messages`;

  // FormData 正确传递 UTF-8 中文（URLSearchParams 在部分环境下会导致主题/正文乱码）
  const form = new FormData();
  form.append("from", getMailgunFromEmail());
  form.append("to", params.to);
  form.append("subject", params.subject);
  form.append("html", params.html);
  form.append("h:Content-Type", "text/html; charset=utf-8");

  if (params.text) {
    form.append("text", params.text);
  }

  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Mailgun API error (${response.status}): ${errText}`);
  }
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const template = buildOtpEmail(code);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendReportLinkEmail(
  email: string,
  companyName: string,
  reportUrl: string
): Promise<void> {
  const template = buildReportLinkEmail(companyName, reportUrl);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
