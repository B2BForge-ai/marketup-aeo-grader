interface OtpRecord {
  code: string;
  expiresAt: number;
  verifyAttempts: number;
  lastSentAt: number;
}

const OTP_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

export const MOCK_PHONE_OTP_CODE = "123456";

type PhoneOtpGlobal = typeof globalThis & {
  __phoneOtpStore?: Map<string, OtpRecord>;
};

function getStore(): Map<string, OtpRecord> {
  const g = globalThis as PhoneOtpGlobal;
  if (!g.__phoneOtpStore) {
    g.__phoneOtpStore = new Map();
  }
  return g.__phoneOtpStore;
}

function normalizePhoneKey(phone: string): string {
  return phone.trim();
}

export function isMockPhoneOtpCode(code: string): boolean {
  return code.trim() === MOCK_PHONE_OTP_CODE;
}

export function generatePhoneOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function savePhoneOtp(phone: string, code: string): void {
  const key = normalizePhoneKey(phone);
  const now = Date.now();
  getStore().set(key, {
    code,
    expiresAt: now + OTP_TTL_MS,
    verifyAttempts: 0,
    lastSentAt: now,
  });
}

export function canSendPhoneOtp(
  phone: string
): { ok: true } | { ok: false; error: string } {
  const key = normalizePhoneKey(phone);
  const existing = getStore().get(key);
  if (!existing) return { ok: true };

  const elapsed = Date.now() - existing.lastSentAt;
  if (elapsed < SEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
    return { ok: false, error: `请 ${waitSec} 秒后再获取验证码` };
  }

  return { ok: true };
}

export function verifyPhoneOtp(
  phone: string,
  code: string
): { ok: true } | { ok: false; error: string } {
  if (isMockPhoneOtpCode(code)) {
    return { ok: true };
  }

  const key = normalizePhoneKey(phone);
  const record = getStore().get(key);

  if (!record) {
    return { ok: false, error: "验证码不存在或已过期，请重新获取" };
  }

  if (Date.now() > record.expiresAt) {
    getStore().delete(key);
    return { ok: false, error: "验证码已过期，请重新获取" };
  }

  if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    getStore().delete(key);
    return { ok: false, error: "验证次数过多，请重新获取验证码" };
  }

  record.verifyAttempts += 1;

  if (record.code !== code.trim()) {
    return { ok: false, error: "验证码错误，请检查后重试" };
  }

  getStore().delete(key);
  return { ok: true };
}

export function isMarketupSmsSendEnabled(): boolean {
  return process.env.MARKETUP_SMS_SEND?.trim().toLowerCase() !== "false";
}
