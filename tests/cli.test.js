import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const cliPath = fileURLToPath(new URL('../bin/organiza.js', import.meta.url));

function runCli(args, env = process.env) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    env,
  });
}

test('help prints usage and exits successfully', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
});

test('unknown commands fail with usage guidance', () => {
  const result = runCli(['unknown']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Usage:/);
});

test('database check without configuration fails without exposing credentials', () => {
  const env = { ...process.env };
  delete env.DATABASE_URL;

  const result = runCli(['db', 'check'], env);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DATABASE_URL/);
  assert.doesNotMatch(result.stderr, /password|postgres:\/\//i);
});

test('database check masks connection details on failure', () => {
  const secret = 'local-test-secret';
  const env = {
    ...process.env,
    DATABASE_URL: `postgres://user:${secret}@127.0.0.1:1/does_not_exist`,
  };

  const result = runCli(['db', 'check'], env);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unable to connect/);
  assert.doesNotMatch(result.stderr, new RegExp(secret));
});
