import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOX2D_PIN } from '../src/pin.mjs';
import { experiments, runDiagnosticCase, diagnosticComparisons } from '../src/phase0b.mjs';

const results = experiments().map(c => runDiagnosticCase(c));
const comparisons = diagnosticComparisons(results);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '.reports', 'phase0b-contact-diagnostics.json');
const report = {
  schemaVersion: 1, phase: 'phase0b-contact-diagnostics',
  sourceRepository: BOX2D_PIN.repository, sourceCommit: BOX2D_PIN.revision,
  criteriaStatus: 'DIAGNOSTIC_ONLY_NOT_QUALIFIED',
  methodology: 'Contact data sampled after world steps; transient/iterative impulses may not equal a full collision impulse history.',
  experimentCount: results.length,
  results, comparisons
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
const cases = results.filter(r => r.config.family === 'friction-offset' &&
  [0, -1.5, 1.5].includes(r.config.offsetM));
console.log(`Phase 0B contact diagnostics — Box2D ${BOX2D_PIN.revision} (NOT physics qualification)`);
console.table(cases.map(r => ({
  friction: r.config.friction,
  offsetM: r.config.offsetM,
  order: r.config.creationOrder,
  firstContactSec: r.firstContactTick === null ? null : +(r.firstContactTick * r.config.dtSeconds).toFixed(4),
  postContactTowOmegaDegps: r.metrics.towPostContactAngularVelocityDegps === null ? null : +r.metrics.towPostContactAngularVelocityDegps.toFixed(6),
  finalTowYawDeg: +r.metrics.towFinalYawDeg.toFixed(5)
})));
console.log(`Runs: ${results.length}; comparisons: ${comparisons.length}; saved ${output}`);
console.log('Diagnostics only. Examine signed yaw, contact manifolds, friction, small offsets, timestep and bow geometry.');
