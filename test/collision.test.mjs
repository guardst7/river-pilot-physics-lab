import test from 'node:test';
import assert from 'node:assert/strict';
import { runCollisionScenario } from '../src/scenarios.mjs';
import { SCENARIOS, RECTANGULAR_COLLISION } from '../src/fixtures.mjs';
import { allFinite } from '../src/measure.mjs';
import { assess } from '../src/assessment.mjs';

test('all six isolated collision fixtures run and report finite SI metrics', () => {
  for (const spec of SCENARIOS) {
    const result = runCollisionScenario(spec);
    assert.equal(result.samples.length, RECTANGULAR_COLLISION.sampledAtSeconds.length);
    assert.ok(allFinite(result));
    const initial = result.samples[0];
    assert.ok(Math.abs(initial.towboat.massKg - RECTANGULAR_COLLISION.towboat.massKg) < 0.1);
    assert.ok(Math.abs(initial.barge.massKg - RECTANGULAR_COLLISION.barge.massKg) < 0.1);
  }
});

test('re-running an identical fixture produces the same numerical result', () => {
  const config = SCENARIOS[0];
  const a = runCollisionScenario(config);
  const b = runCollisionScenario(config);
  assert.deepEqual(b, a);
});

test('assessment reports provisional checks without secretly enforcing tolerances', () => {
  const byId = Object.fromEntries(SCENARIOS.map(s => [s.id, runCollisionScenario(s)]));
  const assessment = assess(byId);
  assert.equal(assessment.criteriaStatus, 'PROVISIONAL_NOT_CALIBRATED');
  assert.ok(assessment.checks.length >= 10);
  assert.ok(assessment.checks.every(c => typeof c.passed === 'boolean' && Number.isFinite(c.measured)));
});
