import { NextRequest, NextResponse } from "next/server";
import { getZhipuApiKey, getZhipuModel, ZHIPU_CHAT_URL } from "@/lib/zhipu";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a world-class GEO (Generative Engine Optimization) strategist. 
Your task is a two-step automated audit based on the Company Name, Industry, and Company Website URL provided by the user.

Step 1: Based on the company profile and its website URL, identify exactly 3 high-value, high-commercial-intent search phrases (Keywords) that potential customers would use when asking LLM search engines (like Zhipu, Kimi, DeepSeek) for solutions in this industry.
Step 2: Perform a rigorous GEO audit specifically against these 3 generated keywords to see how well this company's brand intercepts them.

You MUST respond with a single, valid JSON object. Do not wrap it in markdown code blocks. The word 'json' is explicitly required.

Response Structure Example:
{
  "score": 65,
  "extractedKeywords": [
    { "keyword": "关键词1 (如：好用的B2B营销自动化系统)", "reason": "为什么选这个词：这是该行业转化率最高的通用意图词" },
    { "keyword": "关键词2 (如：HubSpot国内替代软件)", "reason": "为什么选这个词：精准拦截寻找替代方案的高客单价客户" },
    { "keyword": "关键词3 (如：如何做外贸B2B获客)", "reason": "为什么选这个词：针对上游知识库检索场景的内容拦截点" }
  ],
  "geoMetrics": {
    "structuringScore": 58,
    "statisticsScore": 45,
    "citationRate": "18%",
    "semanticDensity": "低"
  },
  "geoTechnicalActions": [
    { "type": "结构化重构", "targetKeyword": "关键词1的实际文本", "detail": "针对【关键词1】，大模型在检索时优先抓取带有清晰产品功能对比表的网页，而您的官网全是宣传口水话，导致无法被 AI 提取作为答案。建议增加结构化参数表格。" },
    { "type": "语义绑定", "targetKeyword": "关键词2的实际文本", "detail": "针对【关键词2】，您的品牌在全网语料中尚未与该竞品建立'替代关联'。建议在公网发布对比分析报告，让两者的实体名在同一段落高频共现。" }
  ],
  "gaps": ["大模型无法将该官网 URL 关联到核心业务痛点", "缺乏针对 AI 爬虫切片（Chunking）优化的落地页"]
}

Field requirements:
- score: integer 0-100, overall GEO score for keyword interception capability
- extractedKeywords: array of exactly 3 objects, each with "keyword" (realistic Chinese search phrase) and "reason" (why this keyword was selected, in Chinese)
- geoMetrics: structuringScore and statisticsScore integers 0-100; citationRate percentage string; semanticDensity one of "高", "中", "低"
- geoTechnicalActions: array of 2-4 objects, each with "type" (e.g. "结构化重构", "数字指标增强", "语义绑定", "实体语义解耦"), "targetKeyword" (must match one of the 3 extracted keywords exactly), and "detail" (actionable recommendation referencing the target keyword, in Chinese)
- gaps: array of 2-4 specific information gap findings in Chinese`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, industry, websiteUrl } = body;

    if (!companyName?.trim() || !industry?.trim() || !websiteUrl?.trim()) {
      return NextResponse.json(
        { error: "公司名、行业和官网 URL 均为必填项" },
        { status: 400 }
      );
    }

    const apiKey = getZhipuApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "服务端未配置 ZHIPU_AI_API_KEY，请在 Vercel 环境变量或 .env.local 中设置",
        },
        { status: 500 }
      );
    }

    const response = await fetch(ZHIPU_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getZhipuModel(),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Company: ${companyName.trim()}\nIndustry: ${industry.trim()}\nWebsite: ${websiteUrl.trim()}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Zhipu API error:", errText);
      return NextResponse.json(
        { error: "GEO 诊断服务暂时不可用，请稍后重试" },
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
