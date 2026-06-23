"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Building2,
  Briefcase,
  Globe,
  CircleCheck,
  AlertCircle,
  Rocket,
  Phone,
} from "lucide-react";
import PillBadge from "./components/PillBadge";
import ExtractedKeywords from "./components/ExtractedKeywords";
import GeoMetricsGrid from "./components/GeoMetricsGrid";
import GeoTechnicalActions from "./components/GeoTechnicalActions";
import ChatPanel from "./components/ChatPanel";
import RejectedLowScoreCard from "./components/RejectedLowScoreCard";
import SweetSpotUnlockCard from "./components/SweetSpotUnlockCard";
import EmailOtpModal from "./components/EmailOtpModal";
import DeepReportSuccess from "./components/DeepReportSuccess";
import type { ExtractedKeyword } from "./components/ExtractedKeywords";
import type { GeoMetrics } from "./components/GeoMetricsGrid";
import type { GeoTechnicalAction } from "./components/GeoTechnicalActions";

type ViewState = "input" | "loading" | "result";

interface GradeResult {
  id?: string;
  score: number;
  extractedKeywords: ExtractedKeyword[];
  geoMetrics: GeoMetrics;
  geoTechnicalActions: GeoTechnicalAction[];
  gaps: string[];
}

const SCORE_THRESHOLD = 40;

const LOADING_LOGS = [
  "正在验证官网是否可以正常访问...",
  "正在读取首页标题与描述文案...",
  "正在识别 3 个高价值搜索关键词...",
  "正在计算官网文案与关键词的匹配程度...",
  "正在评估官网内容质量指标...",
  "正在生成优化建议与可复制方案...",
  "正在整理问题清单...",
  "诊断报告已生成",
];

function getScoreLabel(score: number) {
  if (score >= 80) return "良好";
  if (score >= 60) return "中等";
  return "偏低";
}

function getScoreSummary(score: number) {
  if (score >= 80)
    return "您的官网内容与核心搜索词匹配较好，结构化和数据支撑较完整，被 AI 搜索引用和推荐的概率较高。";
  if (score >= 60)
    return "您的官网已有一定基础，但部分关键词匹配不足、缺少结构化内容，AI 搜索时可能优先推荐竞品。";
  return "您的官网与行业核心搜索词重合较少，AI 搜索时较难被关联到您的品牌，建议优先优化标题和描述文案。";
}

function countSevereGaps(result: GradeResult): number {
  const lowKeywords =
    result.extractedKeywords?.filter(
      (k) => (k.semanticSimilarity ?? 100) < 60
    ).length ?? 0;
  const gapCount = result.gaps?.length ?? 0;
  return Math.max(gapCount, lowKeywords, 1);
}

const inputClass =
  "w-full bg-white border border-[#E8E8E8] rounded-lg px-3.5 py-3 text-[15px] text-[#111] outline-none transition focus:border-[#E8321A] placeholder:text-[#AAA]";

export default function Home() {
  const [view, setView] = useState<ViewState>("input");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [sendingSms, setSendingSms] = useState(false);
  const [auditRequestId, setAuditRequestId] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState("");
  const [loadingLogIndex, setLoadingLogIndex] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [deepReportVerified, setDeepReportVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    if (view !== "loading") return;
    setLoadingLogIndex(0);
    const timer = setInterval(() => {
      setLoadingLogIndex((i) => Math.min(i + 1, LOADING_LOGS.length - 1));
    }, 1800);
    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (smsCountdown <= 0) return;
    const timer = setTimeout(() => setSmsCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [smsCountdown]);

  async function handleSendSmsCode() {
    if (phone.trim().length !== 11) {
      setError("请先输入有效的 11 位手机号");
      return;
    }

    setSendingSms(true);
    setError("");
    try {
      const res = await fetch("/api/auth/sms-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "验证码发送失败");
      setSmsCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingSms(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !industry.trim() || !websiteUrl.trim() || !phone.trim() || !smsCode.trim()) return;

    setError("");
    setDeepReportVerified(false);
    setVerifiedEmail("");
    setAuditRequestId("");
    setShowOtpModal(false);
    setView("loading");

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          industry,
          websiteUrl,
          phone,
          smsCode: smsCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "诊断失败");

      setAuditRequestId(data.id ?? "");
      setResult(data);
      setView("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "诊断失败，请重试");
      setView("input");
    }
  }

  function handleReset() {
    setView("input");
    setResult(null);
    setDeepReportVerified(false);
    setVerifiedEmail("");
    setAuditRequestId("");
    setShowOtpModal(false);
    setWebsiteUrl("");
    setPhone("");
    setSmsCode("");
    setSmsCountdown(0);
    setError("");
  }

  function handleOtpVerified(email: string) {
    setShowOtpModal(false);
    setVerifiedEmail(email);
    setDeepReportVerified(true);
  }

  const isQualified = (result?.score ?? 0) >= SCORE_THRESHOLD;

  return (
    <main className="min-h-screen bg-[#F7F7F7] flex justify-center items-start py-8 px-4">
      <div className="w-full max-w-[680px] bg-white border border-[#E8E8E8] rounded-xl overflow-hidden min-h-[560px] flex flex-col shadow-sm">
        {view === "input" && (
          <div className="flex flex-col items-center justify-center px-6 sm:px-10 py-14 animate-[fadeIn_0.4s_ease-out]">
            <PillBadge />
            <p className="text-xs text-[#999] text-center mt-6 mb-1">
              本检测服务由{" "}
              <span className="font-medium text-[#E8321A]">MarketUP</span>{" "}
              提供技术支持
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-semibold text-[#111] text-center leading-[1.3] mt-4 mb-3">
              当用户问 AI，
              <br />
              你的<span className="text-[#E8321A]">品牌</span>会被推荐吗？
            </h1>
            <p className="text-[15px] text-[#666] text-center mb-6 leading-relaxed max-w-[440px]">
              填写企业信息，约 30 秒自动生成诊断报告：分析官网与搜索词的匹配程度，并给出可直接复制的优化方案。
            </p>

            <div className="w-full max-w-[440px] mb-5 px-3.5 py-3 bg-[#FFF9F8] border border-[#FFDDD8] rounded-lg text-xs text-[#666] leading-relaxed">
              每位用户限 <strong className="text-[#444] font-medium">1 次</strong>{" "}
              免费初筛（同一手机号）与{" "}
              <strong className="text-[#444] font-medium">1 次</strong>{" "}
              深度报告（同一企业邮箱）。如需再次检测，敬请关注 MarketUP
              后续活动与官方渠道，获取更多机会。
            </div>

            <form
              onSubmit={handleSubmit}
              className="w-full max-w-[440px] bg-[#F9F9F9] border border-[#EFEFEF] rounded-xl p-6"
            >
              <div className="mb-4">
                <label className="text-sm font-medium text-[#444] mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#E8321A]" />
                  公司名称
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="例：MarketUP 科技有限公司"
                  required
                  className={inputClass}
                />
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-[#444] mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#E8321A]" />
                  主营行业
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="例：B2B 营销自动化 SaaS"
                  required
                  className={inputClass}
                />
              </div>
              <div className="mb-5">
                <label className="text-sm font-medium text-[#444] mb-2 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#E8321A]" />
                  企业官网 URL
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="例：www.marketup.cn"
                  required
                  className={inputClass}
                />
              </div>
              <div className="mb-5">
                <label className="text-sm font-medium text-[#444] mb-2 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#E8321A]" />
                  联系手机号
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
                    setError("");
                  }}
                  placeholder="11 位手机号，用于接收诊断跟进"
                  required
                  maxLength={11}
                  className={inputClass}
                />
              </div>
              <div className="mb-5">
                <label className="text-sm font-medium text-[#444] mb-2 block">
                  手机验证码
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={smsCode}
                    onChange={(e) => {
                      setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setError("");
                    }}
                    placeholder="6 位短信验证码"
                    required
                    maxLength={6}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleSendSmsCode}
                    disabled={
                      sendingSms || smsCountdown > 0 || phone.trim().length !== 11
                    }
                    className="shrink-0 px-4 rounded-lg border border-[#E8321A] text-[#E8321A] text-sm font-medium hover:bg-[#FFF5F4] disabled:opacity-40 disabled:cursor-not-allowed transition whitespace-nowrap"
                  >
                    {sendingSms
                      ? "发送中..."
                      : smsCountdown > 0
                        ? `${smsCountdown}s`
                        : "获取验证码"}
                  </button>
                </div>
                <p className="text-xs text-[#999] mt-2">
                  验证码由 MarketUP 短信服务发送，与官网表单验证逻辑一致。
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[#E8321A] text-sm bg-[#FEF0EE] border border-[#FFCCC8] rounded-lg px-3.5 py-3 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-lg bg-[#E8321A] hover:bg-[#C82A14] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition"
              >
                <Search className="w-4 h-4" />
                开始免费诊断
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 text-sm text-[#666]">
              <span className="flex items-center gap-1.5">
                <CircleCheck className="w-4 h-4 text-[#E8321A]" />
                1,500+ 企业已检测
              </span>
              <span className="text-[#DDD]">·</span>
              <span className="flex items-center gap-1.5">
                <CircleCheck className="w-4 h-4 text-[#E8321A]" />
                续约率 91%
              </span>
              <span className="text-[#DDD]">·</span>
              <span className="flex items-center gap-1.5">
                <CircleCheck className="w-4 h-4 text-[#E8321A]" />
                6 大行业深耕
              </span>
            </div>
          </div>
        )}

        {view === "loading" && (
          <div className="flex flex-col items-center justify-center px-6 sm:px-10 py-14 bg-[#FAFAFA] flex-1 animate-[fadeIn_0.4s_ease-out]">
            <PillBadge />
            <div
              className="w-[72px] h-[72px] rounded-full border-2 border-[#F0F0F0] border-t-[#E8321A] border-r-[#E8321A] mt-9 mb-7"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <h2 className="text-xl font-semibold text-[#111] mb-2">
              正在分析您的官网...
            </h2>
            <p className="text-[15px] text-[#666] mb-6 text-center leading-relaxed max-w-[400px]">
              系统正在读取{" "}
              <span className="text-[#E8321A]">{websiteUrl}</span>{" "}
              的页面内容，提取搜索关键词并生成诊断报告，请稍候。
            </p>
            <div className="w-full max-w-[480px] bg-[#111] rounded-[10px] px-4 py-4 font-mono text-[13px] leading-8 min-h-[120px]">
              {LOADING_LOGS.slice(0, loadingLogIndex + 1).map((log, i) => (
                <div key={i}>
                  <span className="text-[#E8321A]">&gt; </span>
                  <span
                    className={
                      i === LOADING_LOGS.length - 1 &&
                      loadingLogIndex === LOADING_LOGS.length - 1
                        ? "text-[#34D399]"
                        : "text-[#888]"
                    }
                  >
                    {log}
                  </span>
                  {i === loadingLogIndex &&
                    loadingLogIndex < LOADING_LOGS.length - 1 && (
                      <span className="inline-block w-1.5 h-3 bg-[#E8321A] ml-0.5 align-middle animate-blink" />
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "result" && result && (
          <div className="px-6 sm:px-8 py-10 overflow-y-auto flex-1 animate-[fadeInUp_0.5s_ease-out]">
            <div className="max-w-[580px] mx-auto space-y-8">
              <PillBadge />

              <div className="flex items-center gap-5 p-5 bg-[#FEF0EE] rounded-xl">
                <div className="text-center shrink-0">
                  <div className="text-[40px] font-bold text-[#E8321A] leading-none tabular-nums">
                    {result.score}
                  </div>
                  <div className="text-xs font-medium text-[#C0937A] mt-1">
                    AI 搜索可见度
                  </div>
                </div>
                <div className="w-px h-14 bg-[#FFCCC8] shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-[#111] mb-1.5">
                    综合评级：{getScoreLabel(result.score)}
                  </h3>
                  <p className="text-sm text-[#666] leading-relaxed">
                    {getScoreSummary(result.score)}
                  </p>
                </div>
              </div>

              {result.extractedKeywords?.length > 0 && (
                <ExtractedKeywords keywords={result.extractedKeywords} />
              )}

              {!isQualified && <RejectedLowScoreCard />}

              {isQualified && (
                <>
                  {deepReportVerified ? (
                    <DeepReportSuccess
                      companyName={companyName}
                      email={verifiedEmail}
                      onReset={handleReset}
                    />
                  ) : (
                    <SweetSpotUnlockCard
                      severeCount={countSevereGaps(result)}
                      onUnlock={() => setShowOtpModal(true)}
                    />
                  )}

                  {result.geoMetrics && (
                    <GeoMetricsGrid metrics={result.geoMetrics} />
                  )}

                  {result.geoTechnicalActions?.length > 0 && (
                    <GeoTechnicalActions
                      actions={result.geoTechnicalActions}
                    />
                  )}

                  {result.gaps?.length > 0 && (
                    <section>
                      <div className="mb-3">
                        <h3 className="text-base font-semibold text-[#111] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-[#E8321A]" />
                          发现的问题
                        </h3>
                        <p className="text-sm text-[#666] mt-1.5">
                          以下是目前影响 AI 搜索引用您官网的主要问题。
                        </p>
                      </div>
                      <div className="space-y-2">
                        {result.gaps.map((gap, i) => (
                          <div
                            key={i}
                            className="flex gap-2.5 px-3.5 py-3 border-l-2 border-[#FFCCC8] bg-[#FEF9F9] rounded-r-lg"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8321A] shrink-0 mt-2" />
                            <p className="text-sm text-[#555] leading-relaxed">
                              {gap}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="bg-[#FFF5F4] border border-[#FFCCC8] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#FEE0DC] flex items-center justify-center shrink-0">
                      <Rocket className="w-5 h-5 text-[#E8321A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-[15px] font-semibold text-[#111] block mb-1">
                        想提升 AI 搜索中的品牌曝光？
                      </strong>
                      <span className="text-sm text-[#666]">
                        MarketUP 可帮您一键配置语义化官网，让大模型更快收录您的内容
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        alert("感谢关注！MarketUP 专家将尽快与您联系。")
                      }
                      className="bg-[#E8321A] hover:bg-[#C82A14] text-white border-none rounded-lg px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition shrink-0 w-full sm:w-auto text-center"
                    >
                      立即咨询 →
                    </button>
                  </div>

                  {!deepReportVerified && (
                    <ChatPanel
                      companyName={companyName}
                      industry={industry}
                      report={result as unknown as Record<string, unknown>}
                    />
                  )}

                  {!deepReportVerified && (
                    <button
                      onClick={handleReset}
                      className="w-full bg-transparent border border-[#E8E8E8] rounded-lg py-3 text-sm text-[#888] hover:border-[#CCC] hover:text-[#666] transition"
                    >
                      ← 重新检测其他企业
                    </button>
                  )}
                </>
              )}

              {!isQualified && (
                <button
                  onClick={handleReset}
                  className="w-full bg-transparent border border-[#E8E8E8] rounded-lg py-3 text-sm text-[#888] hover:border-[#CCC] hover:text-[#666] transition"
                >
                  ← 重新检测其他企业
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {result && isQualified && auditRequestId && (
        <EmailOtpModal
          open={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          onVerified={handleOtpVerified}
          auditRequestId={auditRequestId}
          industry={industry}
          gradeSnapshot={result as unknown as Record<string, unknown>}
        />
      )}
    </main>
  );
}
