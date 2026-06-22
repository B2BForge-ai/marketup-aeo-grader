-- 在 Supabase Dashboard → SQL Editor 中执行

CREATE TABLE IF NOT EXISTS "AuditRequest" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "initialScore" INTEGER NOT NULL,
  "email" TEXT,
  "hasRequestedDeepReport" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'NONE',
  "rawAiReport" TEXT,
  "richReportHtml" TEXT,
  "reportAccessToken" TEXT,
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuditRequest_reportAccessToken_key"
  ON "AuditRequest"("reportAccessToken");

-- 若表已存在，仅追加新列：
-- ALTER TABLE "AuditRequest" ADD COLUMN IF NOT EXISTS "richReportHtml" TEXT;
-- ALTER TABLE "AuditRequest" ADD COLUMN IF NOT EXISTS "reportAccessToken" TEXT;
-- CREATE UNIQUE INDEX IF NOT EXISTS "AuditRequest_reportAccessToken_key" ON "AuditRequest"("reportAccessToken");
