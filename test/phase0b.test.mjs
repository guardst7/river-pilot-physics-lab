import test from 'node:test';
import assert from 'node:assert/strict';
import { experiments, runDiagnosticCase, diagnosticComparisons } from '../src/phase0b.mjs';
import { runCollisionScenario } from '../src/scenarios.mjs';
import { SCENARIOS } from '../src/fixtures.mjs';

const get = (offsetM, creationOrder, extra = {}) => ({
  id: `test-${offsetM}-${creationOrder}`, family: 'test',
  offsetM, creationOrder, friction: 0.3,
  bowStyle: 'flat', dtSeconds: 1 / 60, substeps: 4,
  ...extra
});

test('experiment matrix covers friction, perturbations, order, timestep, bow geometry', () => {
  const cases = experiments();
  assert.equal(cases.length, 66);
  assert.equal(new Set(cases.map(c => c.id)).size, cases.length);
  assert.ok(cases.some(c => c.friction === 0 && c.offsetM === 0));
  assert.ok(cases.some(c => c.offsetM === 0.001));
  assert.ok(cases.some(c => c.dtSeconds === 1 / 120));
  assert.ok(cases.some(c => c.bowStyle === 'chamfered'));
});

test('diagnostic fixture records finite contact and post-impact movement', () => {
  const r = runDiagnosticCase(get(0, 'tow-first'));
  assert.equal(r.contactEverObserved, true);
  assert.ok(r.firstContactTick !== null);
  assert.ok(r.impactWindow.length >= 4);
  assert.ok(r.contactTimeline.length >= 1);
  assert.ok(r.contactTimeline.some(c => c.contacts.some(d => d.pointCount > 0)));
  assert.ok(Number.isFinite(r.metrics.towPostContactAngularVelocityDegps));
  assert.ok(Math.abs(r.metrics.xMomentumDeltaKgMps) < 0.001);
});

test('new diagnostic scenario reproduces untouched Phase 0A baseline geometry', () => {
  const old = runCollisionScenario(SCENARIOS[0]);
  const newer = runDiagnosticCase(get(0, 'tow-first'));
  assert.equal(newer.metrics.towFinalYawDeg, old.samples.at(-1).towboat.angleDeg);
  assert.equal(newer.metrics.bargeDeltaVxMps, old.metrics.bargeChangeInSpeedXMps);
});

test('chamfered bow preserves controlled mass and inertia', () => {
  const flat = runDiagnosticCase(get(0, 'tow-first'));
  const chamfer = runDiagnosticCase(get(0, 'tow-first', { bowStyle: 'chamfered' }));
  assert.ok(Math.abs(chamfer.final.towboat.massKg - flat.final.towboat.massKg) < 0.1);
  assert.ok(Math.abs(chamfer.geometry.towInertiaKgM2 - flat.geometry.towInertiaKgM2) < 1);
  assert.equal(chamfer.contactEverObserved, true);
});

test('comparison entries preserve both order and mirror-pair directions', () => {
  const cases = [get(1.5, 'tow-first'), get(-1.5, 'tow-first'), get(1.5, 'barge-first'), get(-1.5, 'barge-first')]
    .map(c => ({ ...c, id: ['probe', 'flat', `offset${c.offsetM}`, c.creationOrder, 'friction0.3', '60hz', '4sub'].join('--') }));
  const results = cases.map(c => runDiagnosticCase(c));
  const comparisons = diagnosticComparisons(results);
  assert.equal(comparisons.filter(c => c.comparison === 'creation-order').length, 2);
  assert.equal(comparisons.filter(c => c.comparison === 'reflection').length, 1);
});
