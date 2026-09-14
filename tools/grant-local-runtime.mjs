import pg from 'pg';
if (process.env.APP_ENV !== 'local' || !process.env.MIGRATION_DATABASE_URL) {
  throw new Error('Local migration configuration is required');
}
const client = new pg.Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
try {
  await client.connect();
  await client.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC;
    GRANT USAGE ON SCHEMA public TO dealith_app;
    GRANT SELECT, INSERT ON "AuditEvent", "ConsumerReceipt" TO dealith_app;
    GRANT SELECT, INSERT, UPDATE ON "OutboxEvent", "EventProjection" TO dealith_app;`);
} catch {
  throw new Error('Local runtime grant failed');
} finally {
  await client.end();
}
