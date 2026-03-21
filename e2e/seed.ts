import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv({ path: "apps/auth-server/.env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in apps/auth-server/.env");
}

const sql = postgres(databaseUrl, { ssl: false, max: 1 });

async function seedDemoFixtures() {
  await sql.unsafe(`
    INSERT INTO falcon_app (id, slug, name, description, status, created_at, updated_at)
    VALUES
      (
        'a0000001-0000-4000-8000-000000000001',
        'demo-01-source',
        'Demo 01 Source',
        'Falcon Connect demo — source',
        'active',
        now(),
        now()
      ),
      (
        'a0000002-0000-4000-8000-000000000002',
        'demo-02-target',
        'Demo 02 Target',
        'Falcon Connect demo — target',
        'active',
        now(),
        now()
      )
    ON CONFLICT (id) DO NOTHING;
  `);

  await sql.unsafe(`
    INSERT INTO app_capability (id, app_id, scope_key, description, created_at)
    VALUES
      (
        'cap-demo-read',
        'a0000002-0000-4000-8000-000000000002',
        'demo.read',
        'Demo read scope',
        now()
      )
    ON CONFLICT (app_id, scope_key) DO NOTHING;
  `);

  await sql.unsafe(`
    INSERT INTO falcon_auth_app (
      id,
      name,
      allowed_origins,
      redirect_urls,
      publishable_key,
      secret_key_hash,
      settings,
      created_at,
      updated_at
    )
    VALUES
      (
        'falcon-auth-demo-01',
        'Demo 01 Source',
        '["http://localhost:3010"]'::jsonb,
        '["http://localhost:3010/auth/callback"]'::jsonb,
        'pk_demo_source',
        NULL,
        NULL,
        now(),
        now()
      ),
      (
        'falcon-auth-demo-02',
        'Demo 02 Target',
        '["http://localhost:3011"]'::jsonb,
        '["http://localhost:3011/auth/callback"]'::jsonb,
        'pk_demo_target',
        NULL,
        NULL,
        now(),
        now()
      )
    ON CONFLICT (publishable_key) DO NOTHING;
  `);
}

async function main() {
  console.log("Seeding Falcon demo auth/connect fixtures...");
  await seedDemoFixtures();
  console.log("Falcon demo fixtures seeded.");
}

await main().finally(async () => {
  await sql.end({ timeout: 5 });
});
