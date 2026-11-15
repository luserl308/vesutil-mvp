import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { dbPool } from "@/lib/db/pool";
import { sendAuthEmail, isSmtpConfigured } from "@/lib/email/smtp";
import { clientRateKey, createAuthToken, csrfFailure, hashAuthToken, rateLimit, requestOriginAllowed } from "@/lib/auth/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!requestOriginAllowed(request)) return csrfFailure();
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return NextResponse.json({ error: "Ожидается JSON." }, { status: 415 });
  if (!dbPool) return NextResponse.json({ error: "Регистрация временно недоступна." }, { status: 503 });
  if (!isSmtpConfigured()) return NextResponse.json({ error: "Регистрация пока не включена: почта не настроена." }, { status: 503 });
  try {
    if (!await rateLimit(clientRateKey(request, "register"), 5, 60))
      return NextResponse.json({ error: "Слишком много попыток. Повторите позже." }, { status: 429 });
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return NextResponse.json({ error: "Укажите корректный email." }, { status: 400 });
    if (password.length < 12 || password.length > 128)
      return NextResponse.json({ error: "Пароль должен содержать от 12 до 128 символов." }, { status: 400 });
    if (!displayName) return NextResponse.json({ error: "Укажите имя." }, { status: 400 });

    const existing = await dbPool.query("SELECT id FROM app_users WHERE lower(email) = $1 LIMIT 1", [email]);
    if (existing.rowCount) return NextResponse.json({ message: "Если адрес доступен для регистрации, на него будет отправлено письмо с дальнейшими инструкциями." });
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    const token = createAuthToken();
    const client = await dbPool.connect();
    let userId: string;
    try {
      await client.query("BEGIN");
      const created = await client.query(
        `INSERT INTO app_users(auth_provider, auth_subject, email, display_name, password_hash)
         VALUES ('local', $1, $2, $3, $4) RETURNING id::text`,
        [randomUUID(), email, displayName, passwordHash],
      );
      userId = created.rows[0].id;
      await client.query(
        "INSERT INTO auth_email_tokens(user_id, purpose, token_hash, expires_at) VALUES ($1, 'verify_email', $2, now() + interval '30 minutes')",
        [userId, hashAuthToken(token)],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      if ((error as { code?: string }).code === "23505")
        return NextResponse.json({ message: "Если адрес доступен для регистрации, на него будет отправлено письмо с дальнейшими инструкциями." });
      throw error;
    } finally { client.release(); }

    const url = new URL("/verify-email", request.url);
    url.searchParams.set("token", token);
    try {
      await sendAuthEmail(email, "Подтверждение почты Vesutil",
        `Здравствуйте, ${displayName}! Для подтверждения адреса откройте ссылку (действует 30 минут): ${url.toString()}\nЕсли вы не регистрировались, проигнорируйте письмо.`,
        `<p>Здравствуйте, ${displayName.replace(/[&<>"]/g, "")}!</p><p>Подтвердите адрес электронной почты:</p><p><a href="${url.toString()}">Подтвердить email</a></p><p>Ссылка действует 30 минут. Если вы не регистрировались, проигнорируйте письмо.</p>`);
    } catch {
      await dbPool.query("DELETE FROM app_users WHERE id = $1 AND email_verified_at IS NULL", [userId!]);
      return NextResponse.json({ error: "Не удалось отправить письмо. Проверьте настройки почты и попробуйте позже." }, { status: 503 });
    }
    return NextResponse.json({ message: "Проверьте почту и перейдите по ссылке для подтверждения адреса." }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Не удалось выполнить регистрацию." }, { status: 503 });
  }
}