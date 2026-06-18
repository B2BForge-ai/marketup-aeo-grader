import { LayoutTemplate, Hash, Link2, Wrench, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface GeoTechnicalAction {
  type: string;
  targetKeyword?: string;
  detail: string;
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
        {actions.map((action, i) => {
          const style = getStyle(action.type);
          const Icon = style.icon;
          return (
            <div
              key={i}
              className={`rounded-xl border p-5 ${style.bg} ${style.border}`}
            >
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
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {action.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
