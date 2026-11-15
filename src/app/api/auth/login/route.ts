import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { dbPool } from "@/lib/db/pool";
import { issueSessionCookie } from "@/lib/auth/session";
import { clientRateKey, csrfFailure, rateLimit, requestOriginAllowed } from "@/lib/auth/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!requestOriginAllowed(request)) return csrfFailure();
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return NextResponse.json({ error: "Ожидается JSON." }, { status: 415 });
  if (!dbPool) return NextResponse.json({ error: "Сервис недоступен." }, { status: 503 });
  try {
    if (!await rateLimit(clientRateKey(request, "login"), 10, 15))
      return NextResponse.json({ error: "Слишком много попыток. Повторите позже." }, { status: 429 });
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const result = await dbPool.query(
      `SELECT id::text, password_hash, email_verified_at, status FROM app_users
        WHERE lower(email) = $1 AND auth_provider = 'local' LIMIT 1`, [email],
    );
    const user = result.rows[0];
    const valid = Boolean(user?.password_hash) && await argon2.verify(user.password_hash, password).catch(() => false);
    if (!valid || user.status !== "active")
      return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
    if (!user.email_verified_at)
      return NextResponse.json({ error: "Сначала подтвердите адрес по ссылке из письма." }, { status: 403 });
    await issueSessionCookie(user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Не удалось выполнить вход." }, { status: 503 });
  }
}