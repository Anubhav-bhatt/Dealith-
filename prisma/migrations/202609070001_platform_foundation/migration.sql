-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" UUID NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "auditEventId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "envelope" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMPTZ(6),
    "leaseToken" UUID,
    "lastEnqueuedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "failedAt" TIMESTAMPTZ(6),
    "lastErrorCode" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumerReceipt" (
    "eventId" UUID NOT NULL,
    "consumer" TEXT NOT NULL,
    "processedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumerReceipt_pkey" PRIMARY KEY ("eventId","consumer")
);

-- CreateTable
CREATE TABLE "EventProjection" (
    "eventType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EventProjection_pkey" PRIMARY KEY ("eventType")
);

-- CreateIndex
CREATE INDEX "AuditEvent_occurredAt_idx" ON "AuditEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_completedAt_leaseUntil_createdAt_idx" ON "OutboxEvent"("completedAt", "leaseUntil", "createdAt");

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_auditEventId_fkey" FOREIGN KEY ("auditEventId") REFERENCES "AuditEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumerReceipt" ADD CONSTRAINT "ConsumerReceipt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OutboxEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Immutable audit facts and stable outbox payloads; processing metadata remains mutable.
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_attempts_nonnegative" CHECK (attempts >= 0 AND failures >= 0);
ALTER TABLE "EventProjection" ADD CONSTRAINT "EventProjection_count_nonnegative" CHECK (count >= 0);
CREATE FUNCTION prevent_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit facts are append-only'; END;
$$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
CREATE FUNCTION protect_outbox_fact() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW."auditEventId" IS DISTINCT FROM OLD."auditEventId"
    OR NEW."eventType" IS DISTINCT FROM OLD."eventType" OR NEW.envelope IS DISTINCT FROM OLD.envelope
    OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'Outbox facts are immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER outbox_immutable_fact BEFORE UPDATE ON "OutboxEvent"
FOR EACH ROW EXECUTE FUNCTION protect_outbox_fact();
