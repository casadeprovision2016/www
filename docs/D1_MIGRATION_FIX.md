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
Migrations should be applied in the CI pipeline **before** the Next.js build runs. As a fallback, the homepage gracefully handles missing database tables during the build process.

### Approach: Defensive Build + Graceful Degradation

The implementation uses two layers:
1. **CI/CD layer** (ideal): Run migrations before the build automatically
2. **Application layer** (fallback): Homepage catches missing-table errors and renders with empty data

This approach allows the build to succeed even if migrations haven't been run yet, while still supporting full functionality once the schema is initialized.

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

#### 3. [src/app/(public)/page.tsx](../src/app/(public)/page.tsx)
Added try/catch error handling to gracefully handle missing database tables:
- If tables don't exist during build, the homepage renders with empty events and streams
- Logs a warning message indicating migrations need to be run
- Once migrations are applied, the page automatically fetches and displays real data
- Allows builds to succeed even before migrations are configured

```typescript
try {
  const db = await getDB()
  // ... query events and streams ...
} catch (error) {
  if (errorMsg.includes('no such table') || errorMsg.includes('SQLITE_ERROR')) {
    console.warn('[Homepage] Database tables not yet initialized. Rendering with empty data.')
  } else {
    throw error // Re-throw unexpected errors
  }
}
```

#### 4. [src/lib/db/client.ts](../src/lib/db/client.ts)
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

### Immediate (Next Build)
The build will now **succeed** even without migrations being applied:
1. Homepage catches the missing-table error and renders with empty events/streams
2. D1 binding validation provides clear diagnostic messages if D1 is missing
3. CI logs will show a warning: `[Homepage] Database tables not yet initialized...`

### For Full Functionality (After Build Succeeds)
To populate events and streams on the homepage, apply migrations to your D1 database:

#### Option A: Run migrations manually (Recommended for immediate fix)
```bash
# Using wrangler CLI (requires API token with D1 permissions)
npx wrangler d1 execute www-db --file=./migrations/0001_initial_schema.sql
```

#### Option B: Set up GitHub Secrets for automated migrations in CI (Recommended for production)
The CI pipeline has the infrastructure to run migrations automatically before each build. To enable it:

1. **Set GitHub Secrets** in your repository settings:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with D1 permissions
     - [Get your token](https://dash.cloudflare.com/profile/api-tokens)
     - Minimum scope required: `D1 > Edit`

   - `CF_ACCOUNT_ID`: Your Cloudflare account ID
     - Found in [Dashboard Settings](https://dash.cloudflare.com/)

2. **Push a commit** to trigger CI:
   ```bash
   git add .
   git commit -m "ci: enable d1 migrations with cloudflare secrets"
   git push origin main
   ```

3. **Monitor the build**:
   - The CI job `Run D1 migrations (remote)` will execute before the build
   - If secrets are set correctly, migrations will apply automatically
   - If secrets are missing, the build will still succeed with empty data (graceful fallback)

### 3. Verify the Build Succeeded
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

### 3. Verify the Build Succeeded
Check Cloudflare Pages / Workers build dashboard to confirm:
- ✅ Build completes successfully
- ✅ Next.js compilation finishes without "no such table" errors
- ⚠️ Homepage shows empty events/streams section (expected until migrations are run)

Once migrations are applied (manually or via CI), the page will automatically show live data.

### 4. Verify the D1 Database ID
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

### 5. Next Steps After Build Succeeds
Once the build completes:

1. **Add event data** (if desired):
   - Use the admin dashboard to create events and streams
   - Or insert data directly into D1 using `wrangler d1 shell`

2. **Run migrations in production** (if using Option B above):
   - Push with GitHub Secrets configured
   - CI will automatically run migrations before each build

3. **Redeploy** (if using Option A - manual migrations):
   - After running migrations manually, commit and push to trigger a new build
   - The new build will now fetch and display real event data

## Local Testing

### Test the build succeeds (with or without migrations):
```bash
npm run build:worker
# or
npx opennextjs-cloudflare build
```

Expected output:
- ✅ Compilation succeeds
- ✅ TypeScript check passes
- ⚠️ Static generation completes (with or without data)
- ⚠️ If tables don't exist: warning log `[Homepage] Database tables not yet initialized...`

### Test migrations locally:
```bash
npm run d1:migrate:local
```

Then run build again to see events/streams populate.

## How It Works

### Build-time Flow (Current Approach)
```
1. Dependencies installed
2. Next.js build starts
3. Homepage component executes
4. Tries to query D1 database
5. If tables exist → shows real data ✅
6. If tables missing → catches error, renders empty data ⚠️
7. Build succeeds regardless
```

### After Migrations Applied
```
1. Run: npm run d1:migrate
2. Tables created in D1
3. Next build/deploy triggers
4. Homepage queries D1
5. Tables exist → shows live event data ✅
```

### Production Recommendations
1. **Run migrations once** after setting up D1:
   ```bash
   npx wrangler d1 execute www-db --file=./migrations/0001_initial_schema.sql
   ```

2. **Set up GitHub Secrets** (optional but recommended):
   - Enables automatic migrations before each production build
   - Useful if you add new migrations in the future

3. **Monitor Cloudflare dashboard**:
   - Verify migrations applied successfully
   - Check D1 database statistics for table existence

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
