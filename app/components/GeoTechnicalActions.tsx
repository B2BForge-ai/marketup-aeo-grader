"use client";

import { useState } from "react";
import {
  LayoutTemplate,
  Hash,
  Link2,
  Wrench,
  Target,
  ChevronDown,
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

const ACTION_ICONS: Record<string, LucideIcon> = {
  结构化重构: LayoutTemplate,
  数字指标增强: Hash,
  语义绑定: Link2,
  官网文案直改: LayoutTemplate,
  全网布线标题配方: Link2,
  实体语义解耦: Link2,
};

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
    <div className="mt-3 space-y-2">
      <div className="relative rounded-lg bg-[#111] border border-[#333] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#1a1a1a] border-b border-[#333]">
          <span className="text-[13px] text-[#aaa]">
            以下内容可直接复制使用
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[13px] px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-[#ddd] transition"
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
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-[#34D399] max-h-64">
          <code>{code}</code>
        </pre>
      </div>
      <p className="text-[13px] text-[#666] leading-relaxed">
        需要自动完成结构化标记与发布？MarketUP 语义建站可一键配置 AEO
        标记，让大模型更快收录您的官网内容。
      </p>
    </div>
  );
}

function ActionCard({ action }: { action: GeoTechnicalAction }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ACTION_ICONS[action.type] ?? Wrench;
  const hasSnippet = Boolean(action.codeSnippet?.trim());

  return (
    <div className="bg-white border border-[#EFEFEF] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#FEF0EE] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#E8321A]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF0EE] text-[#E8321A] border border-[#FFCCC8]">
              {action.type}
            </span>
            {action.targetKeyword && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#F9F9F9] border border-[#EFEFEF] text-[#555]">
                <Target className="w-3 h-3 text-[#E8321A]" />
                针对：{action.targetKeyword}
              </span>
            )}
          </div>
          <p className="text-sm text-[#444] leading-relaxed">{action.detail}</p>
          {hasSnippet && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#E8321A] hover:text-[#C82A14] transition"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
                {expanded ? "收起可复制内容" : "展开可复制内容"}
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
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111] flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#E8321A]" />
          优化行动方案
        </h3>
        <p className="text-sm text-[#666] mt-1.5">
          每条建议均附带可直接复制的内容，包括官网文案修改、公网文章标题等。
        </p>
      </div>
      <div className="space-y-3">
        {actions.map((action, i) => (
          <ActionCard key={i} action={action} />
        ))}
      </div>
    </section>
  );
}
