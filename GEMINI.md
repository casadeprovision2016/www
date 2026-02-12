# Casa de Provisión 2016 - Project Context

## Project Overview
This is a church management system for "Casa de Provisión 2016". It features a public-facing website and a private administrative dashboard (`/panel`) for managing members, donations, events, ministries, and pastoral visits.

### Key Technologies
- **Framework:** Next.js 16 (App Router)
- **Runtime:** Cloudflare Workers (via OpenNext)
- **Language:** TypeScript
- **Database:** Cloudflare D1 (SQLite-based)
- **Authentication:** Custom JWT-based authentication using `jose`
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI primitives with a Shadcn-like structure
- **State Management:** TanStack Query (React Query) for client-side data fetching

## Architecture
- `src/app`: Contains the application routes.
    - `(public)`: Publicly accessible pages (Home, Login, Policies).
    - `(dashboard)`: Protected administrative routes under `/panel`.
    - `api`: Backend route handlers performing D1 database operations.
- `src/components`: UI components, including general Radix-based ones and feature-specific components for the dashboard (e.g., `MembersManager`, `DonationsManager`).
- `src/lib`: Core logic and utilities.
    - `auth`: JWT signing, verification, and session management.
    - `db`: Cloudflare D1 client initialization (`getDB`).
    - `queries`: Client-side React Query hooks for API interaction.
- `src/types`: TypeScript definitions, including the database schema.
- `migrations`: SQL files for D1 database schema.

## Building and Running

### Development
```bash
npm run dev
```

### Preview (Local Cloudflare Runtime)
```bash
npm run preview
```

### Deployment
```bash
npm run deploy
```

### Database Management
The project uses Cloudflare D1. The database name is `www-db`.
- **Apply migrations (local):** `npx wrangler d1 execute www-db --local --file=./migrations/0001_initial_schema.sql`
- **Apply migrations (remote):** `npx wrangler d1 execute www-db --remote --file=./migrations/0001_initial_schema.sql`

## Development Conventions
- **Database Access:** Use raw SQL with `db.prepare().bind().first/all()` via the `getDB()` helper in API routes.
- **Authentication:** Routes under `/panel` are protected by `middleware.ts` which checks for a `session` cookie.
- **Client State:** Use TanStack Query hooks in `src/lib/queries` for data fetching in components.
- **Styling:** Adhere to Tailwind CSS 4 conventions.
- **Icons:** Use `lucide-react`.

## Important Files
- `wrangler.jsonc`: Cloudflare configuration.
- `src/middleware.ts`: Authentication and routing guard.
- `src/lib/db/client.ts`: D1 database entry point.
- `src/types/database.ts`: Source of truth for database types.
- `docs/MIGRATION_COMPLETE.md`: Details about the Supabase to D1 migration.
