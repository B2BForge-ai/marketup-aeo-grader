"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface AuditReportItem {
  id: string;
  companyName: string;
  url: string;
  phone: string;
  email: string | null;
  initialScore: number;
  rawAiReport: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotFoundPage({ reason }: { reason: "missing" | "invalid" }) {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-[#DDD] mb-4">404</p>
        <p className="text-[#888] text-lg mb-3">对不起，该页面不存在</p>
        {reason === "missing" ? (
          <p className="text-sm text-[#AAA] leading-relaxed">
            请在 URL 末尾加上管理 Token，例如：
            <br />
            <code className="text-[#666]">/admin/reports?token=你的ADMIN_SECRET_TOKEN</code>
          </p>
        ) : (
          <p className="text-sm text-[#AAA] leading-relaxed">
            访问 Token 无效或未在 Vercel 配置{" "}
            <code className="text-[#666]">ADMIN_SECRET_TOKEN</code>
            。请确认环境变量与 URL 中的 token 完全一致后重新部署。
          </p>
        )}
      </div>
    </div>
  );
}

function AdminReportsContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [reports, setReports] = useState<AuditReportItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [reportSuccess, setReportSuccess] = useState<{
    url: string;
    companyName: string;
    email: string;
    emailMock?: boolean;
  } | null>(null);

  const selected = reports.find((r) => r.id === selectedId) ?? null;

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?token=${encodeURIComponent(token)}`);
      if (res.status === 401) {
        setAuthorized(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      setAuthorized(true);
      setReports(data.reports ?? []);
    } catch (err) {
      setToast({
        type: "error",
        msg: err instanceof Error ? err.message : "加载失败",
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setAuthorized(false);
      return;
    }
    fetchReports();
  }, [token, fetchReports]);

  useEffect(() => {
    if (selected) {
      setEditedContent(selected.rawAiReport ?? "");
      setAdminNotes(selected.adminNotes ?? "");
    } else {
      setEditedContent("");
      setAdminNotes("");
    }
  }, [selected]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleAction(action: "APPROVE" | "REJECT") {
    if (!selectedId || !token) return;

    const confirmMsg =
      action === "APPROVE"
        ? "确认核准并将专属报告链接发送至客户企业邮箱？"
        : "确认驳回该申请？";
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedId,
          action,
          editedReport: action === "APPROVE" ? editedContent : undefined,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");

      if (action === "APPROVE" && data.reportUrl) {
        setReportSuccess({
          url: data.reportUrl,
          companyName: data.companyName ?? selected?.companyName ?? "报告",
          email: data.email ?? selected?.email ?? "",
          emailMock: data.emailMock,
        });
      }

      if (action !== "APPROVE") {
        setToast({ type: "success", msg: "已驳回该申请" });
      }
      setSelectedId(null);
      await fetchReports();
    } catch (err) {
      setToast({
        type: "error",
        msg: err instanceof Error ? err.message : "操作失败",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (!token) {
    return <NotFoundPage reason="missing" />;
  }

  if (authorized === false) {
    return <NotFoundPage reason="invalid" />;
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <p className="text-[#888]">验证访问权限...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-[#E8321A] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {reportSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setReportSuccess(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center animate-[fadeInUp_0.3s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-3xl">
              🎉
            </div>
            <h3 className="text-xl font-semibold text-[#0f172a] mb-2">
              {reportSuccess.emailMock
                ? "报告已保存（模拟模式）"
                : "报告链接已发送至客户邮箱！"}
            </h3>
            <p className="text-sm text-[#64748b] mb-4 leading-relaxed">
              {reportSuccess.companyName} · {reportSuccess.email || "企业邮箱"}
            </p>
            <p className="text-xs text-[#94a3b8] mb-5 break-all bg-[#f8fafc] rounded-lg p-3 text-left">
              专属链接（仅邮件收件人应持有）：<br />
              <span className="text-[#2563eb]">{reportSuccess.url}</span>
            </p>
            <a
              href={reportSuccess.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold transition mb-3"
            >
              🔗 预览客户报告页面
            </a>
            <button
              onClick={() => setReportSuccess(null)}
              className="w-full py-2.5 text-sm text-[#64748b] hover:text-[#334155] transition"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-[#E8E8E8] bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-[#111]">
          MarketUP · 深度报告审核后台
        </h1>
        <p className="text-sm text-[#888] mt-1">
          待审核 {reports.length} 条 · 单次审核目标 30 秒内完成
        </p>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* 左侧列表 25% */}
        <div className="w-1/4 min-w-[220px] border-r border-[#E8E8E8] bg-white overflow-y-auto">
          {loading && reports.length === 0 && (
            <p className="p-4 text-sm text-[#888]">加载中...</p>
          )}
          {!loading && reports.length === 0 && (
            <p className="p-4 text-sm text-[#888]">暂无待审核记录 🎉</p>
          )}
          {reports.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full text-left px-4 py-3 border-b border-[#F0F0F0] transition ${
                selectedId === item.id
                  ? "bg-[#FFF5F4] border-l-[3px] border-l-[#E8321A]"
                  : "hover:bg-[#FAFAFA] border-l-[3px] border-l-transparent"
              }`}
            >
              <p className="text-sm font-semibold text-[#111] truncate">
                {item.companyName}
              </p>
              <p className="text-xs text-[#888] truncate mt-1">
                {item.email ?? "无邮箱"}
              </p>
              <p className="text-xs text-[#E8321A] mt-1">
                得分 {item.initialScore}
              </p>
            </button>
          ))}
        </div>

        {/* 右侧编辑区 75% */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-[#AAA]">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">请从左侧选择一条待审核记录</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-white border border-[#E8E8E8] rounded-lg p-5">
                <h2 className="text-lg font-semibold text-[#111] mb-3">
                  {selected.companyName}
                </h2>
                <table className="text-sm text-[#555] w-full">
                  <tbody>
                    <tr>
                      <td className="py-1 pr-4 text-[#888] w-24">官网</td>
                      <td className="py-1">{selected.url}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 text-[#888]">初筛得分</td>
                      <td className="py-1 text-[#E8321A] font-semibold">
                        {selected.initialScore}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 text-[#888]">手机号</td>
                      <td className="py-1">{selected.phone}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 text-[#888]">企业邮箱</td>
                      <td className="py-1">{selected.email ?? "—"}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 text-[#888]">申请时间</td>
                      <td className="py-1">{formatDate(selected.createdAt)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {!selected.rawAiReport && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                  ⏳ AI 报告仍在生成中，请稍后刷新。您也可以先手动粘贴内容再核准发送。
                </div>
              )}

              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="DeepSeek 生成的 Markdown 报告将显示在此，可直接编辑..."
                className="w-full min-h-[420px] p-4 border border-[#E8E8E8] rounded-lg text-sm text-[#333] font-mono leading-relaxed resize-y outline-none focus:border-[#E8321A] bg-white"
              />

              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="管理员备注（可选，驳回时会保存）"
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg text-sm outline-none focus:border-[#E8321A] bg-white"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAction("REJECT")}
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-lg border border-[#E8321A] text-[#E8321A] text-sm font-semibold hover:bg-[#FFF5F4] disabled:opacity-50 transition"
                >
                  🔴 拒绝并驳回
                </button>
                <button
                  onClick={() => handleAction("APPROVE")}
                  disabled={actionLoading || !editedContent.trim()}
                  className="px-6 py-2.5 rounded-lg bg-[#E8321A] text-white text-sm font-semibold hover:bg-[#C82A14] disabled:opacity-50 transition"
                >
                  {actionLoading ? "发送中..." : "🟢 核准并发送报告链接"}
                </button>
                <button
                  onClick={fetchReports}
                  disabled={loading}
                  className="ml-auto px-4 py-2.5 rounded-lg border border-[#E8E8E8] text-sm text-[#666] hover:bg-[#FAFAFA] transition"
                >
                  刷新列表
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
          <p className="text-[#888]">加载中...</p>
        </div>
      }
    >
      <AdminReportsContent />
    </Suspense>
  );
}
