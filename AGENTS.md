# River Pilot Physics Lab — Codex Standing Instructions

Applies to **all future sessions** in this repository. Read `README.md`, `docs/05_HANDOFF.md`, and the relevant protocol before editing. Treat the handoff as an editable status ledger, not an invitation to assume undocumented things have passed.

## Mission

Isolate and measure Phaser Box2D simulation correctness with minimal cost/context before integrating a unified physics engine into River Pilot. Engine defects belong upstream in `phaser-box2d`; game integration belongs in `river-pilot`; qualification and reusable pure maritime models belong here only after separately approved milestones.

## Boundaries

- Work only inside this Git repo; never edit `C:\Repos\phaser-box2d`, `C:\Repos\river-pilot`, or any parent directory.
- The pinned vendor under `.vendor/` is **read-only**. Do not patch it. When an engine defect is suspected, make a minimal reproduction and report it for the separate Box2D repo.
- No Phaser rendering, graphical client, assets, map streaming, gameplay, scoring, AI navigation, or large refactors in Phase 0A.
- Do not copy proprietary or large game files into the public lab.
- Do not commit, push, reset, rebase, stash, switch branches, or rewrite Git history without explicit user approval. Preserve preexisting changes.
- No new dependencies, other physics engines, subagents, background work, or multi-stage implementation without explicit approval.
- Keep each authorized task as small as possible. Run focused tests first, full smoke suite only before finishing a slice.

## Technical invariants

- Units: 1 Box2D length unit = 1 meter; seconds and kilograms are literal SI. No compensating 1:10 world scaling without formal review.
- 2D XY is **horizontal**, +X is bow/forward, +Y is lateral, +Z is not simulated. Planar world gravity is (0,0).
- Actual solver masses must be verified after shapes are attached. Shape density is area density kg/m²; physical vessel hulls/added mass are **not** yet modeled.
- Source dependency **must** be `guardst7/phaser-box2d` at reviewed pin in `src/pin.mjs`; import `src/main.js`, never prebuilt `dist/` bundles from the lifecycle-fix commit. Run `npm run verify:box2d` before experiments.
- Cases are independent worlds, with fixed 60 Hz stepping and explicit substeps; don't infer contacts merely from overlapping positions or use post-collision states as initial states.
- Keep fixture inputs, solver interface, report/measurement code, and provisional assessment distinct.
- Never silently loosen thresholds to make a test green. Historical results are context, not a golden answer.
- Match mirror semantics (+Y/-Y) and body creation-order variations; preserve exact numeric evidence and source revision.

## Session protocol

1. Read `docs/05_HANDOFF.md`; check `git status --short` and the pin.
2. Identify one small user-authorized objective; say what is out of scope.
3. Run or capture a before baseline when feasible.
4. Change only necessary files; write focused regression tests for found issues.
5. Run focused tests; verify dependency; report what passed and failed. Distinguish harness tests from physical acceptance tests.
6. Update `docs/05_HANDOFF.md` with verified facts, files, remaining blockers, and the **one recommended next task**. Add a decision to `docs/04_ROADMAP_AND_DECISIONS.md` only for genuine decisions.
7. Do not advance automatically to the next milestone or integrate River Pilot.

## Known traps

- The earlier Phaser Box2D v1.1.0 `dist` bundle did **not** include PR #42's registry lifecycle/stale handle fix. Do not use it to validate this harness.
- PR #42 was **submitted**, not necessarily merged. The fix pin is `1b318f4`; it is independent of review status.
- 32 is the count of simultaneously allocated **physics world instances**, not a cap on River Pilot map chunks, bodies or playable waterway length.
- A successful test process shows harness health, *not* automatic proof of realistic tow/barge physics.
