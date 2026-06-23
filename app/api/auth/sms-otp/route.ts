import { NextRequest, NextResponse } from "next/server";
import { sendMarketupSmsCode } from "@/lib/marketup-auth-code";
import { validatePhone } from "@/lib/phone-validation";
import { canSendSms, recordSmsSend } from "@/lib/sms-send-cooldown";
import { isPhoneUsedForGrade, PHONE_USAGE_LIMIT_MESSAGE } from "@/lib/usage-limit";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body as { phone?: string };

    const phoneCheck = validatePhone(phone ?? "");
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }

    const normalizedPhone = phone!.trim();

    if (await isPhoneUsedForGrade(normalizedPhone)) {
      return NextResponse.json({ error: PHONE_USAGE_LIMIT_MESSAGE }, { status: 409 });
    }

    const cooldown = canSendSms(normalizedPhone);
    if (!cooldown.ok) {
      return NextResponse.json({ error: cooldown.error }, { status: 429 });
    }

    await sendMarketupSmsCode(normalizedPhone);
    recordSmsSend(normalizedPhone);

    return NextResponse.json({ success: true, message: "验证码已发送" });
  } catch (error) {
    console.error("SMS OTP send error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "验证码发送失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}
