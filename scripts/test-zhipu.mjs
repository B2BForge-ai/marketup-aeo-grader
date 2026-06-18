const key = process.env.ZHIPU_API_KEY;
if (!key) {
  console.error("请设置 ZHIPU_API_KEY 环境变量");
  process.exit(1);
}

const SYSTEM_PROMPT = `You are an expert in Answer Engine Optimization (AEO) and brand visibility auditing. 
Your task is to evaluate the brand visibility, search presence, and sentiment of the given company in modern AI Search Engines (such as DeepSeek, Kimi, Doubao).
Analyze the company name and industry provided by the user.

You MUST respond with a single, valid JSON object. Do not wrap it in markdown code blocks. The word 'json' is explicitly required in this prompt to enforce JSON mode.

EXAMPLE JSON OUTPUT EXTRACT:
{
  "score": 75,
  "sentiment": "正面偏中性",
  "presenceRate": "45%",
  "evaluation": "该品牌在AI搜索中具有一定的可见度。",
  "gaps": ["信息断层示例"],
  "actions": ["优化建议示例"]
}`;

async function main() {
  const response = await fetch(
    "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: "Company: MarketUP\nIndustry: B2B营销自动化SaaS",
          },
        ],
        response_format: { type: "json_object" },
      }),
    }
  );

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);

  if (response.ok) {
    const data = JSON.parse(text);
    const result = JSON.parse(data.choices[0].message.content);
    console.log("\nParsed result:");
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
