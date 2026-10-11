# 05 — Current cross-session handoff (keep this current)

**Last authored:** 2026-10-11. **Phase:** Standalone lab bootstrap / Stage 0A-1. **Authority:** reports must be verified on user's checkout before updating this to "passed".

## Mission and repository addresses

- `https://github.com/guardst7/river-pilot-physics-lab` — this repo; user created it.
- `https://github.com/guardst7/phaser-box2d` — Box2D fork; submitted upstream PR [#42](https://github.com/phaserjs/phaser-box2d/pull/42).
- `C:\Repos\river-pilot` — main game; **do not edit** while physics migration paused.
- Intended lab local path: `C:\Repos\river-pilot-physics-lab`.

## Engine source / important resolved issues

- Box2D registry allocation historically failed after cycle 32: `b2DestroyWorld` did not install its replacement world into the registry; recycled handles were also insufficiently validated by assertion-only lookup.
- Engine fork correction is committed at `1b318f4`: registry slot reuse, generation increment, invalid/stale handle rejection; upstream review pending (do not claim merged).
- Our lab uses only exact pinned source through `.vendor/phaser-box2d/src/main.js`; the fork's `dist/` may still contain old behavior.

## Starter implementation supplied

- Clone/verify scripts under `tools/`, no npm dependencies.
- Physical fixtures, body/world helpers, observation and scenario comparison under `src/`.
- Test runner under `test/` and GitHub Actions CI.
- Six scenarios: nominal centerline and ±1.5 m lateral offsets, each with body creation order reversed.
- JSON at `.reports/phase0a-collision-baseline.json`; ignored and generated locally.
- Provisional numerical thresholds; investigate flags do **not** by themselves mean the engine is broken.

## VERIFIED EVIDENCE vs PENDING

**Verified historically (user/Codex reports):** Phaser Box2D fork's world lifecycle regression tests, lint and build passed after correction; PR #42 submitted. River Pilot's previous Phase 0A candidate had unexplained centerline yaw (reported ~17.9°) and order sensitivity.

**Not yet independently verified in this lab on pinned source:** `npm test`, `npm run scenarios`, initial numerical measurements, comparison to original Phase 0A exact inputs. Any code execution on an old bundled source is merely a smoke check and **not** qualification of the fixed source.

## Running locally — Windows PowerShell

```powershell
cd C:\Repos\river-pilot-physics-lab
npm.cmd run setup:box2d
npm.cmd test
npm.cmd run scenarios
```

If an environment or API mismatch occurs, fix the smallest verified cause in this repo; do not make engine edits in `.vendor/` or elsewhere. Attach the exact console traceback and `git status --short` to the next session.

## Codex and Git restrictions

Read `AGENTS.md`. One agent, one small slice; no broad changes, no modifying sibling repos, no Git commits/pushes/reset/branch switches without approval. Record actual evidence in this file each session. The existing public repo may already contain a README/license; merge rather than overwriting those files blindly.

## CURRENT BLOCKER

No authenticated/local check of exact corrected fork from this packaged environment. Need first run in user's `C:\Repos` workspace to qualify and capture actual behavior.

## ONE RECOMMENDED NEXT TASK

Run setup, tests, and scenarios against pinned `1b318f4`, then summarize the measured centerline yaw, mirror behavior, and creation-order differences. Do not yet implement joints, vessel physics, or River Pilot integration.
