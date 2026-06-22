import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db-health";
import { getDeepSeekApiKey } from "@/lib/deepseek";

export async function GET() {
  const key = getDeepSeekApiKey();
  const db = await checkDatabaseConnection();

  return NextResponse.json({
    deepseekKeyConfigured: Boolean(key),
    keyLength: key?.length ?? 0,
    databaseConnected: db.ok,
    databaseError: db.error ?? null,
    nodeEnv: process.env.NODE_ENV,
    expectedVar: "DEEPSEEK_API_KEY",
    hint: !key
      ? "DEEPSEEK_API_KEY 未读取到，请检查 Vercel Settings → Environment Variables"
      : !db.ok
        ? "DeepSeek 已配置，但数据库不可达。请在 Supabase 确认项目未暂停，并使用 Pooler 连接串（6543）更新 DATABASE_URL，然后执行 prisma/supabase-init.sql"
        : "环境变量与数据库连接正常",
  });
}
