"use client";

import { Target } from "lucide-react";

interface SweetSpotUnlockCardProps {
  severeCount: number;
  onUnlock: () => void;
}

export default function SweetSpotUnlockCard({
  severeCount,
  onUnlock,
}: SweetSpotUnlockCardProps) {
  return (
    <div className="rounded-xl border-2 border-[#E8321A] bg-gradient-to-br from-[#FFF5F4] to-white p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8321A]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-[#E8321A]" />
          <span className="text-xs font-semibold text-[#E8321A] uppercase tracking-wide">
            高价值 B2B 审计目标
          </span>
        </div>
        <p className="text-[15px] font-semibold text-[#111] leading-relaxed mb-4">
          🎯 发现{" "}
          <span className="text-[#E8321A] text-lg tabular-nums">
            {severeCount}
          </span>{" "}
          处严重 AI 拦截断层！
        </p>
        <p className="text-sm text-[#666] mb-4 leading-relaxed">
          点击解锁《5000 字 GEO 深度整改与 AI 爬虫诱饵代码白皮书》，将通过企业邮箱发送完整版报告。
        </p>
        <button
          onClick={onUnlock}
          className="w-full py-3.5 rounded-lg bg-[#E8321A] hover:bg-[#C82A14] text-white text-[15px] font-semibold transition shadow-sm"
        >
          解锁深度整改白皮书 →
        </button>
      </div>
    </div>
  );
}
