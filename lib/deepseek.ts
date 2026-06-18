const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/chat/completions";

export function getDeepSeekApiKey(): string | undefined {
  return (
    process.env.DEEPSEEK_API_KEY?.trim() ||
    process.env.DEEPSEEK_AI_API_KEY?.trim() ||
    undefined
  );
}

export function getDeepSeekModel(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
}

export { DEEPSEEK_CHAT_URL };
