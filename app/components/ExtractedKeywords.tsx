import { Crosshair, Sparkles, AlertTriangle } from "lucide-react";

export interface ExtractedKeyword {
  keyword: string;
  reason: string;
  semanticSimilarity?: number;
}

const CARD_ACCENTS = [
  "from-blue-500/15 to-blue-600/5 border-blue-500/30 text-blue-300",
  "from-violet-500/15 to-violet-600/5 border-violet-500/30 text-violet-300",
  "from-amber-500/15 to-amber-600/5 border-amber-500/30 text-amber-300",
];

const BADGE_COLORS = [
  "bg-blue-500/20 text-blue-300",
  "bg-violet-500/20 text-violet-300",
  "bg-amber-500/20 text-amber-300",
];

function getSimilarityStyle(percent: number) {
  if (percent < 40) {
    return {
      bar: "bg-red-500",
      text: "text-red-400",
      ring: "ring-red-500/40",
      bg: "bg-red-500/10",
    };
  }
  if (percent < 60) {
    return {
      bar: "bg-orange-500",
      text: "text-orange-400",
      ring: "ring-orange-500/40",
      bg: "bg-orange-500/10",
    };
  }
  return {
    bar: "bg-emerald-500",
    text: "text-emerald-400",
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/10",
  };
}

function SimilarityBadge({ percent }: { percent: number }) {
  const style = getSimilarityStyle(percent);
  const isLow = percent < 60;

  return (
    <div className={`mt-3 rounded-lg p-3 ${style.bg} ring-1 ${style.ring}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">AI 语义空间吻合度</span>
        <span className={`text-sm font-bold tabular-nums ${style.text}`}>
          {percent}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isLow && (
        <p className="mt-2 text-xs text-orange-300/90 leading-relaxed flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-400" />
          这意味着大模型在进行 Vector Search 时，您的网站有极高概率因语义偏离而被直接过滤。
        </p>
      )}
    </div>
  );
}

export default function ExtractedKeywords({
  keywords,
}: {
  keywords: ExtractedKeyword[];
}) {
  if (!keywords?.length) return null;

  return (
    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-amber-500" />

      <div className="flex items-center gap-2 mb-5">
        <Crosshair className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-slate-100">
          🎯 智能扫描：为您锁定的 3 大 AI 流量主战场
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {keywords.map((item, i) => (
          <div
            key={i}
            className={`rounded-xl border bg-gradient-to-br p-4 ${CARD_ACCENTS[i % 3]}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[i % 3]}`}
              >
                战场 {i + 1}
              </span>
              <Sparkles className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-sm font-semibold text-white leading-snug mb-2">
              {item.keyword}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {item.reason}
            </p>
            {typeof item.semanticSimilarity === "number" && (
              <SimilarityBadge percent={item.semanticSimilarity} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
