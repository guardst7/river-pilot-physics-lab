# Phase 0A — Collision Baseline Analysis and Next Experiments

**Status:** Baseline analyzed; collision physics not yet qualified.  
**Date:** 2026-10-11  
**Input:** `phase0a-collision-baseline.json` produced by River Pilot Physics Lab  
**Engine source:** `https://github.com/guardst7/phaser-box2d.git` at commit `1b318f4`  
**Lab baseline:** initial Git commit `1301621`  
**Scope:** Isolated, freely moving rigid rectangles. **Not** a simulation of real marine hydrodynamics.

## 1. Baseline fixture

- World: zero gravity, zero body linear/angular damping; continuous collision enabled.
- Fixed timestep: 1/60 s, four substeps; 2 s run.
- Towboat proxy: 32 m × 10 m rectangle, 450,000 kg, initially +2.5 m/s along X.
- Barge proxy: 60 m × 11 m rectangle, 2,000,000 kg, initially stationary.
- Initial opposing faces separated by 0.75 m; initial impact expected at approximately 0.30 s.
- Centerline lateral offset: 0 m. Off-center offsets: +1.5 m and -1.5 m.
- Restitution = 0, friction = 0.3, with rectangular collision geometry.
- Six runs: centerline / positive offset / negative offset, each with tow-first and barge-first creation order.
- Reported sample times: 0, 0.25, 0.50, 1.00, 2.00 seconds.

## 2. Observed measurements at 2 seconds

| Scenario | Towboat signed yaw | Barge signed yaw | Towboat angular velocity | Barge +X speed |
|---|---:|---:|---:|---:|
| Centerline, tow first | -0.329948° | +0.091486° | -0.191052°/s | 0.463237 m/s |
| Centerline, barge first | +0.329948° | -0.091486° | +0.191052°/s | 0.463237 m/s |
| +1.5 m offset, tow first | -0.722766° | +0.079722° | -0.422507°/s | 0.465469 m/s |
| -1.5 m offset, tow first | -0.522594° | +0.265716° | -0.304758°/s | 0.465958 m/s |
| +1.5 m offset, barge first | +0.522594° | -0.265716° | +0.304758°/s | 0.465958 m/s |
| -1.5 m offset, barge first | +0.722766° | -0.079722° | +0.422507°/s | 0.465469 m/s |

**Reproducible mathematical patterns (all recorded samples, both bodies):**

- Centerline tow-first mirrors centerline barge-first.
- Positive-offset tow-first mirrors negative-offset barge-first.
- Negative-offset tow-first mirrors positive-offset barge-first.
- Over these paired samples, maximum absolute residual among corresponding reflected X/Y positions, X/Y velocities, signed angle, and angular velocity is below `4e-15` in their respective units.
- Positive and negative offsets **with the same creation order** are **not** mirror-equivalent.

The lab's `compareMirrors` and `compareOrder` functions implement their intended mathematical comparisons correctly. The provisional `INVESTIGATE` observations reflect actual differences rather than an obvious comparison sign error.

## 3. Basic physical consistency checks

Using reported instantaneous body masses and center-of-mass velocities:

- Initial X linear momentum = `450000 kg × 2.5 m/s = 1,125,000 kg·m/s`.
- Final X momentum matches the initial value to floating-point precision for all six scenarios.
- Initial and final Y momentum are zero to floating-point precision.
- For solid uniform-rectangle inertias `I = m (L² + beam²) / 12`, total angular momentum (orbital about the origin + body spin) is also conserved to a small numerical residual, less than approximately 8 N·m·s in the observed samples. This is a **consistency calculation under the uniform-rectangle model**, not an independent solver-internal inertia audit.
- Centerline final mass-weighted X speed = `0.45918367 m/s`, agreeing with conservation of the original momentum.
- Approximate total kinetic energy after centerline impact is 18.42% of initial kinetic energy. Significant loss is expected with restitution zero; this alone is not evidence of a bug.

These checks make a catastrophic momentum or mass-unit error less likely in these fixtures. They **do not** prove that contact selection and torque are correct.

## 4. Key interpretation

The centerline fixture has **no geometric reason to prefer clockwise or counterclockwise**. Nevertheless, creation order changes the sign of its angular motion. Off-center fixtures exhibit a tightly structured related asymmetry. This is **consistent with a contact manifold/tie-breaking or sequential impulse ordering effect**, particularly for flat-to-flat contact, but it does not establish which subsystem is responsible.

**Important measurement caveat:** the test's largest absolute yaw is largely **accumulated post-impact rotation**. For example, centerline towboat angular velocity has settled near `-0.191052°/s` by 0.5 s and remains at that value through 2 s, while yaw increases from about `-0.04337°` to `-0.32995°`. With zero angular damping, the angle will continue to accumulate after bodies separate. Consequently a final-angle tolerance (e.g. 0.5°) cannot be interpreted independently of test duration. Prefer angular velocity and immediate post-impact impulse/spin metrics, while recording final heading separately.

**Do not declare Box2D defective on this evidence alone.** Also do not declare the engine qualified because the rotations are smaller than the earlier ~17.9° isolated fixture: those fixtures must be matched in geometry/settings before comparisons are meaningful.

## 5. Next focused experiments (one small approved development slice)

Do **not** implement maritime physics, change the Box2D engine, or modify River Pilot during this slice.

1. **Improve measurement around first contact.** Save states at the first contact tick, several ticks immediately before/after, and at post-contact separation. Record pre-impact and post-impact linear/angular velocities, contact point count and locations/normals/impulses *if accessible without invasive engine changes*. If contact details cannot be obtained, state that explicitly.
2. **Vary friction while holding everything else fixed.** Run `friction = 0` and the baseline `0.3`, including centerline and mirrored offsets in both creation orders. Check whether ordering bias persists without tangential friction.
3. **Break geometric ties by a controlled perturbation.** Test offsets `0`, `±0.001`, `±0.01`, `±0.1`, and `±1.5` meters. Determine whether the selected yaw branch changes discontinuously around zero and whether order-dependent differences diminish with unambiguous contact geometry.
4. **Check timestep sensitivity.** Run at `1/60 s` with 1, 4, and 8 substeps and at `1/120 s` with 4 substeps. Measure angular velocity immediately after impact and the same fixed physical end time (not the same tick count).
5. **Test a non-flat contact geometry.** As a *separate fixture*, replace the towboat's flat front with a simple symmetric chamfered convex bow (within Box2D's polygon-vertex limits). Retain mass, COM, and as-near-as-practicable moment of inertia. Compare qualitative results; document any change in effective contact geometry/inertia so this is not mistaken for an exact A/B test.
6. **Preserve the existing baseline.** Keep the original six scenarios and their results reproducible. Add new scenarios and reporting without silently changing baseline fixtures or recalibrating tolerances to obtain green checks.

### What would warrant modifying Box2D?

A small reproducible fixture showing incorrect handling of a **well-defined**, nondegenerate contact (rather than merely a directional choice at symmetric flat-face contact), after verifying API usage and numerical configuration. Only then investigate a minimal engine change in the **separate `phaser-box2d` repo**, with a regression test and potential upstream PR.

## 6. Handoff instructions

- Preserve the pinned Box2D SHA `1b318f4` until a separately approved dependency update.
- Implement the next tests in `river-pilot-physics-lab` only.
- Do not copy River Pilot's full source/assets or modify River Pilot.
- Maintain `AGENTS.md`, `docs/05_HANDOFF.md`, and session logs to preserve experiment names, exact configurations, measured numbers, remaining unknowns, and next authorized task.
- Use `npm.cmd test` and `npm.cmd run scenarios` to ensure original baseline remains runnable.
- Distinguish test-framework PASS from physical qualification PASS.
- Do not change Git history, commit or push without user approval.

## 7. Decision status

**Keep Box2D as a candidate. Physics qualification remains pending.** Current data supports conservation of momentum but reveals repeatable signed angular response that depends on creation/contact ordering. Next experimental work should isolate which collision features generate that response before investing in marine propulsion, joints, or solver modifications.
