"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import {
  isPublicEmail,
  isValidEmailFormat,
  PUBLIC_EMAIL_ERROR,
} from "@/lib/email-validation";

const inputClass =
  "w-full bg-white border border-[#E8E8E8] rounded-lg px-3.5 py-3 text-[15px] text-[#111] outline-none transition focus:border-[#E8321A] placeholder:text-[#AAA] disabled:opacity-50";

interface EmailOtpModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: (email: string) => void;
  auditRequestId: string;
  industry: string;
  gradeSnapshot: Record<string, unknown>;
}

export default function EmailOtpModal({
  open,
  onClose,
  onVerified,
  auditRequestId,
  industry,
  gradeSnapshot,
}: EmailOtpModalProps) {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setOtpCode("");
    setEmailError("");
    setSubmitError("");
    setCountdown(0);
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const isPublic =
    email.trim() !== "" && isPublicEmail(email);
  const canSendCode =
    isValidEmailFormat(email) && !isPublic && countdown === 0 && !sending;

  function validateEmailField(): boolean {
    if (!isValidEmailFormat(email)) {
      setEmailError("请输入有效的企业工作邮箱");
      return false;
    }
    if (isPublicEmail(email)) {
      setEmailError(PUBLIC_EMAIL_ERROR);
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handleSendOtp() {
    if (!validateEmailField()) return;

    setSending(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setCountdown(60);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmailField()) return;
    if (!otpCode.trim()) {
      setSubmitError("请输入验证码");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/report/deep-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: auditRequestId,
          email: email.trim(),
          otpCode: otpCode.trim(),
          industry,
          gradeSnapshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "验证失败");
      onVerified(email.trim());
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white border border-[#EFEFEF] rounded-2xl shadow-xl p-6 animate-[fadeInUp_0.3s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#999] hover:text-[#666] transition"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-[#111] mb-1 pr-8">
          企业邮箱验证
        </h3>
        <p className="text-sm text-[#666] mb-2 leading-relaxed">
          深度白皮书将发送至您的企业工作邮箱，请先完成验证。
        </p>
        <p className="text-xs text-[#999] mb-5 leading-relaxed">
          每个企业邮箱仅可申请 1 次深度报告；如需再次获取，请关注 MarketUP
          后续活动。
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#444] mb-2 block">
              企业工作邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
                setSubmitError("");
              }}
              placeholder="name@yourcompany.com"
              className={`${inputClass} ${emailError ? "border-[#E8321A]" : ""}`}
            />
            {emailError && (
              <p className="text-[#E8321A] text-sm mt-2 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-[#444] mb-2 block">
              邮箱验证码
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ""));
                  setSubmitError("");
                }}
                placeholder="6 位数字"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!canSendCode}
                className="shrink-0 px-4 rounded-lg border border-[#E8321A] text-[#E8321A] text-sm font-medium hover:bg-[#FFF5F4] disabled:opacity-40 disabled:cursor-not-allowed transition whitespace-nowrap"
              >
                {sending
                  ? "发送中..."
                  : countdown > 0
                    ? `${countdown}s`
                    : "获取验证码"}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="text-[#E8321A] text-sm flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || isPublic}
            className="w-full py-3.5 rounded-lg bg-[#E8321A] hover:bg-[#C82A14] text-white text-[15px] font-semibold disabled:opacity-50 transition"
          >
            {submitting ? "验证中..." : "验证并生成深度报告"}
          </button>
        </form>
      </div>
    </div>
  );
}
