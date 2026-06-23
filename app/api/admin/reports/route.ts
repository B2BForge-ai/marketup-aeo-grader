import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { convertMarkdownToPdfHtml } from "@/lib/pdf-template";
import { prisma } from "@/lib/prisma";
import {
  buildReportViewUrl,
  generateReportAccessToken,
} from "@/lib/report-access";
import { isEmailMockMode, sendReportLinkEmail } from "@/lib/email";

export const maxDuration = 60;

type AdminAction = "APPROVE" | "REJECT";

interface AdminPostBody {
  id?: string;
  action?: AdminAction;
  editedReport?: string;
  adminNotes?: string;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return unauthorizedResponse();
    }

    const reports = await prisma.auditRequest.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        url: true,
        phone: true,
        email: true,
        initialScore: true,
        rawAiReport: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error("Admin GET reports error:", error);
    return NextResponse.json(
      { error: "获取待审核列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return unauthorizedResponse();
    }

    const body: AdminPostBody = await request.json();
    const { id, action, editedReport, adminNotes } = body;

    if (!id?.trim() || !action) {
      return NextResponse.json(
        { error: "缺少必要参数：id、action" },
        { status: 400 }
      );
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "action 必须为 APPROVE 或 REJECT" },
        { status: 400 }
      );
    }

    const record = await prisma.auditRequest.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    if (record.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: `当前状态为 ${record.status}，无法审核` },
        { status: 409 }
      );
    }

    if (action === "REJECT") {
      await prisma.auditRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNotes: adminNotes?.trim() || null,
        },
      });

      return NextResponse.json({ success: true, message: "已驳回" });
    }

    const finalMarkdown =
      editedReport?.trim() || record.rawAiReport?.trim() || "";

    if (!finalMarkdown) {
      return NextResponse.json(
        { error: "报告内容为空。请等待 AI 生成完成或手动编辑内容。" },
        { status: 400 }
      );
    }

    if (!record.email?.trim()) {
      return NextResponse.json(
        { error: "该记录缺少企业邮箱，无法发送报告链接" },
        { status: 400 }
      );
    }

    const accessToken = generateReportAccessToken();
    const richReportHtml = convertMarkdownToPdfHtml(
      finalMarkdown,
      record.companyName,
      record.initialScore
    );
    const reportUrl = buildReportViewUrl(accessToken);

    try {
      await sendReportLinkEmail(
        record.email,
        record.companyName,
        reportUrl
      );
    } catch (emailError) {
      console.error(
        `Report link email failed for audit ${id} (${record.email}):`,
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
      where: { id },
      data: {
        status: "SENT",
        rawAiReport: finalMarkdown,
        richReportHtml,
        reportAccessToken: accessToken,
        adminNotes: adminNotes?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: isEmailMockMode()
        ? "报告已保存，模拟模式未发邮件"
        : "报告链接已发送至客户邮箱",
      reportUrl,
      emailMock: isEmailMockMode(),
      auditId: id,
      companyName: record.companyName,
      email: record.email,
    });
  } catch (error) {
    console.error("Admin POST reports error:", error);
    return NextResponse.json({ error: "审核操作失败" }, { status: 500 });
  }
}
