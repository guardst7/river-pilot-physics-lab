import test from 'node:test';
import assert from 'node:assert/strict';
import { referenceCases, runReferenceCase, referenceComparisons } from '../src/phase0b2.mjs';
import { runDiagnosticCase } from '../src/phase0b.mjs';

const cases = referenceCases();
const pick = (geometry, friction = 0, creationOrder = 'tow-first') => cases.find(c =>
  c.geometry === geometry && c.friction === friction && c.creationOrder === creationOrder);

test('reference matrix has 2 geometries × 2 friction settings × 2 creation orders', () => {
  assert.equal(cases.length, 8);
  assert.equal(new Set(cases.map(c => c.id)).size, 8);
});

test('centerline single-contact probe reports one manifold point; flat reference reports two', () => {
  const one = runReferenceCase(pick('single-point'));
  const two = runReferenceCase(pick('two-point'));
  assert.equal(one.firstContactPointCount, 1);
  assert.equal(two.firstContactPointCount, 2);
  assert.ok(one.measuredContactPointCounts.every(n => n <= 1));
  assert.ok(Math.abs(one.metrics.xMomentumDeltaKgMps) < 0.01);
  assert.ok(Math.abs(one.metrics.yMomentumDeltaKgMps) < 0.01);
});

test('mass and inertia match across reference geometries', () => {
  const one = runReferenceCase(pick('single-point', 0.3));
  const two = runReferenceCase(pick('two-point', 0.3));
  assert.ok(Math.abs(one.final.towboat.massKg - two.final.towboat.massKg) < 0.1);
  assert.ok(Math.abs(one.geometry.towInertiaKgM2 - two.geometry.towInertiaKgM2) < 1);
});

test('two-point reference is unchanged from Phase 0B', () => {
  const config = pick('two-point', 0.3, 'barge-first');
  const unchanged = runDiagnosticCase(config);
  const wrapped = runReferenceCase(config);
  assert.deepEqual(wrapped.metrics, unchanged.metrics);
  assert.deepEqual(wrapped.final, unchanged.final);
});

test('same fixture is deterministic and comparison retains signed angular velocity', () => {
  const config = pick('single-point', 0.3);
  const a = runReferenceCase(config);
  const b = runReferenceCase(config);
  assert.deepEqual(a, b);
  const results = cases.map(config => runReferenceCase(config));
  const pairs = referenceComparisons(results);
  assert.equal(pairs.length, 4);
  assert.ok(pairs.every(p => Number.isFinite(p.orderOmegaResidualDegps)));
  assert.ok(pairs.every(p => Number.isFinite(p.idealZeroOmegaResidualDegps)));
});


test('centered one-point impulse produces negligible angular velocity for both orders and friction settings', () => {
  for (const friction of [0, 0.3]) {
    const a = runReferenceCase(pick('single-point', friction, 'tow-first'));
    const b = runReferenceCase(pick('single-point', friction, 'barge-first'));
    for (const result of [a, b]) {
      assert.equal(result.firstContactPointCount, 1);
      assert.ok(Math.abs(result.metrics.towPostContactAngularVelocityDegps) < 1e-6);
      assert.ok(Math.abs(result.metrics.bargePostContactAngularVelocityDegps) < 1e-6);
    }
    assert.ok(Math.abs(a.final.towboat.vxMps - b.final.towboat.vxMps) < 1e-6);
  }
});
