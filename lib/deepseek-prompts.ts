export interface DeepGeoReportPromptInput {
  companyName: string;
  industry: string;
  url: string;
  score: number;
  gradeSnapshot?: Record<string, unknown>;
}

export interface DeepGeoReportPrompt {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = `你是 MarketUP 首席 GEO 架构师，负责为 B2B 企业撰写《GEO 深度整改与 AI 爬虫诱饵代码白皮书》。

【输出格式 — 强制遵守】
- 仅输出标准 Markdown 正文，禁止使用 \`\`\`markdown 代码围栏包裹全文。
- 总字数不少于 4500 中文字符，内容必须硬核、可执行，可直接 Ctrl+C 上线。
- 严禁使用模糊营销空话，例如："加强建设"、"持续优化"、"不断提升"、"加大投入"、"完善体系" 等。每条建议必须绑定具体页面位置、关键词、代码或可粘贴文案。

【必须包含以下 4 大模块，使用二级标题 ## 开头】

## 一、AI 检索可见性断层审计
- 基于该网址在智谱 / Kimi / DeepSeek 等 AI 神经网络中的潜在收录逻辑，客观揭示信息断层严重的技术原因。
- 必须指出：未结构化、缺乏核心实体（Organization/Product）、同义词匹配失败、TF-IDF 字面重合不足等至少 3 项具体证据。
- 结合初筛得分给出批判性诊断，区分「文案用词问题」与「业务错位」。

## 二、GEO 关键词文案直改指南
- 根据 TF-IDF 分数，提供至少 3 组 Before ➡️ After 文案直改对照。
- 格式示例：
  **Before：** 我们提供一流的销管服务……
  **After：** 我们作为 [公司名] B2B 营销自动化系统，提供 SaaS 降本增效组合方案……
- 每组必须说明：针对哪个黄金关键词、当前 TF-IDF 得分、修改后预期提升点。

## 三、AI 搜索引擎专属引饵代码
- 根据业务和核心黄金词，输出可直接部署的 JSON-LD 结构化代码（Organization + FAQPage + Product 三合一或分块）。
- 代码块必须使用 \`\`\`json 围栏，内容必须是合法 JSON，含公司名、官网 URL、3 个 FAQ 问答。
- 附带部署说明：粘贴至官网 <head> 的具体步骤（不超过 5 步）。

## 四、商业漏斗拦截点与 MarketUP 自动化闭环
- 分别诊断 Awareness（认知）、Evaluation（评估）、Decision（决策）三阶段的 AI 搜索拦截现状。
- 每个阶段给出 1 条可量化拦截点 + 1 条 MarketUP 智能建站模块可一键配置的解决方案。
- 结尾附 30 天 GEO 行动路线图（按周拆解，共 4 周，每周 2-3 项具体任务）。`;

export function generateDeepGeoReportPrompt(
  input: DeepGeoReportPromptInput
): DeepGeoReportPrompt {
  const snapshotText = input.gradeSnapshot
    ? `\n\n【初筛诊断 JSON 快照（含 TF-IDF 关键词得分，请引用具体数字）】\n${JSON.stringify(input.gradeSnapshot, null, 2)}`
    : "";

  const user = `请为以下 B2B 企业生成完整的 GEO 深度整改白皮书（Markdown 格式）：

- 公司名称：${input.companyName}
- 主营行业：${input.industry}
- 官网 URL：${input.url}
- 初筛 AI 搜索可见度得分：${input.score} / 100${snapshotText}

请严格按照 System Prompt 中的 4 大模块结构输出，确保所有文案和代码可直接复制使用。`;

  return { system: SYSTEM_PROMPT, user };
}
