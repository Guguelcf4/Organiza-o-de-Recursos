#!/usr/bin/env node

import { runner } from 'node-pg-migrate';
import { Client } from 'pg';
import { fileURLToPath } from 'node:url';

const usage = `Usage:
  npm run cli -- --help
  npm run db:check
  npm run db:migrate

Commands:
  db check    Verify the configured PostgreSQL connection.
  db migrate  Apply pending database migrations.
`;

function printUsage(output = process.stdout) {
  output.write(usage);
}

async function checkDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    process.stderr.write('DATABASE_URL is required for database commands.\n');
    return 2;
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 3000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    process.stdout.write('PostgreSQL connection OK.\n');
    return 0;
  } catch {
    process.stderr.write('Unable to connect to the configured PostgreSQL database.\n');
    return 1;
  }
}

async function migrateDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    process.stderr.write('DATABASE_URL is required for database commands.\n');
    return 2;
  }

  try {
    await runner({
      databaseUrl,
      dir: fileURLToPath(new URL('../migrations', import.meta.url)),
      direction: 'up',
      migrationsTable: 'schema_migrations',
      migrationsSchema: 'public',
      schema: 'public',
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });
    process.stdout.write('Database migrations are up to date.\n');
    return 0;
  } catch {
    process.stderr.write('Unable to apply database migrations. Check the database configuration and migration files.\n');
    return 1;
  }
}

async function main(args) {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }

  if (args.length === 2 && args[0] === 'db' && args[1] === 'check') {
    return checkDatabase();
  }

  if (args.length === 2 && args[0] === 'db' && args[1] === 'migrate') {
    return migrateDatabase();
  }

  process.stderr.write(`Unknown command: ${args.join(' ')}\n`);
  printUsage(process.stderr);
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
