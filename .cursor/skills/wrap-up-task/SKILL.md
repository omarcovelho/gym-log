---
name: wrap-up-task
description: >-
  Finalizes a completed feature task in gym-log: verify tests and builds, create
  a feature branch, bump the minor version, and commit. Use when the user says
  "wrap up this task", "wrap up", "finalize", "fechar essa task", or similar.
---

# Wrap Up Task

Run this checklist when the user wants to close out the current feature work.

## Prerequisites

- Feature implementation is done and the user confirmed it is good enough.
- Do **not** push to remote unless the user explicitly asks.

## Steps (in order)

### 1. Verify quality gate

```bash
cd api && npm test
cd api && npm run build
cd front && npm run build
```

- API: all Jest tests must pass.
- Front: `tsc -b && vite build` must pass.
- If anything fails, fix first — do not branch/commit until green.

### 2. Inspect git state

```bash
git status
git diff
git log -3 --oneline
```

- Confirm what will be committed.
- Never stage `.env`, credentials, or secrets.

### 3. Create feature branch

From `master` (or current base), if not already on a feature branch:

```bash
git checkout -b feat/<short-kebab-name>
```

- Name from the feature (e.g. `feature/progress-block-tag-charts`).
- Skip if already on an appropriate feature branch with the work.

### 4. Minor version bump

Bump **minor** in all three app manifests:

- `package.json` (root)
- `api/package.json`
- `front/package.json`

Update **only** the project root entries in lockfiles (lines 3 and 9 under `packages.""`):

- `package-lock.json`
- `api/package-lock.json`
- `front/package-lock.json`

**Do not** `replace_all` on lockfiles — dependency versions (e.g. `@microsoft/tsdoc@0.16.0`) must stay unchanged.

### 5. Stage and commit

```bash
git add <relevant files>
git commit -m "$(cat <<'EOF'
<Feature summary> and bump to X.Y.Z.

<One sentence why — user-facing or product value, not implementation detail.>
EOF
)"
```

Commit message style (from repo history):

- Subject: imperative, includes version bump (e.g. `Add block-tag progress charts and bump to 0.17.0.`)
- Body: one sentence on **why**, not a file list.

Follow user git safety rules: no `--no-verify`, no amend unless hook auto-fixed files, no push unless asked.

### 6. Report to user

Return:

- Branch name
- Commit hash + subject
- Version bumped to
- Checks run (tests, builds) and results
- Reminder that push/PR are not done unless requested

## gym-log specifics

| Check | Command | Location |
|-------|---------|----------|
| API tests | `npm test` | `api/` |
| API build | `npm run build` | `api/` |
| Front build | `npm run build` | `front/` |
| Pre-commit | Husky lint-staged on staged `api/**/*.ts`, `front/**/*.{ts,tsx}` | auto on commit |

No front test suite yet — build + lint via hook is sufficient.

## Examples

**User:** "ok, wrap up this task"

**Agent:** runs tests → builds → `feat/copy-workout` → 0.16.0 → 0.17.0 → commit → reports `8a00374` on `feat/...`.

**User:** "finalize" (already on feature branch, version already bumped)

**Agent:** run checks only, commit if uncommitted changes remain, skip redundant branch/version steps.

## Do not

- Push or open a PR unless explicitly requested
- Bump patch when the user said "minor version bump"
- Commit unrelated or half-done work
- Skip failing tests/builds
