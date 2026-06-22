"use client";

import { CheckCircle2 } from "lucide-react";

interface DeepReportSuccessProps {
  companyName: string;
  email: string;
  onReset: () => void;
}

export default function DeepReportSuccess({
  companyName,
  email,
  onReset,
}: DeepReportSuccessProps) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center relative overflow-hidden animate-[fadeInUp_0.5s_ease-out]">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-ping"
            style={{
              left: `${10 + (i * 7) % 80}%`,
              top: `${15 + (i * 11) % 60}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: "2s",
            }}
          />
        ))}
      </div>

      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-[fadeIn_0.4s_ease-out]">
          <CheckCircle2 className="w-9 h-9 text-emerald-500" />
        </div>

        <h3 className="text-xl font-semibold text-[#111] mb-4">
          🎉 验证成功！
        </h3>

        <div className="text-sm text-[#555] leading-relaxed space-y-3 text-left bg-white/80 rounded-lg p-4 border border-emerald-100">
          <p>
            系统已将{" "}
            <strong className="text-[#111]">{companyName}</strong>{" "}
            锁定为高优先度审计目标。
          </p>
          <p>
            🧠 DeepSeek 专家大脑正在全力为您生成 5000 字的《GEO
            深度整改与 AI 爬虫诱饵代码白皮书》，生成后将进入人工审核队列。
          </p>
          <p>
            📧 专家核准后，专属报告链接将发送至您的企业邮箱：
            <strong className="text-[#111]">{email}</strong>
            。链接仅对您有效，请勿转发。人工审核通过后即刻送达（如未收到请检查垃圾箱）。
          </p>
        </div>

        <button
          onClick={onReset}
          className="mt-5 w-full py-3 rounded-lg border border-[#E8E8E8] text-sm text-[#666] hover:bg-[#FAFAFA] transition"
        >
          ← 重新检测其他企业
        </button>
      </div>
    </div>
  );
}
