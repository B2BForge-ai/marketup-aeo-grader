function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(params: {
  preheader: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const { preheader, title, bodyHtml, footerNote } = params;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'PingFang SC','Microsoft YaHei',Helvetica,Arial,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #ececec;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#E8321A;padding:20px 28px;">
              <p style="margin:0;color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.04em;">MarketUP · AI Search Grader</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:600;line-height:1.4;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#333333;font-size:15px;line-height:1.75;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <p style="margin:0;color:#999999;font-size:12px;line-height:1.6;">
                ${footerNote ? `${escapeHtml(footerNote)}<br />` : ""}
                本邮件由 <strong style="color:#666666;">MarketUP</strong> 通过
                <strong style="color:#666666;">email.b2bforge.ai</strong> 发送，请勿直接回复。
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;color:#aaaaaa;font-size:11px;">© MarketUP · B2BForge.ai</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildOtpEmail(code: string) {
  const safeCode = escapeHtml(code);
  const html = emailShell({
    preheader: `您的 GEO 深度审计验证码为 ${code}`,
    title: "企业邮箱验证码",
    bodyHtml: `
      <p style="margin:0 0 16px;">您好，</p>
      <p style="margin:0 0 20px;">您正在申请 MarketUP GEO 深度整改报告，请使用以下验证码完成企业邮箱验证：</p>
      <div style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;background:#FEF0EE;border:1px dashed #E8321A;border-radius:10px;padding:16px 28px;font-size:32px;font-weight:700;letter-spacing:8px;color:#E8321A;">${safeCode}</span>
      </div>
      <p style="margin:0 0 8px;color:#666666;font-size:14px;">验证码 <strong>5 分钟</strong> 内有效，请勿泄露给他人。</p>
      <p style="margin:0;color:#999999;font-size:13px;">如非本人操作，请忽略此邮件。</p>
    `,
    footerNote: "此为系统自动邮件，用于 GEO 深度报告邮箱验证。",
  });

  const text = [
    "MarketUP · GEO 深度审计",
    "",
    "您的企业邮箱验证码为：",
    code,
    "",
    "验证码 5 分钟内有效，请勿泄露给他人。",
    "如非本人操作，请忽略此邮件。",
  ].join("\n");

  return {
    subject: `【MarketUP】您的 GEO 深度审计验证码：${code}`,
    html,
    text,
  };
}

export function buildReportLinkEmail(companyName: string, reportUrl: string) {
  const safeCompany = escapeHtml(companyName);
  const safeUrl = escapeHtml(reportUrl);

  const html = emailShell({
    preheader: `${companyName} 的 GEO 深度整改报告已核准完成`,
    title: "您的 GEO 深度整改报告已就绪",
    bodyHtml: `
      <p style="margin:0 0 16px;">您好，</p>
      <p style="margin:0 0 20px;">
        <strong>${safeCompany}</strong> 的《GEO 深度整改与 AI 爬虫诱饵代码白皮书》已由 MarketUP 专家核准完成。
        请点击下方按钮查看完整报告（链接为您专属，请勿转发）。
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
        <tr>
          <td style="border-radius:8px;background:#E8321A;">
            <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">查看我的专属报告 →</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;color:#666666;font-size:14px;">若按钮无法点击，请复制以下链接至浏览器打开：</p>
      <p style="margin:0;word-break:break-all;font-size:13px;color:#E8321A;">${safeUrl}</p>
    `,
    footerNote: "报告链接仅对您的企业邮箱开放，有效期以系统策略为准。",
  });

  const text = [
    "MarketUP · GEO 深度整改报告",
    "",
    `${companyName} 的 GEO 深度整改报告已就绪。`,
    "",
    "查看报告：",
    reportUrl,
    "",
    "链接为您专属，请勿转发。",
  ].join("\n");

  return {
    subject: `【MarketUP】${companyName} · GEO 深度整改报告（专属链接）`,
    html,
    text,
  };
}
