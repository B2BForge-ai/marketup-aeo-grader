function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="inline-code">$1</code>'
  );
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="link">$1</a>'
  );
  return result;
}

function isBeforeLine(line: string): boolean {
  return /^(\*\*)?Before[：:]/i.test(line.trim()) || /^【Before】/.test(line.trim());
}

function isAfterLine(line: string): boolean {
  return /^(\*\*)?After[：:]/i.test(line.trim()) || /^【After】/.test(line.trim());
}

function extractLabelContent(line: string): string {
  return line
    .replace(/^(\*\*)?Before[：:]\s*(\*\*)?/i, "")
    .replace(/^(\*\*)?After[：:]\s*(\*\*)?/i, "")
    .replace(/^【Before】\s*/, "")
    .replace(/^【After】\s*/, "")
    .trim();
}

function renderComparisonCards(before: string, after: string): string {
  return `
    <div class="comparison-grid">
      <div class="comparison-card before-card">
        <div class="comparison-label">Before · 原文案</div>
        <div class="comparison-body">${inlineFormat(before)}</div>
      </div>
      <div class="comparison-card after-card">
        <div class="comparison-label">After · 优化后</div>
        <div class="comparison-body">${inlineFormat(after)}</div>
      </div>
    </div>`;
}

function parseMarkdownBody(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  let i = 0;
  let inCodeBlock = false;
  let codeLang = "";
  const codeLines: string[] = [];
  let h2Count = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeLines.length = 0;
      } else {
        inCodeBlock = false;
        const langBadge = codeLang
          ? `<span class="code-lang">${escapeHtml(codeLang)}</span>`
          : "";
        parts.push(
          `<div class="code-block">${langBadge}<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre></div>`
        );
        codeLines.length = 0;
        codeLang = "";
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (isBeforeLine(line)) {
      const beforeParts = [extractLabelContent(line)];
      i++;
      while (
        i < lines.length &&
        !isAfterLine(lines[i]) &&
        !lines[i].startsWith("#") &&
        !lines[i].startsWith("```") &&
        lines[i].trim() !== ""
      ) {
        beforeParts.push(lines[i]);
        i++;
      }
      const beforeText = beforeParts.filter(Boolean).join("\n");

      if (i < lines.length && isAfterLine(lines[i])) {
        const afterParts = [extractLabelContent(lines[i])];
        i++;
        while (
          i < lines.length &&
          !isBeforeLine(lines[i]) &&
          !/^#{1,6}\s/.test(lines[i]) &&
          !lines[i].startsWith("```") &&
          lines[i].trim() !== ""
        ) {
          afterParts.push(lines[i]);
          i++;
        }
        parts.push(renderComparisonCards(beforeText, afterParts.join("\n")));
        continue;
      }
      parts.push(
        `<div class="comparison-card before-card solo"><div class="comparison-label">Before</div><div class="comparison-body">${inlineFormat(beforeText)}</div></div>`
      );
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 2;
      const text = line.replace(/^#+\s*/, "");
      const tag = `h${Math.min(level, 6)}`;

      if (level === 2) {
        h2Count += 1;
        if (h2Count > 1) {
          parts.push('<div class="page-break"></div>');
        }
      }

      parts.push(
        `<${tag} class="heading-${level}">${inlineFormat(text)}</${tag}>`
      );
      i++;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(`<li>${inlineFormat(lines[i].replace(/^[-*]\s*/, ""))}</li>`);
        i++;
      }
      parts.push(`<ul class="bullet-list">${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          `<li>${inlineFormat(lines[i].replace(/^\d+\.\s*/, ""))}</li>`
        );
        i++;
      }
      parts.push(`<ol class="ordered-list">${items.join("")}</ol>`);
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      parts.push(
        `<blockquote class="quote">${inlineFormat(quoteLines.join(" "))}</blockquote>`
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !isBeforeLine(lines[i]) &&
      !lines[i].trim().startsWith(">")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    parts.push(`<p class="paragraph">${inlineFormat(paraLines.join(" "))}</p>`);
  }

  return parts.join("\n");
}

const PDF_STYLES = `
  :root {
    --bg: #ffffff;
    --bg-subtle: #f8fafc;
    --navy: #0f172a;
    --blue: #2563eb;
    --amber: #d97706;
    --text: #334155;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --code-bg: #0f172a;
    --before-bg: #fef2f2;
    --before-border: #fecaca;
    --after-bg: #f0fdf4;
    --after-border: #bbf7d0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    background: var(--bg-subtle);
    color: var(--text);
    font-size: 11pt;
    line-height: 1.75;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .report-shell {
    max-width: 820px;
    margin: 0 auto;
    background: var(--bg);
  }

  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 100vh;
    padding: 64px 56px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%);
    border-bottom: 4px solid var(--blue);
    page-break-after: always;
  }

  .cover-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #eff6ff;
    color: var(--blue);
    font-size: 10pt;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 8px 16px;
    border-radius: 999px;
    border: 1px solid #bfdbfe;
    width: fit-content;
    margin-bottom: 32px;
  }

  .cover h1 {
    font-size: 28pt;
    font-weight: 700;
    color: var(--navy);
    line-height: 1.25;
    margin-bottom: 16px;
  }

  .cover-subtitle {
    font-size: 14pt;
    color: var(--text-muted);
    margin-bottom: 48px;
  }

  .score-panel {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 24px;
    align-items: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px 32px;
    box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  }

  .score-ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid var(--blue);
    background: #eff6ff;
  }

  .score-value {
    font-size: 32pt;
    font-weight: 800;
    color: var(--blue);
    line-height: 1;
  }

  .score-label {
    font-size: 9pt;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .score-meta h2 {
    font-size: 13pt;
    color: var(--navy);
    margin-bottom: 8px;
  }

  .score-meta p {
    font-size: 10pt;
    color: var(--text-muted);
  }

  .content {
    padding: 48px 56px 64px;
  }

  .chapter { margin-bottom: 8px; }

  h1, h2, h3, h4, h5, h6 {
    color: var(--navy);
    font-weight: 700;
    line-height: 1.35;
  }

  .heading-1 { font-size: 20pt; margin: 32px 0 16px; }
  .heading-2 {
    font-size: 16pt;
    margin: 28px 0 14px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--blue);
  }
  .heading-3 { font-size: 13pt; margin: 20px 0 10px; color: var(--blue); }
  .heading-4, .heading-5, .heading-6 { font-size: 11pt; margin: 16px 0 8px; }

  .paragraph { margin-bottom: 14px; text-align: justify; }

  .bullet-list, .ordered-list {
    margin: 0 0 16px 20px;
    padding-left: 8px;
  }

  .bullet-list li, .ordered-list li { margin-bottom: 6px; }

  .quote {
    border-left: 4px solid var(--amber);
    background: #fffbeb;
    padding: 14px 18px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
    color: #92400e;
    font-style: italic;
  }

  .code-block {
    position: relative;
    margin: 20px 0;
    border-radius: 10px;
    overflow: hidden;
    page-break-inside: avoid;
  }

  .code-lang {
    display: block;
    background: #1e293b;
    color: #94a3b8;
    font-size: 9pt;
    padding: 6px 14px;
    font-family: Consolas, Monaco, monospace;
  }

  .code-block pre {
    background: var(--code-bg);
    padding: 18px 20px;
    overflow-x: auto;
    margin: 0;
  }

  .code-block code {
    font-family: Consolas, Monaco, monospace;
    font-size: 9pt;
    line-height: 1.55;
    color: #a9dc76;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .inline-code {
    background: #f1f5f9;
    color: #be185d;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: Consolas, Monaco, monospace;
    font-size: 9pt;
  }

  .link { color: var(--blue); text-decoration: underline; }

  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 20px 0;
    page-break-inside: avoid;
  }

  .comparison-card {
    border-radius: 12px;
    padding: 18px 20px;
    border: 1px solid;
  }

  .comparison-card.solo { margin: 16px 0; }

  .before-card {
    background: var(--before-bg);
    border-color: var(--before-border);
  }

  .after-card {
    background: var(--after-bg);
    border-color: var(--after-border);
  }

  .comparison-label {
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .before-card .comparison-label { color: #dc2626; }
  .after-card .comparison-label { color: #16a34a; }

  .comparison-body {
    font-size: 10pt;
    line-height: 1.65;
    color: var(--navy);
  }

  .page-break { page-break-before: always; }

  @media print {
    body { background: white; }
    .page-break { page-break-before: always; }
    h1, h2, h3 { page-break-after: avoid; }
    pre, blockquote, .code-block, .comparison-grid { page-break-inside: avoid; }
    .cover { page-break-after: always; }
  }

  @media (max-width: 640px) {
    .comparison-grid { grid-template-columns: 1fr; }
    .score-panel { grid-template-columns: 1fr; }
  }
`;

export function convertMarkdownToPdfHtml(
  markdownText: string,
  companyName: string,
  score: number
): string {
  const bodyHtml = parseMarkdownBody(markdownText.trim());
  const generatedAt = new Date().toLocaleString("zh-CN");
  const scoreLevel =
    score >= 80 ? "良好" : score >= 60 ? "中等" : score >= 40 ? "待提升" : "偏低";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(companyName)} · GEO 深度整改报告</title>
  <style>${PDF_STYLES}</style>
</head>
<body>
  <div class="report-shell">
    <header class="cover">
      <div class="cover-badge">MarketUP · AI Search Grader</div>
      <h1>GEO 深度整改与<br>AI 爬虫诱饵代码白皮书</h1>
      <p class="cover-subtitle">${escapeHtml(companyName)} · 企业 AI 检索可见度专项诊断</p>
      <div class="score-panel">
        <div class="score-ring">
          <span class="score-value">${score}</span>
          <span class="score-label">可见度得分</span>
        </div>
        <div class="score-meta">
          <h2>综合评级：${scoreLevel}</h2>
          <p>本报告基于 TF-IDF 语义匹配、DeepSeek 专家推理与 GEO 行业最佳实践生成。</p>
          <p style="margin-top:8px;">生成时间：${escapeHtml(generatedAt)}</p>
        </div>
      </div>
    </header>
    <main class="content">
      ${bodyHtml}
    </main>
  </div>
</body>
</html>`;
}
