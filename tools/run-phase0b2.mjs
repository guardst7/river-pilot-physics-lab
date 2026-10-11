/** Produce a compact, machine-readable single-vs-two-contact diagnostic. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOX2D_PIN } from '../src/pin.mjs';
import { referenceCases, runReferenceCase, referenceComparisons } from '../src/phase0b2.mjs';

const cases = referenceCases();
const results = cases.map(config => runReferenceCase(config));
const comparisons = referenceComparisons(results);
const report = {
  schemaVersion: 1,
  phase: 'phase0b2-single-vs-two-contact',
  sourceRepository: BOX2D_PIN.repository,
  sourceCommit: BOX2D_PIN.revision,
  criteriaStatus: 'DIAGNOSTIC_ONLY_NOT_QUALIFIED',
  methodology: 'Circle nose-only reference and original flat rectangle; same solver mass, COM, inertia, bow tip position, friction, speed, and timestep. Contact impulses are post-step observations, not a complete solver history.',
  limitations: ['Circle probe is not a realistic vessel hull',
    'Single-point findings do not by themselves prove a solver defect',
    'Yaw magnitude accumulated over 2 seconds depends on the absence of angular damping'],
  experimentCount: results.length,
  results,
  comparisons
};
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '.reports', 'phase0b2-contact-count-reference.json');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(`Phase 0B-2 — single-contact vs two-contact, Box2D ${BOX2D_PIN.revision} (DIAGNOSTIC ONLY)`);
console.table(results.map(r => ({
  geometry: r.config.geometry,
  friction: r.config.friction,
  order: r.config.creationOrder,
  initialContactPoints: r.firstContactPointCount,
  postContactTowOmegaDegps: +r.metrics.towPostContactAngularVelocityDegps.toFixed(8),
  finalTowYawDeg: +r.metrics.towFinalYawDeg.toFixed(8)
})));
console.table(comparisons.map(c => ({
  geometry: c.geometry,
  friction: c.friction,
  orderOmegaResidualDegps: +c.orderOmegaResidualDegps.toFixed(8),
  idealZeroOmegaResidualDegps: +c.idealZeroOmegaResidualDegps.toFixed(8)
})));
console.log(`Saved ${results.length} cases and ${comparisons.length} pairs to ${output}`);
console.log('No physics acceptance thresholds enforced. Preserve the JSON for review.');
