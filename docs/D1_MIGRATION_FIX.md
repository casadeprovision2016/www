# D1 Migration Fix for Cloudflare Build Failure

## Problem
The Cloudflare build was failing during the prerendering step with:
```
D1_ERROR: no such table: events: SQLITE_ERROR
```

This occurred because the homepage (`src/app/(public)/page.tsx`) performs server-side database queries at build time, but the D1 database used during the build had not been initialized with the required schema (tables, indexes, etc.).

## Root Cause
1. [src/app/(public)/page.tsx](../src/app/(public)/page.tsx) is a Next.js server component that queries the `events` and `streams` tables during prerendering.
2. The D1 database used by the build environment did not have the `events` table created.
3. The migration file [migrations/0001_initial_schema.sql](../migrations/0001_initial_schema.sql) defines the schema but was not being executed before the build.

## Solution Implemented
Migrations are now automatically applied in the CI pipeline **before** the Next.js build runs.

### Changes Made

#### 1. [package.json](../package.json)
Added two npm scripts for D1 migrations:
```json
"d1:migrate": "wrangler d1 execute www-db --file=./migrations/0001_initial_schema.sql",
"d1:migrate:local": "wrangler d1 execute www-db --local --file=./migrations/0001_initial_schema.sql"
```

- **`d1:migrate`**: Runs migrations against the remote D1 database (used in CI)
- **`d1:migrate:local`**: Runs migrations against a local D1 instance (for local testing)

#### 2. [.github/workflows/ci.yml](./../.github/workflows/ci.yml)
Updated the `build` job to run migrations before the OpenNext build:

```yaml
- name: Run D1 migrations (remote)
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
  run: npm run d1:migrate
  continue-on-error: true

- name: OpenNext / Cloudflare build
  env:
    JWT_SECRET: ${{ secrets.JWT_SECRET || 'dummy-secret-for-build' }}
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
  run: npx opennextjs-cloudflare build
```

The migration step:
- Runs **before** the build
- Uses Cloudflare API credentials from GitHub Secrets
- Has `continue-on-error: true` (won't fail the workflow if migration is already idempotent)

#### 3. [src/lib/db/client.ts](../src/lib/db/client.ts)
Added defensive error handling and logging:
- Validates that the D1 database binding is available
- Provides clear error messages if D1 is not configured
- Adds diagnostic logging to help troubleshoot future D1 issues

```typescript
if (!env.DB) {
  console.error('[DB Client] Error: D1 database binding not available...')
  throw new Error('...')
}
```

## What Needs to Be Done

### 1. Ensure GitHub Secrets Are Configured
The CI now requires these secrets in your GitHub repository settings:

- **`CLOUDFLARE_API_TOKEN`**: Your Cloudflare API token with D1 permissions
  - [Get your token](https://dash.cloudflare.com/profile/api-tokens)
  - Create a token with scope: `D1 > Edit` (or use a broader Workers token)

- **`CF_ACCOUNT_ID`**: Your Cloudflare account ID
  - Found in [Dashboard Settings](https://dash.cloudflare.com/)

### 2. Verify the D1 Database ID
The `wrangler.jsonc` file already has the correct D1 database configuration:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "www-db",
    "database_id": "7237394e-cf46-489f-83f9-b7f389b2b4ed"
  }
]
```

No changes needed here unless your D1 database ID changes.

### 3. Run Next CI Build
Commit these changes and push to trigger the CI pipeline:

```bash
git add package.json .github/workflows/ci.yml src/lib/db/client.ts docs/D1_MIGRATION_FIX.md
git commit -m "fix: run D1 migrations before build to resolve prerender failure"
git push origin main
```

The build should now:
1. ✅ Run migrations against the D1 database
2. ✅ Initialize the schema (tables, indexes)
3. ✅ Successfully prerender the homepage with live event data
4. ✅ Complete the Cloudflare deployment

## Local Testing

### Test migrations locally:
```bash
npm run d1:migrate:local
```

### Test the build locally:
```bash
npm run build:worker
# or
npx opennextjs-cloudflare build
```

## Rollback (if needed)
If the migration causes issues:

1. Revert the CI change:
   ```bash
   git revert <commit-hash>
   ```

2. Or temporarily disable by removing the migration step from [.github/workflows/ci.yml](./../.github/workflows/ci.yml)

## Troubleshooting

### Build still fails with "no such table: events"
- [ ] Check that `CLOUDFLARE_API_TOKEN` and `CF_ACCOUNT_ID` are set in GitHub Secrets
- [ ] Verify the token has D1 permissions
- [ ] Check the CI logs for the migration step output
- [ ] Manually run the migration from the command line:
  ```bash
  wrangler d1 execute www-db --file=./migrations/0001_initial_schema.sql
  ```

### "D1 database binding not available"
- [ ] Ensure `wrangler.jsonc` has the correct `database_id`
- [ ] Check that the D1 database exists in Cloudflare Dashboard: https://dash.cloudflare.com → D1

### Running migrations multiple times
The migration file uses SQL that is idempotent (safe to run multiple times) because it creates tables only if they don't exist. Running it repeatedly is safe and won't corrupt data.

## References
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler D1 Command Reference](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
- [OpenNext Cloudflare Build Config](https://github.com/opennextjs/opennextjs-cloudflare)

---
**Date Implemented**: 2026-02-12  
**Related Error**: `D1_ERROR: no such table: events: SQLITE_ERROR`  
**Build Link**: https://dash.cloudflare.com/7e1da073e82f221adc1afbef6dbbb49e/workers/services/view/www/production/builds/a741b9eb-1218-4878-b249-6ab20efd7873
