import { Search, Flame, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ExtractedKeyword {
  keyword: string;
  reason: string;
  semanticSimilarity?: number;
}

const PRIORITY_ICONS: LucideIcon[] = [Flame, Target, TrendingUp];

function barColor(percent: number) {
  if (percent >= 60) return "#E8321A";
  if (percent >= 40) return "#F59E0B";
  return "#888888";
}

function matchHint(percent: number) {
  if (percent >= 60) return "官网文案与关键词高度重合，较易被 AI 搜索关联。";
  if (percent >= 40) return "有一定重合，但建议优化标题与描述中的用词。";
  return "重合度偏低，AI 搜索时可能优先推荐竞品而非您的官网。";
}

export default function ExtractedKeywords({
  keywords,
}: {
  keywords: ExtractedKeyword[];
}) {
  if (!keywords?.length) return null;

  const maxPct = Math.max(
    ...keywords.map((k) => k.semanticSimilarity ?? 0)
  );

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#E8321A]" />
          核心搜索关键词
        </h3>
        <p className="text-sm text-[#666] mt-1.5 leading-relaxed">
          以下是潜在客户向 DeepSeek、Kimi 等大模型提问时，最可能搜索的 3
          个行业关键词。匹配度反映您的官网标题/描述与这些词的字面重合程度。
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {keywords.map((item, i) => {
          const pct = item.semanticSimilarity ?? 0;
          const isTop = pct === maxPct && pct > 0;
          const Icon = PRIORITY_ICONS[i % 3];

          return (
            <div
              key={i}
              className={`bg-white border rounded-xl p-4 ${
                isTop ? "border-[#E8321A]" : "border-[#EFEFEF]"
              }`}
            >
              <div className="text-xs font-semibold text-[#E8321A] mb-2 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                关键词 {i + 1}
                {isTop && (
                  <span className="text-[#888] font-normal">· 匹配最高</span>
                )}
              </div>
              <p className="text-[15px] font-semibold text-[#111] leading-snug mb-3">
                {item.keyword}
              </p>
              {typeof item.semanticSimilarity === "number" && (
                <>
                  <div className="h-1 bg-[#F0F0F0] rounded-full mb-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: barColor(pct),
                      }}
                    />
                  </div>
                  <p className="text-sm text-[#444] mb-1.5">
                    官网文案匹配度{" "}
                    <span className="font-bold text-[#111]">{pct}%</span>
                  </p>
                  <p className="text-[13px] text-[#666] leading-relaxed mb-2">
                    {matchHint(pct)}
                  </p>
                </>
              )}
              <p className="text-[13px] text-[#666] leading-relaxed border-l-2 border-[#FFCCC8] pl-2.5">
                <span className="font-medium text-[#888]">选择理由：</span>
                {item.reason}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
