# 05 — Cross-session handoff (read first)

**Updated:** 2026-10-11. **Current stage:** Phase 0B and Phase 0B-2 **verified on user's pinned engine and analyzed**. **Do not call Box2D qualified yet.**

## Repo and source authority

- Lab: https://github.com/guardst7/river-pilot-physics-lab (user's `main` initial commit `1301621` before this update).
- Box2D fork: https://github.com/guardst7/phaser-box2d; fixed engine source pinned to `1b318f45782c203367eef85e6c0021e7ae04681b`; upstream PR https://github.com/phaserjs/phaser-box2d/pull/42 (submitted, not assumed merged).
- Main game: `C:\Repos\river-pilot` — physics integration PAUSED; do not edit during lab testing.
- Pinned source is imported from `.vendor/phaser-box2d/src/main.js`, not stale generated dist files. `tools/verify-box2d.mjs` checks the pin.

## Completed and verified on user machine — Phase 0A

User reported successful `npm.cmd run setup:box2d`, `npm.cmd test` (six tests), and `npm.cmd run scenarios` against the pinned source. Original six scenarios ran and generated `.reports/phase0a-collision-baseline.json`. User uploaded the numerical report. Key outputs: centerline tow yaw at 2sec ±0.3299477° with creation-order reversal; corresponding barge yaw ±0.091486°; off-center cases show structured reflection when **both** offset sign and creation order reverse. Friction baseline is 0.3; timestep 1/60sec with four substeps. Initial X momentum 1,125,000 kg·m/s, final momentum conserved to numerical precision. These are facts about the recorded **isolated rectangle** fixture, not a physics-qualification pass. See `docs/07_PHASE0A_BASELINE_ANALYSIS.md`.

## Phase 0B verified on user's Windows checkout (uncommitted update)

- User confirmed `npm.cmd test`: **11/11 passed**, including the six original tests and five new contact diagnostic tests, with source verification `1b318f45782c203367eef85e6c0021e7ae04681b`.
- `npm.cmd run diagnostics:contacts` completed **66 runs** and **46 comparisons**; generated `.reports/phase0b-contact-diagnostics.json` (ignored by Git). The user uploaded the report for analysis.
- Collision begins in the centered flat-face fixture with **two contact points** at Y=-5m and +5m. Their ordering reverses with body creation order. The recorded impulses in some individual post-step observations are unequal. The public API's post-step impulse values do **not** capture a reliable full collision impulse history.
- At 60 Hz, 4 substeps, friction 0.3, centered towboat post-contact yaw rate is **-0.191052°/s** with tow-first and **+0.191052°/s** with barge-first; friction 0 gives **+0.223363°/s** and **-0.223363°/s**, respectively.
- At 60 Hz, friction 0.3, centered tow-first: one substep yields **-0.119154°/s**; four gives **-0.191052°/s**; eight gives **-0.339408°/s**. At 120 Hz/four substeps, it gives **-0.054689°/s**. There is not yet a demonstrated numerical-convergence trend.
- Symmetric chamfered bow does not eliminate the order effect; centered tow-first at friction 0.3/60Hz/4 substeps gives **-0.678680°/s**.
- X and Y momentum residuals are very small across the matrix (max recorded absolute magnitudes around 2.1e-9 and 2.2e-11 kg·m/s). This is compatible with conservation of linear momentum; it does **not** prove the contact impulse distribution is symmetric or physically acceptable.
- **Interpretation:** deterministic order-dependent angular bias in this controlled fixture. Contact-point/solver sequencing is a leading hypothesis, **not a proven Box2D defect**. The historical ~17.9° fixture has not been reproduced or explained.
- Full findings, evidence and next diagnostic proposal: `docs/09_PHASE0B_RESULTS_AND_NEXT_SLICE.md`.

## Relevant commands

```powershell
cd C:\Repos\river-pilot-physics-lab
npm.cmd test
npm.cmd run scenarios
npm.cmd run diagnostics:contacts
```

Pin: `1b318f45782c203367eef85e6c0021e7ae04681b` (fork source under ignored `.vendor/phaser-box2d/src/main.js`, **not** old `dist`). No Box2D fork or River Pilot modifications were made during Phase 0B.

## Git and session rules

- Read `AGENTS.md` and docs/08 before editing; capture `git status --short`.
- Never modify `.vendor/`, sibling Box2D source, or River Pilot.
- Do not change pin, dependencies, acceptance tolerances, solver math, or Git history without approval.
- No commit/push/branch switch without user permission. The user decides when to stage and push Phase 0B files.
- The previous 17.9° historical collision fixture is **not** reproduced here; do not conflate it with the six current baseline cases.
- Fix an actual harness failure before making physics inferences. Preserve numerical evidence and keep tests separated from acceptance.

## Phase 0B-2 — user verified on pinned source (2026-10-11)

- User ran `npm.cmd test` against verified source revision `1b318f45782c203367eef85e6c0021e7ae04681b`: **17/17 tests passed**.
- User ran `npm.cmd run diagnostics:contact-count`: eight scenarios and four comparison pairs generated in `.reports/phase0b2-contact-count-reference.json`; user supplied and analyzed JSON.
- Single centered circle-nose contact (mass/COM/inertia matched to rectangle; **not** a realistic hull) has **one manifold point and 0 deg/s yaw rate** for both creation orders and friction 0/0.3. Both bodies have common post-impact forward speed `0.4591836735 m/s`.
- Two-point flat rectangular face contact reverses signed towboat yaw with creation order: friction 0: `+0.223363/-0.223363 deg/s`; friction 0.3: `-0.191052/+0.191052 deg/s` (tow-first/barge-first).
- This confirms reproducible **two-contact creation-order bias in this fixture**, not a verified Box2D source defect. Total linear momentum residuals are tiny. Post-step contact impulse recordings do not establish a full constraint impulse history. Historical 17.9-degree anomaly remains a distinct, unresolved fixture.
- Full findings and next diagnostic decision: `docs/11_PHASE0B2_PINNED_RESULTS_AND_NEXT_SLICE.md`. `docs/10` remains the experimental protocol.
- No Box2D source, dependency pin, vendor files, or River Pilot files changed; **the present results are diagnostics, not physics qualification**.

## ONE recommended next task — proposed Phase 0B-3 (not automatically approved)

**Read-only source audit of manifold-point order and the two-point solver path, then propose one discriminating experiment.** Do not implement solver changes, new tests, or River Pilot integration until the user approves. See docs/11.

**Git state:** User committed/pushed initial lab baseline `1301621`. Phase 0B source/docs and the present Phase 0B-2 patch have not yet been reported committed. When installing or handing off, inspect `git status --short` and preserve all current user edits.
