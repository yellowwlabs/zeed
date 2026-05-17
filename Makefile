.PHONY: help dev dev-frontend dev-backend install install-fresh build build-frontend build-backend start db-generate db-push db-migrate db-studio db-reset lint typecheck typecheck-frontend typecheck-backend test test-ui contracts-test clean clean-deep

SHELL := /bin/bash
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Development ───────────────────────────────────────────────

dev: ## Start all services (frontend + backend) in parallel
	pnpm run dev

dev-frontend: ## Start frontend only (Next.js on port 3000)
	cd frontend && pnpm run dev

dev-backend: ## Start backend only (Express + tRPC on port 3001)
	cd backend && pnpm run dev

# ─── Install ───────────────────────────────────────────────────

install: ## Install all workspace dependencies
	pnpm install

install-fresh: ## Clean install (remove node_modules and reinstall)
	rm -rf frontend/node_modules backend/node_modules contracts/node_modules node_modules
	pnpm install

# ─── Build ─────────────────────────────────────────────────────

build: ## Build all packages
	pnpm run build

build-frontend: ## Build frontend only
	cd frontend && pnpm run build

build-backend: ## Build backend only
	cd backend && pnpm run build

# ─── Start (Production) ────────────────────────────────────────

start: ## Start all services in production mode
	pnpm run start

# ─── Database ──────────────────────────────────────────────────

db-generate: ## Generate Prisma client
	cd backend && pnpm exec prisma generate --schema=./prisma/schema.prisma

db-push: ## Push Prisma schema to database (no migrations)
	cd backend && pnpm exec prisma db push --schema=./prisma/schema.prisma

db-migrate: ## Run Prisma migrations (development)
	cd backend && pnpm exec prisma migrate dev --schema=./prisma/schema.prisma

db-studio: ## Open Prisma Studio (database GUI)
	cd backend && pnpm exec prisma studio --schema=./prisma/schema.prisma

db-reset: ## Reset database (drop + push schema)
	cd backend && pnpm exec prisma migrate reset --schema=./prisma/schema.prisma --force

# ─── Code Quality ──────────────────────────────────────────────

lint: ## Run linter on all packages
	pnpm run lint

typecheck: ## Run TypeScript type checking on all packages
	pnpm run typecheck

typecheck-frontend: ## Type check frontend only
	cd frontend && pnpm run typecheck

typecheck-backend: ## Type check backend only
	cd backend && pnpm run typecheck

# ─── Testing ───────────────────────────────────────────────────

test: ## Run all tests
	pnpm run test

test-ui: ## Run tests with UI
	pnpm run test:ui

contracts-test: ## Run Midnight contract tests
	cd contracts && pnpm run test

# ─── Cleanup ───────────────────────────────────────────────────

clean: ## Remove build artifacts and caches
	rm -rf frontend/.next frontend/dist backend/dist frontend/tsconfig.tsbuildinfo backend/tsconfig.tsbuildinfo tsconfig.tsbuildinfo

clean-deep: ## Full clean including node_modules
	rm -rf frontend/.next frontend/dist backend/dist frontend/tsconfig.tsbuildinfo backend/tsconfig.tsbuildinfo tsconfig.tsbuildinfo
	rm -rf frontend/node_modules backend/node_modules contracts/node_modules node_modules
