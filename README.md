# Fundraise SaaS

A two-sided marketplace for startup fundraising contracts: SAFEs and convertible notes, with cap table management, native e-signature, and Midnight-powered selective disclosure proofs.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma** + **PostgreSQL**
- **tRPC** (type-safe API end to end)
- **NextAuth v5** (Credentials provider with Argon2 hashing)
- **Tailwind CSS** + shadcn/ui primitives
- **Decimal.js** for all financial math (never floats for money)
- **Midnight Network** (Compact contracts for selective disclosure)
- **Vitest** for unit tests

## Project Structure

```
.
├── contracts/midnight/             # Compact smart contracts
│   ├── founder_majority.compact    # Demo proof #1: founder control
│   └── accreditation.compact       # Demo proof #2: accredited investor
├── prisma/
│   └── schema.prisma               # Full data model
├── src/
│   ├── app/                        # Next.js App Router pages + API routes
│   │   ├── api/auth/[...nextauth]  # NextAuth handler
│   │   ├── api/trpc/[trpc]         # tRPC handler
│   │   ├── dashboard/              # Authenticated dashboard
│   │   ├── sign-in/, sign-up/      # Auth pages
│   │   └── page.tsx                # Landing
│   ├── server/api/
│   │   ├── trpc.ts                 # tRPC init + middleware
│   │   ├── root.ts                 # Root router
│   │   └── routers/
│   │       ├── auth.ts             # Sign-up, me
│   │       ├── company.ts          # Issuer CRUD
│   │       ├── investor.ts         # Investor CRUD
│   │       ├── deal.ts             # Deal lifecycle
│   │       ├── investment.ts       # Investor commitments
│   │       └── capTable.ts         # Cap table management
│   ├── lib/
│   │   ├── db.ts                   # Prisma client
│   │   ├── auth.ts                 # NextAuth config
│   │   ├── utils.ts                # Helpers
│   │   ├── trpc/                   # Client + provider
│   │   └── finance/
│   │       ├── conversion.ts       # SAFE/Note conversion math
│   │       └── conversion.test.ts  # 11 unit tests (all passing)
│   └── types/                      # Shared TypeScript types
└── package.json
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your database URL and secrets
```

Generate an AUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Set up Postgres

Use Docker for a quick local Postgres:
```bash
docker run --name fundraise-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fundraise_saas \
  -p 5432:5432 -d postgres:16
```

### 4. Run migrations

```bash
npm run db:push     # Creates all tables from schema
npm run db:generate # Generates Prisma client
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Run tests

```bash
npm run test          # Run all tests
npm run test:ui       # Visual test runner
```

The conversion math tests (`src/lib/finance/conversion.test.ts`) cover SAFE conversion with cap, discount, and combined modes, plus note interest accrual and dilution math.

## Architecture Notes

### Why this data model

- **User**, **Company**, **Investor** are separate entities. A single user can be a member of multiple companies and multiple investor entities (e.g., a founder who also angel invests).
- **CompanyMember** / **InvestorMember** join tables hold roles. tRPC middleware (`companyMemberProcedure`, `investorMemberProcedure`) enforces membership on every request.
- **Deal** holds default terms shared by all investments in the round. **Investment** can override terms per investor (e.g., one investor gets a lower cap).
- **Document** is immutable once signing starts (`status: AWAITING_SIGNATURES`). `contentHash` is recomputed on every signature to detect tampering.
- **AuditEvent** is append-only. Never deleted. Indexed by `resourceType + resourceId` for fast lookup.

### Why Decimal.js for money

Floats are catastrophically wrong for currency. `0.1 + 0.2 !== 0.3` in JavaScript. Decimal.js gives us 28 significant digits and proper rounding. All financial inputs and outputs are strings; conversion happens at the boundary.

### Why tRPC + middleware-based authz

Every authorization check is a tRPC middleware. You can't accidentally expose a query without auth because the middleware runs before the handler. `companyMemberProcedure` requires `companyId` in input and verifies membership; same for `investorMemberProcedure`.

## Midnight Contracts

The two Compact contracts in `contracts/midnight/` implement selective disclosure proofs:

### 1. `founder_majority.compact`

Founders prove they hold ≥ N basis points of fully-diluted shares without revealing exact counts. The contract takes founder shares and total shares as witness (private) inputs and asserts the ratio via cross-multiplication: `founders * 10000 >= threshold * total`. If the assertion fails, the proof can't be generated, so a successful proof guarantees the constraint.

### 2. `accreditation.compact`

Investors prove they meet SEC Rule 501 thresholds (income ≥ $200k or net worth ≥ $1M) without revealing actual figures. Includes a 90-day validity window per SEC guidance.

### Compiling Compact contracts

You'll need the Midnight Compact compiler. Both contracts target language version 0.16–0.21. See [docs.midnight.network](https://docs.midnight.network) for compiler installation and proof server setup.

The contracts are designed so that the TypeScript backend will:
1. Deploy one `accreditation.compact` instance per investor
2. Deploy one `founder_majority.compact` instance per company
3. Prove circuits client-side (where the witness data lives privately)
4. Submit proofs to the network; the platform verifies on-chain state

## Roadmap from this skeleton

This skeleton gives you:
- Auth (sign-up + sign-in with Argon2 password hashing)
- Full data model (companies, investors, deals, investments, documents, signatures, cap table, audit log)
- tRPC routers for all core resources with role-based authorization
- Conversion math library with 11 passing tests
- Two compiled Midnight contracts

Next pieces to build:
1. **Document templating engine** — Handlebars-based, with YC SAFE and standard convertible note templates
2. **PDF generation** — `@react-pdf/renderer` for the final signed document
3. **E-signature UI** — Canvas-based drawing, typed signature, ESIGN consent flow
4. **S3 integration** — for storing PDFs and data room files
5. **Email** — Resend for signing invitations and notifications
6. **Midnight bridge** — TypeScript SDK calls to deploy contracts and submit proofs

## Security notes

- Passwords hashed with Argon2id (current best practice)
- Session strategy: JWT (no server-side session table needed for credentials auth)
- All sensitive financial fields encrypted at rest (you'll need to add app-level encryption for `taxId`, `wireInstructions`)
- SOC 2 Type II should be your goal before going to GA — start with audit log discipline (already built in)
- Never custody investor funds yourself; integrate with Modern Treasury, Stripe Connect, or Mercury for escrow

## Legal

This software does not constitute legal or financial advice. Users must engage their own counsel. The platform is a document automation tool, not a law firm. Securities offerings using documents generated by this platform must comply with applicable federal and state securities laws including Reg D, Reg CF, or Reg A+ as appropriate.
