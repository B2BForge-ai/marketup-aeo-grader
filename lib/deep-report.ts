import {
  DEEPSEEK_CHAT_URL,
  getDeepSeekApiKey,
  getDeepSeekModel,
} from "@/lib/deepseek";
import { generateDeepGeoReportPrompt } from "@/lib/deepseek-prompts";

export interface DeepReportInput {
  companyName: string;
  industry: string;
  websiteUrl: string;
  score: number;
  gradeSnapshot: Record<string, unknown>;
}

function stripMarkdownFence(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

export async function generateDeepReportMarkdown(
  input: DeepReportInput
): Promise<string> {
  const apiKey = getDeepSeekApiKey();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const { system, user } = generateDeepGeoReportPrompt({
    companyName: input.companyName,
    industry: input.industry,
    url: input.websiteUrl,
    score: input.score,
    gradeSnapshot: input.gradeSnapshot,
  });

  const response = await fetch(DEEPSEEK_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getDeepSeekModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek deep report error: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek returned empty deep report");
  }

  return stripMarkdownFence(content);
}
