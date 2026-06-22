import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token?.trim()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const record = await prisma.auditRequest.findUnique({
      where: { reportAccessToken: token.trim() },
      select: {
        richReportHtml: true,
        status: true,
      },
    });

    if (
      !record?.richReportHtml ||
      (record.status !== "SENT" && record.status !== "PDF_GENERATED")
    ) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new NextResponse(record.richReportHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("Report view error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
