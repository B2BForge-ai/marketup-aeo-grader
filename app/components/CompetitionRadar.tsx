import { Swords, Target } from "lucide-react";

export interface CompetitorEntry {
  name: string;
  score: number;
  sov: string;
  tag: string;
}

function parseSov(sov: string): number {
  const n = parseInt(sov.replace(/[^\d]/g, ""), 10);
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
}

function isOwnBrand(name: string, index: number) {
  return index === 0 || name === "本公司";
}

export default function CompetitionRadar({
  competitors,
  companyName,
}: {
  competitors: CompetitorEntry[];
  companyName: string;
}) {
  if (!competitors?.length) return null;

  const brands = competitors.map((c, i) => {
    const isOwn = isOwnBrand(c.name, i);
    return {
      ...c,
      isOwn,
      displayName: isOwn ? companyName : c.name,
      sovNum: parseSov(c.sov),
      barClass: isOwn
        ? "from-blue-500 to-blue-400"
        : "from-red-500/80 to-slate-500/80",
      textClass: isOwn ? "text-blue-300" : "text-red-300",
      sovClass: isOwn ? "bg-blue-500" : "bg-red-500/70",
    };
  });

  return (
    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur border border-violet-500/20 rounded-2xl p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-6 relative">
        <Swords className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-slate-100">
          ⚔️ 品牌 vs 竞品 GEO 对比
        </h3>
      </div>

      <div className="space-y-4 mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
          GEO 综合得分
        </p>
        {brands.map((brand) => (
          <div key={brand.displayName} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${brand.textClass} flex items-center gap-1.5`}>
                {brand.isOwn ? (
                  <Target className="w-3.5 h-3.5" />
                ) : (
                  <Swords className="w-3.5 h-3.5" />
                )}
                {brand.displayName}
                {brand.isOwn && (
                  <span className="text-xs text-blue-400/60 font-normal">
                    您的品牌
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
                  {brand.tag}
                </span>
                <span className={`font-bold tabular-nums ${brand.textClass}`}>
                  {brand.score}
                </span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${brand.barClass} transition-all duration-1000 ease-out`}
                style={{ width: `${brand.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
          LLM 声量份额 (SOV)
        </p>
        <div className="flex h-10 rounded-lg overflow-hidden border border-white/10">
          {brands.map((brand) =>
            brand.sovNum > 0 ? (
              <div
                key={brand.displayName}
                className={`${brand.sovClass} flex items-center justify-center text-xs font-semibold text-white/90 transition-all duration-1000`}
                style={{ width: `${brand.sovNum}%`, minWidth: brand.sovNum > 0 ? "2rem" : 0 }}
              >
                {brand.sov}
              </div>
            ) : null
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
          {brands.map((brand) => (
            <div
              key={brand.displayName}
              className="flex items-center gap-1.5 text-xs text-slate-400"
            >
              <span className={`w-2.5 h-2.5 rounded-sm ${brand.sovClass}`} />
              {brand.displayName}{" "}
              <span className={brand.textClass}>{brand.sov}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
