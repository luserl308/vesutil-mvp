import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const TEST_TAX_ID = "VESUTIL-LOCAL-TEST-0001";
const COMPANY_NAME = "ТЕСТОВАЯ КОМПАНИЯ VESUTIL — НЕ РЕАЛЬНЫЙ ПОСТАВЩИК";
const BRANCH_NAME = "Тестовый филиал (локальная проверка)";
const OFFER_TITLE = "ТЕСТОВОЕ ПРЕДЛОЖЕНИЕ — приём картона";

function assertLocalDatabase() {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const url = new URL(DATABASE_URL);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!localHosts.has(url.hostname) || url.pathname.replace(/^\//, "") !== "vesutil") {
    throw new Error("Safety stop: this script only works with the local 'vesutil' database on localhost.");
  }
}

async function main() {
  assertLocalDatabase();
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (process.argv.includes("--cleanup")) {
      const deleted = await client.query(
        "DELETE FROM companies WHERE tax_id = $1 RETURNING id",
        [TEST_TAX_ID],
      );
      await client.query("COMMIT");
      console.log(deleted.rowCount ? "Local test company and its related data removed." : "No local test data found.");
      return;
    }

    const companyResult = await client.query(
      `INSERT INTO companies (legal_name, display_name, tax_id, description, status)
       VALUES ($1, $1, $2, 'Автоматически созданная тестовая запись. Не является реальной компанией.', 'active')
       ON CONFLICT (tax_id) DO UPDATE SET
         legal_name = EXCLUDED.legal_name,
         display_name = EXCLUDED.display_name,
         description = EXCLUDED.description,
         status = 'active',
         updated_at = now()
       RETURNING id`,
      [COMPANY_NAME, TEST_TAX_ID],
    );
    const companyId = companyResult.rows[0].id;

    const branchResult = await client.query(
      "SELECT id FROM branches WHERE company_id = $1 AND name = $2 LIMIT 1",
      [companyId, BRANCH_NAME],
    );
    const branchId = branchResult.rows[0]?.id ?? (await client.query(
      `INSERT INTO branches (company_id, name, address, city, region, status, accepts_visitors)
       VALUES ($1, $2, 'ТЕСТОВЫЙ АДРЕС — НЕ ДЛЯ ПОСЕЩЕНИЯ', 'Тестовый город', 'Тестовый регион', 'active', false)
       RETURNING id`,
      [companyId, BRANCH_NAME],
    )).rows[0].id;

    const category = await client.query(
      "SELECT id FROM catalog_categories WHERE slug = 'paper-cardboard' AND kind = 'material' AND is_active = true",
    );
    if (!category.rowCount) throw new Error("Required catalog category paper-cardboard was not found. Run migrations first.");

    const materialResult = await client.query(
      `INSERT INTO materials (category_id, name, slug, description)
       VALUES ($1, 'Тестовый картон', 'vesutil-local-test-cardboard', 'Тестовый материал для локальной проверки API')
       ON CONFLICT (slug) DO UPDATE SET
         category_id = EXCLUDED.category_id,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         is_active = true
       RETURNING id`,
      [category.rows[0].id],
    );

    const existingOffer = await client.query(
      "SELECT id FROM offers WHERE branch_id = $1 AND title = $2 LIMIT 1",
      [branchId, OFFER_TITLE],
    );
    let offerId = existingOffer.rows[0]?.id;
    if (offerId) {
      await client.query(
        `UPDATE offers SET material_id = $1, kind = 'material_acceptance',
          description = 'ТЕСТОВАЯ ЗАПИСЬ. Цена намеренно не указана. Не является коммерческим предложением.',
          price_type = 'on_request', price_min = NULL, price_max = NULL, price_unit = NULL,
          pickup_available = false, status = 'published', published_at = COALESCE(published_at, now()),
          updated_at = now()
         WHERE id = $2`,
        [materialResult.rows[0].id, offerId],
      );
    } else {
      const inserted = await client.query(
        `INSERT INTO offers (
          branch_id, kind, material_id, title, description, price_type,
          pickup_available, status, published_at
        ) VALUES (
          $1, 'material_acceptance', $2, $3,
          'ТЕСТОВАЯ ЗАПИСЬ. Цена намеренно не указана. Не является коммерческим предложением.',
          'on_request', false, 'published', now()
        ) RETURNING id`,
        [branchId, materialResult.rows[0].id, OFFER_TITLE],
      );
      offerId = inserted.rows[0].id;
    }

    await client.query("COMMIT");
    console.log("Local test data ready:");
    console.log(`company_id: ${companyId}`);
    console.log(`branch_id: ${branchId}`);
    console.log(`offer_id: ${offerId}`);
    console.log("This is clearly labelled test data; no price or real supplier details were invented.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
