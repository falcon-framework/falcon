Supabase started, but could not extract DB URL automatically.

"Manual Supabase Setup Instructions:"

1. Ensure Docker is installed and running.
2. Install the Supabase CLI (e.g., `npm install -g supabase`).
3. Run `supabase init` in your project's `packages/db` directory.
4. Run `supabase start` in your project's `packages/db` directory.
5. Copy the 'DB URL' from the output.
   Relevant output from `supabase start`:
   ╭──────────────────────────────────────╮
   │ 🔧 Development Tools │
   ├─────────┬────────────────────────────┤
   │ Studio │ http://127.0.0.1:54323 │
   │ Mailpit │ http://127.0.0.1:54324 │
   │ MCP │ http://127.0.0.1:54321/mcp │
   ╰─────────┴────────────────────────────╯

╭──────────────────────────────────────────────────────╮
│ 🌐 APIs │
├────────────────┬─────────────────────────────────────┤
│ Project URL │ http://127.0.0.1:54321 │
│ REST │ http://127.0.0.1:54321/rest/v1 │
│ GraphQL │ http://127.0.0.1:54321/graphql/v1 │
│ Edge Functions │ http://127.0.0.1:54321/functions/v1 │
╰────────────────┴─────────────────────────────────────╯

╭───────────────────────────────────────────────────────────────╮
│ ⛁ Database │
├─────┬─────────────────────────────────────────────────────────┤
│ URL │ postgresql://postgres:postgres@127.0.0.1:54322/postgres │
╰─────┴─────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│ 🔑 Authentication Keys │
├─────────────┬────────────────────────────────────────────────┤
│ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │
│ Secret │ sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz │
╰─────────────┴────────────────────────────────────────────────╯

╭───────────────────────────────────────────────────────────────────────────────╮
│ 📦 Storage (S3) │
├────────────┬──────────────────────────────────────────────────────────────────┤
│ URL │ http://127.0.0.1:54321/storage/v1/s3 │
│ Access Key │ 625729a08b95bf1b7ff351a663f3a23c │
│ Secret Key │ 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907 │
│ Region │ local │
╰────────────┴──────────────────────────────────────────────────────────────────╯

6. Add the DB URL to the .env file in `apps/server/.env` as `DATABASE_URL`:
   DATABASE_URL="your_supabase_db_url"
