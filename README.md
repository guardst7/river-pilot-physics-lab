# River Pilot Physics Lab

Independent, **headless** qualification harness for the 2D physics foundation of River Pilot. This repository is a test laboratory, **not** a separate game or a fork of Box2D. It measures behavior before code is integrated into the game.

**Status:** starter implementation. The included scenarios and harness code need their first run against the pinned corrected Box2D source on a developer machine. The physical acceptance thresholds are provisional, not approved simulation specifications. No collision-performance conclusions are claimed here.

## Five-minute Windows setup

Prerequisites: Git, Node.js 20+, and the existing local checkout `C:\Repos\phaser-box2d` at a history containing commit `1b318f4` (preferred, for offline setup). The setup script can clone the public fork when the sibling clone isn't available.

1. Clone/open `https://github.com/guardst7/river-pilot-physics-lab` in `C:\Repos\river-pilot-physics-lab`.
2. Copy the **contents** of the accompanying starter ZIP into that repository root (not into an extra nested directory). Keep any existing Git files.
3. Open PowerShell in that directory and run:

   ```powershell
   npm.cmd run setup:box2d
   npm.cmd test
   npm.cmd run scenarios
   ```

4. Read the console output and `.reports/phase0a-collision-baseline.json` (ignored by Git).
5. Only when the team explicitly elects to enforce the **provisional** numerical gates, run `npm.cmd run qualify` (nonzero exit if provisional checks are violated).

No `npm install` is needed: the lab uses Node's built-in test runner and has **zero npm dependencies**. `npm.cmd run setup:box2d` uses Git; it doesn't modify either neighboring project.

## Commands

| Command | Purpose |
| --- | --- |
| `npm.cmd run setup:box2d` | Create ignored `.vendor/phaser-box2d` clone and checkout pinned commit `1b318f4` |
| `npm.cmd run verify:box2d` | Refuse wrong/dirty vendor revisions |
| `npm.cmd test` | Validate API wiring, numerical finiteness, mass, reproducibility, and 40 world lifecycles |
| `npm.cmd run scenarios` | Measure six collisions; save JSON report; report provisional anomalies without failing |
| `npm.cmd run qualify` | Apply provisional gates as a failing process for investigation **not yet an acceptance decision** |

The fixture is intentionally primitive: **two independent free rectangular rigid bodies**, no push coupling, no wind, no flow, no buoyancy, no propulsion, no joints, no drag, zero planar gravity, and zero rotation locks. A rectangle is **not** a validated hydrodynamic hull. Box2D's `density` is expressed in kg/m² so each 2D body's *total* solver mass is specified in kg.

## Dependency pinning: important

We import **`src/main.js` directly** from the source checkout for the `guardst7/phaser-box2d` fix at `1b318f4`. We do **not** load `dist/PhaserBox2D.js`: at that commit the bundled distribution files were not rebuilt, so they may not contain the world registry and stale-ID corrections. The verified vendor clone lives under `.vendor/` and is excluded from Git.

Configuration: `src/pin.mjs`; implementation: `tools/setup-box2d.mjs`, `tools/verify-box2d.mjs`. Changing the pin requires explicit review, new baseline measurements, and a documentation update. The lab's ordinary test commands validate the exact pin before using it.

## Working directory layout

```text
C:\Repos\
  river-pilot\                    # existing game — untouched by this lab
  phaser-box2d\                   # existing engine fork — untouched by this lab
  river-pilot-physics-lab\        # this repository
    .vendor/phaser-box2d\        # ignored local clone of corrected engine source
    src/                          # physical fixtures and measurements
    test/                         # node:test smoke/reproducibility tests
    tools/                        # dependency bootstrap and report runner
    docs/                         # scope, acceptance, handoffs and decisions
    .reports/                     # ignored generated JSON snapshots
    AGENTS.md                     # standing instructions for Codex sessions
```

## First question

Does the same nominally symmetric towboat/barge rectangular collision behave similarly when either body is created first? Does mirroring a lateral offset reverse yaw rather than introducing an unexplained bias? A previous River Pilot qualification reported approximately **17.9° of unwanted towboat yaw** during a purported centerline impact and sensitivity to body creation order. That is **historical, unverified in this exact harness**. Our first task is to reproduce or refute it using carefully controlled fixtures.

## Documentation and session handoff

- [AGENTS.md](AGENTS.md) — permanent Codex rules and cost-conscious working practice
- [docs/00_SCOPE_AND_ARCHITECTURE.md](docs/00_SCOPE_AND_ARCHITECTURE.md) — repository boundaries and intended long-term reuse
- [docs/01_DEPENDENCY_AND_REPRODUCIBILITY.md](docs/01_DEPENDENCY_AND_REPRODUCIBILITY.md) — pin, updates, failure recovery
- [docs/02_FIXTURES_AND_MEASUREMENTS.md](docs/02_FIXTURES_AND_MEASUREMENTS.md) — what each scenario does and does not prove
- [docs/03_ACCEPTANCE_AND_TEST_PROTOCOL.md](docs/03_ACCEPTANCE_AND_TEST_PROTOCOL.md) — checks, caveats, quality gates
- [docs/04_ROADMAP_AND_DECISIONS.md](docs/04_ROADMAP_AND_DECISIONS.md) — deliberately small next slices and decision log
- [docs/05_HANDOFF.md](docs/05_HANDOFF.md) — **read this first in every new Codex session**
- [docs/06_SESSION_LOG_TEMPLATE.md](docs/06_SESSION_LOG_TEMPLATE.md) — compact end-of-session reporting template

## Git rules

The ZIP contains no `.git` directory and doesn't push anything. Copy files into the GitHub repo you've already cloned. After inspecting and testing, **you** may choose to stage/commit/push. Do not commit `.vendor/` or `.reports/`, and do not modify the parent `phaser-box2d` or `river-pilot` repositories as part of lab work.

## Licensing

No Box2D source or compiled bundle is distributed in this lab starter. The engine is obtained separately and remains under its own MIT license; retain upstream notices if distribution of vendor binaries is later authorized. No license is assigned to this new project by the starter archive; use the license settings of your GitHub repository or select one explicitly.
