import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, destroyWorld, createRectangle, advance } from '../src/world.mjs';
import { snapshot, allFinite, compareMirrors, compareOrder } from '../src/measure.mjs';

/** These are harness and API smoke checks, not maritime model acceptance. */
test('zero-gravity stationary body stays finite with expected SI mass', () => {
  const world = createWorld();
  try {
    const rectangle = createRectangle(world, {
      xM: 0, yM: 0, lengthM: 10, beamM: 2, massKg: 20_000, speedMps: 0
    });
    assert.ok(Math.abs(rectangle.actualMassKg - 20_000) < 0.01, `Unexpected Box2D mass ${rectangle.actualMassKg}`);
    for (let i = 0; i < 10; ++i) advance(world);
    const result = snapshot(rectangle.bodyId);
    assert.ok(allFinite(result));
    assert.ok(Math.abs(result.xM) < 1e-6);
    assert.ok(Math.abs(result.yM) < 1e-6);
  } finally { destroyWorld(world); }
});

test('world can be safely created/destroyed repeatedly (pinned fix smoke check)', () => {
  for (let i = 0; i < 40; ++i) {
    const world = createWorld();
    try { advance(world); } finally { destroyWorld(world); }
  }
});

test('pure metric comparators use reflection and creation-order conventions', () => {
  const a = { xM: 1, yM: 2, vxMps: 3, vyMps: 4, angleDeg: 5, angularVelocityDegps: 6 };
  const reflected = { xM: 1, yM: -2, vxMps: 3, vyMps: -4, angleDeg: -5, angularVelocityDegps: -6 };
  assert.ok(Object.values(compareMirrors(a, reflected)).every(v => v === 0));
  assert.ok(Object.values(compareOrder(a, { ...a })).every(v => v === 0));
});
