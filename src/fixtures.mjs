/**
 * Controlled rectangular proxy hulls, not approved River Pilot vessel specs.
 * All numeric quantities in SI, with XY as horizontal water plane.
 * Bow faces +X; beam spans Y. 1 world length unit = 1 meter.
 */
export const RECTANGULAR_COLLISION = Object.freeze({
  name: 'two-free-rectangles',
  dtSeconds: 1 / 60,
  substeps: 4,
  durationSeconds: 2,
  gapM: 0.75,
  lateralOffsetM: 1.5,
  towboat: Object.freeze({ lengthM: 32, beamM: 10, massKg: 450_000, speedMps: 2.5 }),
  barge: Object.freeze({ lengthM: 60, beamM: 11, massKg: 2_000_000, speedMps: 0 }),
  sampledAtSeconds: Object.freeze([0, 0.25, 0.5, 1, 2])
});

export const SCENARIOS = Object.freeze([
  { id: 'centerline-tow-first', offsetM: 0, creationOrder: 'tow-first' },
  { id: 'centerline-barge-first', offsetM: 0, creationOrder: 'barge-first' },
  { id: 'port-offset-tow-first', offsetM: 1.5, creationOrder: 'tow-first' },
  { id: 'starboard-offset-tow-first', offsetM: -1.5, creationOrder: 'tow-first' },
  { id: 'port-offset-barge-first', offsetM: 1.5, creationOrder: 'barge-first' },
  { id: 'starboard-offset-barge-first', offsetM: -1.5, creationOrder: 'barge-first' }
]);
