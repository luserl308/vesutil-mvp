import { dbPool, isDatabaseConfigured } from "@/lib/db/pool";
import { categories as demoCategories, offers as demoOffers } from "./demo-data";
import type { CatalogCategory, CatalogFilters, CatalogOffer, CatalogKind } from "./types";

function demoCategoryList(kind?: CatalogKind): CatalogCategory[] {
  return demoCategories.filter((category) => !kind || category.kind === kind);
}

function demoOfferList(filters: CatalogFilters): CatalogOffer[] {
  const query = filters.q?.trim().toLocaleLowerCase("ru") ?? "";
  const city = filters.city?.trim().toLocaleLowerCase("ru") ?? "";

  return demoOffers.filter((offer) => offer.kind === filters.kind)
    .filter((offer) => !filters.category || filters.category === offer.categorySlug || filters.category === offer.category)
    .filter((offer) => !query || [offer.title, offer.category, offer.description, offer.location, ...offer.keywords].join(" ").toLocaleLowerCase("ru").includes(query))
    .filter((offer) => !city || offer.location.toLocaleLowerCase("ru").includes(city))
    .filter((offer) => filters.pickup !== true || offer.pickupAvailable);
}

export async function listCategories(kind?: CatalogKind): Promise<CatalogCategory[]> {
  if (!isDatabaseConfigured() || !dbPool) return demoCategoryList(kind);

  const result = await dbPool.query(
    `SELECT id::text, kind, name, slug
       FROM catalog_categories
      WHERE is_active = true AND ($1::text IS NULL OR kind = $1)
      ORDER BY sort_order, name`,
    [kind ?? null],
  );
  return result.rows as CatalogCategory[];
}

export async function listOffers(filters: CatalogFilters): Promise<CatalogOffer[]> {
  if (!isDatabaseConfigured() || !dbPool) return demoOfferList(filters);

  const values: unknown[] = [filters.kind];
  const conditions = [
    "o.status = 'published'",
    "b.status = 'active'",
    "c.status = 'active'",
    "cc.is_active = true",
    "((o.kind = 'service' AND $1 = 'service') OR (o.kind <> 'service' AND $1 = 'material'))",
    "(o.valid_until IS NULL OR o.valid_until >= now())",
  ];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`(cc.slug = $${values.length} OR cc.name = $${values.length})`);
  }
  if (filters.city?.trim()) {
    values.push(`%${filters.city.trim()}%`);
    conditions.push(`(b.city ILIKE $${values.length} OR b.region ILIKE $${values.length})`);
  }
  if (filters.pickup === true) conditions.push("o.pickup_available = true");
  if (filters.q?.trim()) {
    values.push(`%${filters.q.trim()}%`);
    conditions.push(`(o.title ILIKE $${values.length} OR COALESCE(o.description, '') ILIKE $${values.length} OR cc.name ILIKE $${values.length} OR COALESCE(m.name, st.name, '') ILIKE $${values.length} OR b.city ILIKE $${values.length})`);
  }

  const result = await dbPool!.query(
    `SELECT
       o.id::text AS id,
       CASE WHEN o.kind = 'service' THEN 'service' ELSE 'material' END AS kind,
       o.title,
       cc.name AS category,
       cc.slug AS "categorySlug",
       concat_ws(', ', b.city, b.region) AS location,
       CASE
         WHEN o.price_type = 'on_request' OR (o.price_min IS NULL AND o.price_max IS NULL) THEN 'По запросу'
         WHEN o.price_type = 'fixed' THEN to_char(o.price_min, 'FM999999999990D00')
         WHEN o.price_type = 'from' THEN 'от ' || to_char(o.price_min, 'FM999999999990D00')
         WHEN o.price_type = 'up_to' THEN 'до ' || to_char(o.price_max, 'FM999999999990D00')
         ELSE concat(to_char(o.price_min, 'FM999999999990D00'), '–', to_char(o.price_max, 'FM999999999990D00'))
       END AS "priceLabel",
       o.price_unit AS unit,
       COALESCE(o.description, '') AS description,
       o.pickup_available AS "pickupAvailable",
       CASE WHEN o.kind = 'service' THEN '🛠️' ELSE '♻️' END AS icon,
       ARRAY_REMOVE(ARRAY[m.name, st.name, cc.name], NULL) AS keywords,
       false AS demo
     FROM offers o
     JOIN branches b ON b.id = o.branch_id
     JOIN companies c ON c.id = b.company_id
     LEFT JOIN materials m ON m.id = o.material_id
     LEFT JOIN service_types st ON st.id = o.service_type_id
     JOIN catalog_categories cc ON cc.id = COALESCE(m.category_id, st.category_id)
     WHERE ${conditions.join(" AND ")}
     ORDER BY o.updated_at DESC
     LIMIT 100`,
    values,
  );
  return result.rows as CatalogOffer[];
}
