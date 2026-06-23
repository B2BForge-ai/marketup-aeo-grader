import { NextResponse } from "next/server";
import { runHealthCheck } from "@/lib/health-check";

export async function GET() {
  const report = await runHealthCheck();

  const httpStatus =
    report.status === "unhealthy"
      ? 503
      : report.status === "degraded"
        ? 200
        : 200;

  return NextResponse.json(report, { status: httpStatus });
}
