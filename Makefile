# ── RaceTrack — Developer Makefile ───────────────────────────────────────────
#
# Prerequisites: Node.js 18+, Python 3.11+, uv (https://github.com/astral-sh/uv)
# Run `make` or `make help` to list all available targets.
# ─────────────────────────────────────────────────────────────────────────────

.DEFAULT_GOAL := help

# Optional variable used by fetch-series
SERIES ?=

.PHONY: help \
	install setup \
	dev build preview \
	typecheck test-smoke test-pipeline test \
	validate ci refresh \
	fetch fetch-bronze fetch-series rebuild-gold \
	clean clean-bronze \
	bd-prime bd-ready

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' \
		| sort

# ── Setup & Install ───────────────────────────────────────────────────────────

install: ## Install all npm and Python dependencies
	npm ci
	uv sync

setup: install ## Full dev environment setup (alias for install)

# ── Frontend Development ─────────────────────────────────────────────────────

dev: ## Start Astro dev server with hot reload
	npm run dev

build: ## Build site for production (outputs to dist/)
	npm run build

preview: ## Preview the production build locally
	npm run preview

# ── Type-checking & Tests ─────────────────────────────────────────────────────

typecheck: ## Run Astro TypeScript type check only
	npm run typecheck

test-smoke: ## Run frontend smoke tests only (includes an astro build)
	npm run test:smoke

test-pipeline: ## Run Python pipeline unit tests only
	npm run test:pipeline

test: ## Run all quality gates (typecheck + smoke + pipeline tests)
	npm test

# ── Data Validation ───────────────────────────────────────────────────────────

validate: ## Validate seed, silver, and gold JSON files
	npm run validate:data

# ── Combined Workflows ────────────────────────────────────────────────────────

ci: test validate build ## Full CI check: test → validate → build (run before every push)

refresh: fetch validate ## Fetch latest data then validate (quick data refresh cycle)

# ── Data Pipeline ─────────────────────────────────────────────────────────────

fetch: ## Run the full data pipeline — all series, bronze → silver → gold
	uv run python -m pipeline

fetch-bronze: ## Fetch raw API data only, skip transforms and gold rebuild
	uv run python -m pipeline --bronze-only

# Usage: make fetch-series SERIES=f1,motogp
# API series:  f1  motogp  moto2  moto3  nascar  wsbk
# Seed series: f2  f3  fe  indycar  wec  imsa  dtm  gtworld  nls  superformula  iomtt
fetch-series: ## Fetch and rebuild one or more series (usage: make fetch-series SERIES=f1,motogp)
	@test -n "$(SERIES)" || { \
		echo "Error: SERIES is required."; \
		echo "Usage:  make fetch-series SERIES=f1,motogp"; \
		echo ""; \
		echo "API series:  f1 motogp moto2 moto3 nascar wsbk"; \
		echo "Seed series: f2 f3 fe indycar wec imsa dtm gtworld nls superformula iomtt"; \
		exit 1; \
	}
	uv run python -m pipeline --series $(SERIES)

rebuild-gold: ## Rebuild gold layer from existing silver files (no API calls)
	uv run python3 -c "import pathlib,json;from pipeline.transforms.gold import build_calendar,build_upcoming;from pipeline.utils import write_json;from pipeline.config import GOLD_DIR;d=pathlib.Path('data/silver');files=sorted(d.glob('*.json'));evs=[];[evs.extend(json.loads(f.read_text()))for f in files];src=[f.stem for f in files];cal=build_calendar(evs,sources=src);upc=build_upcoming(evs,sources=src);write_json(GOLD_DIR/'calendar.json',cal);write_json(GOLD_DIR/'upcoming.json',upc);print('Gold rebuilt: %d total, %d upcoming'%(cal['eventCount'],upc['eventCount']))"

# ── Housekeeping ──────────────────────────────────────────────────────────────

clean: ## Remove the production build output (dist/)
	rm -rf dist/

clean-bronze: ## Remove cached raw API responses in data/bronze/ (these are never committed)
	rm -f data/bronze/*.json

# ── Issue Tracking (bd) ───────────────────────────────────────────────────────

bd-prime: ## Show full bd workflow context and session close protocol
	bd prime

bd-ready: ## Show available work items ready to claim
	bd ready
