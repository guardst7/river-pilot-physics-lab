# 04 — Roadmap and decision register

## Status

- **Done historically in engine fork:** world-registry slot and stale-handle fixes authored, tested and submitted in Phaser Box2D PR #42. Pin `1b318f4` represents the user's fix; a PR submission is not a merge.
- **Delivered in this starter:** lab scaffold, pinned source setup, six primitive collision cases, observables/diagnostic flags, tests, CI, and session docs.
- **Pending verification:** first actual execution against exact corrected source on user's machine. Do not call these observations passed or failed until measured.
- **Paused:** integrating physics into River Pilot.

## Small, approval-gated slices

| Slice | Scope | Evidence gate |
| --- | --- | --- |
| 0A-1 | Run starter on pinned source; classify all results | Successful API smoke suite and preserved collision report |
| 0A-2 | Reproduce historical exact fixture, investigate any centerline/order discrepancy | Reduced, repeatable explanation: fixture vs Box2D vs test interpretation |
| 0A-3 | Approve meaningful symmetry tolerances | Documented rationale, fixed numerical acceptance gate |
| 0B | CCD, world-origin precision and performance tests | Explicit authorization and nonregressing baselines |
| 1+ | Neutral vessel mass/COM/force models; connected assemblies and shore | Separate design review and measurable milestones |

No task may silently skip a gate. At the end of a session, recommend **one next slice** and stop.

## Decision record

**D-001 — Separate repositories.** Physics engine fixes belong in `phaser-box2d` upstream fork, experiments and independently reusable numerical models in `river-pilot-physics-lab`, production game integration in `river-pilot`. Rationale: reproducibility and lower Codex context cost.

**D-002 — Source pin.** Use `guardst7/phaser-box2d` at `1b318f4` and import `src/main.js` rather than old `dist` bundles. Rationale: the accepted source-only lifecycle fix isn't in that commit's generated distributions.

**D-003 — No approved maritime realism claims at Stage 1.** Primitive rectangles and provisional thresholds are diagnostic; `npm test` is an infrastructure test, not an engine acceptance certificate.

**D-004 — 1:1 real-world units.** The lab uses physical meters, kilograms and seconds, with zero planar gravity and no alternative scaling absent a reviewed decision.

## Next recommended task

Run the delivered lab on the developer machine and share the `npm test` summary and six-case scenario table. Fix setup/API mistakes if any; then decide whether to port the exact historical Phase 0A collision fixture.
