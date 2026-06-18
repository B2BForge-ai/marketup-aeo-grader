import { NextRequest } from "next/server";

export const maxDuration = 60;

const CHAT_SYSTEM = `你是一位资深的 AEO（Answer Engine Optimization）营销专家，专精于 DeepSeek、Kimi、豆包等 AI 搜索引擎的品牌可见度优化。

你将收到一份完整的企业 AEO 诊断报告作为上下文。请基于该报告：
- 解答用户对诊断结果的疑问
- 提供针对 DeepSeek / Kimi / 豆包 的差异化干预策略
- 给出可落地的内容优化、结构化数据和渠道投放建议
- 回答简洁专业，使用中文，必要时用条目列表

不要编造报告中不存在的数据；若用户问题超出报告范围，基于 AEO 最佳实践给出合理建议并说明假设。`;

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
      return new Response(
        JSON.stringify({ error: "缺少必要参数" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey?.trim()) {
      return new Response(
        JSON.stringify({ error: "API Key 未配置" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const contextBlock = `
【诊断上下文】
公司：${companyName}
行业：${industry}
完整诊断报告 JSON：
${JSON.stringify(report, null, 2)}
`;

    const upstream = await fetch(
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
            { role: "system", content: CHAT_SYSTEM + contextBlock },
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          stream: true,
          temperature: 0.7,
        }),
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("Chat API error:", errText);
      return new Response(
        JSON.stringify({ error: "对话服务暂时不可用" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!upstream.body) {
      return new Response(
        JSON.stringify({ error: "流式响应不可用" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
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
    return new Response(
      JSON.stringify({ error: "对话过程中发生错误" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
