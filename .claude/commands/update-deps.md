# Upgrade npm + Python Dependencies

Update all npm and Python dependencies for RaceTrack to their latest compatible versions.

## What to do

Work through these steps in order. Stop and report if any step fails — don't blindly continue.

### 1. Check current state

```bash
git status          # make sure working tree is clean before starting
npm outdated        # see what npm packages are outdated
uv pip list --outdated  # see what Python packages are outdated (if supported)
```

### 2. Upgrade npm dependencies

```bash
# Update package.json ranges and install
npx npm-check-updates -u
npm install
```

Review the diff to `package.json` and `package-lock.json` — flag any major version bumps (they may be breaking).

### 3. Upgrade Python dependencies

```bash
# Update uv.lock to latest compatible versions
uv lock --upgrade
uv sync
```

### 4. Run quality gates

```bash
npm test                 # Astro check + smoke tests + pipeline unit tests
npm run validate:data    # validate seed, silver, and gold JSON
npm run build            # production build must succeed
```

If anything fails, bisect the upgrades to find the breaking package and pin it.

### 5. Commit

```bash
git add package.json package-lock.json uv.lock pyproject.toml
git commit -m "chore: upgrade npm and Python dependencies"
git push
```

---

**Gotchas:**
- Astro major versions often require config or syntax changes — check the Astro changelog before upgrading
- Tailwind v4 has its own upgrade path — do not upgrade Tailwind without checking the migration guide
- `uv` manages Python deps — never use `pip install` directly
- After a Python dep upgrade, re-run `npm run test:pipeline` to catch any API-shape changes in the fetchers
