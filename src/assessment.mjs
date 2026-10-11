import { compareMirrors, compareOrder } from './measure.mjs';

/**
 * Provisional gates, NOT validated vessel-physics acceptance criteria.
 * These deliberately expose possible anomalies without altering engine input.
 * See docs/03_ACCEPTANCE_AND_TEST_PROTOCOL.md before making a go/no-go decision.
 */
export const PRELIMINARY_TOLERANCE = Object.freeze({
  centerlineMaxYawDeg: 0.5,
  mirroredFinalYawDeg: 0.5,
  creationOrderFinalYawDeg: 0.5,
  minimumBargeDeltaSpeedMps: 0.01
});

export function assess(resultById, tolerance = PRELIMINARY_TOLERANCE) {
  const centerA = resultById['centerline-tow-first'];
  const centerB = resultById['centerline-barge-first'];
  const portA = resultById['port-offset-tow-first'];
  const starboardA = resultById['starboard-offset-tow-first'];
  const portB = resultById['port-offset-barge-first'];
  const starboardB = resultById['starboard-offset-barge-first'];
  const last = result => result.samples.at(-1);
  const checks = [];
  function push(id, measured, maximumOrMinimum, relation, note) {
    const passed = relation === 'min' ? measured >= maximumOrMinimum : measured <= maximumOrMinimum;
    checks.push({ id, measured, threshold: maximumOrMinimum, relation, passed, status: passed ? 'PASS' : 'INVESTIGATE', note });
  }
  for (const [order, result] of [['tow-first', centerA], ['barge-first', centerB]]) {
    push(`centerline-towboat-yaw-${order}`, result.metrics.maxAbsoluteTowYawDeg, tolerance.centerlineMaxYawDeg, 'max', 'An ideal symmetric isolated fixture should not produce substantial yaw.');
    push(`centerline-barge-yaw-${order}`, result.metrics.maxAbsoluteBargeYawDeg, tolerance.centerlineMaxYawDeg, 'max', 'Barrel-like rotation in nominally symmetric contact requires investigation.');
  }
  for (const [order, port, starboard] of [['tow-first', portA, starboardA], ['barge-first', portB, starboardB]]) {
    const tow = compareMirrors(last(port).towboat, last(starboard).towboat);
    const barge = compareMirrors(last(port).barge, last(starboard).barge);
    push(`mirrored-towboat-yaw-${order}`, tow.angleMirrorDiffDeg, tolerance.mirroredFinalYawDeg, 'max', 'Mirrored offsets should produce approximately opposite yaw.');
    push(`mirrored-barge-yaw-${order}`, barge.angleMirrorDiffDeg, tolerance.mirroredFinalYawDeg, 'max', 'Mirrored offsets should produce approximately opposite yaw.');
  }
  for (const [name, a, b] of [
    ['centerline', centerA, centerB],
    ['port-offset', portA, portB],
    ['starboard-offset', starboardA, starboardB]
  ]) {
    const tow = compareOrder(last(a).towboat, last(b).towboat);
    const barge = compareOrder(last(a).barge, last(b).barge);
    push(`creation-order-towboat-yaw-${name}`, tow.angleDiffDeg, tolerance.creationOrderFinalYawDeg, 'max', 'Creation order should not substantially alter an otherwise identical outcome.');
    push(`creation-order-barge-yaw-${name}`, barge.angleDiffDeg, tolerance.creationOrderFinalYawDeg, 'max', 'Creation order should not substantially alter an otherwise identical outcome.');
  }
  for (const result of [centerA, centerB]) {
    push(`barge-observed-motion-${result.configuration.creationOrder}`, result.metrics.bargeChangeInSpeedXMps, tolerance.minimumBargeDeltaSpeedMps, 'min', 'Checks contact transferred some momentum; not proof of realistic impulse.');
  }
  return { criteriaStatus: 'PROVISIONAL_NOT_CALIBRATED', checks, allPreliminaryChecksPassed: checks.every(x => x.passed) };
}
