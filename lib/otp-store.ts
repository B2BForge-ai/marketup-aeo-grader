interface OtpRecord {
  code: string;
  expiresAt: number;
  verifyAttempts: number;
  lastSentAt: number;
}

const OTP_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

/** 开发/演示用万能验证码，输入此码直接通过校验 */
export const MOCK_OTP_CODE = "123456";

export function isMockOtpCode(code: string): boolean {
  return code.trim() === MOCK_OTP_CODE;
}

type OtpGlobal = typeof globalThis & {
  __emailOtpStore?: Map<string, OtpRecord>;
};

function getStore(): Map<string, OtpRecord> {
  const g = globalThis as OtpGlobal;
  if (!g.__emailOtpStore) {
    g.__emailOtpStore = new Map();
  }
  return g.__emailOtpStore;
}

function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function saveOtp(email: string, code: string): void {
  const key = normalizeEmailKey(email);
  const now = Date.now();
  getStore().set(key, {
    code,
    expiresAt: now + OTP_TTL_MS,
    verifyAttempts: 0,
    lastSentAt: now,
  });
}

export function canSendOtp(email: string): { ok: true } | { ok: false; error: string } {
  const key = normalizeEmailKey(email);
  const existing = getStore().get(key);
  if (!existing) return { ok: true };

  const elapsed = Date.now() - existing.lastSentAt;
  if (elapsed < SEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
    return { ok: false, error: `请 ${waitSec} 秒后再获取验证码` };
  }
  return { ok: true };
}

export function verifyOtp(
  email: string,
  code: string
): { ok: true } | { ok: false; error: string } {
  if (isMockOtpCode(code)) {
    return { ok: true };
  }

  const key = normalizeEmailKey(email);
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
