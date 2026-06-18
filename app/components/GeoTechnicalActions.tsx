"use client";

import { useState } from "react";
import {
  LayoutTemplate,
  Hash,
  Link2,
  Wrench,
  Target,
  ChevronDown,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface GeoTechnicalAction {
  type: string;
  targetKeyword?: string;
  detail: string;
  codeSnippet?: string;
}

const ACTION_STYLES: Record<
  string,
  { bg: string; border: string; icon: LucideIcon; iconColor: string }
> = {
  结构化重构: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    icon: LayoutTemplate,
    iconColor: "text-cyan-400",
  },
  数字指标增强: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    icon: Hash,
    iconColor: "text-violet-400",
  },
  语义绑定: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    icon: Link2,
    iconColor: "text-amber-400",
  },
  实体语义解耦: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    icon: Link2,
    iconColor: "text-emerald-400",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-slate-500/10",
  border: "border-slate-500/25",
  icon: Wrench,
  iconColor: "text-slate-400",
};

function getStyle(type: string) {
  return ACTION_STYLES[type] ?? DEFAULT_STYLE;
}

function CodeSnippetPanel({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="relative rounded-lg bg-[#0d1117] border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-green-400" />
            AI 诱饵代码 · 可直接复制部署
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-slate-300 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                一键复制
              </>
            )}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-green-300/90 max-h-64">
          <code>{code}</code>
        </pre>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed px-1">
        💡 嫌手动配置麻烦？MarketUP 语义建站模块支持全自动 AEO
        标记，一键发布即达大模型底层知识库。
      </p>
    </div>
  );
}

function ActionCard({ action }: { action: GeoTechnicalAction }) {
  const [expanded, setExpanded] = useState(false);
  const style = getStyle(action.type);
  const Icon = style.icon;
  const hasSnippet = Boolean(action.codeSnippet?.trim());

  return (
    <div className={`rounded-xl border p-5 ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-4 h-4 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.bg} ${style.iconColor} border ${style.border}`}
            >
              {action.type}
            </span>
            {action.targetKeyword && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                <Target className="w-3 h-3 text-orange-400" />
                优化词：{action.targetKeyword}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{action.detail}</p>

          {hasSnippet && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
                {expanded ? "收起 AI 诱饵代码" : "查看 AI 诱饵代码"}
              </button>
              {expanded && (
                <CodeSnippetPanel code={action.codeSnippet!.trim()} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeoTechnicalActions({
  actions,
}: {
  actions: GeoTechnicalAction[];
}) {
  if (!actions?.length) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-blue-400" />
        GEO 技术整改方案
      </h3>
      <div className="space-y-3">
        {actions.map((action, i) => (
          <ActionCard key={i} action={action} />
        ))}
      </div>
    </div>
  );
}
