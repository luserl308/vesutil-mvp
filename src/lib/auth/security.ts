import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "@/lib/db/pool";

export function hashAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function createAuthToken() {
  return randomBytes(32).toString("base64url");
}
export function requestOriginAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
export function csrfFailure() {
  return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
}
export async function rateLimit(key: string, maxAttempts = 8, windowMinutes = 15) {
  if (!dbPool) return false;
  const result = await dbPool.query(
    `INSERT INTO auth_rate_limits(bucket_key, attempts, window_started_at, updated_at)
     VALUES ($1, 1, now(), now())
     ON CONFLICT (bucket_key) DO UPDATE SET
       attempts = CASE WHEN auth_rate_limits.window_started_at < now() - ($3 * interval '1 minute')
                       THEN 1 ELSE auth_rate_limits.attempts + 1 END,
       window_started_at = CASE WHEN auth_rate_limits.window_started_at < now() - ($3 * interval '1 minute')
                                THEN now() ELSE auth_rate_limits.window_started_at END,
       blocked_until = CASE WHEN auth_rate_limits.window_started_at < now() - ($3 * interval '1 minute')
                            THEN NULL
                            WHEN auth_rate_limits.attempts + 1 > $2
                            THEN now() + interval '15 minutes'
                            ELSE auth_rate_limits.blocked_until END,
       updated_at = now()
     RETURNING attempts, blocked_until`,
    [key, maxAttempts, windowMinutes],
  );
  return !result.rows[0].blocked_until && result.rows[0].attempts <= maxAttempts;
}
export function clientRateKey(request: NextRequest, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return hashAuthToken(scope + ":" + forwarded);
}