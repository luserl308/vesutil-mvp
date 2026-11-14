export type CatalogKind = "material" | "service";

export type CatalogCategory = {
  id: string;
  kind: CatalogKind;
  name: string;
  slug: string;
};

export type CatalogOffer = {
  id: string;
  kind: CatalogKind;
  title: string;
  category: string;
  categorySlug: string;
  location: string;
  priceLabel: string;
  unit: string | null;
  description: string;
  pickupAvailable: boolean;
  icon: string;
  keywords: string[];
  demo: boolean;
};

export type CatalogFilters = {
  kind: CatalogKind;
  q?: string;
  category?: string;
  city?: string;
  pickup?: boolean;
};
