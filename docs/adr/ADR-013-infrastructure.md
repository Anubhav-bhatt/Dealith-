# ADR-013: AWS managed infrastructure with isolated environments

Status: Recorded baseline, 2026-09-07. Sources: master §§48–49, 59–62, 72, 74, 93. PHASE-01 nonproduction implementation; no Phase 0 provisioning.

## Context and decision

Target AWS CloudFront/WAF/ALB, ECS Fargate web/admin/API/worker services, RDS PostgreSQL, ElastiCache Redis, private S3/KMS, Secrets Manager, ECR and OpenTelemetry collection. Terraform owns reviewed environment-specific infrastructure. Use private data/service subnets, minimum IAM/task roles, scoped egress and multiple availability zones for production. Separate production/nonproduction accounts, secrets, Terraform state and data; previews have bounded lifetimes and isolated synthetic namespaces.

Local/test/dev/preview/staging/pre-production/production responsibilities are defined in [infrastructure](../INFRASTRUCTURE.md). Runtime dependencies, image digests, regions and capacity are selected/verified during implementation; no credentials, accounts or cost measurements exist in Phase 0. Region and cross-region backup choices require residency review. API/worker scale independently but share the modular backend's authority model.

## Alternatives and consequences

Kubernetes adds control-plane complexity without a current workload need. One shared environment/role magnifies compromise and accidental production access. Managed services reduce some operating work while retaining backup, networking, IAM, spend and vendor-lock-in obligations. Multi-region active/active is deferred; an approved regional disaster recovery path remains a launch gate.

## Verification and revisit

PHASE-01 verifies Terraform plans, least-privilege roles, secret isolation, nonproduction startup and dependency health. PHASE-15 demonstrates Multi-AZ/recovery, approved residency, capacity, on-call and cost alarms. Revisit service/topology choices only with measured requirements and a safe migration/recovery plan.
