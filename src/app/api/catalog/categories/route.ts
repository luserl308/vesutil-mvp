import { NextRequest, NextResponse } from "next/server";
import { listCategories } from "@/lib/catalog/repository";
import { isDatabaseConfigured } from "@/lib/db/pool";
import type { CatalogKind } from "@/lib/catalog/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rawKind = request.nextUrl.searchParams.get("kind");
  if (rawKind && rawKind !== "material" && rawKind !== "service") {
    return NextResponse.json({ error: "kind must be material or service" }, { status: 400 });
  }

  try {
    const data = await listCategories(rawKind as CatalogKind | null ?? undefined);
    const source = isDatabaseConfigured() ? "database" : "demo";
    return NextResponse.json({ data, meta: { source, demo: source === "demo", count: data.length } });
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить категории. Попробуйте позже." }, { status: 503 });
  }
}
