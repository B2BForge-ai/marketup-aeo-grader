import { checkDatabaseConnection } from "@/lib/db-health";
import { getDeepSeekApiKey, getDeepSeekModel } from "@/lib/deepseek";
import {
  getMailgunApiBase,
  getMailgunApiKey,
  getMailgunDomain,
  getMailgunFromEmail,
  isEmailConfigured,
} from "@/lib/email";
import {
  getMarketupApiBase,
  getMarketupReferer,
} from "@/lib/marketup-auth-code";
import { isMarketupSmsSendEnabled } from "@/lib/phone-otp-store";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckItem {
  ok: boolean;
  configured?: boolean;
  detail?: string;
  warning?: string | null;
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  nodeEnv: string;
  checks: {
    database: HealthCheckItem & { error?: string | null };
    deepseek: HealthCheckItem & { model: string; keyLength: number };
    mailgun: HealthCheckItem & {
      domain: string;
      fromEmail: string;
      apiBase: string;
      region: string;
      mockMode: boolean;
      keyLength: number;
    };
    admin: HealthCheckItem & { keyLength: number };
    appUrl: HealthCheckItem & { value: string | null };
    marketupSms: HealthCheckItem & {
      enabled: boolean;
      apiBase: string;
      referer: string;
    };
  };
  hints: string[];
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export async function runHealthCheck(): Promise<HealthReport> {
  const db = await checkDatabaseConnection();
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL?.trim());

  const deepseekKey = getDeepSeekApiKey();
  const deepseekConfigured = Boolean(deepseekKey);

  const mailgunConfigured = isEmailConfigured();
  const mailgunRegion =
    process.env.MAILGUN_REGION?.trim().toLowerCase() || "us";
  const mailgunMockMode = !mailgunConfigured;

  const adminToken = process.env.ADMIN_SECRET_TOKEN?.trim();
  const adminConfigured = Boolean(adminToken);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || null;
  const appUrlConfigured = Boolean(appUrl);

  const marketupSmsEnabled = isMarketupSmsSendEnabled();

  const hints: string[] = [];

  // --- database ---
  if (!databaseUrlConfigured) {
    hints.push("DATABASE_URL 未配置：初筛诊断、深度报告、管理端均无法写库");
  } else if (!db.ok) {
    hints.push(
      `数据库不可达：请用 Supabase Pooler（6543）连接串，并执行 prisma/supabase-init.sql。${db.error ?? ""}`
    );
  }

  // --- deepseek ---
  if (!deepseekConfigured) {
    hints.push("DEEPSEEK_API_KEY 未配置：AI 诊断与报告生成不可用");
  }

  // --- mailgun ---
  if (mailgunMockMode) {
    hints.push(
      "MAILGUN_API_KEY 未配置：邮箱 OTP 与报告邮件走模拟模式（验证码固定 123456）"
    );
  } else if (mailgunRegion === "eu") {
    hints.push(
      "MAILGUN_REGION=eu 但 Key 可能属于美区；删除该变量或改为 us，否则发信会 401"
    );
  }

  // --- admin ---
  if (!adminConfigured) {
    hints.push(
      "ADMIN_SECRET_TOKEN 未配置：/admin/reports 将无法通过 token 鉴权"
    );
  }

  // --- app url ---
  if (!appUrlConfigured) {
    hints.push(
      "NEXT_PUBLIC_APP_URL 未配置：报告邮件中的专属链接可能不正确"
    );
  } else if (isProductionEnv() && appUrl && isLocalhostUrl(appUrl)) {
    hints.push(
      "NEXT_PUBLIC_APP_URL 仍为 localhost，生产环境请改为 https://marketup-aeo-grader.vercel.app"
    );
  }

  // --- marketup sms ---
  if (!marketupSmsEnabled) {
    hints.push(
      "MARKETUP_SMS_SEND=false：手机短信走本地模拟（验证码 123456），不会真实发短信"
    );
  }

  const checks = {
    database: {
      ok: databaseUrlConfigured && db.ok,
      configured: databaseUrlConfigured,
      error: db.error ?? null,
      detail: databaseUrlConfigured
        ? db.ok
          ? "连接正常"
          : "已配置但连接失败"
        : "未配置",
    },
    deepseek: {
      ok: deepseekConfigured,
      configured: deepseekConfigured,
      model: getDeepSeekModel(),
      keyLength: deepseekKey?.length ?? 0,
      detail: deepseekConfigured ? "已配置" : "未配置",
    },
    mailgun: {
      ok: mailgunConfigured && mailgunRegion !== "eu",
      configured: mailgunConfigured,
      domain: getMailgunDomain(),
      fromEmail: getMailgunFromEmail(),
      apiBase: getMailgunApiBase(),
      region: mailgunRegion,
      mockMode: mailgunMockMode,
      keyLength: getMailgunApiKey()?.length ?? 0,
      warning: mailgunConfigured && mailgunRegion === "eu" ? "eu 区域可能与 Key 不匹配" : null,
      detail: mailgunMockMode
        ? "模拟模式"
        : mailgunRegion === "eu"
          ? "已配置但区域可能有误"
          : "已配置",
    },
    admin: {
      ok: adminConfigured,
      configured: adminConfigured,
      keyLength: adminToken?.length ?? 0,
      detail: adminConfigured ? "已配置" : "未配置",
    },
    appUrl: {
      ok:
        appUrlConfigured &&
        !(isProductionEnv() && appUrl && isLocalhostUrl(appUrl)),
      configured: appUrlConfigured,
      value: appUrl,
      detail: appUrl ?? "未配置",
    },
    marketupSms: {
      ok: marketupSmsEnabled,
      configured: true,
      enabled: marketupSmsEnabled,
      apiBase: getMarketupApiBase(),
      referer: getMarketupReferer(),
      detail: marketupSmsEnabled ? "真实发短信（验码暂用 123456）" : "本地模拟",
    },
  };

  const criticalFailed =
    !checks.database.ok || !checks.deepseek.ok;
  const anyWarning =
    hints.length > 0 ||
    checks.mailgun.warning ||
    !checks.admin.ok ||
    !checks.appUrl.ok;

  let status: HealthStatus = "healthy";
  if (criticalFailed) {
    status = "unhealthy";
  } else if (anyWarning) {
    status = "degraded";
  }

  if (status === "healthy" && hints.length === 0) {
    hints.push("核心服务配置正常，可进行线上全流程测试");
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    checks,
    hints,
  };
}
