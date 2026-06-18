import { NextResponse } from "next/server";

/** 用于排查 Vercel 环境变量是否生效，不暴露 Key 内容 */
export async function GET() {
  const key = process.env.ZHIPU_API_KEY?.trim();
  return NextResponse.json({
    zhipuKeyConfigured: Boolean(key),
    keyLength: key?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    hint: key
      ? "环境变量已读取，API 应可正常工作"
      : "ZHIPU_API_KEY 未读取到，请检查 Vercel Settings → Environment Variables",
  });
}
