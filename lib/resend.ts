const RESEND_API_URL = "https://api.resend.com/emails";

export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined;
}

export function isEmailMockMode(): boolean {
  return !getResendApiKey();
}

export function getResendFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "MarketUP GEO <onboarding@resend.dev>"
  );
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.log(
      `[Mock Email] 跳过真实发信 → ${params.to} | ${params.subject}`
    );
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromEmail(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API error: ${errText}`);
  }
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `【MarketUP】您的 GEO 深度审计验证码：${code}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#E8321A;margin:0 0 16px;">MarketUP · GEO 深度审计</h2>
        <p style="color:#444;font-size:15px;line-height:1.6;">您的验证码为：</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#111;margin:16px 0;">${code}</p>
        <p style="color:#888;font-size:13px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
      </div>
    `,
  });
}

export async function sendReportLinkEmail(
  email: string,
  companyName: string,
  reportUrl: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `【MarketUP】${companyName} · GEO 深度整改报告（专属链接）`,
    html: `
      <div style="font-family:'PingFang SC','Microsoft YaHei',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
          <p style="margin:0 0 8px;color:#2563eb;font-size:13px;font-weight:600;">MarketUP · AI Search Grader</p>
          <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">您的 GEO 深度整改报告已就绪</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
            ${companyName} 的《GEO 深度整改与 AI 爬虫诱饵代码白皮书》已由专家核准完成。
            请点击下方按钮查看完整报告（链接为您专属，请勿转发）。
          </p>
          <a href="${reportUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
            查看我的专属报告 →
          </a>
          <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:24px 0 0;word-break:break-all;">
            若按钮无法点击，请复制链接至浏览器打开：<br>${reportUrl}
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendDeepReportEmail(
  email: string,
  companyName: string,
  reportHtml: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `【MarketUP】${companyName} · GEO 深度整改与 AI 爬虫诱饵代码白皮书`,
    html: reportHtml,
  });
}
