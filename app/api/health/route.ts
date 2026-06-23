import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db-health";
import { getDeepSeekApiKey } from "@/lib/deepseek";
import {
  getMailgunApiBase,
  getMailgunApiKey,
  getMailgunDomain,
  getMailgunFromEmail,
  isEmailConfigured,
} from "@/lib/email";

export async function GET() {
  const key = getDeepSeekApiKey();
  const db = await checkDatabaseConnection();
  const mailgunRegion = process.env.MAILGUN_REGION?.trim().toLowerCase() || "us";

  return NextResponse.json({
    deepseekKeyConfigured: Boolean(key),
    keyLength: key?.length ?? 0,
    databaseConnected: db.ok,
    databaseError: db.error ?? null,
    mailgunConfigured: isEmailConfigured(),
    mailgunDomain: getMailgunDomain(),
    mailgunFromEmail: getMailgunFromEmail(),
    mailgunApiBase: getMailgunApiBase(),
    mailgunRegion,
    mailgunKeyLength: getMailgunApiKey()?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    expectedVar: "DEEPSEEK_API_KEY",
    hint: !key
      ? "DEEPSEEK_API_KEY 未读取到，请检查 Vercel Settings → Environment Variables"
      : !db.ok
        ? "DeepSeek 已配置，但数据库不可达。请在 Supabase 确认项目未暂停，并使用 Pooler 连接串（6543）更新 DATABASE_URL，然后执行 prisma/supabase-init.sql"
        : !isEmailConfigured()
          ? "Mailgun 未配置 MAILGUN_API_KEY，邮箱 OTP 将走模拟模式（验证码 123456）"
          : mailgunRegion === "eu"
            ? "Mailgun 当前为 EU 区域；若 Key 来自美区控制台，请删除 MAILGUN_REGION 或改为 us"
            : "环境变量与数据库连接正常",
  });
}
