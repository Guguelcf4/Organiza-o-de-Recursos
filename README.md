# Organiza-o-de-Recursos

Local foundation for the resource-booking product. This story provides a technical CLI, PostgreSQL connectivity and migration tracking only; it does not implement product workflows or a web UI.

## Requirements

- Node.js `>=22.11.0` (verified here with `v24.21.0`)
- npm (verified here with `11.19.0`)
- Docker Engine with Docker Compose
- PostgreSQL `17.6` (the local Compose image is pinned to `postgres:17.6-alpine`)

The CLI dependencies and exact resolved package versions are recorded in `package-lock.json` (`node-pg-migrate` `9.0.0`, `pg` `8.23.1`). The runtime and dependency choices are implementation details, not product-approved versions.

## Local setup

1. If no `.env` exists, copy `.env.example` to `.env`. If one already exists, preserve it and add only the local database variables from `.env.example`.
2. Replace the example `POSTGRES_PASSWORD` with a local-only value and keep `DATABASE_URL` in sync. URL-encode reserved characters in the connection URL.
3. Start PostgreSQL and wait for its health check:

   ```sh
   docker compose up -d --wait
   ```

4. Install exactly the locked dependencies and inspect the selected runtime:

   ```sh
   npm ci
   node --version
   npm ls --depth=0
   ```

5. Check the CLI and database connection:

   ```sh
   npm run cli -- --help
   npm run db:check
   ```

   Help exits with code `0`. `db:check` exits with code `0` on a successful PostgreSQL connection and non-zero otherwise. Connection errors do not print the connection URL or password.

## Database migrations

The migration baseline uses `node-pg-migrate` and creates only its `public.schema_migrations` control table and a recorded no-op baseline migration; no product/domain tables are introduced.

On a new, empty, dedicated development database:

```sh
npm run db:migrate
```

Running the same command again against that migrated database is the idempotency check. It must exit successfully without creating duplicate structures or rerunning the baseline migration. Do not point setup or test commands at a database containing user data.

## Tests

Unit/CLI tests:

```sh
npm test
```

The database integration test is skipped with an explicit reason unless `TEST_DATABASE_URL` is configured. To run it, create a separate empty PostgreSQL database and set `TEST_DATABASE_URL` in `.env` (or in the environment), then run:

```sh
npm run test:db
```

The integration test applies migrations twice and verifies that the only public table is the migration ledger and that exactly one baseline migration is recorded. It does not drop or reset a database. Preserve the command output and exit codes in the story implementation record; never include connection URLs or credentials in that evidence.

## Available CLI commands

```text
npm run cli -- --help
npm run db:check
npm run db:migrate
```

Product workflows remain CLI-first and will be added in later stories. Any future Next.js interface is strictly observational/read-only and must not precede the operational CLI.