import { NextRequest, NextResponse } from "next/server";
import { validateEnterpriseEmail } from "@/lib/email-validation";
import {
  isEmailUsedForDeepReport,
  isEmailUsageTestWhitelisted,
  EMAIL_USAGE_LIMIT_MESSAGE,
} from "@/lib/usage-limit";
import {
  canSendOtp,
  generateOtpCode,
  MOCK_OTP_CODE,
  saveOtp,
} from "@/lib/otp-store";
import { isEmailConfigured, sendOtpEmail } from "@/lib/email";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email?.trim()) {
      return NextResponse.json({ error: "请输入企业工作邮箱" }, { status: 400 });
    }

    const normalizedEmail = email.trim();
    const isTestEmail = isEmailUsageTestWhitelisted(normalizedEmail);

    const emailCheck = validateEnterpriseEmail(normalizedEmail);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    if (await isEmailUsedForDeepReport(normalizedEmail)) {
      return NextResponse.json({ error: EMAIL_USAGE_LIMIT_MESSAGE }, { status: 409 });
    }

    if (!isEmailConfigured()) {
      const cooldown = isTestEmail ? { ok: true as const } : canSendOtp(normalizedEmail);
      if (!cooldown.ok) {
        return NextResponse.json({ error: cooldown.error }, { status: 429 });
      }
      saveOtp(normalizedEmail, MOCK_OTP_CODE);
      return NextResponse.json({
        success: true,
        message: "模拟模式：验证码为 123456",
        mock: true,
      });
    }

    const cooldown = isTestEmail ? { ok: true as const } : canSendOtp(normalizedEmail);
    if (!cooldown.ok) {
      return NextResponse.json({ error: cooldown.error }, { status: 429 });
    }

    const code = generateOtpCode();

    try {
      await sendOtpEmail(normalizedEmail, code);
      saveOtp(normalizedEmail, code);
      return NextResponse.json({ success: true, message: "验证码已发送" });
    } catch (sendError) {
      console.error("Mailgun send failed:", sendError);

      if (isTestEmail) {
        saveOtp(normalizedEmail, MOCK_OTP_CODE);
        return NextResponse.json({
          success: true,
          message: "测试模式：邮件服务异常，请使用验证码 123456",
          mock: true,
        });
      }

      throw sendError;
    }
  } catch (error) {
    console.error("Email OTP send error:", error);
    return NextResponse.json(
      {
        error:
          "验证码发送失败，请稍后重试。若持续失败，请检查 Vercel 中 MAILGUN_API_KEY 是否正确（美区 Key，勿设 MAILGUN_REGION=eu）",
      },
      { status: 500 }
    );
  }
}
