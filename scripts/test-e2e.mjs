/** 端到端 API 测试 */
const BASE = "http://localhost:3000";

async function testGrade() {
  console.log("=== 测试 /api/grade ===\n");
  const res = await fetch(`${BASE}/api/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "MarketUP",
      industry: "B2B营销自动化SaaS",
      competitor: "HubSpot, Salesforce",
    }),
  });

  const data = await res.json();
  console.log("Status:", res.status);

  if (!res.ok) {
    console.error("失败:", data);
    return null;
  }

  console.log("整体得分:", data.score);
  console.log("情感:", data.sentiment);
  console.log("提及率:", data.presenceRate);
  console.log("\n竞品雷达 (competitors):");
  data.competitors?.forEach((c) => {
    console.log(`  - ${c.name}: score=${c.score}, sov=${c.sov}, tag=${c.tag}`);
    console.log(`    优势: ${c.advantage}`);
  });
  console.log("\nGaps:", data.gaps?.length, "条");
  console.log("Actions:", data.actions?.length, "条");

  return data;
}

async function testChat(report) {
  console.log("\n=== 测试 /api/chat (流式) ===\n");
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "MarketUP",
      industry: "B2B营销自动化SaaS",
      report,
      messages: [
        {
          role: "user",
          content: "为什么我们在 Kimi 上得分最低？一句话回答。",
        },
      ],
    }),
  });

  console.log("Status:", res.status);
  if (!res.ok) {
    console.error("失败:", await res.text());
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";

  process.stdout.write("AI 回复: ");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim().startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          reply += delta;
          process.stdout.write(delta);
        }
      } catch {
        /* skip */
      }
    }
  }
  console.log("\n\n流式回复长度:", reply.length, "字符");
}

async function main() {
  try {
    const report = await testGrade();
    if (report) await testChat(report);
    console.log("\n✅ 全部测试通过");
  } catch (e) {
    console.error("\n❌ 测试失败:", e.message);
    console.error("请确认 dev server 已运行: npm run dev");
    process.exit(1);
  }
}

main();
