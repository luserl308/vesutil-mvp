import { NextRequest, NextResponse } from "next/server";
import { listOffers } from "@/lib/catalog/repository";
import { isDatabaseConfigured } from "@/lib/db/pool";
import type { CatalogKind } from "@/lib/catalog/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rawKind = params.get("kind") ?? "material";
  if (rawKind !== "material" && rawKind !== "service") {
    return NextResponse.json({ error: "kind must be material or service" }, { status: 400 });
  }
  const rawPickup = params.get("pickup");
  if (rawPickup && rawPickup !== "true" && rawPickup !== "false") {
    return NextResponse.json({ error: "pickup must be true or false" }, { status: 400 });
  }

  try {
    const data = await listOffers({
      kind: rawKind as CatalogKind,
      q: params.get("q") ?? undefined,
      category: params.get("category") ?? undefined,
      city: params.get("city") ?? undefined,
      pickup: rawPickup === "true",
    });
    const source = isDatabaseConfigured() ? "database" : "demo";
    return NextResponse.json({
      data,
      meta: { source, demo: source === "demo", count: data.length, filters: { kind: rawKind, q: params.get("q"), category: params.get("category"), city: params.get("city"), pickup: rawPickup } },
    });
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить каталог. Попробуйте позже." }, { status: 503 });
  }
}
