import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ authenticated: false, user: null });
    const { sessionId: _sessionId, ...safeUser } = user;
    return NextResponse.json({ authenticated: true, user: safeUser });
  } catch {
    return NextResponse.json({ error: "Не удалось проверить сессию." }, { status: 503 });
  }
}