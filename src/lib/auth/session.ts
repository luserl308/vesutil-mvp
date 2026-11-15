import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { dbPool } from "@/lib/db/pool";

const COOKIE_NAME = "vesutil_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : { maxAge: 0 }),
  };
}

export async function issueSessionCookie(userId: string) {
  if (!dbPool) throw new Error("Database is required to create a session");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await dbPool.query(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at)
     SELECT id, $2, $3 FROM app_users WHERE id = $1 AND status = 'active'`,
    [userId, hashToken(token), expiresAt],
  );

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, cookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token && dbPool) {
    await dbPool.query(
      `UPDATE user_sessions SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [hashToken(token)],
    );
  }
  jar.set(COOKIE_NAME, "", cookieOptions());
}

export async function getCurrentUser() {
  if (!dbPool) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token || token.length > 128) return null;

  const result = await dbPool.query(
    `SELECT u.id::text, u.email, u.display_name AS "displayName", u.status,
            s.id::text AS "sessionId"
       FROM user_sessions s
       JOIN app_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.status = 'active'
      LIMIT 1`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}
