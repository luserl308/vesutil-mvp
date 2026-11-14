import { categories, offers } from "./demo-data";
import type { CatalogFilters, CatalogKind } from "./types";

export function listCategories(kind?: CatalogKind) {
  return categories.filter((category) => !kind || category.kind === kind);
}

export function listOffers(filters: CatalogFilters) {
  const query = filters.q?.trim().toLocaleLowerCase("ru") ?? "";
  const city = filters.city?.trim().toLocaleLowerCase("ru") ?? "";

  return offers.filter((offer) => offer.kind === filters.kind)
    .filter((offer) => !filters.category || filters.category === offer.categorySlug || filters.category === offer.category)
    .filter((offer) => !query || [offer.title, offer.category, offer.description, offer.location, ...offer.keywords].join(" ").toLocaleLowerCase("ru").includes(query))
    .filter((offer) => !city || offer.location.toLocaleLowerCase("ru").includes(city))
    .filter((offer) => filters.pickup !== true || offer.pickupAvailable);
}