'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Globe, ArrowRight, RefreshCw, Mail, Phone, AlertTriangle, Download, Eye } from 'lucide-react';

interface AuditRequest {
  id: string;
  companyName: string;
  url: string;
  phone: string;
  email: string;
  initialScore: number;
  rawAiReport: string | null;
  createdAt: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [list, setList] = useState<AuditRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuditRequest | null>(null);
  const [editedReport, setEditedReport] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      setToken(urlToken);
    }
  }, []);

  useEffect(() => {
    if (token === null) return;

    if (!token.trim()) {
      setAuthorized(false);
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/reports?token=${encodeURIComponent(token)}`
        );
        if (res.status === 401) {
          setAuthorized(false);
          return;
        }
        const result = await res.json();
        if (result.success) {
          setAuthorized(true);
          setList(result.data ?? result.reports ?? []);
        } else {
          setAuthorized(false);
        }
      } catch {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const fetchPendingList = async () => {
    if (!token?.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports?token=${encodeURIComponent(token)}`
      );
      const result = await res.json();
      if (result.success) {
        setList(result.data ?? result.reports ?? []);
      } else if (res.status === 401) {
        setAuthorized(false);
      }
    } catch (e) {
      console.error('Failed to load pending queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: AuditRequest) => {
    setSelectedItem(item);
    setEditedReport(item.rawAiReport || '');
    setAdminNotes('');
    setGeneratedPdfUrl(null); // Reset preview url on new item selection
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          action,
          editedReport: action === 'APPROVE' ? editedReport : undefined,
          adminNotes: adminNotes
        })
      });

      const result = await res.json();
      if (result.success) {
        if (action === 'APPROVE') {
          setGeneratedPdfUrl(result.reportUrl);
          setList(list.filter(item => item.id !== selectedItem.id));
          alert(
            result.emailMock
              ? '🚀 报告已保存！客户邮箱处于模拟模式，未真实发信。可点击下方预览并打印 PDF。'
              : '🚀 核准成功！报告链接已发送至客户邮箱，您也可点击下方预览并打印 PDF。'
          );
        } else {
          // Splice off rejected items from sidebar
          setList(list.filter(item => item.id !== selectedItem.id));
          setSelectedItem(null);
          setEditedReport('');
          setAdminNotes('');
          alert('❌ 申请已成功驳回。');
        }
      } else {
        alert('操作失败: ' + result.error);
      }
    } catch (e) {
      alert('网络请求异常，请检查后端运行状态。');
    } finally {
      setActionLoading(false);
    }
  };

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col items-center justify-center p-8">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-4xl font-extrabold text-white mb-2">404 - 找不到页面</h1>
        <p className="text-slate-500 text-center max-w-md">
          Token 无效或未配置。请使用与 Vercel 环境变量{" "}
          <code className="text-slate-400">ADMIN_SECRET_TOKEN</code>{" "}
          一致的链接，例如：
          <br />
          <code className="text-slate-400 text-sm mt-2 inline-block">
            /admin/reports?token=dev-admin-123456
          </code>
        </p>
      </div>
    );
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-lg font-bold tracking-wider text-slate-100">MarketUP GEO / AEO 人工审核控制台</span>
        </div>
        <button 
          onClick={fetchPendingList}
          className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition rounded flex items-center space-x-2 text-sm text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新队列</span>
        </button>
      </header>

      {}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left side queue */}
        <aside className="w-1/4 bg-slate-900/50 border-r border-slate-800 flex flex-col flex-shrink-0">
          <div className="p-4 bg-slate-900 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
            待审队列 ({list.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {loading && list.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">拉取数据中...</div>
            ) : list.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center">
                <CheckCircle className="w-8 h-8 text-emerald-500/40 mb-2" />
                <span>没有待审核的深度报告</span>
              </div>
            ) : (
              list.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-4 cursor-pointer text-left transition ${
                    selectedItem?.id === item.id 
                      ? 'bg-blue-600/10 border-l-4 border-blue-500' 
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="font-semibold text-white mb-1 truncate">{item.companyName}</div>
                  <div className="text-xs text-slate-400 mb-2 truncate flex items-center">
                    <Globe className="w-3 h-3 mr-1" /> {item.url}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                      初筛 {item.initialScore}分
                    </span>
                    <span className="text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {}
        <main className="w-3/4 bg-slate-950 flex flex-col overflow-hidden">
          {selectedItem ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Item Summary Bar */}
              <div className="p-6 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.companyName}</h2>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                    <span className="flex items-center"><Globe className="w-4 h-4 mr-1 text-blue-500" /> {selectedItem.url}</span>
                    <span className="flex items-center"><Phone className="w-4 h-4 mr-1 text-purple-500" /> {selectedItem.phone}</span>
                    <span className="flex items-center"><Mail className="w-4 h-4 mr-1 text-emerald-500" /> {selectedItem.email}</span>
                  </div>
                </div>
                <div className="bg-slate-900 px-4 py-2 border border-slate-700 rounded-lg text-center">
                  <span className="text-xs text-slate-500 block uppercase">初筛得分</span>
                  <span className="text-2xl font-extrabold text-blue-400">{selectedItem.initialScore}</span>
                </div>
              </div>

              {}
              <div className="flex-1 p-4 flex flex-col overflow-hidden">
                <div className="text-xs font-semibold text-slate-400 mb-2 uppercase flex items-center justify-between">
                  <span className="flex items-center"><FileText className="w-4 h-4 mr-1" /> 编辑 DeepSeek 原始 Markdown 报告 (可手写微调表格文本)</span>
                  {generatedPdfUrl && (
                    <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> PDF HTML 已成功生成并落地
                    </span>
                  )}
                </div>
                
                <textarea
                  value={editedReport}
                  onChange={(e) => {
                    setEditedReport(e.target.value);
                    if(generatedPdfUrl) setGeneratedPdfUrl(null); // Clear URL on edit modifications to force rebuild
                  }}
                  className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                  placeholder="正在加载 DeepSeek 报告草稿..."
                />
              </div>

              {}
              <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col gap-4 flex-shrink-0">
                {/* Visual download and printer instruction sheet */}
                {generatedPdfUrl && (
                  <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">报告已生成，可预览并打印 PDF</h4>
                        <p className="text-xs text-slate-400 mt-0.5">点击下方按钮打开报告页面，在浏览器中按 <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px]">Ctrl + P</kbd> 并勾选「背景图形」即可另存为 PDF。</p>
                      </div>
                    </div>
                    <a
                      href={generatedPdfUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 active:scale-95 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>预览并打印 PDF</span>
                    </a>
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Notes update textbox */}
                  <input
                    type="text"
                    placeholder="添加审核备注/驳回理由（选填，将记录在数据库中）"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full md:w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-slate-700"
                  />

                  {/* Actions buttons package */}
                  <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAction('REJECT')}
                      className="px-6 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-sm font-semibold flex items-center space-x-2 transition active:scale-95 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>拒绝并驳回</span>
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAction('APPROVE')}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition active:scale-95 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{generatedPdfUrl ? '重新核准生成报告' : '核准并生成 PDF 报告'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 mb-4 text-slate-600 animate-pulse">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">未选择任何审计目标</h3>
              <p className="text-sm text-slate-600 max-w-sm">请在左侧待审核队列中选择一个客户，来加载并审计 DeepSeek 生成的深度 AEO/GEO 诊断报告。</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}