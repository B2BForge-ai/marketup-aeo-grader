import { NextRequest } from "next/server";

export function getAdminSecretToken(): string | undefined {
  return process.env.ADMIN_SECRET_TOKEN?.trim() || undefined;
}

export function extractAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const queryToken = request.nextUrl.searchParams.get("token");
  if (queryToken?.trim()) {
    return queryToken.trim();
  }
  return null;
}

export function isAdminAuthorized(request: NextRequest): boolean {
  const secret = getAdminSecretToken();
  if (!secret) return false;
  const token = extractAdminToken(request);
  return token === secret;
}
