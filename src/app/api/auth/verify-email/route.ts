import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "@/lib/db/pool";
import { hashAuthToken } from "@/lib/auth/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!dbPool) return NextResponse.json({ error: "Сервис недоступен." }, { status: 503 });
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    if (token.length < 32 || token.length > 128) return NextResponse.json({ error: "Ссылка недействительна или устарела." }, { status: 400 });
    const result = await dbPool.query(
      `UPDATE auth_email_tokens SET consumed_at = now()
        WHERE token_hash = $1 AND purpose = 'verify_email' AND consumed_at IS NULL AND expires_at > now()
        RETURNING user_id::text`,
      [hashAuthToken(token)],
    );
    if (!result.rowCount) return NextResponse.json({ error: "Ссылка недействительна или устарела." }, { status: 400 });
    await dbPool.query("UPDATE app_users SET email_verified_at = now(), updated_at = now() WHERE id = $1 AND email_verified_at IS NULL", [result.rows[0].user_id]);
    return NextResponse.json({ success: true, message: "Адрес подтверждён. Теперь можно войти." });
  } catch {
    return NextResponse.json({ error: "Не удалось подтвердить адрес." }, { status: 503 });
  }
}