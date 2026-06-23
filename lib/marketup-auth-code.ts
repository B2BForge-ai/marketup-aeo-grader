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

  const payload = (await response.json()) as MarketupApiResponse<number>;
  if (!response.ok) {
    throw new Error(payload.message || `MarketUP 发码失败 (${response.status})`);
  }

  parseMarketupResponse(payload);
}

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

  const payload = (await response.json()) as MarketupApiResponse<boolean>;
  if (!response.ok || payload.code !== 200) {
    return false;
  }

  return payload.data === true;
}
