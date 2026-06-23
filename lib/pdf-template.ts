/**
 * 殿堂级咨询报告视觉 - PDF HTML 模版生成器
 * 摆脱了邮件客户端限制，全面使用 Tailwind CSS、现代 Web 字体、精美阴影与打印控制。
 * 针对 Puppeteer 或浏览器直接打印 (Cmd + P) 进行了物理分页优化 (Page-Break Protection)。
 */

// 辅助函数：将 Markdown 标记安全、高保真地转换为现代化带 Tailwind 的 HTML
function parseMarkdownToPdfHtml(markdown: string): string {
  let html = markdown;

  // 1. 转义基础 HTML 字符防止代码干扰，但保留特定容器
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. 解析 JSON-LD 代码块（高亮美化，物理分页防截断）
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

  // 3. 解析提示词附录代码块（绿虚线卡片，CMO/CEO一键复制资产）
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

  // 4. 解析标准代码块
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `
    <pre class="my-6 p-5 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all page-break-inside-avoid">${code.trim()}</pre>`;
  });

  // 5. 解析行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 mx-0.5 bg-slate-100 text-rose-600 rounded font-mono text-xs border border-slate-200 font-semibold">$1</code>');

  // 6. 解析 H1, H2, H3 标题（并强行在 H2 标题前注入分页符，保证 PDF 排版不会半截断裂）
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-black text-slate-900 mt-10 mb-6 border-b-4 border-blue-600 pb-3 leading-tight tracking-tight">$1</h1>');
  
  // 核心：在二级标题前面，注入带有 page-break 的打印占位符，保证 PDF 排版绝对整齐
  html = html.replace(/^## (.*?)$/gm, '<div class="page-break-before"></div><h2 class="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b-2 border-slate-200 pb-2 flex items-center gap-2">$1</h2>');
  
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold text-slate-700 mt-6 mb-3">$1</h3>');

  // 7. 解析加粗 **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 bg-yellow-50 px-0.5 rounded">$1</strong>');

  // 8. 解析列表
  html = html.replace(/^[-\*] (.*?)$/gm, '<li class="my-2 text-slate-600 leading-relaxed text-sm flex items-start gap-2"><span class="text-blue-500 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500"></span><span class="flex-1">$1</span></li>');
  html = html.replace(/(<li [\s\S]*?<\/li>)/g, '<ul class="pl-4 my-4">$1</ul>');
  html = html.replace(/<\/ul>\s*<ul class="pl-4 my-4">/g, ''); // 修复多余的闭合标签

  // 9. 解析引用块
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="my-6 pl-4 border-l-4 border-blue-500 italic text-slate-600 py-1 bg-blue-50/50 rounded-r-lg">$1</blockquote>');

  // 10. 解析段落 (将不符合上面规则的纯文本转为优雅的段落)
  html = html.split('\n\n').map(p => {
    const trimmed = p.trim();
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<div') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote')) {
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
      /* 隐藏打印时的页眉页脚（如果需要浏览器默认自带的除外） */
      @page {
        margin: 20mm 15mm 20mm 15mm;
      }
    }

    /* 自定义美化 Before / After 卡片对比样式 */
    .aeo-before-card {
      background-color: #fef2f2;
      border: 1px solid #fee2e2;
      border-left: 4px solid #ef4444;
    }
    .aeo-after-card {
      background-color: #f0fdf4;
      border: 1px solid #dcfce7;
      border-left: 4px solid #22c55e;
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

  <!-- 主体解析内容 -->
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