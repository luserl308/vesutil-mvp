import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { csrfFailure, requestOriginAllowed } from "@/lib/auth/security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!requestOriginAllowed(request)) return csrfFailure();
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Не удалось завершить сессию." }, { status: 503 });
  }
}