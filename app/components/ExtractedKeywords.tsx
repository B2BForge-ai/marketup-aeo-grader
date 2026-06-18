import { Crosshair, Sparkles } from "lucide-react";

export interface ExtractedKeyword {
  keyword: string;
  reason: string;
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
          </div>
        ))}
      </div>
    </div>
  );
}
