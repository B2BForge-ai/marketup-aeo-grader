import { NextRequest, NextResponse } from "next/server";
import {
  DEEPSEEK_CHAT_URL,
  getDeepSeekApiKey,
  getDeepSeekModel,
} from "@/lib/deepseek";
import { fetchWebsiteMeta } from "@/lib/fetch-website-meta";
import { computeSemanticSimilarityPercent } from "@/lib/text-similarity";
import { normalizeWebsiteUrl, validateWebsiteUrl } from "@/lib/validate-url";

export const maxDuration = 60;

const KEYWORD_EXTRACTION_PROMPT = `You are a GEO keyword strategist. Based on the company profile and website metadata, identify exactly 3 high-value, high-commercial-intent search phrases that potential customers would use when asking LLM search engines for solutions in this industry.

IMPORTANT — TF-IDF compatibility rule:
Our backend uses local TF-IDF (literal keyword matching) for similarity scoring. It CANNOT recognize synonyms or paraphrases.
Therefore, when generating the 3 keywords, you MUST:
- Read the provided "官网真实文案" (Website Title + Description) carefully.
- In at least 1–2 of the 3 keywords, embed 1–2 core technical terms that the company ALREADY uses in their website copy (e.g. if they wrote "销管", your keyword must contain "销管"; if they wrote "营销自动化", include that exact phrase).
- This ensures TF-IDF has literal token overlap and avoids false 0% scores caused by synonym mismatch, NOT because the business is irrelevant.

The 3 keywords should still be high commercial-intent search phrases — not just raw copy-paste of the title. Blend industry intent with the company's actual wording.

Respond with a single valid JSON object only. No markdown.

{
  "extractedKeywords": [
    { "keyword": "关键词1", "reason": "为什么选这个词（中文），注明引用了官网哪些原词" },
    { "keyword": "关键词2", "reason": "为什么选这个词（中文）" },
    { "keyword": "关键词3", "reason": "为什么选这个词（中文）" }
  ]
}`;

const SYSTEM_PROMPT = `You are a world-class GEO (Generative Engine Optimization) strategist.
You will receive TF-IDF text vector cosine similarity scores between the company website copy and 3 target keywords.

IMPORTANT — How to interpret TF-IDF scores:
- TF-IDF measures LITERAL token overlap only. It cannot detect synonyms or semantic equivalence.
- These scores are REFERENCE data, not the final truth. Use them as one signal among many.
- When a score is very low (0%–20%), DO NOT blindly conclude the business is irrelevant. Apply your language understanding to diagnose:
  (A) "文案用词不合大模型胃口" — the business IS relevant but website copy uses different wording, jargon, or marketing fluff that fails literal matching; recommend GEO copy/structured-data fixes.
  (B) "业务真的不相关" — the keyword genuinely does not match what this company offers; say so explicitly with evidence from the website copy.
- When scores are moderate/high, cite them as supporting evidence for alignment or misalignment.
- Always give a nuanced, critical GEO audit — never let a low TF-IDF score alone drive a harsh or false-negative verdict.

Perform a rigorous GEO audit against the 3 provided keywords.

You MUST respond with a single, valid JSON object. Do not wrap it in markdown code blocks.

Response Structure Example:
{
  "score": 65,
  "extractedKeywords": [
    { "keyword": "好用的B2B营销自动化系统", "reason": "为什么选这个词" },
    { "keyword": "HubSpot国内替代软件", "reason": "为什么选这个词" },
    { "keyword": "如何做外贸B2B获客", "reason": "为什么选这个词" }
  ],
  "geoMetrics": {
    "structuringScore": 58,
    "statisticsScore": 45,
    "citationRate": "18%",
    "semanticDensity": "低"
  },
  "geoTechnicalActions": [
    {
      "type": "结构化重构",
      "targetKeyword": "好用的B2B营销自动化系统",
      "detail": "TF-IDF 字面相似度仅 X%，但结合官网文案判断属于「用词不合大模型胃口」/「业务不相关」——（具体说明）。建议部署下方 JSON-LD 以增强 RAG 可提取性。",
      "codeSnippet": "<script type=\\"application/ld+json\\">{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"FAQPage\\",\\"mainEntity\\":[{\\"@type\\":\\"Question\\",\\"name\\":\\"什么是好用的B2B营销自动化系统？\\",\\"acceptedAnswer\\":{\\"@type\\":\\"Answer\\",\\"text\\":\\"公司名提供全链路自动化方案...\\"}}]}</script>"
    },
    {
      "type": "数字指标增强",
      "targetKeyword": "HubSpot国内替代软件",
      "detail": "TF-IDF 得分 X%，（语义解读：文案偏离 vs 业务不相关）。建议嵌入量化数据增强 AI 引用概率。",
      "codeSnippet": "## 核心数据背书\\n- 客户转化率提升 **35%**\\n- 部署周期缩短至 **7 天**\\n- 服务企业 **500+** 家"
    }
  ],
  "gaps": ["结合 TF-IDF 得分与语义理解，指出具体偏离原因：是文案问题还是业务错位"]
}

Field requirements:
- score: integer 0-100, informed by TF-IDF scores AND your semantic judgment of the website copy
- extractedKeywords: use EXACTLY the 3 keywords provided in the user message (same keyword strings, you may refine reason)
- geoMetrics: structuringScore, statisticsScore (0-100), citationRate (%), semanticDensity (高/中/低)
- geoTechnicalActions: 2-4 objects with type, targetKeyword, detail, codeSnippet
  * When type is "结构化重构": codeSnippet MUST be valid JSON-LD script tag tailored to company and targetKeyword
  * When type is "数字指标增强": codeSnippet MUST be Markdown Q&A or statistics block with specific numbers
  * For other types: codeSnippet may be empty string ""
- gaps: 2-4 Chinese strings; for low-TF-IDF keywords, distinguish "文案用词问题" vs "业务不相关"`;

interface ExtractedKeyword {
  keyword: string;
  reason: string;
}

async function callDeepSeekChat(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
  jsonMode = true
) {
  const body: Record<string, unknown> = {
    model: getDeepSeekModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(DEEPSEEK_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek chat error: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned empty content");
  }

  return JSON.parse(content);
}

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

    const urlCheck = await validateWebsiteUrl(websiteUrl);
    if (!urlCheck.ok) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const apiKey = getDeepSeekApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "服务端未配置 DEEPSEEK_API_KEY，请在 Vercel 环境变量或 .env.local 中设置",
        },
        { status: 500 }
      );
    }

    const normalizedUrl = normalizeWebsiteUrl(websiteUrl);

    let websiteMeta;
    try {
      websiteMeta = await fetchWebsiteMeta(normalizedUrl);
    } catch {
      return NextResponse.json(
        {
          error:
            "无法读取官网页面内容，请确保网站可公开访问且包含 Title 或 Description 元信息。",
        },
        { status: 400 }
      );
    }

    const websiteText =
      websiteMeta.text.trim() ||
      [companyName.trim(), industry.trim()].filter(Boolean).join(" · ");

    if (!websiteText) {
      return NextResponse.json(
        { error: "无法从官网提取可用于语义分析的文本内容" },
        { status: 400 }
      );
    }

    const keywordPayload = await callDeepSeekChat(
      apiKey,
      KEYWORD_EXTRACTION_PROMPT,
      `Company: ${companyName.trim()}
Industry: ${industry.trim()}
Website: ${normalizedUrl}
官网真实文案（Title + Description，请从中提取 1-2 个已在使用的核心技术词融入关键词）:
Title: ${websiteMeta.title || "(未检测到)"}
Description: ${websiteMeta.description || "(未检测到)"}
Merged Copy: ${websiteText}`
    );

    const keywords: ExtractedKeyword[] = keywordPayload.extractedKeywords;
    if (!keywords?.length || keywords.length < 3) {
      return NextResponse.json(
        { error: "关键词提取失败，请稍后重试" },
        { status: 502 }
      );
    }

    const topKeywords = keywords.slice(0, 3);

    const semanticSimilarities = topKeywords.map((kw) => ({
      keyword: kw.keyword,
      reason: kw.reason,
      semanticSimilarity: computeSemanticSimilarityPercent(
        websiteText,
        kw.keyword
      ),
    }));

    const similarityContext = semanticSimilarities
      .map(
        (item, i) =>
          `- 关键词 ${i + 1}「${item.keyword}」：真实语义相似度 ${item.semanticSimilarity}%`
      )
      .join("\n");

    const diagnosisPayload = await callDeepSeekChat(
      apiKey,
      SYSTEM_PROMPT,
      `Company: ${companyName.trim()}
Industry: ${industry.trim()}
Website: ${normalizedUrl}
Website Title: ${websiteMeta.title || "(未检测到)"}
Website Description: ${websiteMeta.description || "(未检测到)"}
官网真实文案: ${websiteText}

【TF-IDF 字面相似度参考数据（仅供参考，无法识别同义词）】
后端采用本地 TF-IDF 算法计算的字面匹配得分如下：
${similarityContext}

注意：TF-IDF 只能检测字面重合，不能识别同义词。若得分很低（0%-20%），请结合上方官网真实文案，用你的语义理解判断是「文案用词不合大模型胃口」还是「业务真的不相关」，不要盲目被低分误导。请在报告中给出有批判性、有区分度的 GEO 分析。

【必须使用以下 3 个关键词（keyword 字段不得修改）】
${topKeywords.map((k, i) => `${i + 1}. ${k.keyword}`).join("\n")}`
    );

    const result = {
      ...diagnosisPayload,
      extractedKeywords: semanticSimilarities,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Grade API error:", error);
    return NextResponse.json(
      { error: "诊断过程中发生错误，请稍后重试" },
      { status: 500 }
    );
  }
}
