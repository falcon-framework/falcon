-- Platform Postgres seed for Falcon Auth + Falcon Connect demos (demo-01 + demo-02).
-- Run after migrations. Adjust URLs/keys to match your `.env.local` in both apps.
--
-- Prerequisites:
-- 1. Start auth-server and connect-service with DATABASE_URL pointing at this database.
-- 2. Set connect-service CORS_ORIGIN to a comma-separated list that includes BOTH demo
--    origins and your console origin, e.g.:
--      http://localhost:3002,http://localhost:3010,http://localhost:3011
-- 3. Register two falcon_auth_app rows (below) with publishable keys matching .env.example.
-- 4. Sign up through demo-01 (or console), create an organization in the UI so `member`
--    exists with role `owner` or `admin` (required to create + approve installations).
--    Use the SAME user on demo-02 so SSO cookies apply; use the SAME organization so
--    X-Organization-Id resolves for Connect on both apps.

-- ─── falcon_app (Connect identities) ─────────────────────────────────────────

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

-- ─── app_capability (scopes the source app can request for the target) ─────

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

-- ─── falcon_auth_app (Falcon Auth client registrations) ─────────────────────

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
    '[]'::jsonb,
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
    '[]'::jsonb,
    'pk_demo_target',
    NULL,
    NULL,
    now(),
    now()
  )
ON CONFLICT (publishable_key) DO NOTHING;
