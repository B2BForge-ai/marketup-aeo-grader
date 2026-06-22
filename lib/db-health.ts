import { prisma } from "@/lib/prisma";

export async function checkDatabaseConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { ok: false, error: "DATABASE_URL 未配置" };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "未知数据库错误";
    return { ok: false, error: message.split("\n")[0] };
  }
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  return (
    name.includes("PrismaClientInitializationError") ||
    message.includes("Can't reach database server") ||
    message.includes("P1001") ||
    message.includes("P1017") ||
    message.includes("Connection")
  );
}
