import { NextResponse } from "next/server";
import { getZhipuApiKey } from "@/lib/zhipu";

export async function GET() {
  const key = getZhipuApiKey();
  return NextResponse.json({
    zhipuKeyConfigured: Boolean(key),
    keyLength: key?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    expectedVar: "ZHIPU_AI_API_KEY",
    hint: key
      ? "环境变量已读取，API 应可正常工作"
      : "ZHIPU_AI_API_KEY 未读取到，请检查 Vercel Settings → Environment Variables",
  });
}
