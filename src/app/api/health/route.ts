import { NextResponse } from "next/server";
import { dbPool, isDatabaseConfigured } from "@/lib/db/pool";
import { isSmtpConfigured } from "@/lib/email/smtp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ status: "ok", app: "vesutil-mvp", database: "not_configured", email: isSmtpConfigured() ? "configured" : "not_configured" });
  }
  try {
    await dbPool!.query("SELECT 1");
    return NextResponse.json({ status: "ok", app: "vesutil-mvp", database: "connected", email: isSmtpConfigured() ? "configured" : "not_configured" });
  } catch {
    return NextResponse.json({ status: "degraded", app: "vesutil-mvp", database: "unavailable", email: isSmtpConfigured() ? "configured" : "not_configured" }, { status: 503 });
  }
}