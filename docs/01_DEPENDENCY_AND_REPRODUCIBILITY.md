# 01 — Dependency and reproducibility

## Exact source

- Fork: `https://github.com/guardst7/phaser-box2d.git`
- Pinned commit: `1b318f4` (world registry reuse and stale-handle rejection, submitted upstream as [PR #42](https://github.com/phaserjs/phaser-box2d/pull/42))
- API entry: `.vendor/phaser-box2d/src/main.js`
- Source is not copied into this repository and `dist/` is never imported.

`npm.cmd run setup:box2d` will prefer an already available **sibling Git clone**, `C:\Repos\phaser-box2d`, and make a *new* local clone inside ignored `.vendor/`. That means it does **not** touch the sibling's branch, stage, working-tree changes, or tracked generated bundles. If no sibling exists, it clones the fork URL. It detaches HEAD at the pin and checks that source exists.

`npm.cmd run verify:box2d` checks the pinned HEAD, validates that the source entry exists and fails if tracked vendor files are modified. `npm test`, `npm run scenarios`, and `npm run qualify` invoke this verification before experiments.

## Why not `npm install phaser-box2d` or `dist/PhaserBox2D.js`?

Our fork's commit was deliberately source-only. An npm release or checked-in `dist` bundle may still have the two bugs; using those would silently undermine the tests. Direct ES module import from `src/main.js` matches the fork's own Node regression tests. The lab has no external npm dependencies.

## Changing versions

A later patch should be qualified in a *separate, approved* dependency-upgrade task. Record the new exact commit and its provenance in `src/pin.mjs`, reproduce before/after reports, update this file and `docs/05_HANDOFF.md`, and never quietly move the pin to a branch name such as `main`.

## Typical failure recovery

| Symptom | Next action |
| --- | --- |
| Vendor source missing | Run `npm.cmd run setup:box2d` in lab root |
| Local sibling is missing | Setup uses public fork, needs network |
| Local sibling lacks the pinned commit | Fetch the commit in the sibling **with user approval**, or use online fork clone |
| `.vendor` exists at wrong commit | Inspect for local work; **manually** remove disposable `.vendor/phaser-box2d`, rerun setup |
| Test reports invalid vendor working tree | Preserve/inspect changes; don't reset without approval |
| `node` not found | Reopen VS Code after installing Node.js LTS |
| GitHub CI cannot fetch fork | Inspect network/perms/commit availability; do not replace the pin with upstream unpatched `main` |

## Confidence boundary

The authored lab can be syntax/runtime-checked independently, but numerical results are meaningful only after a first run against this exact corrected source revision. Store report artifacts in `.reports/` (ignored) and summarize relevant numbers in handoff. GitHub Actions can upload numerical results, but the CI baseline step is deliberately non-blocking for provisional physics criteria.
