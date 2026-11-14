import { NextRequest, NextResponse } from "next/server";
import { listCategories } from "@/lib/catalog/repository";
import type { CatalogKind } from "@/lib/catalog/types";

export function GET(request: NextRequest) {
  const rawKind = request.nextUrl.searchParams.get("kind");
  if (rawKind && rawKind !== "material" && rawKind !== "service") {
    return NextResponse.json({ error: "kind must be material or service" }, { status: 400 });
  }
  const data = listCategories(rawKind as CatalogKind | null ?? undefined);
  return NextResponse.json({ data, meta: { source: "demo", demo: true, count: data.length } });
}