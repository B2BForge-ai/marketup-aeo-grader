import { NextResponse } from "next/server";
import { getDeepSeekApiKey } from "@/lib/deepseek";

export async function GET() {
  const key = getDeepSeekApiKey();
  return NextResponse.json({
    deepseekKeyConfigured: Boolean(key),
    keyLength: key?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    expectedVar: "DEEPSEEK_API_KEY",
    hint: key
      ? "环境变量已读取，API 应可正常工作"
      : "DEEPSEEK_API_KEY 未读取到，请检查 Vercel Settings → Environment Variables",
  });
}
