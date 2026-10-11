# 09 — Phase 0B results and next investigative slice

**Date:** 2026-10-11
**Status:** Pinned-source diagnostics analyzed. **Box2D not yet qualified for River Pilot.**
**Source:** User-provided `.reports/phase0b-contact-diagnostics.json`, schema v1, fork commit `1b318f4` (`1b318f45782c203367eef85e6c0021e7ae04681b`). This report is a derived summary; the raw report is ignored by Git and should be retained locally.
**User verification:** `npm.cmd test`: **11 passed, 0 failed**. `npm.cmd run diagnostics:contacts`: **66 runs, 46 comparisons**.

## Controlled fixture

Two freely moving rigid bodies in zero-gravity, zero-damping planar space: 32m × 10m towboat proxy, mass 450,000kg, at 2.5m/s in +X; 60m × 11m stationary barge proxy, mass 2,000,000kg; initial longitudinal gap 0.75m. Independent physics world per case. Default solver: 60Hz / four substeps, 2-second run. Experiments varied friction, Y offset, creation order, step settings, and bow geometry. These are *unpowered isolated impacts*, not realistic sustained towboat pushing trials.

## Verified numerical findings

| Centerline flat-face case, 60Hz/4 substeps | Tow-first post-contact yaw rate | Barge-first post-contact yaw rate | Interpretation |
|---|---:|---:|---|
| Friction 0 | +0.223363°/s | -0.223363°/s | Bias exists without friction |
| Friction 0.3 | -0.191052°/s | +0.191052°/s | Friction changes sign and magnitude; creation order reverses sign |

With a centered fixture, both contact points begin at approximately Y=-5m and Y=+5m. The public manifold's point order is reversed when body creation order changes. At friction zero, 60Hz/4 substeps, the post-step *recorded* normal impulse at tick 20 is about 18,978.5 at one point and zero at the other; the priority of the Y≈+5m versus Y≈-5m point swaps with creation order. This supports contact-order sensitivity as a lead, **not proof that these are the complete collision impulses**. In the friction=0.3, 60Hz/1-substep case, the first reported contact step includes unequal recorded impulses (approximately 479,944 and 384,877); again, those are per-step sample data only.

For 0.001m offsets near the center, the rotation remains very close to the centered, creation-order-dependent result. It does **not** abruptly converge toward a physically ideal zero-bias response just because a tiny offset was introduced. Under simultaneous offset reflection **and** creation-order reversal, mirrored results agree to floating-point precision. Therefore the effect is structured and deterministic, not random noise.

The following settings illustrate strong **solver-configuration sensitivity** for the centered, friction=0.3, tow-first case:

| Step setting | Post-contact tow yaw rate | Yaw after 2s |
|---|---:|---:|
| 60Hz, 1 substep | -0.119154°/s | -0.226393° |
| 60Hz, 4 substeps | -0.191052°/s | -0.329948° |
| 60Hz, 8 substeps | -0.339408°/s | -0.578835° |
| 120Hz, 4 substeps | -0.054689°/s | -0.096343° |

This is not enough data to claim either solver convergence or divergence at fixed overall resolution. Both frame duration and substeps affect results; a better-controlled convergence sweep is required.

Changing the symmetric towboat bow to the tested chamfered polygon did not eliminate the centered ordering effect: at 60Hz/4 substeps and friction=0.3, tow-first post-contact yaw rate was -0.678680°/s versus +0.678680°/s for barge-first, with tow yaw at 2s about ±1.154079°. The bow is an **alternate contact geometry**, not a realistic hull-validation conclusion.

Across the 66 experiments, maximum absolute reported X and Y linear momentum residuals were approximately **2.10×10⁻⁹ kg·m/s** and **2.18×10⁻¹¹ kg·m/s**, respectively. This is strong linear-momentum bookkeeping. Angular momentum is approximately conserved but not identically: depending on configuration, the moment balance includes individual spin and orbital angular momentum and modest numerical residuals. Conservation of total momentum **does not guarantee** symmetric individual-contact impulses.

The report marks solver contacts over many frames even when sampled impulses are zero, and the `impactWindow` shows the main speed change near tick 19. In multi-substep settings, some recorded manifold impulses are zero in the same tick that body velocity changes substantially; **do not reconstruct total collision impulse by summing the post-step contact snapshots**. Likewise, the final 2-second yaw grows after initial contact because the world has no angular damping. Compare post-contact angular velocity, not just final angle.

## What this establishes — and does not

**Established:** A deterministic creation-order dependency produces nonzero angular motion in a nominally symmetric, centered, flat-face collision in the corrected Phaser Box2D JavaScript source. The effect survives friction=0, small lateral offsets, and a symmetric alternate bow; its magnitude changes substantially with solver settings. Contact manifolds initially contain two symmetric points with ordering that reverses across body creation order.

**Not established:** A definite mathematical defect in Box2D's collision solver; the precise solver operation that produces the bias; realistic handling of sustained towboat-to-barge pushing; adequate CCD, large-world precision, articulated barge assemblies, grounding, or maritime forces. The separate historical approximately 17.9° result belongs to a different fixture and is **not** reproduced or explained here. Do not change the Box2D fork or River Pilot based on this data alone.

## ONE recommended next investigation — Phase 0B-2 (requires authorization)

Create a *minimal* centerline **single-contact** reference (for example, a circle touching a symmetric straight face at its center) and the existing **two-point** flat-face reference, using exactly the same fork commit. For each, test both creation orders, friction 0 and 0.3, identical mass/speed/time, and carefully fixed step settings. Test expected zero yaw in the single-contact case and compare with the two-point case. Keep the existing Phase 0A and 0B fixtures and reports unchanged.

If single-contact symmetry holds while two-contact symmetry fails, investigate ordered sequential contact constraint resolution / manifold point ordering next. If both fail, first check fixture construction, mass properties, API handling and timestep. As a small supplementary experiment, test timestep convergence (60/120/240Hz with matched substep settings and post-impact sampling). Any solver instrumentation must be proposed separately; avoid modifying `.vendor/` or the upstream fork merely to print values. Do not assume a library defect from an isolated solver-order effect.

### Decision gate

Require evidence explaining why an ideal centered impact gets nonzero spin, whether the effect converges with numerical refinement, and whether there is a safe modeling or solver choice for River Pilot. Only then propose meaningful acceptance tolerances or vendor work. **Phase 0C CCD/origin/performance and maritime features are not yet authorized.**

## Project handoff / Git hygiene

User has run this experiment locally, but has not yet reported committing the Phase 0B update. Before doing any new coding: inspect `git status --short`, preserve user edits, confirm the pin, and run focused tests. The current handoff entry in `docs/05_HANDOFF.md` should direct only the explicitly approved next slice. The raw `.reports` JSON remains ignored by Git; this derived analysis document is appropriate to commit alongside the Phase 0B lab changes when the user approves.
