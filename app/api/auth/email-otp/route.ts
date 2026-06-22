import { NextRequest, NextResponse } from "next/server";
import { validateEnterpriseEmail } from "@/lib/email-validation";
import {
  isEmailUsedForDeepReport,
  EMAIL_USAGE_LIMIT_MESSAGE,
} from "@/lib/usage-limit";
import {
  canSendOtp,
  generateOtpCode,
  MOCK_OTP_CODE,
  saveOtp,
} from "@/lib/otp-store";
import { getResendApiKey, sendOtpEmail } from "@/lib/resend";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email?.trim()) {
      return NextResponse.json({ error: "请输入企业工作邮箱" }, { status: 400 });
    }

    const emailCheck = validateEnterpriseEmail(email);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    if (await isEmailUsedForDeepReport(email)) {
      return NextResponse.json({ error: EMAIL_USAGE_LIMIT_MESSAGE }, { status: 409 });
    }

    if (!getResendApiKey()) {
      const cooldown = canSendOtp(email);
      if (!cooldown.ok) {
        return NextResponse.json({ error: cooldown.error }, { status: 429 });
      }
      saveOtp(email, MOCK_OTP_CODE);
      return NextResponse.json({
        success: true,
        message: "模拟模式：验证码为 123456",
        mock: true,
      });
    }

    const cooldown = canSendOtp(email);
    if (!cooldown.ok) {
      return NextResponse.json({ error: cooldown.error }, { status: 429 });
    }

    const code = generateOtpCode();
    saveOtp(email, code);
    await sendOtpEmail(email.trim(), code);

    return NextResponse.json({ success: true, message: "验证码已发送" });
  } catch (error) {
    console.error("Email OTP send error:", error);
    return NextResponse.json(
      { error: "验证码发送失败，请稍后重试" },
      { status: 500 }
    );
  }
}
