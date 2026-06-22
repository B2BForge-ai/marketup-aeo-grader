const BASE = process.env.BASE_URL || "https://marketup-aeo-grader.vercel.app";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "dev-admin-123456";

const results = [];

function record(name, ok, detail, status) {
  results.push({ name, ok, detail, status });
  console.log(`${ok ? "✅" : "❌"} ${name}${status ? ` [${status}]` : ""}`);
  if (detail) console.log(`   ${detail}`);
}

async function jsonFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = { _text: await res.text?.() };
  }
  return { res, data };
}

async function main() {
  console.log(`\n🔍 功能可用性检测 — ${BASE}\n`);

  // 1. Health
  try {
    const { res, data } = await jsonFetch("/api/health");
    record(
      "健康检查 /api/health",
      res.ok,
      `DeepSeek=${data.deepseekKeyConfigured}, DB=${data.databaseConnected}${data.databaseError ? ` (${data.databaseError})` : ""}`,
      res.status
    );
  } catch (e) {
    record("健康检查 /api/health", false, e.message);
  }

  // 2. Homepage
  try {
    const res = await fetch(`${BASE}/`);
    record("首页 /", res.ok, `页面大小 ${(await res.text()).length} bytes`, res.status);
  } catch (e) {
    record("首页 /", false, e.message);
  }

  // 3. Admin page
  try {
    const res = await fetch(`${BASE}/admin/reports`);
    record("管理端页面 /admin/reports", res.ok, "需 token 参数才能加载数据", res.status);
  } catch (e) {
    record("管理端页面 /admin/reports", false, e.message);
  }

  // 4. Admin API unauthorized
  try {
    const { res } = await jsonFetch("/api/admin/reports");
    record("管理端 API 鉴权", res.status === 401, "无 token 应返回 401", res.status);
  } catch (e) {
    record("管理端 API 鉴权", false, e.message);
  }

  // 5. Admin API with token
  try {
    const { res, data } = await jsonFetch(`/api/admin/reports?token=${encodeURIComponent(ADMIN_TOKEN)}`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const ok = res.ok || res.status === 401;
    record(
      "管理端 API 列表",
      res.ok,
      res.ok
        ? `待审核 ${data.reports?.length ?? 0} 条`
        : res.status === 401
          ? "ADMIN_SECRET_TOKEN 与 dev-admin-123456 不一致（Vercel 可能用了其他 token）"
          : data.error || "未知错误",
      res.status
    );
  } catch (e) {
    record("管理端 API 列表", false, e.message);
  }

  // 6. Email OTP mock
  try {
    const { res, data } = await jsonFetch("/api/auth/email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@marketup.cn" }),
    });
    record(
      "邮箱 OTP 发送",
      res.ok,
      data.mock ? "模拟模式（无 RESEND_API_KEY）" : data.message || data.error,
      res.status
    );
  } catch (e) {
    record("邮箱 OTP 发送", false, e.message);
  }

  // 7. Grade API (slow)
  let auditId = null;
  try {
    const { res, data } = await jsonFetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "MarketUP",
        industry: "B2B营销自动化SaaS",
        websiteUrl: "www.marketup.cn",
        phone: "13770626459",
      }),
    });
    auditId = data.id ?? null;
    record(
      "初筛诊断 /api/grade",
      res.ok && typeof data.score === "number",
      res.ok
        ? `得分 ${data.score}，记录 id=${auditId}`
        : data.error || "失败",
      res.status
    );
  } catch (e) {
    record("初筛诊断 /api/grade", false, e.message);
  }

  // 8. Deep report trigger
  if (auditId) {
    try {
      const { res, data } = await jsonFetch("/api/report/deep-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: auditId,
          email: "test@marketup.cn",
          otpCode: "123456",
          industry: "B2B营销自动化SaaS",
          gradeSnapshot: { score: 50 },
        }),
      });
      record(
        "深度报告触发 /api/report/deep-generate",
        res.ok,
        data.message || data.error || JSON.stringify(data).slice(0, 120),
        res.status
      );
    } catch (e) {
      record("深度报告触发 /api/report/deep-generate", false, e.message);
    }
  } else {
    record(
      "深度报告触发 /api/report/deep-generate",
      false,
      "跳过：初筛未产生 audit id（依赖数据库）"
    );
  }

  // 9. Report view
  try {
    const res = await fetch(`${BASE}/report/invalid-token-test`);
    record(
      "报告专属链接 /report/[token]",
      res.status === 404,
      res.status === 404 ? "无效 token 正确返回 404（需核准后才有真实链接）" : `意外状态 ${res.status}`,
      res.status
    );
  } catch (e) {
    record("报告专属链接 /report/[token]", false, e.message);
  }

  // 10. Chat API
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "MarketUP",
        industry: "B2B SaaS",
        report: { score: 65, gaps: ["测试"] },
        messages: [{ role: "user", content: "一句话说明 GEO" }],
      }),
    });
    record(
      "GEO 对话 /api/chat",
      res.ok,
      res.ok ? "流式接口可调用" : `失败: ${(await res.text()).slice(0, 80)}`,
      res.status
    );
  } catch (e) {
    record("GEO 对话 /api/chat", false, e.message);
  }

  console.log("\n--- 不可用 / 受限功能清单 ---\n");
  const broken = results.filter((r) => !r.ok);
  if (broken.length === 0) {
    console.log("（无）全部检测项通过");
  } else {
    broken.forEach((r) => console.log(`• ${r.name}: ${r.detail}`));
  }

  console.log("\n--- 环境依赖说明 ---\n");
  console.log("• RESEND 未配置时：OTP/报告邮件为模拟模式，验证码固定 123456");
  console.log("• DATABASE_URL 未连通时：初筛、深度报告、管理端列表均不可用");
  console.log("• ADMIN_SECRET_TOKEN 需与访问 /admin/reports?token= 一致");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
