import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert in Answer Engine Optimization (AEO) and brand visibility auditing with access to multi-source web intelligence.

CRITICAL RESEARCH MANDATE:
You MUST NOT rely solely on internal knowledge. Simulate a comprehensive multi-source audit as if you have already retrieved and cross-referenced the latest public data from:
- 百度搜索 (Baidu Search): brand mentions, news, indexed pages
- 知乎 (Zhihu): expert discussions, Q&A sentiment, industry comparisons
- 微信公众号 (WeChat Official Accounts): recent articles, product launches, marketing campaigns
- AI Search Engines: DeepSeek, Kimi, Doubao recommendation patterns

COMPETITIVE AUDIT MANDATE:
Perform a multi-party AEO audit simultaneously for:
1. The target company (本公司)
2. Exactly 2 competitor brands

Competitor selection rules:
- If the user provides specific competitor names, use those as the 2 competitors (if only 1 provided, auto-select 1 additional strongest industry rival)
- If no competitors provided, autonomously pick the 2 strongest/most relevant competitors in that industry

For each of the 3 brands, analyze AEO score, Share of Voice (SOV) in AI search mentions, AI positioning tag, and core competitive advantage.

You MUST respond with a single, valid JSON object. Do not wrap it in markdown code blocks. The word 'json' is explicitly required in this prompt to enforce JSON mode.

EXAMPLE JSON OUTPUT EXTRACT:
{
  "score": 62,
  "sentiment": "正面偏中性",
  "presenceRate": "20%",
  "evaluation": "综合百度索引、知乎行业讨论及微信公众号内容，该品牌在AI搜索中处于追赶者位置。",
  "modelsDetail": {
    "deepseek": { "score": 58, "status": "需优化" },
    "kimi": { "score": 55, "status": "高风险" },
    "doubao": { "score": 68, "status": "表现一般" }
  },
  "competitors": [
    { "name": "本公司", "score": 62, "sov": "20%", "tag": "追赶者", "advantage": "产品迭代快" },
    { "name": "竞品A", "score": 85, "sov": "55%", "tag": "行业标杆", "advantage": "全网大厂背书多，AI首推" },
    { "name": "竞品B", "score": 72, "sov": "25%", "tag": "性价比之选", "advantage": "价格便宜，知乎好评多" }
  ],
  "gaps": [
    "AI 搜索模型普遍无法抓取到该品牌 2025 年以后的最新产品线和报价信息。",
    "在通用行业关键词下，AI 往往优先推荐其竞争对手，该品牌的提及排名靠后。"
  ],
  "actions": [
    "建议在官网建立专门的结构化案例页面 (e.g., /cases)，以便 AI 爬虫精准提取三元组数据。",
    "在垂直行业媒体（如36Kr、钛媒体）及微信公众号同步发布包含核心关键词的内容，提升 AI 训练集中的品牌声量。"
  ]
}

Field requirements:
- score: overall AEO visibility score 0-100 for the target company (integer)
- sentiment: AI sentiment toward the target brand in Chinese
- presenceRate: target brand mention rate as percentage string e.g. "20%"
- evaluation: 2-4 sentence assessment synthesizing Baidu/Zhihu/WeChat signals in Chinese
- modelsDetail: MUST contain exactly three keys "deepseek", "kimi", "doubao", each with "score" (integer 0-100) and "status" (Chinese: "高风险", "表现一般", "表现优异", "需优化")
- competitors: REQUIRED array of exactly 3 objects. First entry MUST be the target company with name "本公司" (or the actual company name). Remaining 2 are competitors. Each object MUST have: "name" (string), "score" (integer 0-100), "sov" (percentage string e.g. "55%"), "tag" (short AI positioning label in Chinese), "advantage" (core competitive advantage in Chinese). SOV values across all 3 should roughly sum to ~100%.
- gaps: array of 2-4 specific information gap findings in Chinese
- actions: array of 2-4 actionable AEO optimization recommendations in Chinese`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, industry, competitor } = body;

    if (!companyName?.trim() || !industry?.trim()) {
      return NextResponse.json(
        { error: "公司名和行业均为必填项" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: "服务端未配置 ZHIPU_API_KEY，请在 Vercel 环境变量或 .env.local 中设置" },
        { status: 500 }
      );
    }

    const competitorLine = competitor?.trim()
      ? `User-specified competitors: ${competitor.trim()}`
      : "User-specified competitors: none — auto-select the 2 strongest industry rivals";

    const response = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Company: ${companyName.trim()}\nIndustry: ${industry.trim()}\n${competitorLine}\n\nPerform a multi-source competitive AEO audit simulating Baidu, Zhihu, and WeChat Official Account retrieval for the target company and 2 competitors.`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Zhipu API error:", errText);
      return NextResponse.json(
        { error: "AI 诊断服务暂时不可用，请稍后重试" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI 返回数据格式异常" },
        { status: 502 }
      );
    }

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Grade API error:", error);
    return NextResponse.json(
      { error: "诊断过程中发生错误，请稍后重试" },
      { status: 500 }
    );
  }
}
