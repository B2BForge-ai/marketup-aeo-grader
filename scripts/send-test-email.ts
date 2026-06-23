/**
 * 本地测试 Mailgun UTF-8 与邮件模板：MAILGUN_API_KEY=xxx npx tsx scripts/send-test-email.ts
 */
import { buildOtpEmail, buildReportLinkEmail } from "../lib/email-templates";

const apiKey = process.env.MAILGUN_API_KEY?.trim();
const to = process.env.TEST_EMAIL_TO?.trim() || "milo@bagevent.cn";
const domain = process.env.MAILGUN_DOMAIN?.trim() || "email.b2bforge.ai";
const from =
  process.env.MAILGUN_FROM_EMAIL?.trim() ||
  "MarketUP GEO <noreply@email.b2bforge.ai>";

if (!apiKey) {
  console.error("请设置 MAILGUN_API_KEY 环境变量");
  process.exit(1);
}

async function send(template: { subject: string; html: string; text: string }) {
  const form = new FormData();
  form.append("from", from);
  form.append("to", to);
  form.append("subject", template.subject);
  form.append("html", template.html);
  form.append("text", template.text);
  form.append("h:Content-Type", "text/html; charset=utf-8");

  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form,
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${body}`);
  console.log("OK:", body);
}

async function main() {
  console.log("发送 OTP 测试邮件 →", to);
  await send(buildOtpEmail("123456"));

  console.log("发送报告链接测试邮件 →", to);
  await send(
    buildReportLinkEmail(
      "测试科技有限公司",
      "https://marketup-aeo-grader.vercel.app/report/demo-token"
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
