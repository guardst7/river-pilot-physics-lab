# 00 — Scope and architecture

**Purpose:** validate numerical dynamics and constraints independently of River Pilot's Phaser scenes, maps, gameplay and debug UI. The lab is a deliberately small consumer of Box2D source, not a replacement physics engine.

## Ownership and dependency direction

```text
phaser-box2d fork (source pin 1b318f4, engine corrections upstream)
                  |
          .vendor/ pinned checkout (ignored, read-only)
                  |
river-pilot-physics-lab (headless fixtures + measurements + qualification)
                  |
          validated contracts/data/models only, after approval
                  v
river-pilot (future separate integration milestone)
```

## Present responsibilities

- `src/pin.mjs`: one reviewed vendor source commit.
- `src/box2d.mjs`: sole Box2D source-entry re-export. It is intentionally *not* a fake engine adapter.
- `src/world.mjs`: minimal world/body helpers for tests. Nothing is allowed to sneak independent movement integration into them.
- `src/fixtures.mjs`: authored geometric and physical test inputs.
- `src/scenarios.mjs`: repeatable case setup, stepping and sampling; always destroys worlds in finally.
- `src/measure.mjs`: pure observation and mirrored/order-comparison utilities.
- `src/assessment.mjs`: explicitly provisional thresholds; judgments are separate from raw measurements.
- `tools/`: setup/pin verification and JSON report production.
- `test/`: API wiring, sanity, and determinism tests. A green `npm test` does not say physical acceptance passed.

## Future boundary (not authorized yet)

Once qualified, maritime force producers should operate on solver-independent meters/kilograms/seconds, COM velocity and orientation. Hydrodynamic drag, current-relative flow, propulsion and rudder forces should produce force/torque, **not** independently integrate position or angle. The Box2D bridge alone applies forces and steps one authoritative shared solver world. Static shoreline chunks are not separate physics-world instances. Connected vessel assemblies, joint/compound choices, grounding, and world-origin translation each require separately documented tests.

## Explicit non-goals of Stage 1

No game maps or authored bathymetry; no vessel/shoreline collision fixtures; no connected barges; no damage; no wind or current; no high-level architecture rewrite; no browser visualization; no assumptions that planed drafts or speeds are physically calibrated.
