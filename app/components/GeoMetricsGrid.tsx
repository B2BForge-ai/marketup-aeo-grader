import { LayoutGrid, BarChart3, Quote, Network } from "lucide-react";

export interface GeoMetrics {
  structuringScore: number;
  statisticsScore: number;
  citationRate: string;
  semanticDensity: string;
}

function scoreColor(score: number) {
  if (score < 60) return "text-red-400";
  if (score <= 80) return "text-yellow-400";
  return "text-emerald-400";
}

function densityColor(d: string) {
  if (d === "高") return "text-emerald-400";
  if (d === "低") return "text-red-400";
  return "text-yellow-400";
}

const METRICS = [
  {
    key: "structuringScore" as const,
    label: "结构化格式得分",
    desc: "Q&A 对、数据表格、Markdown 列表",
    icon: LayoutGrid,
    accent: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/25",
    iconColor: "text-cyan-400",
    kind: "score" as const,
  },
  {
    key: "statisticsScore" as const,
    label: "权威数字密度",
    desc: "量化指标与统计数据丰富度",
    icon: BarChart3,
    accent: "from-violet-500/20 to-violet-600/5 border-violet-500/25",
    iconColor: "text-violet-400",
    kind: "score" as const,
  },
  {
    key: "citationRate" as const,
    label: "权威引用率",
    desc: "媒体、学术语料、白皮书被引用率",
    icon: Quote,
    accent: "from-amber-500/20 to-amber-600/5 border-amber-500/25",
    iconColor: "text-amber-400",
    kind: "rate" as const,
  },
  {
    key: "semanticDensity" as const,
    label: "语义共现密度",
    desc: "品牌实体与行业核心词关联强度",
    icon: Network,
    accent: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/25",
    iconColor: "text-emerald-400",
    kind: "density" as const,
  },
];

export default function GeoMetricsGrid({ metrics }: { metrics: GeoMetrics }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <LayoutGrid className="w-5 h-5 text-cyan-400" />
        GEO 核心指标矩阵
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const value =
            m.kind === "score"
              ? metrics[m.key]
              : m.kind === "rate"
                ? metrics.citationRate
                : metrics.semanticDensity;

          return (
            <div
              key={m.key}
              className={`rounded-xl border bg-gradient-to-br p-4 ${m.accent}`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`w-5 h-5 ${m.iconColor}`} />
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    m.kind === "score"
                      ? scoreColor(metrics[m.key] as number)
                      : m.kind === "density"
                        ? densityColor(metrics.semanticDensity)
                        : "text-amber-300"
                  }`}
                >
                  {value}
                  {m.kind === "score" && (
                    <span className="text-sm text-slate-500 font-normal">
                      /100
                    </span>
                  )}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200">{m.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
              {m.kind === "score" && (
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${m.iconColor.replace("text-", "from-")} to-white/20`}
                    style={{
                      width: `${metrics[m.key]}%`,
                      background:
                        m.key === "structuringScore"
                          ? "linear-gradient(90deg, #06b6d4, #22d3ee)"
                          : "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
