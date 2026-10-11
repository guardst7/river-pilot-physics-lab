# 03 — Acceptance and test protocol

## Two different layers of test results

1. `npm test` — **harness smoke tests**: correct vendor wiring, sane body mass, finite numerical values, basic zero-gravity behavior, 40 world cycles, stable identical reruns, and measurement utility arithmetic. **Green does not qualify Box2D for River Pilot.**
2. `npm run scenarios` — six numerical experiments with *provisional* physical checks and a complete JSON record. A report may contain `INVESTIGATE` flags while the command exits 0. `npm run qualify` enforces the very same provisional checks as a diagnostic command, exiting nonzero when they fail. **Do not interpret either result as final engine acceptance.**

The provisional values in `src/assessment.mjs` are an explicit starting hypothesis (0.5° yaw limits and 0.01 m/s barge velocity response). They **have not been derived from validated field evidence**, and must not be quietly relaxed to make tests pass. The next review should determine justified tolerances and distinguish real solver asymmetry from fixture/API errors.

## Reproduction protocol

- Verify pinned commit; preserve the command output in the session report.
- Run `npm.cmd test` first; fix harness/runtime issues before judging physics.
- Run `npm.cmd run scenarios`; inspect all six cases, not just the aggregate flag.
- Compare centerline yaw time series and reversed body-creation order.
- Compare mirrored offsets with the correct signs (Y, angle, angular velocity).
- Check that the barge actually responds; otherwise the fixture may not have collided.
- Repeat on the *same* pinned revision before suspecting nondeterminism.
- If surprising, reduce the fixture to a small, analytic rectangle test and compare solver contacts only after authorizing a dedicated instrumentation slice.
- Record exact results in `docs/05_HANDOFF.md` and optionally attach the full ignored JSON result to a discussion (do not invent sample values).

## Failure classification

| Failure | What it establishes | Does not establish |
| --- | --- | --- |
| Pin/setup failure | Wrong source or unavailable dependency | Physics engine defective |
| Harness unit test failure | API/fixture/test/wiring problem or engine inconsistency | Root cause without investigation |
| Provisional yaw failure | A hypothesis about symmetry was violated | Automatically a Box2D bug |
| Contact not transferred | Setup, time stepping, contact, or solver needs analysis | Barge physics model is wrong |
| Creation-order divergence | Different numerical outcomes with changed object allocation order | Definitive solver defect without reduced case |

## Qualification gates (future separate approvals)

- Phase 0A: geometry, units, center/mirror/order collision diagnosis and reproducibility.
- Phase 0B: high speed CCD, origin precision, continuous creation/destruction, profiling.
- Later: vessel mass/COM/inertia, multi-vessel force transfer, joints/assemblies, shoreline/grounding, maritime forces, measured realism and performance budgets.

**Until approved Phase 0 testing passes, River Pilot physics migration remains paused.**

## Phase 0B contact diagnostics (new; non-gating)

`npm.cmd run diagnostics:contacts` runs a 66-case investigative matrix and saves `.reports/phase0b-contact-diagnostics.json` (ignored). It **never applies the provisional 0.5° Phase 0A yaw threshold to declare an engine defect.** Measurements include solver-reported contact manifolds, friction changes, small offset perturbations, timestep/substep sensitivity, and a symmetric chamfered bow. See `docs/08_PHASE0B_CONTACT_DIAGNOSTICS.md`.

**Naming clarification:** This `Phase 0B` label refers specifically to *collision contact diagnostics*, consistent with the current user-approved experiment. The older roadmap called unrelated CCD/origin/performance qualification `0B`; those future subjects are now designated **Phase 0C (not authorized yet)**. Neither phase automatically authorizes maritime models or River Pilot integration.
