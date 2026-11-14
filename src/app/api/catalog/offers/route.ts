import { NextRequest, NextResponse } from "next/server";
import { listOffers } from "@/lib/catalog/repository";
import type { CatalogKind } from "@/lib/catalog/types";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rawKind = params.get("kind") ?? "material";
  if (rawKind !== "material" && rawKind !== "service") {
    return NextResponse.json({ error: "kind must be material or service" }, { status: 400 });
  }
  const rawPickup = params.get("pickup");
  if (rawPickup && rawPickup !== "true" && rawPickup !== "false") {
    return NextResponse.json({ error: "pickup must be true or false" }, { status: 400 });
  }

  const data = listOffers({
    kind: rawKind as CatalogKind,
    q: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    city: params.get("city") ?? undefined,
    pickup: rawPickup === "true",
  });
  return NextResponse.json({
    data,
    meta: { source: "demo", demo: true, count: data.length, filters: { kind: rawKind, q: params.get("q"), category: params.get("category"), city: params.get("city"), pickup: rawPickup } },
  });
}