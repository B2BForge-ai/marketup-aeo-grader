-- CreateTable
CREATE TABLE "AuditRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "initialScore" INTEGER NOT NULL,
    "email" TEXT,
    "hasRequestedDeepReport" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NONE',
    "rawAiReport" TEXT,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
