import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { convertMarkdownToPdfHtml } from "@/lib/pdf-template";
import {
  buildReportViewUrl,
  generateReportAccessToken,
} from "@/lib/report-access";
import { isEmailMockMode, sendReportLinkEmail } from "@/lib/email";

export const maxDuration = 60;

function validateAdminToken(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get("token");

  const authHeader = request.headers.get("Authorization");
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  const expectedToken = process.env.ADMIN_SECRET_TOKEN?.trim();

  if (!expectedToken) {
    console.error("[ERROR] ADMIN_SECRET_TOKEN is not configured.");
    return false;
  }

  return queryToken === expectedToken || headerToken === expectedToken;
}

export async function GET(request: Request) {
  try {
    if (!validateAdminToken(request)) {
      return NextResponse.json(
        { error: "Unauthorized: 凭证无效或缺失" },
        { status: 401 }
      );
    }

    const pendingRequests = await prisma.auditRequest.findMany({
      where: {
        status: "PENDING_REVIEW",
        hasRequestedDeepReport: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: pendingRequests });
  } catch (error) {
    console.error("[GET pending requests error]:", error);
    return NextResponse.json({ error: "获取审核列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateAdminToken(request)) {
      return NextResponse.json(
        { error: "Unauthorized: 凭证无效或缺失" },
        { status: 401 }
      );
    }

    const { id, action, editedReport, adminNotes } = await request.json();

    if (!id?.trim() || !action) {
      return NextResponse.json(
        { error: "Missing required parameters: id, action" },
        { status: 400 }
      );
    }

    const auditRequest = await prisma.auditRequest.findUnique({
      where: { id: id.trim() },
    });

    if (!auditRequest) {
      return NextResponse.json({ error: "未找到对应的诊断记录" }, { status: 404 });
    }

    if (auditRequest.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: `当前状态为 ${auditRequest.status}，无法审核` },
        { status: 409 }
      );
    }

    if (action === "REJECT") {
      await prisma.auditRequest.update({
        where: { id: id.trim() },
        data: {
          status: "REJECTED",
          adminNotes: adminNotes?.trim() || "不合规企业，已拒绝生成报告",
        },
      });
      return NextResponse.json({ success: true, message: "报告申请已成功拒绝" });
    }

    if (action !== "APPROVE") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const finalReportMarkdown =
      editedReport?.trim() || auditRequest.rawAiReport?.trim() || "";

    if (!finalReportMarkdown) {
      return NextResponse.json(
        { error: "没有可以生成的报告文本内容" },
        { status: 400 }
      );
    }

    if (!auditRequest.email?.trim()) {
      return NextResponse.json(
        { error: "该记录缺少企业邮箱，无法发送报告链接" },
        { status: 400 }
      );
    }

    const richReportHtml = convertMarkdownToPdfHtml(
      finalReportMarkdown,
      auditRequest.companyName,
      auditRequest.initialScore
    );

    const accessToken = generateReportAccessToken();
    const reportUrl = buildReportViewUrl(accessToken);

    try {
      await sendReportLinkEmail(
        auditRequest.email,
        auditRequest.companyName,
        reportUrl
      );
    } catch (emailError) {
      console.error(
        `Report link email failed for audit ${id} (${auditRequest.email}):`,
        emailError
      );
      return NextResponse.json(
        {
          error:
            emailError instanceof Error
              ? `邮件发送失败：${emailError.message}`
              : "邮件发送失败，请检查 Mailgun 配置",
        },
        { status: 502 }
      );
    }

    await prisma.auditRequest.update({
      where: { id: id.trim() },
      data: {
        status: "SENT",
        rawAiReport: finalReportMarkdown,
        richReportHtml,
        reportAccessToken: accessToken,
        adminNotes: adminNotes?.trim() || "人工审核通过，报告链接已发送",
      },
    });

    return NextResponse.json({
      success: true,
      message: isEmailMockMode()
        ? "报告已保存，模拟模式未发邮件"
        : "核准成功，报告链接已发送至客户邮箱",
      reportUrl,
      emailMock: isEmailMockMode(),
      auditId: id.trim(),
      companyName: auditRequest.companyName,
      email: auditRequest.email,
    });
  } catch (error) {
    console.error("[POST admin action error]:", error);
    return NextResponse.json({ error: "处理审核请求失败" }, { status: 500 });
  }
}
