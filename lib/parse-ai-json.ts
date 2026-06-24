/** 解析 DeepSeek 等 AI 返回的 JSON（兼容 markdown 代码块包裹） */
export function parseAiJson<T = unknown>(raw: string): T {
  let text = raw.trim();

  const fenceMatch = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    throw new Error(`AI JSON 解析失败: ${text.slice(0, 120)}`);
  }
}
