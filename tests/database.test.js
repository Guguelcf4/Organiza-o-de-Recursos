import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const cliPath = fileURLToPath(new URL('../bin/organiza.js', import.meta.url));
const databaseUrl = process.env.TEST_DATABASE_URL;

test('migration establishes only its ledger and is safe to rerun', {
  skip: databaseUrl ? false : 'Set TEST_DATABASE_URL to an empty dedicated PostgreSQL database.',
}, async () => {
  const env = { ...process.env, DATABASE_URL: databaseUrl };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = spawnSync(process.execPath, [cliPath, 'db', 'migrate'], {
      encoding: 'utf8',
      env,
    });

    assert.equal(result.status, 0, result.stderr);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const tables = await client.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    assert.deepEqual(tables.rows.map((row) => row.tablename), ['schema_migrations']);

    const appliedMigrations = await client.query('SELECT count(*)::int AS count FROM schema_migrations');
    assert.equal(appliedMigrations.rows[0].count, 1);
  } finally {
    await client.end();
  }
});
