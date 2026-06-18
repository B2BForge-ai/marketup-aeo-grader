/** 测试 Next.js /api/grade 路由（需先 npm run dev） */
const body = JSON.stringify({
  companyName: "MarketUP",
  industry: "B2B营销自动化SaaS",
});

async function main() {
  const res = await fetch("http://localhost:3000/api/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error("请先运行 npm run dev:", e.message);
  process.exit(1);
});
