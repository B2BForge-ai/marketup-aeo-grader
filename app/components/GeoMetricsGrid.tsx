import { BarChart3 } from "lucide-react";

export interface GeoMetrics {
  structuringScore: number;
  statisticsScore: number;
  citationRate: string;
  semanticDensity: string;
}

function parseRate(rate: string): number {
  const n = parseInt(rate.replace(/[^\d]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

function densityWidth(d: string): number {
  if (d === "高") return 75;
  if (d === "中") return 45;
  return 20;
}

function barColor(score: number) {
  if (score >= 60) return "#E8321A";
  if (score >= 40) return "#F59E0B";
  return "#888888";
}

const METRICS = [
  {
    key: "structuringScore" as const,
    label: "内容结构化程度",
    desc: "官网是否有清晰的问答结构、FAQ 等，方便 AI 提取答案",
    kind: "score" as const,
  },
  {
    key: "statisticsScore" as const,
    label: "数据说服力",
    desc: "页面是否包含转化率、客户数等具体数字，增强 AI 引用可信度",
    kind: "score" as const,
  },
  {
    key: "citationRate" as const,
    label: "外部引用覆盖",
    desc: "品牌在媒体报道、行业文章中的被引用比例",
    kind: "rate" as const,
  },
  {
    key: "semanticDensity" as const,
    label: "关键词覆盖广度",
    desc: "官网内容与行业核心搜索词的关联覆盖程度",
    kind: "density" as const,
  },
];

export default function GeoMetricsGrid({ metrics }: { metrics: GeoMetrics }) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#E8321A]" />
          官网内容质量指标
        </h3>
        <p className="text-sm text-[#666] mt-1.5">
          从四个维度评估您的官网内容是否容易被 AI 搜索引用和推荐。
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {METRICS.map((m) => {
          const scoreVal =
            m.kind === "score" ? (metrics[m.key] as number) : 0;
          const rateVal = parseRate(metrics.citationRate);
          const barW =
            m.kind === "score"
              ? scoreVal
              : m.kind === "rate"
                ? rateVal
                : densityWidth(metrics.semanticDensity);
          const barBg =
            m.kind === "score" || m.kind === "rate"
              ? barColor(m.kind === "score" ? scoreVal : rateVal)
              : barColor(densityWidth(metrics.semanticDensity));

          const displayVal =
            m.kind === "score"
              ? metrics[m.key]
              : m.kind === "rate"
                ? metrics.citationRate
                : metrics.semanticDensity;

          return (
            <div
              key={m.key}
              className="bg-white border border-[#EFEFEF] rounded-xl p-4"
            >
              <p className="text-sm font-medium text-[#444] mb-1.5">{m.label}</p>
              <p
                className={`font-bold text-[#111] leading-none ${
                  m.kind === "density" ? "text-xl" : "text-[28px]"
                }`}
              >
                {displayVal}
                {m.kind === "score" && (
                  <span className="text-sm text-[#888] font-normal">
                    {" "}
                    /100
                  </span>
                )}
              </p>
              <p className="text-[13px] text-[#666] mt-2 leading-relaxed">
                {m.desc}
              </p>
              <div className="h-1 bg-[#F0F0F0] rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${barW}%`, background: barBg }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
