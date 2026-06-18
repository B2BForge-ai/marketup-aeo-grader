const ZHIPU_CHAT_URL =
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";

export function getZhipuApiKey(): string | undefined {
  return (
    process.env.ZHIPU_AI_API_KEY?.trim() ||
    process.env.ZHIPU_API_KEY?.trim() ||
    undefined
  );
}

export function getZhipuModel(): string {
  return process.env.ZHIPU_MODEL?.trim() || "glm-4-flash";
}

export { ZHIPU_CHAT_URL };
