import { NextRequest, NextResponse } from "next/server";
import { getZhipuApiKey, getZhipuModel, ZHIPU_CHAT_URL } from "@/lib/zhipu";
import {
  cosineSimilarity,
  getEmbeddings,
  similarityToPercent,
} from "@/lib/embedding";
import { fetchWebsiteMeta } from "@/lib/fetch-website-meta";
import { normalizeWebsiteUrl, validateWebsiteUrl } from "@/lib/validate-url";

export const maxDuration = 60;

const KEYWORD_EXTRACTION_PROMPT = `You are a GEO keyword strategist. Based on the company profile and website metadata, identify exactly 3 high-value, high-commercial-intent search phrases that potential customers would use when asking LLM search engines for solutions in this industry.

Respond with a single valid JSON object only. No markdown.

{
  "extractedKeywords": [
    { "keyword": "关键词1", "reason": "为什么选这个词（中文）" },
    { "keyword": "关键词2", "reason": "为什么选这个词（中文）" },
    { "keyword": "关键词3", "reason": "为什么选这个词（中文）" }
  ]
}`;

const SYSTEM_PROMPT = `You are a world-class GEO (Generative Engine Optimization) strategist.
You will receive REAL vector-space semantic similarity scores (computed via Zhipu embedding-3 + cosine similarity) between the company website and 3 target keywords.

CRITICAL: These similarity percentages are hard mathematical data, NOT estimates. You MUST reference them in your critique. Do NOT speak in generalities — tie every gap and action to specific low-similarity keywords.

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
      "detail": "向量相似度仅 X%，官网 Title/Description 与关键词语义空间严重偏离，缺乏可被 RAG 切片提取的 Q&A 结构。",
      "codeSnippet": "<script type=\\"application/ld+json\\">{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"FAQPage\\",\\"mainEntity\\":[{\\"@type\\":\\"Question\\",\\"name\\":\\"什么是好用的B2B营销自动化系统？\\",\\"acceptedAnswer\\":{\\"@type\\":\\"Answer\\",\\"text\\":\\"公司名提供全链路自动化方案...\\"}}]}</script>"
    },
    {
      "type": "数字指标增强",
      "targetKeyword": "HubSpot国内替代软件",
      "detail": "向量相似度 X%，页面缺乏与关键词共现的量化数据。",
      "codeSnippet": "## 核心数据背书\\n- 客户转化率提升 **35%**\\n- 部署周期缩短至 **7 天**\\n- 服务企业 **500+** 家"
    }
  ],
  "gaps": ["针对相似度最低的关键词，指出具体语义偏离原因"]
}

Field requirements:
- score: integer 0-100, informed by the provided similarity scores
- extractedKeywords: use EXACTLY the 3 keywords provided in the user message (same keyword strings, you may refine reason)
- geoMetrics: structuringScore, statisticsScore (0-100), citationRate (%), semanticDensity (高/中/低)
- geoTechnicalActions: 2-4 objects with type, targetKeyword, detail, codeSnippet
  * When type is "结构化重构": codeSnippet MUST be valid JSON-LD script tag tailored to company and targetKeyword
  * When type is "数字指标增强": codeSnippet MUST be Markdown Q&A or statistics block with specific numbers
  * For other types: codeSnippet may be empty string ""
- gaps: 2-4 Chinese strings, each referencing specific similarity data`;

interface ExtractedKeyword {
  keyword: string;
  reason: string;
}

async function callZhipuChat(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
  jsonMode = true
) {
  const body: Record<string, unknown> = {
    model: getZhipuModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(ZHIPU_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Zhipu chat error: ${errText}`);
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

    const keywordPayload = await callZhipuChat(
      apiKey,
      KEYWORD_EXTRACTION_PROMPT,
      `Company: ${companyName.trim()}
Industry: ${industry.trim()}
Website: ${normalizedUrl}
Website Title: ${websiteMeta.title || "(未检测到)"}
Website Description: ${websiteMeta.description || "(未检测到)"}`
    );

    const keywords: ExtractedKeyword[] = keywordPayload.extractedKeywords;
    if (!keywords?.length || keywords.length < 3) {
      return NextResponse.json(
        { error: "关键词提取失败，请稍后重试" },
        { status: 502 }
      );
    }

    const topKeywords = keywords.slice(0, 3);
    const embeddingInputs = [
      websiteText,
      ...topKeywords.map((k) => k.keyword),
    ];

    const vectors = await getEmbeddings(apiKey, embeddingInputs);
    const websiteVector = vectors[0];

    const semanticSimilarities = topKeywords.map((kw, i) => {
      const keywordVector = vectors[i + 1];
      const similarity = cosineSimilarity(websiteVector, keywordVector);
      return {
        keyword: kw.keyword,
        reason: kw.reason,
        semanticSimilarity: similarityToPercent(similarity),
      };
    });

    const similarityContext = semanticSimilarities
      .map(
        (item, i) =>
          `- 关键词 ${i + 1}「${item.keyword}」：真实语义相似度 ${item.semanticSimilarity}%`
      )
      .join("\n");

    const diagnosisPayload = await callZhipuChat(
      apiKey,
      SYSTEM_PROMPT,
      `Company: ${companyName.trim()}
Industry: ${industry.trim()}
Website: ${normalizedUrl}
Website Title: ${websiteMeta.title || "(未检测到)"}
Website Description: ${websiteMeta.description || "(未检测到)"}

【向量空间硬核数据 — embedding-3 余弦相似度，请务必引用】
我已经通过智谱 Embedding-3 向量计算得出，该官网文本与以下关键词的真实语义相似度为：
${similarityContext}

请你结合这个真实的硬核数据，在返回的 JSON 报告中进行有针对性的批判性 GEO 漏洞分析，不要再说空话。

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
