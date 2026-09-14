# DEALITH
## Master Project Scope, Product Requirements & End-to-End Architecture
**Document Type:** Master Product / Engineering Source of Truth  
**Status:** Baseline v1.0  
**Prepared:** 2026-09-06  
**Working Product Name:** **Dealith**  
**Tagline:** **Discover. Verify. Negotiate. Acquire.**  

> **Important naming note:** “Dealith” is a working brand selected because it is short, distinctive, deal-oriented, and a preliminary web check did not surface an obvious exact-name marketplace collision. This is **not** a trademark or domain clearance. Formal trademark, company-name, domain, and app-store checks are mandatory before public launch.

---

# 0. Document Purpose

This document is the master scope and implementation blueprint for Dealith.

It is intended to prevent:
- scope drift;
- forgotten requirements;
- disconnected frontend/backend work;
- incomplete UI states;
- late testing;
- security being added at the end;
- payment/crypto redesign late in development;
- untracked dependencies;
- undocumented architectural decisions;
- “mostly done” phases being treated as complete;
- deadline slippage caused by accumulated technical debt.

Every major product, engineering, QA, security, compliance, infrastructure, and release decision should trace back to this document or an Architecture Decision Record (ADR).

When requirements change, this document must be versioned.

---

# 1. Executive Product Definition

Dealith is an enterprise SaaS marketplace for **digital businesses, software products, technology assets, intellectual property, and qualified investment/acquisition opportunities**.

The platform allows:

1. founders, builders, owners, and organizations to publish structured project/business listings;
2. listings to be verified technically, commercially, operationally, and through identity/business checks;
3. buyers, investors, acquirers, and enterprise scouts to discover relevant opportunities;
4. users to preview the product and understand the problem, solution, market, services, technology, architecture, security posture, traction, and deal structure;
5. promising listings to be saved or added to a **Deal Cart** for structured comparison;
6. interested parties to request confidential access;
7. owners to approve or reject access;
8. parties to execute NDA workflows;
9. parties to communicate within structured deal conversations;
10. confidential material to be shared through a controlled virtual data room;
11. offers, counteroffers, LOIs, due-diligence tasks, agreements, and transaction milestones to be managed;
12. fiat and future crypto settlement to be orchestrated through approved third-party providers;
13. business/technology assets to be transferred through controlled checklists;
14. completed acquisitions/investments to appear in a portfolio layer;
15. reputation, audit, analytics, risk, and compliance records to be maintained.

Dealith is **not** an e-commerce storefront and is **not** a crypto exchange.

---

# 2. Product Vision

## 2.1 Vision

Build the trusted operating system for discovering, evaluating, negotiating, acquiring, investing in, licensing, and transferring digital businesses and technology assets.

## 2.2 Long-Term Product Pillars

Dealith consists of six primary product pillars:

1. **Marketplace Cloud**
   - discovery;
   - listings;
   - search;
   - recommendations;
   - categories;
   - saved opportunities.

2. **Intelligence Cloud**
   - project intelligence;
   - technical health;
   - business metrics;
   - evidence confidence;
   - AI-assisted comparison;
   - verified signals.

3. **Deal Cloud**
   - access requests;
   - NDA;
   - messaging;
   - offers;
   - LOIs;
   - virtual data rooms;
   - due diligence;
   - agreements.

4. **Settlement Cloud**
   - fiat settlement;
   - escrow integrations;
   - crypto settlement integrations;
   - transaction monitoring;
   - settlement milestones.

5. **Portfolio Cloud**
   - completed acquisitions;
   - investments;
   - licenses;
   - ownership records;
   - ongoing performance tracking.

6. **Enterprise Cloud**
   - corporate scouting;
   - team workspaces;
   - private notes;
   - investment-committee workflows;
   - SSO;
   - advanced audit;
   - APIs;
   - enterprise analytics.

---

# 3. Product Principles

All implementation decisions must respect these principles.

## 3.1 Trust Before Growth
Marketplace volume must never be prioritized over identity, transaction, listing, and evidence integrity.

## 3.2 Progressive Disclosure
Users should see only what they need at each stage. The UI must not resemble an overloaded financial terminal or complex job portal.

## 3.3 Structured Data Over Free-Text Chaos
Critical listing information must use structured schemas so that projects can be searched, compared, verified, scored, and audited consistently.

## 3.4 Evidence Over Claims
A self-reported metric must be clearly differentiated from a verified or audited metric.

## 3.5 AI Advises; Deterministic Systems Decide
AI may summarize, compare, classify, recommend, detect risks, or assist. AI must not autonomously:
- approve KYC;
- accept an offer;
- sign an agreement;
- transfer ownership;
- release escrow;
- send funds;
- change legal rights.

## 3.6 Provider Abstraction
Payments, escrow, crypto, KYC, AI, email, storage, search, and analytics providers must be replaceable without rewriting business logic.

## 3.7 Security Is a Product Feature
Permissions, auditability, data-room access, session security, settlement controls, and privacy must be visible and testable product capabilities.

## 3.8 Modular Monolith First
Do not begin with excessive microservices. Build a modular monolith with clear boundaries, domain events, workers, and an outbox. Split services when organizational or scale requirements justify it.

## 3.9 No Hidden “Done”
A feature is complete only when functional, error, loading, permission, accessibility, telemetry, security, automated-testing, and documentation requirements pass.

---

# 4. Target User Segments

## 4.1 Visitor
Can browse approved public opportunities and marketing content.

## 4.2 Founder / Builder
Owns or represents a product/project and can create a listing.

## 4.3 Seller
Offers a software business, digital asset, codebase, IP, or technology asset for sale.

## 4.4 Buyer / Acquirer
Evaluates and acquires digital businesses or assets.

## 4.5 Investor
Evaluates investment opportunities where legally enabled.

## 4.6 Corporate Scout
Searches for startups, tools, IP, acquisitions, licenses, or partnership opportunities for an enterprise.

## 4.7 Advisor
Supports a buyer/seller through diligence or negotiation.

## 4.8 Legal Participant
Receives scoped access to legal documents, agreements, diligence items, and signatures.

## 4.9 Organization Administrator
Controls workspace members, role assignments, billing, and organization-level settings.

## 4.10 Verification Analyst
Reviews identity, organization, listing, technical, and evidence verification.

## 4.11 Compliance Analyst
Handles KYC/AML/risk/sanctions/compliance cases where applicable.

## 4.12 Deal Operations
Assists with deal workflow, failed settlements, disputes, and asset-transfer operations.

## 4.13 Support Agent
Handles non-privileged customer-support activity.

## 4.14 Platform Administrator
Manages marketplace operations, moderation, plans, feature flags, and controlled administrative actions.

## 4.15 Super Administrator
Highly restricted emergency/platform-level role. Must use MFA, strong audit, and limited assignment.

---

# 5. Asset Types

The listing model must support more than SaaS.

Minimum supported asset types:

- SaaS business;
- micro-SaaS;
- AI product;
- mobile application;
- API business;
- developer tool;
- browser extension;
- marketplace;
- e-commerce technology;
- source-code product;
- algorithm;
- software library;
- dataset;
- intellectual property;
- patent-backed technology;
- internal enterprise tool;
- prototype/MVP;
- automation product;
- cybersecurity tool;
- fintech technology;
- health-tech software;
- vertical SaaS;
- infrastructure tooling;
- other approved digital asset.

Each listing must have:
- `assetType`;
- `category`;
- `subcategory`;
- `projectStage`;
- `transactionOptions`.

---

# 6. Project / Business Stages

Minimum stages:

- Idea;
- Prototype;
- MVP;
- Private Beta;
- Public Beta;
- Pre-Revenue;
- Revenue Generating;
- Profitable;
- Growth;
- Scaling;
- Mature;
- Acquisition Ready;
- Distressed / Special Situation;
- Archived / Not Available.

Stage affects:
- required listing fields;
- metric expectations;
- verification requirements;
- discovery filters;
- risk messaging.

---

# 7. Supported Deal Types

The platform must treat deal structure as a first-class domain.

Minimum deal types:

1. Full Acquisition
2. Partial Asset Acquisition
3. Source-Code Purchase
4. Intellectual-Property Purchase
5. Technology License
6. Exclusive License
7. Non-Exclusive License
8. Strategic Partnership
9. Revenue-Share Agreement
10. Equity Investment — feature-gated by jurisdiction/compliance
11. Convertible Instrument — future/regulatory
12. Other Structured Deal — admin-approved

Deal types must not share a single generic checkout.

Each deal type defines:
- required participants;
- legal documents;
- diligence templates;
- settlement model;
- transfer checklist;
- completion criteria.

---

# 8. Regulatory Product Separation

The platform architecture must separate:

## 8.1 Commercial Transactions
- software/business acquisitions;
- code purchases;
- licensing;
- IP transfers;
- partnership contracts.

## 8.2 Regulated Investment Transactions
- equity;
- securities;
- tokenized securities;
- regulated investment products;
- other jurisdiction-dependent instruments.

Investment functionality must be:
- jurisdiction-aware;
- feature-flagged;
- compliance-approved;
- provider-integrated;
- unavailable where unsupported.

No product requirement may assume that listing an investment opportunity automatically makes it legal in every country.

---

# 9. Crypto Strategy

## 9.1 Core Rule
Dealith should be crypto-capable but **non-custodial by default in the initial product**.

## 9.2 V1
- fiat settlement through approved providers;
- escrow-provider integration;
- platform-side settlement records;
- provider webhooks;
- reconciliation;
- no platform-controlled customer private keys.

## 9.3 Later
Supported crypto rails may include:
- stablecoins;
- BTC;
- ETH;
- supported regulated assets.

Crypto support must use a provider abstraction and may require:
- wallet screening;
- KYC/AML;
- blockchain analytics;
- sanctions screening;
- travel-rule controls;
- transaction limits;
- allowlists;
- approval policies.

## 9.4 Forbidden Early Architecture
Do not:
- build a custom blockchain;
- build internal crypto custody;
- store seed phrases;
- store user private keys in the application database;
- create a token merely for marketing;
- treat deal settlement like a crypto trading exchange.

---

# 10. Marketplace User Journey

Canonical lifecycle:

```text
Visitor
  ↓
Discover
  ↓
Register
  ↓
Select Intent
  ↓
Identity / Organization Setup
  ↓
Create Listing OR Explore Listings
  ↓
Verify Listing
  ↓
Publish
  ↓
Discover / Search / Match
  ↓
Preview
  ↓
Save / Deal Cart
  ↓
Compare
  ↓
Request Private Access
  ↓
Owner Review
  ↓
NDA
  ↓
Confidential Access
  ↓
Discussion
  ↓
Offer
  ↓
Negotiation
  ↓
LOI
  ↓
Deal Room
  ↓
Due Diligence
  ↓
Agreement
  ↓
Escrow / Settlement
  ↓
Asset Transfer
  ↓
Inspection / Confirmation
  ↓
Release
  ↓
Deal Completion
  ↓
Portfolio
  ↓
Review / Reputation
```

---

# 11. Public Website Information Architecture

Routes:

```text
/
├── /explore
├── /categories
├── /categories/[slug]
├── /projects/[slug]
├── /how-it-works
├── /sell
├── /buy
├── /investors
├── /enterprise
├── /pricing
├── /trust
├── /security
├── /about
├── /legal/terms
├── /legal/privacy
├── /legal/cookies
├── /login
├── /register
└── /verify
```

Public pages must be:
- SEO-friendly where appropriate;
- performant;
- responsive;
- accessible;
- analytics-instrumented.

---

# 12. Authentication & Onboarding

## 12.1 Authentication Requirements

**FR-AUTH-001** Email/password registration.  
**FR-AUTH-002** Email verification.  
**FR-AUTH-003** Secure login.  
**FR-AUTH-004** Password reset.  
**FR-AUTH-005** MFA support.  
**FR-AUTH-006** Session listing and revocation.  
**FR-AUTH-007** Device/session metadata.  
**FR-AUTH-008** Rate limiting and brute-force protections.  
**FR-AUTH-009** Secure account recovery.  
**FR-AUTH-010** Organization invitation acceptance.  
**FR-AUTH-011** Optional enterprise SSO in later tier.  

## 12.2 Progressive Onboarding

After registration:

1. choose primary intent:
   - sell/list;
   - buy/acquire;
   - invest;
   - scout technology;
   - advisor.

2. choose identity:
   - individual;
   - company/organization.

3. complete profile;

4. optional/required verification based on requested action;

5. enter relevant workspace.

A user may have multiple intents over time.

---

# 13. User Profiles

## 13.1 Common Profile
- avatar;
- display name;
- professional name;
- location;
- bio;
- verified email;
- organization;
- skills/expertise;
- links;
- reputation;
- verification badges;
- activity visibility settings.

## 13.2 Founder/Seller Profile
- projects;
- successful deals;
- response statistics;
- founder experience;
- technical/business background;
- verification status.

## 13.3 Buyer/Investor Profile
- investment/acquisition thesis;
- preferred categories;
- deal-size range;
- geography;
- stage;
- preferred transaction types;
- portfolio;
- verified-buyer status;
- organization affiliation.

---

# 14. Organization & Team Management

Required capabilities:

- create organization;
- organization profile;
- legal/business metadata;
- invite members;
- assign roles;
- remove members;
- transfer ownership;
- workspace billing;
- team-level access;
- enterprise security settings;
- audit member changes;
- project ownership by organization;
- deal participation by organization.

Roles must be scoped per organization where possible.

---

# 15. Project Creation Wizard

The listing experience must be guided.

## Step 1 — Identity
- project name;
- logo;
- URL;
- asset type;
- category;
- stage;
- incorporation status;
- owner.

## Step 2 — Problem
- problem statement;
- affected audience;
- pain points;
- current alternatives;
- why problem matters.

## Step 3 — Solution
- value proposition;
- solution description;
- differentiation;
- use cases.

## Step 4 — Product Preview
- screenshots;
- product video;
- demo URL;
- interactive demo;
- sandbox availability;
- supported platforms.

## Step 5 — Capabilities / Services
Structured capabilities:
- name;
- category;
- description;
- proof/demo;
- maturity.

## Step 6 — Business
- revenue model;
- pricing model;
- customer segment;
- customer count;
- recurring/non-recurring revenue;
- sales channels.

## Step 7 — Market
- market;
- geography;
- competitors;
- differentiation;
- growth thesis;
- risks.

## Step 8 — Technology
- frontend;
- backend;
- database;
- infrastructure;
- AI providers;
- integrations;
- deployment;
- languages;
- architecture summary.

## Step 9 — Metrics
- MRR;
- ARR;
- profit;
- gross margin;
- churn;
- CAC;
- LTV;
- growth;
- active users;
- retention;
- other category-specific metrics.

Each metric requires:
- value;
- currency/unit;
- period;
- evidence state;
- source;
- last updated.

## Step 10 — Team
- founders;
- contributors;
- headcount;
- roles;
- transition availability.

## Step 11 — Deal
- transaction options;
- asking price/valuation where applicable;
- preferred structure;
- minimum acceptable structure;
- included assets;
- excluded assets;
- transition support.

## Step 12 — Verification
- identity;
- business;
- revenue;
- repository;
- domain;
- ownership;
- technical;
- security.

## Step 13 — Visibility
Set field/document visibility:
- public;
- authenticated;
- verified user;
- approved buyer;
- NDA required;
- deal participant;
- platform only.

## Step 14 — Preview
Exact buyer-facing preview.

## Step 15 — Submit
Listing enters review workflow.

---

# 16. Listing Status Lifecycle

Statuses:

```text
DRAFT
INCOMPLETE
READY_FOR_REVIEW
SUBMITTED
UNDER_REVIEW
CHANGES_REQUESTED
APPROVED
SCHEDULED
PUBLISHED
PAUSED
UNDER_OFFER
DEAL_IN_PROGRESS
SOLD
WITHDRAWN
REJECTED
SUSPENDED
ARCHIVED
```

Every transition must be validated server-side.

---

# 17. Project Detail Page

Mandatory sections:

1. Hero
2. Verification
3. Overview
4. Problem
5. Solution
6. Product preview
7. Capabilities/services
8. Market
9. Traction
10. Business model
11. Metrics
12. Technology
13. Architecture
14. Security
15. Repository signals
16. Team
17. Deal options
18. Included assets
19. Confidential-information callout
20. Owner profile
21. Similar opportunities
22. Save
23. Deal Cart
24. Request access
25. Contact / start discussion

Sensitive fields must never leak in page-source/API responses when the viewer lacks permission.

---

# 18. Marketplace Discovery

## 18.1 Browse
Users can browse:
- featured;
- trending;
- newly listed;
- verified;
- high-growth;
- profitable;
- acquisition-ready;
- AI;
- SaaS;
- cybersecurity;
- developer tools;
- fintech;
- other categories.

## 18.2 Search
Search must support:
- keyword;
- semantic relevance;
- filters;
- sort;
- pagination/cursoring;
- typo tolerance where supported.

## 18.3 Filters
Minimum:
- asset type;
- category;
- stage;
- geography;
- asking price;
- revenue;
- profit;
- growth;
- technology;
- verification;
- deal type;
- team size;
- age;
- buyer/investor eligibility.

## 18.4 Sorting
- relevance;
- newest;
- trending;
- revenue;
- growth;
- price;
- verification confidence;
- potential score.

---

# 19. Saved Search & Alerts

Users can:
- save search;
- edit search;
- remove search;
- enable notification;
- receive matching-project alerts;
- set frequency/preferences.

Notification throttling is required to prevent spam.

---

# 20. Watchlist

A Watchlist is lightweight bookmarking.

Supports:
- save;
- remove;
- private notes;
- tags;
- collection;
- share with enterprise team where permitted.

Watchlist != Deal Cart.

---

# 21. Deal Cart

The Deal Cart is a structured evaluation workspace, not checkout.

Capabilities:
- add eligible project;
- remove project;
- select intended deal type;
- private note;
- comparison;
- team collaboration;
- request access from cart;
- initiate individual deal.

Constraints:
- no multi-company one-click purchase;
- no bundled escrow;
- each negotiation becomes an independent `Deal`.

---

# 22. Project Comparison

Compare 2–5 listings.

Dimensions:
- category;
- stage;
- revenue;
- growth;
- profitability;
- customers;
- churn;
- business model;
- market;
- technology;
- technical health;
- security;
- verification;
- team;
- asking price;
- deal structure;
- risk signals;
- AI summary.

Unknown/missing information must display as unknown, never silently inferred.

---

# 23. Access Requests

A user can request private access.

Request includes:
- requester;
- organization;
- purpose;
- intended deal type;
- optional message;
- requested data categories.

Owner can:
- approve;
- partially approve;
- reject;
- request more information;
- require NDA.

Every decision is audited.

---

# 24. NDA Workflow

Capabilities:
- platform template;
- uploaded custom NDA;
- electronic-signature provider integration;
- signer routing;
- status tracking;
- expiration;
- document hash/reference;
- signed-copy retention;
- audit history.

NDA state:
```text
NOT_REQUIRED
REQUIRED
SENT
VIEWED
SIGNED
DECLINED
EXPIRED
VOIDED
```

Document access policies can depend on NDA state.

---

# 25. Messaging & Negotiation

Messaging must support:
- one-to-one;
- deal-room threads;
- organization participants;
- attachments with permission controls;
- system messages;
- read status;
- moderation/report;
- block functionality;
- notification preferences;
- audit records where appropriate.

Messaging must not become the source of truth for legal/financial state changes.

Offers, NDA, agreement, settlement, and diligence must use structured objects.

---

# 26. Virtual Data Room

Folders:
- Corporate;
- Financial;
- Legal;
- Customers;
- Team;
- Technology;
- Security;
- Infrastructure;
- Intellectual Property;
- Contracts;
- Other.

## 26.1 Document Controls
Per document:
- classification;
- visibility;
- permitted participant groups;
- NDA requirement;
- download enabled/disabled;
- watermark;
- expiration;
- version;
- uploader;
- hash/reference;
- retention policy;
- legal hold;
- malware scan;
- access log.

## 26.2 Required Events
Audit:
- uploaded;
- updated;
- viewed;
- downloaded;
- shared;
- permission changed;
- deleted/archived;
- expired.

## 26.3 Security
Documents must use:
- private object storage;
- short-lived signed URLs;
- authorization before URL creation;
- server-side metadata validation;
- malware scanning;
- MIME/type verification;
- size limits;
- encrypted storage.

---

# 27. Technical Intelligence

## 27.1 Repository Integrations
Future supported:
- GitHub;
- GitLab;
- Bitbucket.

Use delegated provider authorization.

## 27.2 Derived Signals
Potential signals:
- language mix;
- repository age;
- contributors;
- recent activity;
- release cadence;
- test presence;
- CI/CD presence;
- dependency health;
- security alerts where authorized;
- documentation;
- project structure;
- code ownership signals;
- operational maturity.

## 27.3 No Unauthorized Source-Code Exposure
Investors receive derived technical intelligence unless the owner explicitly grants repository/source access.

## 27.4 Technical Score Components
- architecture;
- maintainability;
- testing;
- documentation;
- security;
- dependency health;
- deployment maturity;
- scalability;
- technical debt.

Every score:
- versioned;
- evidence-linked;
- confidence-scored;
- timestamped.

---

# 28. Verification System

Verification types:

- Email Verified
- Phone Verified
- Identity Verified
- Organization Verified
- Domain Verified
- Ownership Verified
- Repository Verified
- Revenue Verified
- Financial Verified
- Technical Reviewed
- Security Reviewed
- Deal History Verified

Each verification has:
- status;
- provider;
- evidence;
- reviewer;
- reason;
- expiration;
- completedAt.

Statuses:
```text
NOT_STARTED
PENDING
IN_REVIEW
VERIFIED
FAILED
EXPIRED
REVOKED
```

---

# 29. Evidence Classification

Every important claim should indicate:

```text
SELF_REPORTED
DOCUMENT_SUPPORTED
PROVIDER_VERIFIED
PLATFORM_VERIFIED
INDEPENDENTLY_AUDITED
```

The UI must visually distinguish confidence.

---

# 30. Project Potential Score

The score must be explainable.

Example components:
- business quality;
- traction;
- market;
- technology;
- security;
- scalability;
- founder credibility;
- verification confidence.

Requirements:
- no guaranteed investment-return claim;
- no hidden material inputs;
- confidence shown;
- score version stored;
- historical score retained where useful;
- manual overrides audited;
- AI-generated observations labeled.

---

# 31. AI Platform

## 31.1 AI Gateway
All AI calls go through a provider-neutral AI Gateway.

Responsibilities:
- model routing;
- prompts/templates;
- redaction;
- budget control;
- rate limits;
- retries;
- tracing;
- evaluations;
- safety;
- logging policy;
- provider failover.

## 31.2 AI Features
### Listing Copilot
- improve listing;
- summarize;
- classify;
- identify missing information;
- suggest questions.

### Buyer/Investor Copilot
- compare projects;
- summarize;
- explain metrics;
- generate diligence questions;
- identify evidence gaps.

### Technical Copilot
- explain architecture;
- summarize repository findings;
- highlight technical risks;
- generate technical-diligence checklist.

### Deal Copilot
- summarize conversation;
- summarize diligence status;
- flag unresolved items;
- summarize documents subject to permissions.

## 31.3 AI Prohibitions
AI cannot:
- approve/reject users for regulated status autonomously;
- sign;
- legally bind parties;
- move funds;
- release escrow;
- modify settlement recipient;
- change permissions without user action.

---

# 32. Offer System

Offer fields:
- project;
- buyer;
- seller;
- deal type;
- currency;
- amount;
- structure;
- conditions;
- deposit;
- expiration;
- notes;
- status.

Statuses:
```text
DRAFT
SUBMITTED
VIEWED
COUNTERED
ACCEPTED
REJECTED
WITHDRAWN
EXPIRED
SUPERSEDED
```

Every counteroffer creates a version/revision.

Financial precision must use decimal types, never floating-point money.

---

# 33. Deal State Machine

Canonical baseline:

```text
INQUIRY
ACCESS_REQUESTED
ACCESS_APPROVED
NDA_REQUIRED
NDA_SIGNED
DISCUSSION
OFFER_SUBMITTED
NEGOTIATION
OFFER_ACCEPTED
LOI_PENDING
LOI_SIGNED
DUE_DILIGENCE
AGREEMENT_PENDING
AGREEMENT_SIGNED
SETTLEMENT_PENDING
ESCROW_PENDING
ESCROW_FUNDED
ASSET_TRANSFER
INSPECTION
RELEASE_PENDING
SETTLED
CLOSED
```

Exit states:
```text
REJECTED
WITHDRAWN
EXPIRED
CANCELLED
DISPUTED
FAILED
```

Rules:
- transitions server-controlled;
- transition permissions explicit;
- invalid transitions rejected;
- every transition audited;
- financial transitions idempotent;
- external-provider events reconciled.

---

# 34. Due Diligence

Categories:
- corporate;
- financial;
- tax;
- legal;
- technology;
- cybersecurity;
- operations;
- HR;
- customers;
- vendors;
- IP;
- compliance;
- infrastructure.

Task fields:
- title;
- category;
- description;
- owner;
- reviewer;
- status;
- due date;
- evidence;
- comments;
- risk level;
- result;
- blockers.

Statuses:
```text
NOT_STARTED
REQUESTED
IN_PROGRESS
SUBMITTED
UNDER_REVIEW
NEEDS_CLARIFICATION
PASSED
FAILED
WAIVED
NOT_APPLICABLE
```

Templates can depend on asset and deal type.

---

# 35. Agreements

Capabilities:
- agreement templates;
- generated agreement metadata;
- upload counsel-provided agreements;
- versioning;
- participant approval;
- e-signature-provider integration;
- signer order;
- signed-document storage;
- immutable audit references.

The platform should not imply that generated templates replace legal counsel.

---

# 36. Settlement & Escrow

## 36.1 Settlement Orchestrator
Internal interface:

```text
createParticipant()
verifyParticipant()
createSettlement()
createEscrow()
fund()
getStatus()
release()
refund()
cancel()
handleWebhook()
reconcile()
```

## 36.2 Provider Independence
Potential providers:
- fiat marketplace payment provider;
- regulated escrow provider;
- bank-transfer provider;
- approved crypto settlement provider.

## 36.3 Settlement Controls
- idempotency keys;
- signed webhook verification;
- duplicate-event handling;
- out-of-order event handling;
- reconciliation jobs;
- retry policy;
- manual-review queue;
- transaction limits;
- currency precision;
- immutable financial journal references.

## 36.4 Never Trust Client State
Frontend must never determine:
- “payment completed”;
- “escrow funded”;
- “funds released”.

Server/provider-confirmed state is authoritative.

---

# 37. Asset Transfer

Deal completion should support transfer checklists.

Possible transfer items:
- source-code repository;
- domain;
- cloud account/resources;
- database/export;
- app-store listing;
- social accounts;
- email domain;
- analytics property;
- third-party SaaS accounts;
- customer contracts;
- IP assignment;
- documentation;
- credentials via secure process;
- support/transition period.

Each transfer item:
- owner;
- recipient;
- status;
- evidence;
- due date;
- confirmation;
- dispute marker.

Never expose reusable secrets in ordinary chat.

---

# 38. Portfolio

After completion:

## Buyer Portfolio
- acquired projects;
- investment positions;
- licenses;
- purchase price;
- completion date;
- documents;
- ongoing metrics;
- notes;
- team access.

## Seller History
- sold projects;
- deal outcome;
- retained rights if any;
- reviews;
- transaction records.

Portfolio analytics become a later SaaS expansion.

---

# 39. Reviews & Reputation

Reputation may use:
- identity verification;
- successful deal count;
- dispute rate;
- response behavior;
- listing accuracy;
- completed verification;
- transaction completion;
- counterparty reviews.

Anti-abuse requirements:
- only eligible counterparties can review;
- one review per completed relationship unless policy allows edits;
- moderation;
- fraud detection;
- no pay-for-review.

---

# 40. Notifications

Channels:
- in-app;
- email;
- push later;
- enterprise integrations later.

Events:
- verification changes;
- listing review;
- saved-search match;
- access request;
- NDA;
- message;
- offer;
- counteroffer;
- diligence;
- agreement;
- settlement;
- transfer;
- dispute;
- security alert.

Users can configure non-critical notification preferences.

Security/financial alerts may be mandatory.

---

# 41. Analytics

## 41.1 Founder Analytics
- listing views;
- unique visitors;
- buyer views;
- saves;
- Deal Cart additions;
- access requests;
- NDA conversions;
- conversations;
- offer count;
- funnel conversion.

## 41.2 Buyer Analytics
- viewed;
- saved;
- Deal Cart;
- comparisons;
- deal rooms;
- offers;
- completed deals.

## 41.3 Marketplace Analytics
- active listings;
- GMV where applicable;
- transaction conversion;
- time-to-deal;
- category demand;
- supply/demand;
- verification completion;
- fraud/risk;
- retention.

## 41.4 Privacy
Analytics must not expose another user's private behavior beyond product policy.

---

# 42. Subscription & Monetization

Potential plans:

## Founder Free
- limited active listing;
- public marketplace;
- basic analytics;
- basic messaging.

## Founder Pro
- multiple listings;
- advanced analytics;
- enhanced verification;
- private listings;
- advanced Deal Room;
- AI listing intelligence.

## Buyer/Investor Pro
- advanced filters;
- saved searches;
- comparison;
- advanced intelligence;
- enhanced diligence;
- private notes.

## Enterprise
- teams;
- corporate scouting;
- SSO;
- advanced audit;
- private collections;
- API;
- role management;
- procurement/investment workflows;
- dedicated support.

Additional revenue:
- verification;
- technical audit;
- premium listing;
- data-room add-on;
- transaction/success fee where lawful;
- settlement fee;
- AI intelligence;
- API usage.

---

# 43. Admin Application

Separate administration surface.

Modules:
- operations dashboard;
- users;
- organizations;
- listings;
- moderation;
- verification queue;
- compliance cases;
- risk alerts;
- deal monitoring;
- settlement monitoring;
- disputes;
- billing;
- subscriptions;
- reports;
- support;
- audit explorer;
- feature flags;
- system health.

Admin actions must be:
- permissioned;
- reason-required for sensitive actions;
- audited;
- protected by MFA.

---

# 44. RBAC + ABAC

RBAC determines broad capability.

ABAC evaluates context:
- user role;
- organization;
- project ownership;
- deal membership;
- NDA status;
- verification;
- document class;
- jurisdiction;
- subscription;
- transaction stage;
- feature flag.

Example:

```text
CAN_VIEW_FINANCIAL_DOCUMENT =
  authenticated
  AND approved_buyer
  AND deal_participant
  AND nda_signed
  AND document_permission_allows
```

Authorization must be enforced server-side.

---

# 45. Data Privacy

Requirements:
- collect minimum necessary data;
- purpose limitation;
- access controls;
- encryption;
- retention policy;
- deletion/export workflows subject to legal obligations;
- consent where required;
- processor/subprocessor registry;
- data classification;
- confidential-project protections.

Sensitive logs must not include:
- passwords;
- access tokens;
- private keys;
- complete financial credentials;
- unnecessary KYC document contents.

---

# 46. Security Baseline

Use OWASP ASVS as an application-security verification baseline.

Minimum controls:
- secure authentication;
- MFA;
- password hashing;
- session rotation;
- CSRF protection where applicable;
- XSS defense;
- output encoding;
- SQL injection prevention;
- SSRF defense;
- strict file-upload validation;
- malware scanning;
- IDOR/BOLA tests;
- rate limiting;
- API authorization;
- secret management;
- encryption in transit;
- encryption at rest;
- KMS-managed keys where appropriate;
- WAF;
- security headers;
- dependency scanning;
- SAST;
- container scanning;
- infrastructure scanning;
- audit logging;
- suspicious-login detection;
- admin hardening;
- webhook signature verification;
- financial idempotency;
- reconciliation.

---

# 47. Audit Architecture

Audit events for:
- login;
- MFA changes;
- password reset;
- user/role changes;
- project changes;
- verification decisions;
- document access;
- permissions;
- NDA;
- offers;
- deal transitions;
- settlement;
- payout/recipient changes;
- asset transfer;
- disputes;
- admin action.

Audit event fields:
- event id;
- timestamp;
- actor;
- subject/resource;
- action;
- organization;
- IP metadata;
- user agent;
- trace ID;
- before/after reference where safe;
- result;
- reason.

Critical evidence should support immutable retention.

---

# 48. Technical Architecture

## 48.1 Initial Architecture

```text
                         INTERNET
                            │
                         CDN/WAF
                            │
               ┌────────────┴────────────┐
               │                         │
          Marketplace Web            Admin Web
             Next.js                  Next.js
               │                         │
               └────────────┬────────────┘
                            │
                         API Layer
                          NestJS
                            │
 ┌──────────┬──────────┬────┴─────┬──────────┬──────────────┐
 │          │          │          │          │              │
Identity  Projects  Marketplace  Deals    Documents     Settlement
 │          │          │          │          │              │
Org      Search    Intelligence  DD      Agreements     Compliance
 │                                                         │
 └────────────────────── Domain Events ─────────────────────┘
                            │
                    Transactional Outbox
                            │
                         Workers
                            │
              ┌─────────────┼─────────────┐
              │             │             │
             AI       Notifications   Verification
```

## 48.2 Architecture Style
- modular monolith;
- explicit bounded contexts;
- shared contracts;
- domain events;
- transactional outbox;
- background workers;
- provider adapters;
- strong test seams.

---

# 49. Recommended Technology Stack

## Frontend
- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- Framer Motion;
- TanStack Query;
- React Hook Form;
- Zod;
- accessible component primitives;
- Playwright.

## Backend
- NestJS;
- TypeScript;
- Prisma;
- PostgreSQL;
- Redis;
- BullMQ initially.

## Search
- OpenSearch when needed;
- PostgreSQL search acceptable for initial limited scale if benchmarked.

## Object Storage
- AWS S3-compatible private storage.

## Infrastructure
- AWS;
- ECS/Fargate initially;
- RDS PostgreSQL;
- ElastiCache Redis;
- CloudFront;
- WAF;
- KMS;
- Secrets Manager;
- S3;
- Terraform.

## Observability
- OpenTelemetry;
- metrics backend;
- log backend;
- trace backend;
- alerting.

## CI/CD
- GitHub Actions.

---

# 50. Repository Structure

```text
dealith/

frontend/
├── marketplace/
├── admin/
└── packages/
    ├── ui/
    ├── design-system/
    ├── api-client/
    └── frontend-test-kit/

backend/
├── api/
├── workers/
├── prisma/
└── modules/
    ├── identity/
    ├── organization/
    ├── project/
    ├── marketplace/
    ├── search/
    ├── intelligence/
    ├── verification/
    ├── access/
    ├── messaging/
    ├── nda/
    ├── deal/
    ├── offer/
    ├── diligence/
    ├── data-room/
    ├── documents/
    ├── agreement/
    ├── settlement/
    ├── asset-transfer/
    ├── compliance/
    ├── risk/
    ├── billing/
    ├── analytics/
    ├── notification/
    ├── reputation/
    └── admin/

packages/
├── contracts/
├── types/
├── validation/
├── events/
├── observability/
├── security/
├── config/
└── test-kit/

infra/
├── terraform/
├── docker/
├── monitoring/
└── scripts/

docs/
├── architecture/
├── adr/
├── api/
├── product/
├── security/
├── compliance/
├── testing/
├── runbooks/
└── phase-reports/
```

---

# 51. Core Data Model

Required entities include:

```text
User
UserProfile
Session
MfaMethod

Organization
OrganizationMember
OrganizationInvitation

Verification
VerificationEvidence

Project
ProjectProfile
ProjectCategory
ProjectCapability
ProjectPreview
ProjectTechnology
ProjectArchitecture
ProjectMetric
ProjectFinancial
ProjectVerification
ProjectScore

RepositoryConnection
RepositoryAnalysis

Watchlist
WatchlistItem
SavedSearch

DealCart
DealCartItem

AccessRequest
Nda
NdaSigner

Conversation
ConversationParticipant
Message

Deal
DealParticipant
DealEvent

Offer
OfferRevision
LetterOfIntent

DataRoom
DataRoomFolder
Document
DocumentVersion
DocumentAccessPolicy
DocumentAccessEvent

DiligencePlan
DiligenceTask
DiligenceEvidence

Agreement
AgreementVersion
AgreementSigner

Settlement
Escrow
SettlementMilestone
FinancialTransaction
ProviderEvent

AssetTransfer
AssetTransferItem

Subscription
Plan
Invoice

Review
ReputationScore

Notification
NotificationPreference

ComplianceCase
RiskAlert

AuditEvent

FeatureFlag
```

---

# 52. API Domain Boundaries

Minimum logical API domains:

```text
/auth
/users
/organizations
/verifications
/projects
/marketplace
/search
/watchlists
/saved-searches
/deal-cart
/access-requests
/nda
/conversations
/deals
/offers
/diligence
/data-rooms
/documents
/agreements
/settlements
/transfers
/portfolio
/reviews
/reputation
/billing
/notifications
/analytics
/compliance
/admin
```

Rules:
- version APIs;
- validate every input;
- typed contracts;
- stable error schema;
- authorization middleware/guards;
- idempotency for sensitive writes.

---

# 53. Domain Events

Minimum event catalog:

```text
user.registered
user.verified

organization.created
organization.member_added

project.created
project.submitted
project.approved
project.published
project.paused
project.sold

verification.started
verification.completed
verification.failed

access.requested
access.approved
access.rejected

nda.sent
nda.signed
nda.expired

deal.created
deal.transitioned

offer.submitted
offer.countered
offer.accepted
offer.expired

diligence.started
diligence.task_completed
diligence.completed

agreement.sent
agreement.signed

settlement.created
settlement.funding_pending
escrow.funded
settlement.release_requested
settlement.released
settlement.failed

asset_transfer.started
asset_transfer.item_completed
asset_transfer.completed

deal.completed
deal.disputed

risk.detected
compliance.case_created
```

---

# 54. Transactional Outbox

Critical cross-module events must be written atomically with state changes.

Use:
- database transaction;
- outbox table;
- worker dispatch;
- retry;
- idempotent consumers;
- dead-letter handling;
- observability.

Do not rely on “save DB then publish message” without atomicity for financial/deal state.

---

# 55. UI/UX Design System

## 55.1 Brand Direction
Professional, elegant, technology-forward, institutional, trustworthy.

Reference feeling:
- Linear-like clarity;
- Stripe-like trust;
- Apple-like restraint;
- premium financial-product confidence.

Avoid:
- casino visuals;
- crypto-neon overload;
- excessive glassmorphism;
- constant animations;
- dense enterprise clutter.

## 55.2 Required Tokens
- typography;
- spacing;
- radii;
- borders;
- shadows;
- surfaces;
- semantic status;
- focus;
- motion;
- breakpoints.

## 55.3 Component Library
- buttons;
- inputs;
- selects;
- combobox;
- checkbox;
- radio;
- date picker;
- modal;
- drawer;
- popover;
- tooltip;
- toast;
- cards;
- project card;
- metrics;
- badges;
- verification badge;
- score component;
- data table;
- stepper;
- timeline;
- document row;
- deal stage;
- empty state;
- skeleton;
- error state;
- charts;
- upload;
- permission selector.

---

# 56. Responsive Requirements

Support:
- desktop;
- laptop;
- tablet;
- mobile web.

Critical deal/document flows must remain usable on mobile, but complex diligence/admin operations may use optimized desktop-first layouts.

No horizontal overflow on ordinary user flows.

---

# 57. Accessibility

Baseline:
- WCAG 2.2 AA target;
- keyboard navigation;
- visible focus;
- semantic labels;
- form errors announced;
- color contrast;
- reduced-motion support;
- alt text;
- accessible dialogs;
- screen-reader navigation;
- no information conveyed by color alone.

Accessibility is part of Definition of Done.

---

# 58. Performance Requirements

Initial targets:

- core API p95 < 400 ms under expected baseline load;
- search p95 < 600 ms where feasible;
- API server error rate < 0.5%;
- public project page LCP target < 2.5 s;
- lazy-load heavy preview assets;
- responsive images;
- cached public content;
- pagination/cursoring for large lists;
- background processing for slow AI/audit tasks.

Targets must be benchmarked and revised based on production evidence.

---

# 59. Availability & Reliability

Initial:
- core platform target 99.9% monthly availability;
- graceful degradation for AI;
- no deal loss when AI unavailable;
- no settlement decision based on UI state;
- retry transient providers;
- provider circuit-breakers where helpful;
- regular backup;
- recovery tests;
- incident runbooks.

---

# 60. Observability

Every service/module operation should support:
- trace;
- metrics;
- structured logs.

Context fields where appropriate:
- traceId;
- requestId;
- userId;
- organizationId;
- projectId;
- dealId;
- settlementId.

Dashboards:
- API health;
- database;
- Redis;
- queues;
- search;
- file processing;
- AI;
- provider webhooks;
- settlement;
- error rate;
- latency;
- security alerts.

---

# 61. Logging

Use structured logs.

Never log:
- passwords;
- raw authentication tokens;
- seed phrases;
- private keys;
- complete payment credentials;
- unnecessary KYC artifacts.

PII masking/redaction must be standardized.

---

# 62. Feature Flags

Required for:
- crypto;
- regulated investment features;
- experimental AI;
- provider migrations;
- new marketplace ranking;
- enterprise modules;
- staged releases.

Feature flags must support environment and user/org targeting where required.

---

# 63. Testing Strategy

Testing begins with Phase 1.

Layers:

1. static checks;
2. unit tests;
3. component tests;
4. integration tests;
5. contract tests;
6. API E2E;
7. browser E2E;
8. security tests;
9. performance tests;
10. resilience tests;
11. provider sandbox tests;
12. manual exploratory testing;
13. UAT;
14. production smoke tests.

---

# 64. Unit Testing

High-priority unit coverage:
- permissions;
- score logic;
- money calculations;
- deal transitions;
- offer versioning;
- document authorization;
- settlement state;
- commissions;
- refunds;
- idempotency;
- verification status;
- subscription entitlements.

Critical financial/security state logic should aim for near-complete branch coverage.

---

# 65. Integration Testing

Use real ephemeral infrastructure where practical:
- PostgreSQL;
- Redis;
- object-storage emulator;
- queue.

Test:
- repository persistence;
- transactions;
- outbox;
- workers;
- search sync;
- uploads;
- permissions;
- webhook handling;
- audit generation.

---

# 66. Contract Testing

Use contracts between:
- frontend/API;
- API/provider adapters;
- modules if later split into services.

Contract tests prevent silent integration drift.

---

# 67. Browser E2E Matrix

Mandatory baseline scenarios:

```text
AUTH-001 Register
AUTH-002 Verify Email
AUTH-003 Login
AUTH-004 MFA
AUTH-005 Forgot Password
AUTH-006 Logout
AUTH-007 Revoke Session

ORG-001 Create Organization
ORG-002 Invite Member
ORG-003 Role Permission

PROJECT-001 Create Draft
PROJECT-002 Complete Wizard
PROJECT-003 Preview
PROJECT-004 Submit
PROJECT-005 Review Changes
PROJECT-006 Publish
PROJECT-007 Pause

MARKET-001 Browse
MARKET-002 Search
MARKET-003 Filter
MARKET-004 Project Details
MARKET-005 Save
MARKET-006 Deal Cart
MARKET-007 Compare

ACCESS-001 Request Access
ACCESS-002 Approve Access
ACCESS-003 Reject Access
ACCESS-004 Permission Denial

NDA-001 NDA Required
NDA-002 Sign NDA
NDA-003 Expired NDA

MESSAGE-001 Conversation
MESSAGE-002 Attachment Permission

OFFER-001 Submit Offer
OFFER-002 Counteroffer
OFFER-003 Reject
OFFER-004 Accept
OFFER-005 Expire

DEAL-001 Create Deal
DEAL-002 Valid Transition
DEAL-003 Invalid Transition

VDR-001 Upload Document
VDR-002 View Authorized
VDR-003 Deny Unauthorized
VDR-004 Download Disabled
VDR-005 Expired Access

DD-001 Start Diligence
DD-002 Complete Task
DD-003 Needs Clarification
DD-004 Finish Diligence

AGREE-001 Send Agreement
AGREE-002 Sign Agreement

SETTLE-001 Create Settlement
SETTLE-002 Fund
SETTLE-003 Duplicate Webhook
SETTLE-004 Failed Payment
SETTLE-005 Release
SETTLE-006 Refund
SETTLE-007 Reconciliation

TRANSFER-001 Start Transfer
TRANSFER-002 Complete Item
TRANSFER-003 Confirm Assets

DISPUTE-001 Open Dispute

ADMIN-001 Review Listing
ADMIN-002 Suspend Listing
ADMIN-003 Verification Action
ADMIN-004 Compliance Block
```

---

# 68. Security Testing

Automated and manual checks:
- auth bypass;
- privilege escalation;
- IDOR/BOLA;
- broken object-level authorization;
- broken function-level authorization;
- injection;
- XSS;
- CSRF;
- SSRF;
- path traversal;
- unsafe upload;
- malware handling;
- sensitive data exposure;
- rate limiting;
- enumeration;
- reset-flow abuse;
- MFA bypass;
- session fixation;
- webhook forgery;
- replay attack;
- settlement duplication;
- permission-cache issues;
- signed URL misuse.

Independent penetration testing is mandatory before enabling real-money production settlement.

---

# 69. Performance Testing

Use k6 or equivalent.

Scenarios:
- browse;
- search;
- project view;
- login;
- deal-room access;
- message retrieval;
- data-room listing;
- burst listing traffic;
- webhook burst;
- background queue.

Create thresholds in CI/pre-production.

---

# 70. Resilience & Chaos Scenarios

Test:
- Redis unavailable;
- AI provider unavailable;
- email provider unavailable;
- storage latency;
- search unavailable;
- payment provider timeout;
- duplicate webhook;
- out-of-order webhook;
- DB failover;
- worker crash;
- queue retry;
- browser retry/double click.

Expected behavior must be documented.

---

# 71. CI/CD Pipeline

```text
Pull Request
  ↓
Formatting
  ↓
Lint
  ↓
Typecheck
  ↓
Unit Tests
  ↓
Component Tests
  ↓
Integration Tests
  ↓
Contract Tests
  ↓
Security / Dependency Scan
  ↓
Migration Validation
  ↓
Build
  ↓
Preview Deploy
  ↓
Browser E2E
  ↓
Review
  ↓
Merge
  ↓
Staging Deploy
  ↓
Smoke
  ↓
Performance / Security Gates
  ↓
Production Deploy
  ↓
Production Smoke
  ↓
Observe / Rollback if required
```

Mandatory gates cannot be ignored without documented emergency approval.

---

# 72. Environments

Required:
- local;
- test;
- dev;
- preview;
- staging;
- pre-production;
- production.

Rules:
- production data never copied casually to development;
- secrets unique per environment;
- provider sandbox outside production;
- staging mirrors production architecture as closely as economically reasonable.

---

# 73. Database & Migration Policy

- all schema changes via migrations;
- migration tested in CI;
- backwards-compatible deployment for risky changes;
- no manual production schema editing;
- backup before high-risk migration;
- rollback/forward-fix plan;
- indexes measured;
- financial values use Decimal;
- timestamps stored consistently;
- IDs non-guessable where appropriate.

---

# 74. Backup & Disaster Recovery

Required:
- automated DB backups;
- point-in-time recovery where supported;
- object-storage durability;
- restore test schedule;
- documented RPO/RTO;
- disaster runbook;
- secret rotation procedure;
- provider outage procedure.

A backup that has never been restored is not considered verified.

---

# 75. Compliance & Legal Readiness

Before real-money launch:
- jurisdiction analysis;
- terms of service;
- privacy policy;
- cookie policy;
- seller agreement;
- buyer agreement;
- marketplace rules;
- prohibited listings;
- dispute policy;
- refund/escrow policy;
- KYC/AML design where required;
- sanctions process;
- tax/invoice obligations;
- investment-securities analysis;
- VDA/crypto legal analysis;
- data-processing agreements;
- retention policy.

Legal/compliance implementation must be reviewed by qualified professionals in launch jurisdictions.

---

# 76. Fraud & Risk

Risk signals may include:
- new account + high-value deal;
- suspicious login;
- sudden payment-recipient change;
- repeated failed verification;
- mismatched ownership;
- suspicious documents;
- excessive access requests;
- anomalous settlement behavior;
- sanctioned address/person/provider signal;
- repeated disputes.

Risk engine can:
- flag;
- require additional verification;
- pause sensitive action;
- create manual-review case.

Financial blocking logic must be deterministic and reviewable.

---

# 77. Marketplace Moderation

Listings prohibited or restricted according to policy:
- illegal products/services;
- stolen code/IP;
- malware;
- credential theft tools;
- fraudulent businesses;
- unverifiable ownership;
- prohibited financial schemes;
- sanctions violations;
- misleading claims.

Moderation workflow:
```text
REPORTED
TRIAGED
UNDER_REVIEW
ACTION_TAKEN
NO_VIOLATION
APPEALED
CLOSED
```

---

# 78. Search Ranking Principles

Ranking may consider:
- relevance;
- completeness;
- verification;
- freshness;
- engagement quality;
- buyer intent;
- category fit.

Paid promotion must be labeled and must not silently overwrite trust/verification rankings.

---

# 79. SEO Requirements

Public listing SEO:
- canonical URLs;
- metadata;
- Open Graph;
- structured data where appropriate;
- sitemap;
- robots controls;
- private content noindex;
- no confidential data in metadata;
- server rendering/static optimization where appropriate.

---

# 80. Internationalization & Currency

Architecture should support:
- currencies;
- locale formatting;
- timezone;
- translated content later.

Money stored with:
- amount;
- currency;
- decimal precision.

Never compare currencies directly without explicit conversion data.

---

# 81. Email & Communication

Transactional email:
- verification;
- login/security alerts;
- access;
- NDA;
- offer;
- diligence;
- agreement;
- settlement;
- transfer.

Requirements:
- provider abstraction;
- templates;
- localization-ready;
- delivery tracking;
- bounce handling;
- unsubscribe for non-essential marketing;
- no secret data in email.

---

# 82. API Security

- TLS;
- authentication;
- authorization;
- rate limiting;
- request validation;
- response filtering;
- CORS policy;
- CSRF where needed;
- idempotency;
- pagination;
- audit;
- safe error responses;
- security headers;
- no stack traces in production.

---

# 83. Error Handling Standard

Errors should contain:
- stable code;
- user-safe message;
- request/trace ID;
- field errors where relevant.

Never leak:
- database errors;
- secret paths;
- provider secrets;
- internal stack details.

---

# 84. Product State UI Requirements

Every major screen must implement:
- loading;
- skeleton where useful;
- initial empty;
- filtered empty;
- success;
- recoverable error;
- fatal error;
- permission denied;
- expired access;
- offline/network issue where applicable.

No feature is complete with happy-path UI only.

---

# 85. Enterprise Features

Post-core enterprise scope:
- corporate scouting workspace;
- team collections;
- private notes;
- role-based teams;
- internal review;
- investment committee;
- procurement workflow;
- SSO;
- SCIM later;
- advanced audit;
- export;
- API;
- custom retention;
- dedicated account management;
- private marketplace/listings.

---

# 86. Mobile Strategy

V1:
- excellent responsive web.

Later:
- native mobile app if engagement justifies it.

Do not duplicate web/mobile engineering before the core transaction engine is validated.

---

# 87. Non-Functional Requirements

## NFR-SEC
Security and privacy requirements above.

## NFR-PERF
Performance targets defined and benchmarked.

## NFR-REL
No silent financial/deal-state loss.

## NFR-AUD
Critical operations fully auditable.

## NFR-OBS
Production issues diagnosable using logs/metrics/traces.

## NFR-ACC
WCAG 2.2 AA target.

## NFR-MAINT
Strict lint/typecheck; modular boundaries.

## NFR-TEST
Automated tests mandatory for critical flows.

## NFR-SCALE
Architecture supports horizontal stateless API scaling.

## NFR-DATA
Backups, retention, encryption, recovery.

---

# 88. Project Phases

The program is divided into controlled phases.

## Phase 0 — Product & Architecture Freeze
Deliver:
- PRD;
- user journeys;
- feature matrix;
- scope boundaries;
- architecture;
- data model;
- threat model;
- test strategy;
- ADR baseline;
- UI architecture;
- acceptance matrix.

Exit:
- no unresolved P0 architecture question.

## Phase 1 — Platform Foundation
Deliver:
- monorepo;
- frontend/backend;
- database;
- Redis;
- configuration;
- CI;
- environments;
- observability;
- error standards;
- design-system foundation.

Exit:
- CI green;
- deployable baseline;
- smoke test.

## Phase 2 — Identity & Organizations
Deliver:
- auth;
- verification email;
- reset;
- sessions;
- MFA;
- organizations;
- members;
- RBAC baseline.

Exit:
- auth/org E2E green;
- authorization negative tests green.

## Phase 3 — Project Publishing
Deliver:
- wizard;
- draft;
- preview;
- media;
- tech;
- metrics;
- deal options;
- submit/review lifecycle.

Exit:
- founder create→submit flow green.

## Phase 4 — Marketplace Discovery
Deliver:
- browse;
- filters;
- search;
- project detail;
- categories;
- watchlist;
- analytics events.

Exit:
- discovery E2E + performance baseline green.

## Phase 5 — Deal Cart & Comparison
Deliver:
- Deal Cart;
- notes;
- compare 2–5;
- AI comparison optional after deterministic baseline.

Exit:
- comparison workflow green.

## Phase 6 — Access & Communication
Deliver:
- access requests;
- approval;
- messaging;
- confidentiality gates.

Exit:
- permission tests green.

## Phase 7 — Verification & Intelligence
Deliver:
- verification framework;
- evidence classes;
- repository integration;
- technical intelligence;
- score framework.

Exit:
- evidence lineage and verification tests green.

## Phase 8 — NDA & Virtual Data Room
Deliver:
- NDA;
- signing integration;
- folders;
- document access;
- signed URLs;
- watermarks/download policy;
- malware scan;
- audit.

Exit:
- security suite + VDR E2E green.

## Phase 9 — Offers & Deal Engine
Deliver:
- offers;
- revisions;
- state machine;
- participants;
- deal timeline.

Exit:
- transition matrix fully tested.

## Phase 10 — Due Diligence
Deliver:
- templates;
- tasks;
- evidence;
- comments;
- review;
- risk.

Exit:
- diligence E2E green.

## Phase 11 — Agreements & Settlement Sandbox
Deliver:
- agreement versioning/signing;
- settlement abstraction;
- sandbox provider;
- escrow workflow;
- webhook processing;
- reconciliation.

Exit:
- financial idempotency suite green.

## Phase 12 — Asset Transfer & Completion
Deliver:
- transfer checklist;
- acceptance;
- inspection;
- release;
- close;
- portfolio.

Exit:
- full mock/sandbox acquisition E2E green.

## Phase 13 — Admin, Compliance & Risk
Deliver:
- admin;
- moderation;
- verification queue;
- risk;
- compliance cases;
- dispute support;
- audit explorer.

Exit:
- admin permission/security tests green.

## Phase 14 — Billing & Enterprise
Deliver:
- plans;
- subscriptions;
- entitlements;
- invoices;
- enterprise team features.

Exit:
- billing/entitlement E2E green.

## Phase 15 — Production Hardening
Deliver:
- penetration test;
- load test;
- recovery test;
- runbooks;
- alerting;
- legal gates;
- production environment;
- launch checklist.

Exit:
- all launch-blocking findings closed or formally accepted by authorized owner.

---

# 89. Phase Governance

Each phase requires:

```text
PHASE_XX_PLAN.md
PHASE_XX_REQUIREMENTS.md
PHASE_XX_TEST_MATRIX.md
PHASE_XX_REPORT.md
```

Report status:
- PASS;
- CONDITIONAL PASS (only for explicitly non-blocking approved items);
- FAIL/BLOCKED.

No phase is passed because “the main UI works”.

---

# 90. Definition of Done

A feature is DONE only when applicable items pass:

- requirement implemented;
- API implemented;
- schema/migration complete;
- server validation;
- authorization;
- happy state;
- loading state;
- empty state;
- error state;
- mobile/responsive;
- accessibility;
- unit tests;
- integration tests;
- E2E tests;
- negative/permission tests;
- security review;
- observability;
- analytics events;
- documentation;
- no unresolved critical TODO/FIXME;
- CI green;
- acceptance evidence recorded.

---

# 91. Deadline Protection & Delivery Discipline

To prevent deadline misses:

## 91.1 Dependency-Driven Phases
A phase begins only when required predecessor gates pass.

## 91.2 No Hidden Carryover
Any unfinished item is:
- blocker;
- explicitly deferred;
- documented with owner/reason/impact.

## 91.3 Risk Register
Maintain:
```text
risk
probability
impact
owner
mitigation
trigger
status
target resolution
```

## 91.4 Weekly Milestone Review
Review:
- planned vs completed;
- blockers;
- dependencies;
- critical defects;
- scope changes;
- security issues;
- test failures;
- architecture deviations;
- next-week priorities.

## 91.5 Change Control
New requirements must specify:
- priority;
- reason;
- affected modules;
- timeline impact;
- test impact;
- security/compliance impact.

## 91.6 WIP Limits
Do not open large numbers of incomplete feature branches/phases.

## 91.7 Evidence-Based Reporting
Statements such as “complete”, “secure”, “production-ready”, and “tested” require evidence.

---

# 92. Required Project Documents

Maintain continuously:

```text
README.md
MASTER_PROJECT_SCOPE.md
MASTER_PRODUCT_SPEC.md
ARCHITECTURE.md
ARCHITECTURE_DECISIONS.md
DATA_MODEL.md
API_CONTRACTS.md
SECURITY_MODEL.md
THREAT_MODEL.md
RBAC_ABAC_MATRIX.md
COMPLIANCE_BOUNDARIES.md
TEST_STRATEGY.md
E2E_TEST_MATRIX.md
DEPLOYMENT.md
OBSERVABILITY.md
RUNBOOKS.md
PROJECT_RISK_REGISTER.md
PHASE_ACCEPTANCE_MATRIX.md
CHANGELOG.md
```

---

# 93. Architecture Decision Records

ADRs required for material decisions including:
- modular monolith vs services;
- database;
- search;
- object storage;
- auth/session architecture;
- AI provider architecture;
- payment provider;
- escrow provider;
- crypto;
- event/outbox;
- document security;
- infrastructure;
- deployment;
- multi-tenancy.

---

# 94. Launch KPIs

Initial product KPIs:

## Marketplace
- qualified listings;
- listing completion rate;
- verified-listing percentage;
- buyer activation;
- search→project view;
- project view→save;
- save→access request.

## Deals
- access request→NDA;
- NDA→deal;
- deal→offer;
- offer→diligence;
- diligence→agreement;
- agreement→completion;
- median time to deal.

## Trust
- verification success;
- reported listings;
- fraud rate;
- dispute rate;
- security incident rate.

## SaaS
- free→paid conversion;
- MRR;
- retention;
- enterprise pipeline.

---

# 95. Acceptance Criteria for MVP

The first credible MVP is accepted only if:

1. user can register and securely authenticate;
2. organization/profile works;
3. seller can create and publish an approved project;
4. public buyer can discover listings;
5. authenticated buyer can save and Deal-Cart listings;
6. comparison works;
7. buyer can request private access;
8. owner controls access;
9. NDA flow works;
10. controlled data room works;
11. parties can message;
12. buyer can submit offer;
13. seller can counter/accept/reject;
14. deal state machine works;
15. diligence tasks work;
16. agreement flow works in sandbox/test;
17. settlement orchestration works in sandbox;
18. asset-transfer checklist works;
19. completed deal appears in portfolio;
20. admin can review/moderate;
21. audit trail exists;
22. RBAC/ABAC negative tests pass;
23. browser E2E critical path passes;
24. security baseline passes;
25. performance baseline passes;
26. backup/restore tested;
27. production observability available;
28. no open P0/Critical defects.

---

# 96. Explicitly Out of Scope for Initial Release

Unless re-approved:

- custom blockchain;
- custom crypto wallet custody;
- internal seed/private-key storage;
- proprietary token;
- DAO;
- secondary securities exchange;
- international regulated investment support everywhere;
- native mobile apps;
- 30+ microservices;
- autonomous AI transaction execution;
- AI-generated legal advice positioned as legal counsel;
- full accounting ERP;
- public source-code exposure;
- social-media-style feed as the primary product.

---

# 97. Known High-Risk Areas

1. Regulatory status of investment features
2. Crypto/VDA compliance
3. KYC/AML provider coverage
4. Fraudulent ownership/listings
5. Confidential document leakage
6. Payment/escrow correctness
7. Asset-transfer disputes
8. AI hallucinated project analysis
9. Unauthorized admin access
10. Cross-tenant data leakage
11. Marketplace cold start
12. Search/ranking manipulation
13. Fake revenue/traction evidence
14. Provider dependency/outage
15. Scope expansion before core deal flow is stable

Each must have a mitigation plan before relevant production capability is enabled.

---

# 98. Name Strategy

## Recommended Working Name: **Dealith**

### Why it fits
- distinctive;
- not limited to “startup”;
- not limited to “crypto”;
- supports acquisition, licensing, investment, and deal infrastructure;
- pronounceable;
- can operate as a parent-company/product brand;
- works with enterprise positioning.

### Suggested positioning
**Dealith — The operating system for digital asset deals.**

### Alternative taglines
- Discover. Verify. Negotiate. Acquire.
- Where digital businesses become deals.
- The trusted marketplace for technology ownership.
- From discovery to deal completion.
- Digital opportunities. Verified and transactable.

## Backup Name Candidates
Names should undergo formal clearance before adoption:
- Aqverra
- Dealora
- Veylance
- Nexquity
- Acqentra
- Venturial
- Projexium
- Dealvera

Avoid names already showing obvious active collisions during preliminary research, including candidates such as Ventoryx, ProjectNexa, and Assetora.

---

# 99. Brand Architecture

Possible product family:

```text
Dealith Marketplace
Dealith Intelligence
Dealith Deals
Dealith Data Room
Dealith Settlement
Dealith Portfolio
Dealith Enterprise
```

This supports a future MNC-style suite without changing the core brand.

---

# 100. Final Product Architecture

```text
                              DEALITH
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       │                         │                         │
       ▼                         ▼                         ▼
  MARKETPLACE                INTELLIGENCE                 DEALS
       │                         │                         │
 Discovery                  Verification               Access
 Search                     Technical Analysis         NDA
 Listings                   Business Signals           Messaging
 Watchlists                 AI Copilot                 Offers
 Deal Cart                  Scoring                    Data Room
 Comparison                 Evidence                   Due Diligence
                                                        Agreements
       │                         │                         │
       └─────────────────────────┼─────────────────────────┘
                                 ▼
                            SETTLEMENT
                                 │
                      Fiat / Escrow / Crypto Rails
                                 │
                                 ▼
                          ASSET TRANSFER
                                 │
                                 ▼
                             PORTFOLIO
                                 │
                                 ▼
                            ENTERPRISE
```

---

# 101. Engineering North Star

The implementation must optimize for this complete transaction:

> **A verified owner can publish a credible technology asset; a qualified buyer can discover it, understand it, request confidential access, sign an NDA, inspect evidence, negotiate a structured offer, complete due diligence, sign an agreement, fund a provider-managed settlement, confirm the asset transfer, complete the deal, and retain a permanent auditable record — without relying on off-platform spreadsheets, uncontrolled document links, or informal state tracking.**

If a feature does not strengthen:
- discovery;
- trust;
- evaluation;
- negotiation;
- diligence;
- settlement;
- transfer;
- portfolio;
- enterprise operation;

its priority must be questioned.

---

# 102. External Standards / Research Inputs

The architecture should continue to verify current standards and provider requirements before implementation.

Relevant research directions include:
- OWASP Application Security Verification Standard (ASVS)
- OpenTelemetry observability standards
- Playwright end-to-end testing practices
- k6 performance thresholds
- Pact contract testing
- AWS S3 Object Lock / immutable records
- marketplace payment-provider architecture
- escrow-provider requirements
- virtual data-room permission models
- KYC/AML/VDA obligations in supported jurisdictions

Because legal, payment, crypto, security, and provider requirements change, production implementation must re-check current documentation at the time each corresponding phase begins.

---

# 103. Final Scope Decision

Dealith is officially scoped as:

> **An enterprise SaaS platform and trusted marketplace for the discovery, technical and commercial evaluation, controlled disclosure, negotiation, due diligence, acquisition/investment/licensing, settlement, transfer, and post-deal management of digital businesses and technology assets.**

The project must be developed as a complete transaction system, not as a listing website.

**End of Master Scope v1.0**
