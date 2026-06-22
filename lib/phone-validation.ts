export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.trim());
}

export function validatePhone(phone: string): { ok: true } | { ok: false; error: string } {
  if (!phone?.trim()) {
    return { ok: false, error: "请输入手机号" };
  }
  if (!isValidPhone(phone)) {
    return { ok: false, error: "请输入有效的 11 位中国大陆手机号" };
  }
  return { ok: true };
}
