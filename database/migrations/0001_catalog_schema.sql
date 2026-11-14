-- Vesutil MVP catalog schema
-- PostgreSQL 15+. This migration is intentionally not executed against a live database.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  tax_id text,
  description text,
  website_url text,
  public_email text,
  public_phone text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tax_id)
);

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  region text NOT NULL DEFAULT 'Московская область',
  postal_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  contact_phone text,
  contact_email text,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepts_visitors boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);
CREATE INDEX IF NOT EXISTS branches_company_idx ON branches(company_id);
CREATE INDEX IF NOT EXISTS branches_city_region_idx ON branches(city, region);

CREATE TABLE IF NOT EXISTS catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('material','service')),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES catalog_categories(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES catalog_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  accepted_forms jsonb NOT NULL DEFAULT '[]'::jsonb,
  quality_attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);

CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES catalog_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('material_purchase','material_acceptance','service')),
  material_id uuid REFERENCES materials(id) ON DELETE RESTRICT,
  service_type_id uuid REFERENCES service_types(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  price_type text NOT NULL DEFAULT 'on_request' CHECK (price_type IN ('fixed','from','up_to','range','on_request')),
  price_min numeric(14,2),
  price_max numeric(14,2),
  currency char(3) NOT NULL DEFAULT 'RUB',
  price_unit text,
  minimum_quantity numeric(14,3),
  quantity_unit text,
  pickup_available boolean NOT NULL DEFAULT false,
  delivery_available boolean NOT NULL DEFAULT false,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','expired','archived')),
  published_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'service' AND service_type_id IS NOT NULL AND material_id IS NULL)
      OR (kind <> 'service' AND material_id IS NOT NULL AND service_type_id IS NULL)),
  CHECK (price_min IS NULL OR price_min >= 0),
  CHECK (price_max IS NULL OR price_max >= 0),
  CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max),
  CHECK (minimum_quantity IS NULL OR minimum_quantity >= 0)
);
CREATE INDEX IF NOT EXISTS offers_branch_status_idx ON offers(branch_id, status);
CREATE INDEX IF NOT EXISTS offers_material_status_idx ON offers(material_id, status) WHERE material_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS offers_service_status_idx ON offers(service_type_id, status) WHERE service_type_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS offers_updated_idx ON offers(updated_at DESC);

-- Immutable price snapshots make price changes traceable and allow stale-price checks.
CREATE TABLE IF NOT EXISTS offer_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  price_type text NOT NULL CHECK (price_type IN ('fixed','from','up_to','range','on_request')),
  price_min numeric(14,2),
  price_max numeric(14,2),
  currency char(3) NOT NULL DEFAULT 'RUB',
  price_unit text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','excel_import','api')),
  source_file_name text,
  version integer NOT NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, version),
  CHECK (price_min IS NULL OR price_min >= 0),
  CHECK (price_max IS NULL OR price_max >= 0),
  CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS offer_price_history_offer_idx ON offer_price_history(offer_id, effective_from DESC);

CREATE TABLE IF NOT EXISTS offer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  original_file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS offer_documents_offer_idx ON offer_documents(offer_id);

CREATE TABLE IF NOT EXISTS search_no_result_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text text,
  kind text CHECK (kind IN ('material','service')),
  category_slug text,
  city text,
  region text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_no_result_created_idx ON search_no_result_events(created_at DESC);

-- Seed reference taxonomy only; no invented company listings, contacts, or commercial prices.
INSERT INTO catalog_categories (kind, name, slug, sort_order) VALUES
 ('material','Металлолом','metal-scrap',10),
 ('material','Пластик','plastic',20),
 ('material','Стекло','glass',30),
 ('material','Макулатура и картон','paper-cardboard',40),
 ('material','Электронные отходы','electronic-waste',50),
 ('material','Строительные отходы','construction-waste',60),
 ('service','Вывоз и транспортировка','waste-transport',10),
 ('service','Демонтаж и снос','demolition',20),
 ('service','Аренда спецтехники','equipment-rental',30),
 ('service','Погрузка и разгрузка','loading-unloading',40)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
