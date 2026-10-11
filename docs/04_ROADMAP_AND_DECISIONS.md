# 04 — Roadmap and decision register

## Status

- **Done historically in engine fork:** world-registry slot and stale-handle fixes authored, tested and submitted in Phaser Box2D PR #42. Pin `1b318f4` represents the user's fix; a PR submission is not a merge.
- **Delivered in this starter:** lab scaffold, pinned source setup, six primitive collision cases, observables/diagnostic flags, tests, CI, and session docs.
- **Phase 0B user-verified:** 11/11 lab tests passed; 66 contact diagnostic runs and 46 comparisons on fork pin `1b318f4`; results analyzed in `docs/09_PHASE0B_RESULTS_AND_NEXT_SLICE.md`. Not yet committed by user.
- **Phase 0B-2 user-verified:** 17/17 automated tests passed on pinned source `1b318f4`; eight runs demonstrate zero yaw for a single centered contact and sign-reversing nonzero angular velocity for the two-point flat-face control. This is a diagnostic finding, not an engine defect or qualification. See `docs/11_PHASE0B2_PINNED_RESULTS_AND_NEXT_SLICE.md`.
- **Phase 0A verified on user's machine:** six harness tests passed with pinned source; six collision scenarios measured and analyzed in `docs/07_PHASE0A_BASELINE_ANALYSIS.md`.
- **Paused:** integrating physics into River Pilot.

## Small, approval-gated slices

| Slice | Scope | Evidence gate |
| --- | --- | --- |
| 0A-1 | Run starter on pinned source; classify all results | Successful API smoke suite and preserved collision report |
| 0A-2 | Reproduce historical exact fixture, investigate any centerline/order discrepancy | Reduced, repeatable explanation: fixture vs Box2D vs test interpretation |
| 0A-3 | Approve meaningful symmetry tolerances | Documented rationale, fixed numerical acceptance gate |
| 0B (current) | Controlled friction, near-center offsets, timesteps, contact manifolds, symmetric bow geometry | Pin-verified run and analysis; **no automatic physics qualification** |
| 0B-2 (completed; diagnostic only) | Eight centered one-point/two-point reference tests, both orders/friction settings | 17/17 tests; pinned-source numerical comparison documented in docs/11 |
| 0B-3 (recommended; NOT approved) | Read-only trace of two-point manifold/contact-solver ordering; formulate one falsifiable next test | Source-grounded mechanism and test proposal without engine edits |
| 0C (future) | CCD, world-origin precision and performance tests | Separate explicit authorization and nonregressing baselines |
| 1+ | Neutral vessel mass/COM/force models; connected assemblies and shore | Separate design review and measurable milestones |

No task may silently skip a gate. At the end of a session, recommend **one next slice** and stop.

## Decision record

**D-001 — Separate repositories.** Physics engine fixes belong in `phaser-box2d` upstream fork, experiments and independently reusable numerical models in `river-pilot-physics-lab`, production game integration in `river-pilot`. Rationale: reproducibility and lower Codex context cost.

**D-002 — Source pin.** Use `guardst7/phaser-box2d` at `1b318f4` and import `src/main.js` rather than old `dist` bundles. Rationale: the accepted source-only lifecycle fix isn't in that commit's generated distributions.

**D-003 — No approved maritime realism claims at Stage 1.** Primitive rectangles and provisional thresholds are diagnostic; `npm test` is an infrastructure test, not an engine acceptance certificate.

**D-004 — 1:1 real-world units.** The lab uses physical meters, kilograms and seconds, with zero planar gravity and no alternative scaling absent a reviewed decision.

## Next recommended task

**Phase 0B-3: source-level, read-only contact-order mechanism audit.** Trace two-point manifold ordering and impulse application in the pinned port; distinguish possible expected iterative-solver behavior from an actionable implementation defect. Present **one** falsifiable follow-up experiment for approval. See `docs/11_PHASE0B2_PINNED_RESULTS_AND_NEXT_SLICE.md`. Do not modify Box2D, change the pin, expand the fixture suite, or begin River Pilot integration without user approval.

**D-005 — Separate collision diagnostics from future CCD qualification.** Name current contact-order/friction/geometry experiments Phase 0B; reserve Phase 0C for CCD, origin precision, and profiling. The label change conveys no expansion of scope.
