import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ authenticated: Boolean(user), user });
  } catch {
    return NextResponse.json({ error: "Не удалось проверить сессию." }, { status: 503 });
  }
}
