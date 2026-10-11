# 08 — Phase 0B contact symmetry diagnostics

**Status:** Executed and analyzed on user's pinned source commit `1b318f4`: 11/11 lab tests passed, 66 diagnostic cases and 46 comparisons produced. **Not an engine qualification.** See `docs/09_PHASE0B_RESULTS_AND_NEXT_SLICE.md`.

## Purpose

Isolate a directional yaw bias that arises with perfectly symmetric two-rectangle collisions. Previous pin-verified Phase 0A data showed centerline yaw of -0.3299477° (tow-first) and +0.3299477° (barge-first), and structured mirrored-offset creation-order dependencies at 2 seconds. Total momentum was consistent with conservation, but contact/torque selection is not understood. A separate older fixture produced ~17.9° yaw; that exact fixture is not represented here and must not be treated as reproduced or resolved.

## Instructions (Windows PowerShell)

```powershell
cd C:\Repos\river-pilot-physics-lab
npm.cmd run setup:box2d
npm.cmd test
npm.cmd run scenarios
npm.cmd run diagnostics:contacts
```

Expected: pin verifier prints `1b318f45782c203367eef85e6c0021e7ae04681b`. The original report is still `.reports/phase0a-collision-baseline.json`; the Phase 0B report is `.reports/phase0b-contact-diagnostics.json`. Both are ignored by Git. The console prints a compact representative table; the JSON retains the full matrix.

## Controlled experiment matrix (66 cases)

- **36 friction/offset experiments:** friction 0 and 0.3 × nine lateral offsets (0, ±0.001, ±0.01, ±0.1, ±1.5 m) × two body creation orders. Resolution 60Hz / four substeps.
- **24 timestep experiments:** four integration settings (60Hz/1, 60Hz/4, 60Hz/8, 120Hz/4) × offsets 0, ±1.5m × two creation orders; friction 0.3. `60Hz/4` intentionally overlaps the friction matrix as a cross-check.
- **6 alternate bow geometry experiments:** symmetric six-vertex, short-flat chamfered front, with offsets 0, ±1.5m × both creation orders. Friction 0.3, 60Hz/4. **Its mass, center of mass, and inertia are explicitly set to the rectangular proxy** in order to isolate contact geometry, not to describe real hull mass distribution. Bow contact geometry nonetheless differs, so this is not an exact A/B contact comparison.

All experiments use independent physics worlds, a fixed physical 2-second duration, the original 32m × 10m / 450,000kg towboat and 60m × 11m / 2,000,000kg barge proxies, zero planar gravity and damping, initial gap 0.75m and tow speed 2.5m/s. The baseline six-case runner is unchanged.

## Interpretation of JSON fields

- `firstContactTick`, `lastContactTick`: first/last **solver-reported** touching contact, not the physical instant of contact in continuous time. `null` means no touching contact was observed by the public contact API.
- `contactTimeline`: a compact selection of the first eight solver-contact ticks, the final three contact-event ticks, and any explicitly reported end events (rather than a full per-step recording). Fields include normal, manifold point count, contact locations/separation and available normal/tangent impulses. **Do not sum recorded impulses to derive a physically exact total collision impulse.** Warm-starting, solver substeps, CCD and sampling semantics matter.
- `beforeContact`, `shortlyAfterContact`, `impactWindow`: states surrounding the **first recorded contact tick**, including yaw and angular velocity. Post-contact means three full fixed timesteps after the first observed contact; it does not necessarily mean the bodies are fully separated.
- `metrics.towPostContactAngularVelocityDegps`: a useful fixed-near-impact diagnostic; not a universal acceptance limit.
- `metrics.towFinalYawDeg`: cumulative angle by 2 seconds, affected by zero angular damping and therefore run duration.
- `metrics.xMomentumDeltaKgMps`, `yMomentumDeltaKgMps`: numerical linear momentum residual in isolated plane, not a complete marine model validation.
- `comparisons`: **unthresholded** signed reflection and body-creation-order residuals in positions, velocities and angles. No automatic declaration of Box2D correctness or defect.

## Review questions

1. Does a creation-order bias persist at friction=0? Does its sign or magnitude change relative to friction=0.3?
2. Do tiny positive vs negative offsets select distinct yaw branches discontinuously around zero?
3. Are contact normals and contact point counts distinguishable across creation-order/mirror pairs? Which manifold points receive impulses?
4. How does angular velocity **just after** contact change with solver configuration while controlling simulated time?
5. Does the symmetric chamfered bow materially change ordering sensitivity? Any changes must be interpreted alongside contact geometry, not assumed to be a Box2D defect.
6. Are mass, moment of inertia, momentum, and original Phase 0A reproduction stable?

## Boundaries and failure rules

- Never edit `.vendor/`, the sibling `phaser-box2d` checkout, or the game.
- Keep `BOX2D_PIN` at `1b318f4`; do not substitute the obsolete dist bundle.
- There are no new calibrated physical pass/fail thresholds. This stage generates evidence for a later decision.
- Failure of Node tests means there is a **harness/API integration issue** to fix before studying numerical conclusions.
- If the exact pinned API differs from the bundled reference API, fix the lab's integration only after diagnosing it; do not silently edit engine internals.
- Report the actual test output and attach the ignored JSON when seeking further analysis. Do not commit numerical report dumps by default.
- Document any experiment you want to add as a separate approved slice.

## Validation provenance

The new files were exercised in the artifact-building environment with a **temporary, locally patched older `PhaserBox2D.js` bundle only** to check API compatibility, tests, and experiment execution. That smoke check is **not** an execution of the fork's actual commit `1b318f4`, does **not** validate its collision solver, and is not a substitute for the user machine's pinned-source run. The temporary bundle is not distributed with this update.

## Next step

The user has run and shared the pinned-source diagnostics. Findings are in `docs/09_PHASE0B_RESULTS_AND_NEXT_SLICE.md`. Await approval for the single-contact/two-contact reduced-case investigation (Phase 0B-2). Do not modify the Box2D engine or resume River Pilot integration yet.
