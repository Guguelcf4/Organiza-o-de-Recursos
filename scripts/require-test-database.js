if (!process.env.TEST_DATABASE_URL) {
  process.stderr.write('TEST_DATABASE_URL must point to an empty, dedicated PostgreSQL database.\n');
  process.exitCode = 1;
}
