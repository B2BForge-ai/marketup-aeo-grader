import { Swords, Target } from "lucide-react";

export interface CompetitorBrand {
  name: string;
  score: number;
  sov: string;
  tag: string;
  advantage: string;
}

function parseSov(sov: string): number {
  const n = parseInt(sov.replace(/[^\d]/g, ""), 10);
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
}

function isOwnBrand(name: string, index: number) {
  return index === 0 || name === "本公司";
}

const BAR_STYLES = {
  own: {
    bar: "from-blue-500 to-blue-400",
    text: "text-blue-300",
    sov: "bg-blue-500",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
  },
  rival1: {
    bar: "from-red-500/80 to-red-400/80",
    text: "text-red-300",
    sov: "bg-red-500/80",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
  },
  rival2: {
    bar: "from-slate-500 to-slate-400",
    text: "text-slate-300",
    sov: "bg-slate-500",
    border: "border-slate-500/30",
    bg: "bg-slate-500/10",
  },
};

function getStyle(index: number, isOwn: boolean) {
  if (isOwn) return BAR_STYLES.own;
  if (index === 1) return BAR_STYLES.rival1;
  return BAR_STYLES.rival2;
}

export default function CompetitionRadar({
  competitors,
  companyName,
}: {
  competitors: CompetitorBrand[];
  companyName: string;
}) {
  if (!competitors?.length) return null;

  const brands = competitors.map((c, i) => {
    const isOwn = isOwnBrand(c.name, i);
    return {
      ...c,
      isOwn,
      displayName: isOwn ? companyName : c.name,
      style: getStyle(i, isOwn),
      sovNum: parseSov(c.sov),
    };
  });

  const sortedByScore = [...brands].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur border border-violet-500/20 rounded-2xl p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-6 relative">
        <Swords className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-slate-100">
          ⚔️ 行业竞争烈度雷达
        </h3>
      </div>

      <div className="space-y-4 mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
          AEO 综合得分对比
        </p>
        {sortedByScore.map((brand) => (
          <div key={brand.displayName} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${brand.style.text}`}>
                {brand.displayName}
                {brand.isOwn && (
                  <span className="ml-1.5 text-xs text-blue-400/60 font-normal">
                    您的品牌
                  </span>
                )}
              </span>
              <span className={`font-bold tabular-nums ${brand.style.text}`}>
                {brand.score}
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${brand.style.bar} transition-all duration-1000 ease-out`}
                style={{ width: `${brand.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
          AI 搜索声量份额 (SOV)
        </p>
        <div className="flex h-8 rounded-lg overflow-hidden border border-white/10">
          {brands.map((brand) =>
            brand.sovNum > 0 ? (
              <div
                key={brand.displayName}
                className={`${brand.style.sov} flex items-center justify-center text-xs font-semibold text-white/90 transition-all duration-1000`}
                style={{ width: `${brand.sovNum}%` }}
                title={`${brand.displayName}: ${brand.sov}`}
              >
                {brand.sovNum >= 15 ? brand.sov : ""}
              </div>
            ) : null
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {brands.map((brand) => (
            <div
              key={brand.displayName}
              className="flex items-center gap-1.5 text-xs text-slate-400"
            >
              <span className={`w-2.5 h-2.5 rounded-sm ${brand.style.sov}`} />
              {brand.displayName}{" "}
              <span className={brand.style.text}>{brand.sov}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {brands.map((brand) => (
          <div
            key={brand.displayName}
            className={`rounded-xl border p-4 ${brand.style.border} ${brand.style.bg}`}
          >
            <p
              className={`text-sm font-semibold mb-2 truncate ${brand.style.text}`}
            >
              {brand.displayName}
            </p>
            <div className="flex items-center gap-1.5 mb-2">
              {brand.isOwn ? (
                <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              ) : (
                <Swords className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                {brand.tag}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {brand.advantage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
