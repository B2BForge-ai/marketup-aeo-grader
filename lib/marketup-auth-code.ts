import { isValidPhone } from "@/lib/phone-validation";

interface MarketupApiResponse<T = unknown> {
  code?: number;
  message?: string;
  data?: T;
}

export function getMarketupApiBase(): string {
  return (
    process.env.MARKETUP_API_BASE_URL?.trim()?.replace(/\/$/, "") ||
    "https://www.marketup.cn"
  );
}

export function getMarketupReferer(): string {
  return (
    process.env.MARKETUP_API_REFERER?.trim() || "https://www.marketup.cn/"
  );
}

function parseMarketupResponse<T>(payload: MarketupApiResponse<T>): T {
  if (payload.code !== 200) {
    throw new Error(payload.message || "MarketUP 接口请求失败");
  }
  return payload.data as T;
}

async function readMarketupJson<T>(
  response: Response
): Promise<MarketupApiResponse<T> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  try {
    return (await response.json()) as MarketupApiResponse<T>;
  } catch {
    return null;
  }
}

export async function sendMarketupSmsCode(phone: string): Promise<void> {
  if (!isValidPhone(phone)) {
    throw new Error("请输入有效的 11 位中国大陆手机号");
  }

  const url = new URL(`${getMarketupApiBase()}/api/open/auth/code`);
  url.searchParams.set("account", phone.trim());
  url.searchParams.set("type", "0");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Referer: getMarketupReferer() },
    cache: "no-store",
  });

  const payload = await readMarketupJson<number>(response);
  if (!payload) {
    throw new Error(`MarketUP 发码接口返回非 JSON（HTTP ${response.status}）`);
  }
  if (!response.ok) {
    throw new Error(payload.message || `MarketUP 发码失败 (${response.status})`);
  }

  parseMarketupResponse(payload);
}

/** MarketUP 主站若未暴露验码 HTTP 接口，则无法从 aeo-grader 侧校验 Redis 中的验证码 */
export async function verifyMarketupSmsCode(
  phone: string,
  code: string
): Promise<boolean> {
  if (!isValidPhone(phone) || !code?.trim()) {
    return false;
  }

  const url = new URL(`${getMarketupApiBase()}/api/open/auth/code/verify`);
  url.searchParams.set("account", phone.trim());
  url.searchParams.set("code", code.trim());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Referer: getMarketupReferer() },
    cache: "no-store",
  });

  // 主站验码接口未开放或返回 HTML/405 时，静默失败以便 fallback 到本地 mock 验码
  if (!response.ok) {
    return false;
  }

  const payload = await readMarketupJson<boolean>(response);
  if (!payload) {
    return false;
  }

  return payload.code === 200 && payload.data === true;
}
