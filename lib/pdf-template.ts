/**
 * 殿堂级咨询报告视觉 - PDF HTML 模版生成器 (高保真打印升级版)
 * 已内置强大的 Markdown Table 编译器，完美解决 PDF/Print 状态下的表格折行与布局截断问题。
 */

// 辅助函数：专门用于解析 Markdown 表格并输出高保真、美观的 HTML 数据表格
function renderTableHtml(lines: string[]): string {
  if (lines.length < 2) return lines.join('\n'); // 过滤无效表格

  // 安全提取单元格内容（剔除首尾的 pipe 竖线并做去空格处理）
  const getCells = (row: string) => {
    return row.split('|')
      .slice(1, -1)
      .map(cell => cell.trim());
  };

  const headers = getCells(lines[0]);
  
  // 过滤并补齐行数据，防止多列或少列导致的排版崩溃
  const bodyRows = lines.slice(2).map(row => {
    const cells = getCells(row);
    while (cells.length < headers.length) {
      cells.push('');
    }
    return cells.slice(0, headers.length);
  });

  // 生成专为 PDF 打印优化的、带卡片投影与细线区隔的极简表格
  let html = `
  <div class="my-6 overflow-hidden border border-slate-200 rounded-xl shadow-md bg-white page-break-inside-avoid">
    <table class="min-w-full divide-y divide-slate-200 text-left border-collapse text-xs sm:text-sm">
      <thead class="bg-slate-50 border-b border-slate-200">
        <tr>
  `;
  
  headers.forEach(header => {
    html += `<th scope="col" class="px-4 py-3 font-bold text-slate-800 tracking-wide bg-slate-50/80">${header}</th>`;
  });

  html += `
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 bg-white">
  `;

  bodyRows.forEach((row, idx) => {
    // 奇偶行交叉变色，强化视觉引导
    html += `<tr class="${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'} hover:bg-slate-50/50 transition-colors">`;
    row.forEach(cell => {
      // 在单元格内部二次渲染加粗与行内代码块，避免排版单调
      let cellContent = cell
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 bg-yellow-50 px-1 rounded">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 mx-0.5 bg-slate-100 text-rose-600 rounded font-mono text-xs border border-slate-200 font-semibold">$1</code>');
      
      html += `<td class="px-4 py-3.5 text-slate-600 whitespace-normal break-words leading-relaxed">${cellContent}</td>`;
    });
    html += `</tr>`;
  });

  html += `
      </tbody>
    </table>
  </div>
  `;
  return html;
}

// 核心编译流：逐行解析 Markdown 标记
function parseMarkdownToPdfHtml(markdown: string): string {
  const lines = markdown.split('\n');
  let inTable = false;
  let tableLines: string[] = [];
  let processedLines: string[] = [];

  // 第一步：先将表格单独提取出来，避免被后续段落分割标签干扰
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      tableLines.push(line);
    } else {
      if (inTable) {
        processedLines.push(renderTableHtml(tableLines));
        tableLines = [];
        inTable = false;
      }
      processedLines.push(lines[i]);
    }
  }
  if (inTable) {
    processedLines.push(renderTableHtml(tableLines));
  }

  let html = processedLines.join('\n');

  // 1. 解析 JSON-LD 代码块
  html = html.replace(/```json([\s\S]*?)```/g, (_, code) => {
    return `
    <div class="my-6 rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden page-break-inside-avoid">
      <div class="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-800">
        <span>✨ 建议挂载的 JSON-LD 结构化代码 (Copy Ready)</span>
        <span class="text-emerald-400">100% 验证合规</span>
      </div>
      <pre class="p-5 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">${code.trim()}</pre>
    </div>`;
  });

  // 2. 解析专属官网文案重构 Prompt 代码块
  html = html.replace(/```text([\s\S]*?)```/g, (_, code) => {
    return `
    <div class="my-6 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50/40 p-6 shadow-sm page-break-inside-avoid">
      <div class="flex items-center justify-between mb-4">
        <span class="text-emerald-800 font-bold text-sm">🛠️ 专属 AEO/GEO 官网文案重构 Prompt (请整段复制投喂给大模型)</span>
        <span class="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded font-semibold">Ctrl + C 复制</span>
      </div>
      <p class="text-emerald-700 text-xs leading-relaxed mb-4">
        由于大模型对系统化内容和实体密度有严格的召回门槛。请复制下方代码框中的全部 Prompt 投喂给 Claude 或 ChatGPT，即可直接开始对您现有官网的任何页面进行无脑直改。
      </p>
      <pre class="p-4 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all select-all border border-slate-800">${code.trim()}</pre>
    </div>`;
  });

  // 3. 解析标准代码块
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `
    <pre class="my-6 p-5 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all page-break-inside-avoid">${code.trim()}</pre>`;
  });

  // 4. 解析行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 mx-0.5 bg-slate-100 text-rose-600 rounded font-mono text-xs border border-slate-200 font-semibold">$1</code>');

  // 5. 解析 H1, H2, H3 标题（并在 H2 标题前注入分页符，保证 PDF 排版不会半截断裂）
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-black text-slate-900 mt-10 mb-6 border-b-4 border-blue-600 pb-3 leading-tight tracking-tight">$1</h1>');
  
  // 核心：在二级标题前面，注入带有 page-break 的打印占位符，保证 PDF 排版绝对整齐
  html = html.replace(/^## (.*?)$/gm, '<div class="page-break-before"></div><h2 class="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b-2 border-slate-200 pb-2 flex items-center gap-2">$1</h2>');
  
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold text-slate-700 mt-6 mb-3">$1</h3>');

  // 6. 解析加粗 **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 bg-yellow-50 px-0.5 rounded">$1</strong>');

  // 7. 解析列表
  html = html.replace(/^[-\*] (.*?)$/gm, '<li class="my-2 text-slate-600 leading-relaxed text-sm flex items-start gap-2"><span class="text-blue-500 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500"></span><span class="flex-1">$1</span></li>');
  html = html.replace(/(<li [\s\S]*?<\/li>)/g, '<ul class="pl-4 my-4">$1</ul>');
  html = html.replace(/<\/ul>\s*<ul class="pl-4 my-4">/g, ''); // 修复多余的闭合标签

  // 8. 解析引用块
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="my-6 pl-4 border-l-4 border-blue-500 italic text-slate-600 py-1 bg-blue-50/50 rounded-r-lg">$1</blockquote>');

  // 9. 解析段落 (将非控制标记的纯文本转换为优雅的段落)
  html = html.split('\n\n').map(p => {
    const trimmed = p.trim();
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<div') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li')) {
      return p;
    }
    if (trimmed) {
      return `<p class="my-4 text-slate-600 leading-relaxed text-sm tracking-wide">${trimmed}</p>`;
    }
    return '';
  }).join('\n');

  return html;
}

export function convertMarkdownToPdfHtml(
  markdownText: string,
  companyName: string,
  score: number
): string {
  const parsedBody = parseMarkdownToPdfHtml(markdownText);

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${companyName} - AI 检索可见度诊断深度报告</title>
  <!-- 引入现代 Tailwind CSS CDN 保证样式渲染完全可用 -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap');
    
    body {
      font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* 物理分页控制：核心 PDF 导出防被截断机制 */
    @media print {
      body {
        background-color: #ffffff;
      }
      .page-break-before {
        page-break-before: always;
        height: 0;
        margin: 0;
        border: none;
      }
      .page-break-inside-avoid {
        page-break-inside: avoid;
      }
      h1, h2, h3 {
        page-break-after: avoid;
      }
      /* 隐藏打印时的页眉页脚 */
      @page {
        margin: 20mm 15mm 20mm 15mm;
      }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 p-8 md:p-16 max-w-4xl mx-auto shadow-xl my-8 rounded-2xl bg-white border border-slate-200">

  <!-- 报告封面页/页眉页脚 -->
  <header class="flex items-center justify-between border-b border-slate-200 pb-6 mb-10 page-break-inside-avoid">
    <div class="flex flex-col">
      <span class="text-xs font-bold text-blue-600 tracking-widest uppercase">MARKETUP AI SEARCH GRADER</span>
      <span class="text-lg font-black text-slate-900 mt-1">企业大模型引索漏洞诊断报告</span>
    </div>
    <div class="bg-slate-100 px-3 py-1.5 rounded-lg text-right border border-slate-200">
      <span class="text-[10px] text-slate-500 uppercase block tracking-wider font-semibold">报告评测目标</span>
      <span class="text-xs font-bold text-slate-800">${companyName}</span>
    </div>
  </header>

  <!-- 精美得分环面板 -->
  <section class="mb-10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl page-break-inside-avoid">
    <div class="space-y-3 max-w-md">
      <span class="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-bold border border-blue-500/30">
        AI 检索能见度初筛评定
      </span>
      <h3 class="text-xl font-bold">贵司网站在 AI 搜索引擎中存在明显的“流量被截流”和“语义断层”风险。</h3>
      <p class="text-slate-400 text-xs leading-relaxed">
        大模型（DeepSeek/Kimi）的爬虫在索引您的品牌时，因缺少语义建站骨骼、硬核定量数据和 Schema 三元组而陷入模糊匹配。本报告为您提供了一套开箱即用的整改指南。
      </p>
    </div>
    <div class="flex-shrink-0 text-center bg-white/5 border border-white/10 px-8 py-6 rounded-xl backdrop-blur-sm min-w-[160px]">
      <span class="text-xs text-slate-400 block mb-1">GEO 综合评分</span>
      <span class="text-5xl font-black ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-500'} tracking-tighter">${score} <span class="text-lg font-normal text-slate-500">/100</span></span>
      <span class="text-[10px] text-slate-500 block mt-2 font-mono">ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
    </div>
  </section>

  <!-- 主体解析内容（包含我们渲染好、圆角卡片质感的 30天路线图表格） -->
  <article class="prose prose-slate max-w-none">
    ${parsedBody}
  </article>

  <!-- 报告封尾与版权信息 -->
  <footer class="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 page-break-inside-avoid">
    <span>© 2026 MarketUP. All rights reserved. 内部机密诊断报告，严禁外传。</span>
    <div class="flex items-center gap-4">
      <a href="https://marketup.cn" target="_blank" class="text-blue-600 font-bold hover:underline">访问 MarketUP 官网</a>
      <span>|</span>
      <span>AI 语义建站技术支持</span>
    </div>
  </footer>

</body>
</html>
  `;
}