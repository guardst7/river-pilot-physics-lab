# 10 — Phase 0B-2: Single-contact vs two-contact reference

**Status:** User completed pinned-source execution on 2026-10-11 (17/17 automated tests passed; 8/8 diagnostic runs). Results and next small slice: `docs/11_PHASE0B2_PINNED_RESULTS_AND_NEXT_SLICE.md`. **No physics engine qualification or vendor defect conclusion is authorized.**

## Why this experiment

Phase 0B found an order-dependent, nonzero yaw when nominally symmetric rectangular faces collided. The initial flat-face contact manifold has two points. One hypothesis is that an iterative two-point contact constraint distributes its impulses differently depending on point/body ordering. We want a smaller experiment that distinguishes a **single centered contact** from the original **two-point contact**, without touching solver internals or changing the existing experiment.

## Experimental controls

Run **8** independent experiments: 2 geometries × 2 friction coefficients (0 and 0.3) × 2 creation orders (towboat-first and barge-first). Every case uses:

- Original Phase 0A proxy masses (450,000 kg and 2,000,000 kg), bow-tip X position, initial 0.75 m gap, initial tow speed 2.5 m/s, barge at rest, centered at Y=0.
- Zero XY gravity, zero drag, zero restitution, no constraints, and no forces after initialization.
- Original fixed timestep (60 Hz), four solver substeps, two-second observation window.
- Same body center of mass and **rectangle-equivalent rotational inertia** in both geometries.

**Two-point control:** The existing rectangular towboat and rectangular barge, run by the **unchanged `runDiagnosticCase`** from Phase 0B. The observed initial manifold should have two contacts near Y=±5m.

**Single-contact probe:** A *circle-only collider* with radius 2m at the center of the towboat's forward edge. Its world-space foremost X position coincides with the rectangle's bow tip. The Box2D body **mass, center of mass, and inertia are overridden** to equal the rectangular control. The barge stays a rectangle. The circle should make one centered contact with the barge's flat face. This is **not a vessel hull**: the only collider is a circle at the bow, so sides and stern cannot make contacts. Using it is an intentional way to isolate manifold-point count.

The two geometries thus share initial normal approach, bow-tip location and rigid-body mass properties, but their **entire contact geometry differs**. A difference supports contact-geometry/point-count as a lead; it does not prove precisely which solver instruction or constraint causes it.

## Run on Windows in the lab

```powershell
cd C:\Repos\river-pilot-physics-lab
npm.cmd test
npm.cmd run scenarios
npm.cmd run diagnostics:contacts
npm.cmd run diagnostics:contact-count
```

The new report is ignored by Git:

`.reports/phase0b2-contact-count-reference.json`

Expected overall automated test count after applying update: **17** (previous 11 + six new tests). This is a test suite-health result, not an acceptance certification.

## Read the report

Check each configuration's `firstContactPointCount`, `contactTimeline`, `shortlyAfterContact` and `metrics.towPostContactAngularVelocityDegps`. The `comparisons` array contains **signed creation-order residuals** and maximum absolute departure from zero, separated by geometry/friction.

**Diagnostic expectation:** A centered one-contact impulse passing through each body center of mass should have little or no spin. The symmetric two-point control should ideally also show no physical ordering bias, but its numerical contact solver may be order-sensitive; **the result is evidence, not a finding of implementation error**. The unit test treats the centered one-point zero-rotation behavior as a strictly local geometry sanity check. It does not enforce or change River Pilot physics acceptance tolerances.

The contact impulses exposed to this lab are **sampled after a Box2D world step**, not a complete solver-iteration impulse trace. Do not sum them to reconstruct a full impact impulse. Report yaw **rate** shortly after contact, not only angle accumulated at two seconds (no angular damping). First-contact events reflect collision detection/solver reporting, not necessarily the exact first physical touch.

## Decision after reviewing pinned results

If one-point results are near zero and two-point results retain order-dependent spin, use that result to design **one** further narrowly scoped study (e.g., comparing ordered multi-contact solver resolution or controlled numerical convergence) before deciding whether a workaround or vendor investigation is justified.

If the one-point reference also exhibits systematic spin, **first inspect the fixture**, local center of mass, body transforms, and API usage. Do not edit `.vendor/`, the Box2D fork, or the game in this phase.

Historical ~17.9° River Pilot collision result is not the same fixture and is not yet explained. No claim about realistic propulsion, pushing, shoreline, CCD, or barge trains follows from these experiments.

## Files added/updated in this Phase 0B-2 delivery

- `src/phase0b2.mjs` — isolated circle contact probe and experiment comparisons.
- `tools/run-phase0b2.mjs` — report runner.
- `test/phase0b2.test.mjs` — geometry, mass, invariance, determinism and regression tests.
- `package.json` — adds `diagnostics:contact-count`.
- `docs/10_PHASE0B2_SINGLE_VS_TWO_CONTACT.md` — this protocol.
- `README.md`, `docs/04_ROADMAP_AND_DECISIONS.md`, `docs/05_HANDOFF.md` — status and future sessions.
- This package also contains the previously delivered four Phase 0B findings-document updates (`docs/04`, `docs/05`, `docs/08`, `docs/09`), for users who haven't installed them yet.

No production Box2D source, dependency pins, game source, previous fixtures, or existing tests are modified. Preserve existing user changes and review the file list before overwriting.
