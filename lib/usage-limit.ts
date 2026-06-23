import { prisma } from "@/lib/prisma";

export const PHONE_USAGE_LIMIT_MESSAGE =
  "该手机号已使用过免费检测机会。如需再次检测，请关注 MarketUP 后续活动或通过官方渠道获取更多次数。";

export const EMAIL_USAGE_LIMIT_MESSAGE =
  "该企业邮箱已申请过深度报告。如需再次获取，请关注 MarketUP 后续活动或通过官方渠道联系我们。";

/** 测试用手机号，跳过「每号仅可初筛一次」限制 */
const PHONE_USAGE_TEST_WHITELIST = new Set(["13770626459"]);

export function normalizePhoneForLookup(phone: string): string {
  return phone.trim();
}

export function isPhoneUsageTestWhitelisted(phone: string): boolean {
  return PHONE_USAGE_TEST_WHITELIST.has(normalizePhoneForLookup(phone));
}

export function normalizeEmailForLookup(email: string): string {
  return email.trim().toLowerCase();
}

export async function isPhoneUsedForGrade(phone: string): Promise<boolean> {
  const normalized = normalizePhoneForLookup(phone);
  if (isPhoneUsageTestWhitelisted(normalized)) {
    return false;
  }
  const existing = await prisma.auditRequest.findFirst({
    where: { phone: normalized },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function isEmailUsedForDeepReport(
  email: string,
  excludeAuditId?: string
): Promise<boolean> {
  const normalized = normalizeEmailForLookup(email);
  const existing = await prisma.auditRequest.findFirst({
    where: {
      email: normalized,
      hasRequestedDeepReport: true,
      ...(excludeAuditId ? { id: { not: excludeAuditId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(existing);
}
