import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { generateDeepReportMarkdown } from "@/lib/deep-report";
import { validateEnterpriseEmail } from "@/lib/email-validation";
import { verifyOtp } from "@/lib/otp-store";
import { prisma } from "@/lib/prisma";
import {
  isEmailUsedForDeepReport,
  EMAIL_USAGE_LIMIT_MESSAGE,
  normalizeEmailForLookup,
} from "@/lib/usage-limit";

export const maxDuration = 300;

interface DeepGenerateBody {
  id?: string;
  email?: string;
  otpCode?: string;
  industry?: string;
  gradeSnapshot?: Record<string, unknown>;
}

async function generateAndSaveReport(params: {
  auditId: string;
  industry: string;
  gradeSnapshot: Record<string, unknown>;
}) {
  const record = await prisma.auditRequest.findUnique({
    where: { id: params.auditId },
  });

  if (!record) {
    console.error(`Audit record not found: ${params.auditId}`);
    return;
  }

  try {
    const markdown = await generateDeepReportMarkdown({
      companyName: record.companyName,
      industry: params.industry,
      websiteUrl: record.url,
      score: record.initialScore,
      gradeSnapshot: params.gradeSnapshot,
    });

    await prisma.auditRequest.update({
      where: { id: params.auditId },
      data: { rawAiReport: markdown },
    });
  } catch (err) {
    console.error(
      `Async deep report generation failed for audit ${params.auditId}:`,
      err
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DeepGenerateBody = await request.json();
    const { id, email, otpCode, industry, gradeSnapshot } = body;

    if (!id?.trim() || !email?.trim() || !otpCode?.trim()) {
      return NextResponse.json(
        { error: "缺少必要参数：id、email、otpCode" },
        { status: 400 }
      );
    }

    const emailCheck = validateEnterpriseEmail(email);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    if (await isEmailUsedForDeepReport(email, id.trim())) {
      return NextResponse.json({ error: EMAIL_USAGE_LIMIT_MESSAGE }, { status: 409 });
    }

    const otpResult = await verifyOtp(email, otpCode);
    if (!otpResult.ok) {
      return NextResponse.json({ error: otpResult.error }, { status: 400 });
    }

    const record = await prisma.auditRequest.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: "审计记录不存在" }, { status: 404 });
    }

    if (record.hasRequestedDeepReport && record.status === "PENDING_REVIEW") {
      return NextResponse.json({
        success: true,
        message: "verified",
        id: record.id,
      });
    }

    await prisma.auditRequest.update({
      where: { id },
      data: {
        email: normalizeEmailForLookup(email),
        hasRequestedDeepReport: true,
        status: "PENDING_REVIEW",
      },
    });

    const snapshot = gradeSnapshot ?? {};

    after(async () => {
      await generateAndSaveReport({
        auditId: id,
        industry: industry?.trim() || "未提供",
        gradeSnapshot: snapshot,
      });
    });

    return NextResponse.json({
      success: true,
      message: "verified",
      id,
    });
  } catch (error) {
    console.error("Deep generate error:", error);
    return NextResponse.json(
      { error: "验证失败，请稍后重试" },
      { status: 500 }
    );
  }
}
