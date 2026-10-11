# 02 — Fixtures and measurements

## Initial fixture (Phase 0A, deliberately simplified)

Two independent **rectangles** moving in a horizontal plane, no gravity, no hydrodynamic damping, no power, no external forces, no mechanical tow coupling. Both shapes are free to rotate. +X points toward the bow/impact direction, Y is lateral.

| Parameter | Towboat proxy | Barge proxy |
| --- | ---: | ---: |
| Length | 32 m | 60 m |
| Beam | 10 m | 11 m |
| Total rigid-body mass | 450,000 kg | 2,000,000 kg |
| Initial forward velocity | 2.5 m/s | 0 m/s |
| Initial yaw/angular velocity | 0 | 0 |

Initial gap between front and rear rectangular faces: **0.75 m**. Y separation is 0 m (centerline) or ±1.5 m (mirrored offsets). Density is derived as `massKg / (lengthM * beamM)`, not a real water/hull material property. These values are **controlled test inputs, not approved vessel reference data**; they are not asserted to reproduce the previous Phase 0A fixture byte-for-byte. The original case must be ported as an explicit, separately labeled fixture if its original numerical details are retrieved.

Six cases: centerline, port offset, starboard offset; each created in tow-first and barge-first order. Time step 1/60 second, 4 Box2D substeps, 2 seconds simulated. Samples recorded at t = 0, 0.25, 0.5, 1, 2 seconds. All positions in meters, velocities in m/s, yaw in degrees, angular velocity in degrees/s, masses in kg.

## Report semantics

Run `npm.cmd run scenarios` to create `.reports/phase0a-collision-baseline.json` including source revision, fixture data, scenario snapshots, peak yaw, barge Δvx, and provisional flags. Report creation doesn't modify code or vendor. The report stores *observations*, not proof of realism.

### Valid comparisons

- Centerline: yaw of both free rectangles should be near zero **in the ideal symmetric limit**; large persistent yaw needs diagnosis.
- Mirror: port vs starboard y/angle/angular velocity should reverse sign, x motion should remain the same.
- Creation order: physically equivalent setups should have similar results, but contact ordering/solver tolerances may cause small differences. Quantify rather than decree numerical identity.
- Impact: positive barge Δvx is evidence of some momentum transfer, not a substitute for validated contact impulses or conservation analysis.

### Not yet measured

True contact manifold impulses, momentum-energy balances across all steps, CCD tunneling, obstacle contacts, origin precision, very high mass ratios, long-run stability, joints/assemblies, hull shapes and physical hydrodynamic coefficients. Add each only as an authorized slice.

### Historical context

Earlier River Pilot Phase 0A work reported a roughly **17.9° unintended centerline towboat yaw**, rotation of the barge, and dependence on object creation order. This harness must **not** claim to have reproduced that until its own first run. If it does not reproduce the phenomenon, compare the original exact fixture and vendor revision before declaring Box2D cleared.
