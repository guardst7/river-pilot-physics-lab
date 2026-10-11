import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOX2D_PIN } from '../src/pin.mjs';
import { SCENARIOS, RECTANGULAR_COLLISION } from '../src/fixtures.mjs';
import { runCollisionScenario } from '../src/scenarios.mjs';
import { assess } from '../src/assessment.mjs';

const enforce = process.argv.includes('--enforce');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const byId = Object.fromEntries(SCENARIOS.map(scenario => [scenario.id, runCollisionScenario(scenario)]));
const assessment = assess(byId);
const report = {
  schemaVersion: 1,
  tool: 'River Pilot Physics Lab',
  sourceRepository: BOX2D_PIN.repository,
  sourceCommit: BOX2D_PIN.revision,
  fixture: RECTANGULAR_COLLISION,
  scenarios: byId,
  assessment
};
const output = resolve(root, '.reports', 'phase0a-collision-baseline.json');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(`Physics baseline — Box2D ${BOX2D_PIN.revision} / provisional criteria`);
console.table(Object.values(byId).map(s => ({
  scenario: s.id,
  towMaxYawDeg: +s.metrics.maxAbsoluteTowYawDeg.toFixed(4),
  bargeMaxYawDeg: +s.metrics.maxAbsoluteBargeYawDeg.toFixed(4),
  bargeDeltaVx: +s.metrics.bargeChangeInSpeedXMps.toFixed(5)
})));
console.table(assessment.checks.map(x => ({
  check: x.id,
  measurement: +x.measured.toFixed(5),
  limit: x.threshold,
  result: x.status
})));
console.log(`Saved full snapshots/measurements: ${output}`);
if (!assessment.allPreliminaryChecksPassed) {
  console.warn('Some provisional physical checks require investigation. This is NOT a diagnosis of the engine.');
  if (enforce) process.exitCode = 1;
}
