"use client";

import { AlertTriangle } from "lucide-react";

export default function RejectedLowScoreCard() {
  return (
    <div className="rounded-xl border border-[#FFCCC8] bg-[#FEF9F9] p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FEE0DC] flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-[#E8321A]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#111] mb-2">
            诊断提示
          </h3>
          <p className="text-sm text-[#555] leading-relaxed">
            由于您的站点基础语义密度过低，大模型爬虫无法建立有效索引。建议先使用
            MarketUP 智能建站模块重构站点。
          </p>
        </div>
      </div>
    </div>
  );
}
