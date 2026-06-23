const SEND_COOLDOWN_MS = 60 * 1000;

type CooldownGlobal = typeof globalThis & {
  __smsSendCooldownStore?: Map<string, number>;
};

function getStore(): Map<string, number> {
  const g = globalThis as CooldownGlobal;
  if (!g.__smsSendCooldownStore) {
    g.__smsSendCooldownStore = new Map();
  }
  return g.__smsSendCooldownStore;
}

function normalizePhoneKey(phone: string): string {
  return phone.trim();
}

export function canSendSms(
  phone: string
): { ok: true } | { ok: false; error: string } {
  const key = normalizePhoneKey(phone);
  const lastSentAt = getStore().get(key);
  if (!lastSentAt) return { ok: true };

  const elapsed = Date.now() - lastSentAt;
  if (elapsed < SEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
    return { ok: false, error: `请 ${waitSec} 秒后再获取验证码` };
  }

  return { ok: true };
}

export function recordSmsSend(phone: string): void {
  getStore().set(normalizePhoneKey(phone), Date.now());
}
