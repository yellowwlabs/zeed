# Midnight DeFi Angel

A two-sided startup fundraising platform with privacy-preserving zero-knowledge proofs. Issue SAFEs and convertible notes, manage cap tables, run e-signature workflows, and prove compliance facts on-chain without exposing sensitive data — powered by the Midnight network.

## Features

- **Deal Lifecycle Management** — Create rounds, set terms (valuation caps, discounts), invite investors, track commitments through signing and funding
- **SAFE & Convertible Note Instruments** — Full support for YC-style post-money SAFEs and convertible notes with precise Decimal.js math
- **Cap Table Management** — Track equity holders, security types, vesting schedules (cliff + graded), and conversion events
- **Document Templating & E-Signature** — Template-based document generation with signature blocks, ordered signing, tamper detection via content hashing, and full audit trails
- **Data Room** — Secure document sharing with per-investor access grants, watermarking, and expiration
- **Midnight ZK Proofs** — Selective disclosure proofs for founder majority control and investor accreditation without revealing underlying data
- **Wallet Integration** — Connect Midnight-compatible wallets for on-chain interactions
- **Role-Based Access Control** — Company members and investor members with granular permissions enforced at the tRPC middleware layer

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Backend** | Express 5 + tRPC v11, TypeScript |
| **Database** | PostgreSQL 18 + Prisma 7 |
| **UI** | Tailwind CSS 3 + shadcn/ui (Radix primitives) |
| **Auth** | JWT-based with Argon2id password hashing |
| **ZK/Blockchain** | Midnight Network (Compact contracts, shielded state) |
| **Financial Math** | Decimal.js (28-digit precision, no floats) |
| **Validation** | Zod (end-to-end type safety) |
| **Testing** | Vitest |

## Project Structure

```
.
├── backend/                        # Express + tRPC API server
│   ├── src/
│   │   ├── index.ts                # Entry point (port 3001)
│   │   ├── app.ts                  # Express app + middleware
│   │   ├── trpc.ts                 # tRPC context + middleware
│   │   ├── routes/v1/              # tRPC routers
│   │   │   ├── auth.ts             # Registration, login, session
│   │   │   ├── company.ts          # Company CRUD + membership
│   │   │   ├── investor.ts         # Investor entity CRUD
│   │   │   ├── deal.ts             # Deal creation + lifecycle
│   │   │   ├── investment.ts       # Investor commitments
│   │   │   ├── capTable.ts         # Cap table entries + vesting
│   │   │   ├── wallet.ts           # Midnight wallet connection
│   │   │   ├── accreditation.ts    # ZK accreditation proofs
│   │   │   ├── founder-majority.ts # ZK founder majority proofs
│   │   │   └── banner.ts           # Platform banners
│   │   ├── controllers/            # Request handlers
│   │   └── services/               # Business logic layer
│   └── prisma/
│       └── schema.prisma           # Full data model (20+ models)
│
├── frontend/                       # Next.js 16 web application
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── sign-in/                # Authentication
│   │   ├── sign-up/                # Registration
│   │   ├── dashboard/              # User dashboard
│   │   ├── web3-dashboard/         # Wallet + ZK proof dashboard
│   │   ├── companies/              # Company management
│   │   ├── investors/              # Investor management
│   │   ├── onboarding/             # User onboarding flow
│   │   └── api/                    # API routes
│   ├── lib/
│   │   ├── trpc/                   # tRPC client + provider
│   │   ├── wallet-context.tsx      # Midnight wallet state
│   │   └── finance/                # SAFE/note conversion math
│   └── types/                      # Shared TypeScript types
│
├── contracts/                      # Midnight Compact contracts
│   ├── src/
│   │   └── managed/
│   │       ├── accreditation/      # Investor accreditation proof
│   │       └── founder_majority/   # Founder control proof
│   └── scripts/                    # Compile + artifact management
│
├── docker/
│   ├── database/compose.yaml       # PostgreSQL 18
│   └── midnight/                   # Midnight infrastructure
│       ├── node/compose.yaml       # Midnight node
│       ├── indexer/compose.yaml    # Chain indexer
│       └── proofserver/compose.yaml # Proof server
│
├── docs/                           # Project documentation
├── Makefile                        # Developer commands
├── turbo.json                      # Turborepo pipeline
└── pnpm-workspace.yaml             # Workspace definition
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 11+
- PostgreSQL 16+ (or Docker)
- Midnight Compact compiler (for contract development)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env    # If available, otherwise edit .env directly
```

Required environment variables:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/midnight_defi_angel"
PORT=3001
AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NODE_ENV=development
```

### 3. Start PostgreSQL

```bash
docker compose -f docker/database/compose.yaml up -d
```

### 4. Set up the database

```bash
make db-generate    # Generate Prisma client
make db-push        # Push schema to database
```

### 5. Start development servers

```bash
make dev            # Frontend (3000) + Backend (3001) in parallel
```

Or run individually:
```bash
make dev-frontend   # Next.js on port 3000
make dev-backend    # Express on port 3001
```

### 6. Run tests

```bash
make test           # All workspace tests
make test-ui        # Vitest UI mode
make contracts-test # Midnight contract tests
```

## Makefile Commands

Run `make help` for the full list. Key commands:

| Command | Description |
|---------|-------------|
| `make dev` | Start frontend + backend in parallel |
| `make build` | Build all packages |
| `make db-generate` | Generate Prisma client |
| `make db-push` | Push schema to database |
| `make db-migrate` | Run migrations (dev) |
| `make db-studio` | Open Prisma Studio GUI |
| `make lint` | Lint all packages |
| `make typecheck` | TypeScript type checking |
| `make test` | Run all tests |
| `make contracts-test` | Run Midnight contract tests |
| `make clean` | Remove build artifacts |
| `make install-fresh` | Clean reinstall of all dependencies |

## Architecture

### Monorepo Layout

Three packages managed by pnpm workspaces and orchestrated by Turborepo:

- **`frontend`** — Next.js 16 app with App Router, tRPC client, React Query, and Midnight wallet integration
- **`backend`** — Express 5 server hosting tRPC v11 routers with Prisma ORM
- **`contracts`** — Midnight Compact contract source, compiled artifacts, and TypeScript bindings

The `contracts` package exports compiled contract bindings that the frontend consumes via `workspace:*` dependency.

### Data Model

The Prisma schema defines 20+ models across these domains:

**Identity & Auth** — `User`, `Account`, `Session`, `VerificationToken`, `UserRole`

**Companies (Issuers)** — `Company`, `CompanyMember` with roles and primary contact tracking

**Investors** — `Investor` entity, `InvestorMember` for user associations, `AccreditationProof` for ZK verification

**Cap Table** — `CapTableEntry` with security types, `VestingSchedule` (cliff + graded), share counts as BigInt

**Deals & Instruments** — `Deal` with default terms, `Investment` with per-investor term overrides, `ConversionEvent` for SAFE/note conversion tracking

**Documents & Signatures** — `DocumentTemplate`, `Document` with content hash tamper detection, `SignatureBlock` with ordered signing, `Signature` with IP/UA audit data

**Data Room** — `DataRoomItem` for deal documents, `DataRoomAccess` with per-investor grants and watermarking

**Audit** — `AuditEvent` (append-only, indexed by resource type + ID)

**Midnight Integration** — `WalletConnection`, `FounderMajorityProof`, `AccreditationProof`

### Authorization Model

All authorization is enforced through tRPC middleware:

- `companyMemberProcedure` — Requires `companyId` in input, verifies user membership
- `investorMemberProcedure` — Requires `investorId` in input, verifies user membership
- Procedures are composable; you cannot accidentally expose a query without auth

### Midnight ZK Proofs

Two Compact contracts implement selective disclosure:

**`founder_majority.compact`** — Founders prove they hold >= N basis points of fully-diluted shares without revealing exact counts. Uses cross-multiplication to avoid division in ZK circuits.

**`accreditation.compact`** — Investors prove they meet SEC Rule 501 thresholds (income >= $200k or net worth >= $1M) without revealing actual figures. Includes a 90-day validity window.

To compile contracts:
```bash
cd contracts && pnpm run compact
```

See [docs.midnight.network](https://docs.midnight.network) for compiler installation.

### Why Decimal.js

Floating-point arithmetic is unsuitable for financial calculations (`0.1 + 0.2 !== 0.3` in JavaScript). Decimal.js provides 28 significant digits with proper rounding. All financial values are stored as `Decimal` with `@db.Decimal(20, 10)` in Prisma and serialized as strings at API boundaries.

## Midnight Infrastructure

Local Midnight infrastructure is available via Docker Compose:

```bash
# Midnight node
docker compose -f docker/midnight/node/compose.yaml up -d

# Indexer
docker compose -f docker/midnight/indexer/compose.yaml up -d

# Proof server
docker compose -f docker/midnight/proofserver/compose.yaml up -d
```

## Security

- **Password hashing** — Argon2id (current best practice)
- **Session management** — JWT-based (no server-side session table)
- **Document integrity** — Content hash recomputed on every signature to detect tampering
- **Audit trail** — Append-only `AuditEvent` log, never deleted, indexed for fast lookup
- **Financial precision** — Decimal.js for all monetary values, BigInt for share counts
- **Input validation** — Zod schemas at every API boundary

## License

Private — All rights reserved.
