import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

/** 开发/演示用万能验证码，输入此码直接通过校验 */
export const MOCK_OTP_CODE = "123456";

export function isMockOtpCode(code: string): boolean {
  return code.trim() === MOCK_OTP_CODE;
}

function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function saveOtp(email: string, code: string): Promise<void> {
  const key = normalizeEmailKey(email);
  const now = new Date();
  await prisma.emailOtp.upsert({
    where: { email: key },
    create: {
      email: key,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      verifyAttempts: 0,
      lastSentAt: now,
    },
    update: {
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      verifyAttempts: 0,
      lastSentAt: now,
    },
  });
}

export async function canSendOtp(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = normalizeEmailKey(email);
  const existing = await prisma.emailOtp.findUnique({ where: { email: key } });
  if (!existing) return { ok: true };

  const elapsed = Date.now() - existing.lastSentAt.getTime();
  if (elapsed < SEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
    return { ok: false, error: `请 ${waitSec} 秒后再获取验证码` };
  }
  return { ok: true };
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isMockOtpCode(code)) {
    return { ok: true };
  }

  const key = normalizeEmailKey(email);
  const record = await prisma.emailOtp.findUnique({ where: { email: key } });

  if (!record) {
    return { ok: false, error: "验证码不存在或已过期，请重新获取" };
  }

  if (Date.now() > record.expiresAt.getTime()) {
    await prisma.emailOtp.delete({ where: { email: key } }).catch(() => {});
    return { ok: false, error: "验证码已过期，请重新获取" };
  }

  if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.emailOtp.delete({ where: { email: key } }).catch(() => {});
    return { ok: false, error: "验证次数过多，请重新获取验证码" };
  }

  if (record.code !== code.trim()) {
    await prisma.emailOtp.update({
      where: { email: key },
      data: { verifyAttempts: record.verifyAttempts + 1 },
    });
    return { ok: false, error: "验证码错误，请检查后重试" };
  }

  await prisma.emailOtp.delete({ where: { email: key } }).catch(() => {});
  return { ok: true };
}
