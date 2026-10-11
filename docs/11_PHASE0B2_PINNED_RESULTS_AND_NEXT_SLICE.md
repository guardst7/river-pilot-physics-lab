# 11 — Phase 0B-2: pinned-run results and interpretation

**Verified date:** 2026-10-11. **Engine:** `guardst7/phaser-box2d` source commit `1b318f45782c203367eef85e6c0021e7ae04681b` (user's Windows execution). **Status:** reproducible diagnostic finding; **NOT physics qualification or a verified engine defect**.

## Reproduction

- `npm.cmd test` — 17/17 tests passed. This is test-harness/infrastructure health, **not** an assertion that every modeled contact is physically acceptable.
- `npm.cmd run diagnostics:contact-count` — 8/8 scenarios completed; 4 comparison pairs. Generated `.reports/phase0b2-contact-count-reference.json` (ignored by Git). User provided this JSON for analysis.
- 60 Hz; 4 substeps; zero planar gravity, drag, and restitution; two-second observation window; friction either 0 or 0.3.
- Towboat proxy: 450,000 kg, speed 2.5 m/s. Barge: 2,000,000 kg, initially stationary. Both are centered. The controlled single-point probe has the same solver mass, COM, inertia, and forward-tip position as the flat rectangular tow proxy. It is **not** a complete hull.

## Core measurements

| Contact | Friction | Tow created first: post-contact omega (deg/s) | Barge created first: post-contact omega (deg/s) | Signed creation-order residual (deg/s) |
| --- | ---: | ---: | ---: | ---: |
| Single centered point | 0 | 0 | 0 | 0 |
| Single centered point | 0.3 | 0 | 0 | 0 |
| Flat face, two points | 0 | +0.22336309 | -0.22336309 | 0.44672617 |
| Flat face, two points | 0.3 | -0.19105201 | +0.19105201 | 0.38210401 |

All one-point runs report one manifold contact point and no angular velocity, regardless of creation order or friction. Both bodies exit with X velocity `0.4591836734693877 m/s` (to reported numerical precision), the expected common velocity from conservation of momentum for this zero-restitution, centered idealized interaction: `(450000 × 2.5) / (450000 + 2000000)`.

Flat-face runs report two initial manifold points near `Y = -5m` and `Y = +5m`. The measured nonzero yaw reverses sign when object creation order reverses, even at zero friction. In the two-point, tow-first runs, barge final forward velocity was `0.46300734 m/s` (friction 0) or `0.46323731 m/s` (friction 0.3), and corresponding towboat post-contact X velocity was about `0.44218959` or `0.44116749 m/s`, respectively. The x/y total linear-momentum residuals reported by the harness are tiny, but this alone is not proof of correct angular impulse allocation.

The **two-second final yaw angle is not a contact-specific acceptance metric**, since angular damping is intentionally absent; angular velocity is the more useful initial comparison. Historical ~17.9 degree rotation from a different fixture has **not** been reproduced or explained here.

## Evidential conclusion

The results strongly localize **creation-order-dependent angular bias** to this **two-contact flat-face fixture**. They rule out a generic world-initialization, time-stepping, or force-integration problem that would also rotate the one-point reference in identical conditions. Friction is not required for the bias. Numerical ordering of contact/manifold constraints is a plausible mechanism.

**Not demonstrated:** a specific faulty source instruction, physical acceptability across realistic vessel geometries, solver convergence, preservation of total angular momentum, equivalence to the original 17.9-degree failure, or a correct upstream patch. The circle probe and rectangle differ in contact shape despite matched mass properties. The post-step contact-impulse fields are **not a full history of iterative impulses**, so do not attempt to reconstruct total forces from the sampled impulse values.

## ONE recommended next slice — Phase 0B-3 (read-only mechanism audit)

Before writing more fixtures or changing Box2D, inspect the **two-point manifold generation and contact constraint processing** in the pinned JavaScript port:

1. Trace where two manifold points get their ordering and IDs, and how body creation/shape ordering affects that sequence.
2. Trace how the solver applies normal and tangential impulses for a two-point manifold, including whether points are solved sequentially and how warm-starting, bias, and substeps affect the result. Distinguish a design tradeoff typical of iterative solvers from a demonstrable porting error.
3. Where useful, compare relevant behavior against the appropriate upstream Box2D C implementation or published solver design, without assuming the two projects implement identical versions/settings.
4. Return a **source-location-grounded explanation and one minimal falsifiable experiment** that would separate expected iterative ordering sensitivity from a JS-port regression. Stop for review before implementing it.

**Guardrails:** No engine fork edits, no `.vendor` changes, no River Pilot integration, no changing the pinned commit, no new dependency, no loosened acceptance gates, and no unapproved Git operations. Do not issue a new Box2D pull request based on these measurements alone.

## Session/Git handoff

At the time of the verified run, user reported 17 passing tests and generated the Phase 0B-2 JSON. The initial lab commit `1301621` was pushed earlier. **No later commit/push has been confirmed**, so inspect `git status --short` before changing or committing anything. The original 66-run Phase 0B and eight-run Phase 0B-2 updates may still be uncommitted.
