const PUBLIC_EMAIL_DOMAINS = new Set([
  "qq.com",
  "foxmail.com",
  "163.com",
  "126.com",
  "yeah.net",
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.com.cn",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "sina.com",
  "sina.cn",
  "sohu.com",
  "139.com",
  "189.cn",
  "aliyun.com",
  "protonmail.com",
  "proton.me",
]);

export const PUBLIC_EMAIL_ERROR =
  "为了确保数据合规，深度报告仅支持发送至企业工作邮箱（如 name@yourcompany.com）";

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return null;
  return trimmed.slice(at + 1);
}

export function isPublicEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return true;
  return PUBLIC_EMAIL_DOMAINS.has(domain);
}

export function validateEnterpriseEmail(email: string): {
  ok: true;
} | { ok: false; error: string } {
  if (!isValidEmailFormat(email)) {
    return { ok: false, error: "请输入有效的邮箱地址" };
  }
  if (isPublicEmail(email)) {
    return { ok: false, error: PUBLIC_EMAIL_ERROR };
  }
  return { ok: true };
}
