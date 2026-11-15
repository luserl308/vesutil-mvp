import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { dbPool } from "@/lib/db/pool";

const COOKIE_NAME = "vesutil_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = { userId: string; expiresAt: number };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return body + "." + sign(body);
}

function decode(token: string): SessionPayload | null {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || !Number.isInteger(payload.expiresAt) || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function issueSessionCookie(userId: string) {
  const jar = await cookies();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  jar.set(COOKIE_NAME, encode({ userId, expiresAt }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", expires: new Date(expiresAt * 1000),
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getCurrentUser() {
  if (!dbPool) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decode(token);
  if (!payload) return null;
  const result = await dbPool.query(
    `SELECT id::text, email, display_name AS "displayName", status
       FROM app_users WHERE id = $1 AND status = 'active' LIMIT 1`,
    [payload.userId],
  );
  return result.rows[0] ?? null;
}
