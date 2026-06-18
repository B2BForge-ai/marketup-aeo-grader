"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Building2,
  Briefcase,
  TrendingUp,
  Heart,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
  Shield,
  Target,
} from "lucide-react";
import CompetitionRadar from "./components/CompetitionRadar";
import ChatPanel from "./components/ChatPanel";

type ViewState = "input" | "loading" | "result";

interface ModelDetail {
  score: number;
  status: string;
}

interface ModelsDetail {
  deepseek: ModelDetail;
  kimi: ModelDetail;
  doubao: ModelDetail;
}

interface CompetitorBrand {
  name: string;
  score: number;
  sov: string;
  tag: string;
  advantage: string;
}

interface GradeResult {
  score: number;
  sentiment: string;
  presenceRate: string;
  evaluation: string;
  modelsDetail?: ModelsDetail;
  competitors?: CompetitorBrand[];
  gaps: string[];
  actions: string[];
}

const LOADING_LOGS = [
  "正在连接 DeepSeek API...",
  "正在连接 Kimi 语义检索节点...",
  "正在连接豆包 品牌知识库...",
  "正在检索百度索引 2026 最新收录...",
  "正在抓取知乎 行业讨论与问答数据...",
  "正在扫描微信公众号 近期品牌内容...",
  "正在聚合全网多源语义数据集...",
  "正在注入品牌探测 Prompts...",
  "正在计算竞品 AEO 雷达对比...",
  "预计还需要 10 秒...",
];

const PLATFORM_META: { key: keyof ModelsDetail; label: string; color: string }[] = [
  { key: "deepseek", label: "DeepSeek", color: "text-blue-400" },
  { key: "kimi", label: "Kimi", color: "text-violet-400" },
  { key: "doubao", label: "豆包", color: "text-orange-400" },
];

function getScoreColor(score: number) {
  if (score < 60)
    return {
      ring: "stroke-red-500",
      text: "text-red-400",
      bg: "from-red-500/20 to-red-600/10",
    };
  if (score <= 80)
    return {
      ring: "stroke-yellow-400",
      text: "text-yellow-400",
      bg: "from-yellow-500/20 to-yellow-600/10",
    };
  return {
    ring: "stroke-emerald-400",
    text: "text-emerald-400",
    bg: "from-emerald-500/20 to-emerald-600/10",
  };
}

function getStatusBadge(status: string) {
  if (status.includes("高风险") || status.includes("需优化"))
    return "bg-red-500/15 text-red-400 border-red-500/30";
  if (status.includes("优异") || status.includes("优秀"))
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
}

function ScoreGauge({ score }: { score: number }) {
  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" className="-rotate-90">
        <circle
          cx="110"
          cy="110"
          r="90"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="12"
        />
        <circle
          cx="110"
          cy="110"
          r="90"
          fill="none"
          className={colors.ring}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-6xl font-bold tabular-nums ${colors.text}`}>
          {score}
        </span>
        <span className="text-sm text-slate-400 mt-1">AEO 可见度得分</span>
      </div>
    </div>
  );
}

function UnlockModal({
  contact,
  onContactChange,
  onUnlock,
  error,
}: {
  contact: string;
  onContactChange: (v: string) => void;
  onUnlock: () => void;
  error: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#0f1629] border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-900/40 p-8 animate-[fadeInUp_0.4s_ease-out_forwards]">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-center mb-2">
          🔒 您的企业 AEO 深度审计报告已生成
        </h3>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">
          请输入您的手机号 / 企业邮箱，以解锁完整 Gap 漏洞分析与 AEO 纠偏行动清单。
        </p>

        <input
          type="text"
          value={contact}
          onChange={(e) => onContactChange(e.target.value)}
          placeholder="手机号或企业邮箱"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition mb-3"
        />

        {error && (
          <p className="text-red-400 text-sm mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          onClick={onUnlock}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 font-semibold transition-all shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Shield className="w-5 h-5" />
          解锁完整报告
        </button>

        <p className="text-slate-500 text-xs text-center mt-4">
          信息仅用于报告交付，MarketUP 严格保护您的隐私
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<ViewState>("input");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState("");
  const [loadingLogIndex, setLoadingLogIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    if (view !== "loading") return;
    setLoadingLogIndex(0);
    const timer = setInterval(() => {
      setLoadingLogIndex((i) => Math.min(i + 1, LOADING_LOGS.length - 1));
    }, 2000);
    return () => clearInterval(timer);
  }, [view]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !industry.trim()) return;

    setError("");
    setUnlocked(false);
    setContact("");
    setContactError("");
    setView("loading");

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          industry,
          competitor: competitor.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "诊断失败");
      }

      setResult(data);
      setView("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "诊断失败，请重试");
      setView("input");
    }
  }

  function handleUnlock() {
    const trimmed = contact.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^1[3-9]\d{9}$/.test(trimmed);

    if (!trimmed) {
      setContactError("请输入手机号或企业邮箱");
      return;
    }
    if (!isEmail && !isPhone) {
      setContactError("请输入有效的手机号或企业邮箱");
      return;
    }

    setContactError("");
    setUnlocked(true);
  }

  function handleReset() {
    setView("input");
    setResult(null);
    setUnlocked(false);
    setContact("");
    setContactError("");
    setCompetitor("");
    setError("");
  }

  const blurClass = unlocked
    ? ""
    : "blur-md select-none pointer-events-none";

  return (
    <main className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 sm:py-20">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm">
            <Sparkles className="w-4 h-4" />
            AI Search Grader · Powered by 智谱 GLM
          </div>
        </div>

        {/* INPUT */}
        {view === "input" && (
          <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center leading-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-violet-200 bg-clip-text text-transparent">
              AI 搜索时代，大模型能推荐你的品牌吗？
            </h1>
            <p className="text-center text-slate-400 text-base sm:text-lg mb-10 max-w-xl mx-auto">
              输入公司与行业，30 秒免费获取《企业 AEO 可见度诊断报告》
            </p>

            <form
              onSubmit={handleSubmit}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl"
            >
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  公司名称
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="例：MarketUP 科技有限公司"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Briefcase className="w-4 h-4 text-violet-400" />
                  行业 / 主营产品
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="例：B2B 营销自动化 SaaS"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 transition"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Target className="w-4 h-4 text-orange-400" />
                  主要竞争对手品牌
                  <span className="text-slate-500 font-normal text-xs">
                    选填，若不填 AI 将自动匹配行业死敌
                  </span>
                </label>
                <input
                  type="text"
                  value={competitor}
                  onChange={(e) => setCompetitor(e.target.value)}
                  placeholder="例：HubSpot, Salesforce（可填 1-2 个，逗号分隔）"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 transition"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 font-semibold text-lg transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-5 h-5" />
                立即检测
              </button>
            </form>
          </div>
        )}

        {/* LOADING */}
        {view === "loading" && (
          <div className="flex flex-col items-center justify-center p-12 text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-blue-500/40 animate-pulse" />
              <div
                className="absolute inset-4 rounded-full border border-blue-500/20"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, rgba(59,130,246,0.3) 60deg, transparent 120deg)",
                  animation: "spin 3s linear infinite",
                }}
              />
              <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin" />
              <div className="absolute w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            </div>

            <h3 className="text-xl font-semibold mb-2">
              全网 AI 曝光度深度审计中...
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              正在对 <span className="text-blue-300">{companyName}</span>{" "}
              进行多平台雷达扫描
            </p>

            <div className="w-full max-w-md bg-black border border-slate-800 rounded-lg p-4 text-left font-mono text-sm text-green-400 space-y-1.5 min-h-[160px]">
              {LOADING_LOGS.slice(0, loadingLogIndex + 1).map((log, i) => (
                <div
                  key={i}
                  className={
                    i === loadingLogIndex ? "animate-pulse text-green-300" : ""
                  }
                >
                  &gt; {log}
                  {i < loadingLogIndex && (
                    <span className="text-slate-500"> OK</span>
                  )}
                </div>
              ))}
              <div className="animate-pulse text-green-300/60">_</div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {view === "result" && result && (
          <>
            {!unlocked && (
              <UnlockModal
                contact={contact}
                onContactChange={setContact}
                onUnlock={handleUnlock}
                error={contactError}
              />
            )}

            <div className="opacity-0 animate-[fadeInUp_0.7s_ease-out_forwards] space-y-6">
              {/* 整体得分 — 始终清晰 */}
              <div
                className={`flex flex-col items-center py-6 rounded-2xl bg-gradient-to-b ${getScoreColor(result.score).bg} border border-white/10`}
              >
                <ScoreGauge score={result.score} />
                {!unlocked && (
                  <p className="text-slate-400 text-sm mt-4 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    完整报告已生成，留资后即可解锁下方详情
                  </p>
                )}
              </div>

              {unlocked &&
                result.competitors &&
                result.competitors.length > 0 && (
                  <CompetitionRadar
                    competitors={result.competitors}
                    companyName={companyName}
                  />
                )}

              {/* 三平台分项 + 核心指标 — 留资前可见（制造紧迫感） */}
              <div className="space-y-6">
                {result.modelsDetail && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PLATFORM_META.map(({ key, label, color }) => {
                      const detail = result.modelsDetail![key];
                      if (!detail) return null;
                      return (
                        <div
                          key={key}
                          className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 text-center"
                        >
                          <p className={`text-sm font-medium ${color} mb-1`}>
                            {label}
                          </p>
                          <p
                            className={`text-3xl font-bold tabular-nums ${getScoreColor(detail.score).text}`}
                          >
                            {detail.score}
                          </p>
                          <span
                            className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs border ${getStatusBadge(detail.status)}`}
                          >
                            {detail.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      AI 提及率
                    </div>
                    <p className="text-3xl font-bold text-blue-300">
                      {result.presenceRate}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <Heart className="w-4 h-4 text-pink-400" />
                      AI 情感态度
                    </div>
                    <p className="text-2xl font-bold text-pink-300">
                      {result.sentiment}
                    </p>
                  </div>
                </div>

                {/* Evaluation / Gaps / Actions — 留资前模糊 */}
                <div
                  className={`space-y-6 transition-all duration-500 ${blurClass}`}
                >
                  <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-3 text-slate-200">
                      AI 眼中的你
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {result.evaluation}
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur border border-orange-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-orange-300 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      发现的信息断层 (Gaps)
                    </h3>
                    <ul className="space-y-3">
                      {result.gaps.map((gap, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/5 backdrop-blur border border-emerald-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      AEO 核心优化建议 (Actions)
                    </h3>
                    <ul className="space-y-3">
                      {result.actions.map((action, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {unlocked && (
                  <div className="bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/30 rounded-2xl p-6 sm:p-8 text-center">
                    <p className="text-slate-200 text-base sm:text-lg mb-5 leading-relaxed">
                      💡 诊断显示 AI 爬虫无法完美建立您的品牌认知。想要抢占第一波
                      AI 搜索红利？
                    </p>
                    <button
                      onClick={() =>
                        alert("感谢关注！MarketUP 专家将尽快与您联系。")
                      }
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 font-semibold text-lg transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.03] active:scale-[0.98]"
                    >
                      立即联系 MarketUP 专家配置 AEO 语义网站
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {unlocked && (
                  <ChatPanel
                    companyName={companyName}
                    industry={industry}
                    report={result as unknown as Record<string, unknown>}
                  />
                )}
              </div>

              {unlocked && (
                <button
                  onClick={handleReset}
                  className="w-full py-3 text-slate-400 hover:text-white text-sm transition"
                >
                  ← 重新检测其他品牌
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
