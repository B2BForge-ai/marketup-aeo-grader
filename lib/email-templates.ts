function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BRAND = {
  red: "#E8321A",
  redDark: "#C42814",
  redLight: "#FFF5F4",
  redBorder: "#FFD4CE",
  text: "#1A1A1A",
  textMuted: "#666666",
  textHint: "#999999",
  bg: "#F5F5F7",
  card: "#FFFFFF",
  border: "#ECECEC",
};

function emailShell(params: {
  preheader: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const { preheader, title, subtitle, bodyHtml, footerNote } = params;

  return `<!DOCTYPE html>
<html lang="zh-CN" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'PingFang SC','Microsoft YaHei','Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
          <!-- Brand bar -->
          <tr>
            <td style="padding:0 0 16px;text-align:center;">
              <span style="display:inline-block;font-size:13px;font-weight:700;letter-spacing:0.12em;color:${BRAND.red};text-transform:uppercase;">MarketUP</span>
              <span style="display:inline-block;margin-left:8px;font-size:13px;color:${BRAND.textHint};">AI Search Grader</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                <tr>
                  <td style="background:linear-gradient(135deg,${BRAND.red} 0%,${BRAND.redDark} 100%);padding:28px 32px 24px;">
                    <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;line-height:1.35;letter-spacing:-0.01em;">${escapeHtml(title)}</h1>
                    ${subtitle ? `<p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:14px;line-height:1.5;">${escapeHtml(subtitle)}</p>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;color:${BRAND.text};font-size:15px;line-height:1.75;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 28px;border-top:1px solid ${BRAND.border};">
                    <p style="margin:20px 0 0;color:${BRAND.textHint};font-size:12px;line-height:1.7;">
                      ${footerNote ? `${escapeHtml(footerNote)}<br /><br />` : ""}
                      本邮件由 <strong style="color:${BRAND.textMuted};">MarketUP</strong> 系统自动发送，请勿直接回复。<br />
                      发信域名：email.b2bforge.ai
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;color:#BBBBBB;font-size:11px;">&copy; ${new Date().getFullYear()} MarketUP &middot; B2BForge.ai</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpCodeBlock(code: string): string {
  const safeCode = escapeHtml(code);
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td align="center" style="background:${BRAND.redLight};border:1px solid ${BRAND.redBorder};border-radius:12px;padding:24px 16px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;color:${BRAND.textMuted};text-transform:uppercase;">Verification Code</p>
          <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:10px;color:${BRAND.red};font-family:'SF Mono','Consolas','Courier New',monospace;">${safeCode}</p>
        </td>
      </tr>
    </table>`;
}

function primaryButton(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 28px;">
      <tr>
        <td align="center" style="border-radius:10px;background:${BRAND.red};box-shadow:0 4px 14px rgba(232,50,26,0.35);">
          <a href="${safeHref}" target="_blank" style="display:inline-block;padding:15px 36px;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:600;letter-spacing:0.02em;">${safeLabel}</a>
        </td>
      </tr>
    </table>`;
}

function infoBox(content: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;">
      <tr>
        <td style="background:#FAFAFA;border-left:3px solid ${BRAND.red};border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;color:${BRAND.textMuted};line-height:1.65;">
          ${content}
        </td>
      </tr>
    </table>`;
}

export function buildOtpEmail(code: string) {
  const html = emailShell({
    preheader: `您的验证码为 ${code}，5 分钟内有效`,
    title: "企业邮箱验证码",
    subtitle: "用于验证 GEO 深度报告申请",
    bodyHtml: `
      <p style="margin:0 0 12px;color:${BRAND.text};">您好，</p>
      <p style="margin:0 0 4px;color:${BRAND.textMuted};">
        您正在申请 <strong style="color:${BRAND.text};">MarketUP GEO 深度整改报告</strong>。
        请使用以下验证码完成企业邮箱验证：
      </p>
      ${otpCodeBlock(code)}
      ${infoBox("验证码 <strong style=\"color:" + BRAND.text + ";\">5 分钟</strong> 内有效，请勿泄露给他人。如非本人操作，请忽略此邮件。")}
    `,
    footerNote: "此验证码仅用于 GEO 深度报告邮箱验证，一次性使用。",
  });

  const text = [
    "MarketUP · GEO 深度审计",
    "",
    "您好，",
    "",
    "您正在申请 MarketUP GEO 深度整改报告。",
    "您的企业邮箱验证码为：",
    "",
    code,
    "",
    "验证码 5 分钟内有效，请勿泄露给他人。",
    "如非本人操作，请忽略此邮件。",
    "",
    "—— MarketUP 系统自动发送",
  ].join("\n");

  return {
    subject: `【MarketUP】GEO 深度报告验证码：${code}`,
    html,
    text,
  };
}

export function buildReportLinkEmail(companyName: string, reportUrl: string) {
  const safeCompany = escapeHtml(companyName);
  const safeUrl = escapeHtml(reportUrl);

  const html = emailShell({
    preheader: `${companyName} 的 GEO 深度整改报告已核准完成，点击查看`,
    title: "您的专属报告已就绪",
    subtitle: "GEO 深度整改与 AI 爬虫诱饵代码白皮书",
    bodyHtml: `
      <p style="margin:0 0 12px;color:${BRAND.text};">您好，</p>
      <p style="margin:0 0 20px;color:${BRAND.textMuted};">
        <strong style="color:${BRAND.text};">${safeCompany}</strong> 的 GEO 深度整改报告已由 MarketUP 专家核准完成。
        报告包含关键词诊断、整改建议及 JSON-LD 结构化代码，请点击下方按钮查看：
      </p>
      ${primaryButton("查看我的专属报告", reportUrl)}
      <p style="margin:0 0 8px;font-size:13px;color:${BRAND.textHint};">若按钮无法点击，请复制以下链接至浏览器打开：</p>
      <p style="margin:0 0 20px;padding:12px 14px;background:#FAFAFA;border:1px solid ${BRAND.border};border-radius:8px;word-break:break-all;font-size:12px;color:${BRAND.red};line-height:1.6;">${safeUrl}</p>
      ${infoBox("此链接为您专属，请勿转发。报告内容基于 AI 诊断生成，仅供内部参考与优化使用。")}
    `,
    footerNote: "报告链接与您的企业邮箱绑定，有效期以系统策略为准。",
  });

  const text = [
    "MarketUP · GEO 深度整改报告",
    "",
    "您好，",
    "",
    `${companyName} 的 GEO 深度整改报告已核准完成。`,
    "",
    "查看报告：",
    reportUrl,
    "",
    "此链接为您专属，请勿转发。",
    "",
    "—— MarketUP 系统自动发送",
  ].join("\n");

  return {
    subject: `【MarketUP】${companyName} · GEO 深度整改报告已就绪`,
    html,
    text,
  };
}
