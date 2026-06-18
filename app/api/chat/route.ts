import { NextRequest } from "next/server";
import {
  DEEPSEEK_CHAT_URL,
  getDeepSeekApiKey,
  getDeepSeekModel,
} from "@/lib/deepseek";

export const maxDuration = 60;

const CHAT_SYSTEM = `你是一位世界级的 GEO（Generative Engine Optimization，生成式引擎优化）专家，专精于 DeepSeek、Kimi、智谱 GLM 等 LLM RAG 系统的品牌可见度优化。

你将收到一份完整的企业 GEO 诊断报告作为上下文。请基于该报告：
- 解答用户对 GEO 得分、竞品对比、geoMetrics 指标的疑问
- 提供针对结构化重构、数字指标增强、实体语义解耦的具体落地建议
- 给出可操作的 RAG 友好内容优化方案
- 回答简洁专业，使用中文，必要时用条目列表

不要编造报告中不存在的数据；若用户问题超出报告范围，基于 GEO 最佳实践给出合理建议并说明假设。`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, companyName, industry, report } = body as {
      messages: ChatMessage[];
      companyName: string;
      industry: string;
      report: Record<string, unknown>;
    };

    if (!messages?.length || !companyName?.trim() || !industry?.trim()) {
      return new Response(JSON.stringify({ error: "缺少必要参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = getDeepSeekApiKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY 未配置" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contextBlock = `
【GEO 诊断上下文】
公司：${companyName}
行业：${industry}
完整诊断报告 JSON：
${JSON.stringify(report, null, 2)}
`;

    const upstream = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getDeepSeekModel(),
        messages: [
          { role: "system", content: CHAT_SYSTEM + contextBlock },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("Chat API error:", errText);
      return new Response(JSON.stringify({ error: "对话服务暂时不可用" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!upstream.body) {
      return new Response(JSON.stringify({ error: "流式响应不可用" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return new Response(JSON.stringify({ error: "对话过程中发生错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
