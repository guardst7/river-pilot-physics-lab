/**
 * Phase 0B-2: deliberately minimal single-point versus two-point collision.
 * Diagnostic only. Does not modify the existing Phase 0A/0B fixture paths.
 */
import {
  b2Vec2, b2Circle, b2BodyType, b2DefaultBodyDef, b2DefaultShapeDef,
  b2CreateBody, b2CreateCircleShape, b2Body_SetMassData, b2Body_GetMass
} from './box2d.mjs';
import { createWorld, destroyWorld, advance, createRectangle } from './world.mjs';
import { snapshot, allFinite, compareOrder } from './measure.mjs';
import { readContactStep, readRotationalInertia } from './contact-diagnostics.mjs';
import { RECTANGULAR_COLLISION } from './fixtures.mjs';
import { runDiagnosticCase } from './phase0b.mjs';

// In a separate reference, the circle's rightmost point coincides with
// the rectangle bow at X=length/2; body mass, COM and inertia stay identical.
const NOSE_RADIUS_M = 2;
const GEOMETRIES = ['single-point', 'two-point'];
const ORDERS = ['tow-first', 'barge-first'];
const FRICTIONS = [0, 0.3];
const DT = 1 / 60;
const SUBSTEPS = 4;

export function referenceCases() {
  return GEOMETRIES.flatMap(geometry => FRICTIONS.flatMap(friction => ORDERS.map(creationOrder => ({
    id: `phase0b2--${geometry}--friction${friction}--${creationOrder}`,
    geometry, friction, creationOrder,
    dtSeconds: DT, substeps: SUBSTEPS, offsetM: 0, bowStyle: 'flat'
  }))));
}

/** A circle-only contact probe, NOT a simulated vessel hull. */
function createNoseContactProbe(worldId, spec, friction) {
  const bodyDef = b2DefaultBodyDef();
  bodyDef.type = b2BodyType.b2_dynamicBody;
  bodyDef.position = new b2Vec2(spec.xM, 0);
  bodyDef.linearVelocity = new b2Vec2(spec.speedMps, 0);
  bodyDef.linearDamping = 0;
  bodyDef.angularDamping = 0;
  bodyDef.enableSleep = false;
  bodyDef.isAwake = true;
  bodyDef.fixedRotation = false;
  const bodyId = b2CreateBody(worldId, bodyDef);
  if (!bodyId?.index1) throw new Error('Failed to create single-contact reference body.');
  const shapeDef = b2DefaultShapeDef();
  shapeDef.density = spec.massKg / (Math.PI * NOSE_RADIUS_M ** 2);
  shapeDef.restitution = 0;
  shapeDef.friction = friction;
  const circle = new b2Circle(new b2Vec2(spec.lengthM / 2 - NOSE_RADIUS_M, 0), NOSE_RADIUS_M);
  b2CreateCircleShape(bodyId, shapeDef, circle);
  // Match the full rectangle's mass, center of mass, rotational inertia;
  // using only a circle collision shape intentionally isolates contact count.
  b2Body_SetMassData(bodyId, {
    mass: spec.massKg,
    center: new b2Vec2(0, 0),
    rotationalInertia: spec.massKg * (spec.lengthM ** 2 + spec.beamM ** 2) / 12
  });
  if (Math.abs(b2Body_GetMass(bodyId) - spec.massKg) > 0.01) {
    throw new Error('Single-contact mass mismatch.');
  }
  return { bodyId };
}

/** Deliberately preserve the existing two-point fixture and its test path. */
export function runReferenceCase(config, base = RECTANGULAR_COLLISION) {
  if (!GEOMETRIES.includes(config.geometry) || !ORDERS.includes(config.creationOrder) ||
      !FRICTIONS.includes(config.friction)) throw new RangeError('Unapproved reference configuration.');
  if (config.geometry === 'two-point') {
    const r = runDiagnosticCase(config, base);
    return {
      ...r,
      referenceGeometry: 'two-point',
      measuredContactPointCounts: [...new Set(r.contactTimeline.flatMap(f => f.contacts.map(c => c.pointCount)))],
      firstContactPointCount: r.contactTimeline.find(f => f.contacts.length)?.contacts[0]?.pointCount ?? null
    };
  }

  const worldId = createWorld();
  try {
    const tow = base.towboat;
    const barge = base.barge;
    const towSpec = { ...tow, xM: -tow.lengthM / 2 - base.gapM / 2, yM: 0 };
    const bargeSpec = { ...barge, xM: barge.lengthM / 2 + base.gapM / 2, yM: 0,
      friction: config.friction, restitution: 0 };
    const bodies = {};
    for (const label of config.creationOrder === 'tow-first' ? ['towboat', 'barge'] : ['barge', 'towboat']) {
      bodies[label] = label === 'towboat'
        ? createNoseContactProbe(worldId, towSpec, config.friction)
        : createRectangle(worldId, bargeSpec);
    }
    const ticks = Math.round(base.durationSeconds / config.dtSeconds);
    if (Math.abs(ticks * config.dtSeconds - base.durationSeconds) > 1e-9) {
      throw new RangeError('Experiment duration must divide evenly into time steps.');
    }
    const take = (tick) => ({
      tick, seconds: tick * config.dtSeconds,
      towboat: snapshot(bodies.towboat.bodyId), barge: snapshot(bodies.barge.bodyId)
    });
    const initial = take(0);
    let firstContactTick = null;
    let contactTimeline = [];
    let beforeContact = null;
    let shortlyAfterContact = null;
    const encounteredCounts = new Set();
    let maxPointCount = 0;
    for (let tick = 1; tick <= ticks; tick++) {
      const preStep = take(tick - 1);
      advance(worldId, config.dtSeconds, config.substeps);
      const observation = readContactStep(worldId, bodies.towboat.bodyId);
      for (const c of observation.contacts) {
        encounteredCounts.add(c.pointCount);
        maxPointCount = Math.max(maxPointCount, c.pointCount);
      }
      if (firstContactTick === null && (observation.contacts.length > 0 || observation.beginCount > 0)) {
        firstContactTick = tick;
        beforeContact = preStep;
      }
      if (firstContactTick !== null && tick <= firstContactTick + 7) {
        contactTimeline.push({ tick, seconds: tick * config.dtSeconds, ...observation });
      }
      if (firstContactTick !== null && tick === firstContactTick + 3) shortlyAfterContact = take(tick);
    }
    const final = take(ticks);
    const after = shortlyAfterContact ?? final;
    const xMomentumDeltaKgMps = tow.massKg * (final.towboat.vxMps - initial.towboat.vxMps) +
      barge.massKg * (final.barge.vxMps - initial.barge.vxMps);
    const yMomentumDeltaKgMps = tow.massKg * (final.towboat.vyMps - initial.towboat.vyMps) +
      barge.massKg * (final.barge.vyMps - initial.barge.vyMps);
    const result = {
      id: config.id, config, referenceGeometry: config.geometry,
      fixture: { sameMassCOMAndInertiaAsFlatRectangle: true,
        physicalHull: false, circleRadiusM: NOSE_RADIUS_M,
        noseCircleCenterLocalXM: tow.lengthM / 2 - NOSE_RADIUS_M },
      geometry: {
        towInertiaKgM2: readRotationalInertia(bodies.towboat.bodyId),
        bargeInertiaKgM2: readRotationalInertia(bodies.barge.bodyId)
      },
      firstContactTick, firstContactPointCount: contactTimeline.find(f => f.contacts.length)?.contacts[0]?.pointCount ?? null,
      measuredContactPointCounts: [...encounteredCounts].sort(), maxPointCount,
      contactTimeline, beforeContact, shortlyAfterContact: after, final,
      metrics: {
        towPostContactAngularVelocityDegps: after.towboat.angularVelocityDegps,
        bargePostContactAngularVelocityDegps: after.barge.angularVelocityDegps,
        towFinalAngularVelocityDegps: final.towboat.angularVelocityDegps,
        bargeFinalAngularVelocityDegps: final.barge.angularVelocityDegps,
        towFinalYawDeg: final.towboat.angleDeg,
        bargeFinalYawDeg: final.barge.angleDeg,
        bargeDeltaVxMps: final.barge.vxMps - initial.barge.vxMps,
        xMomentumDeltaKgMps, yMomentumDeltaKgMps
      }
    };
    if (!allFinite(result)) throw new Error(`Non-finite measurements for ${config.id}`);
    return result;
  } finally {
    destroyWorld(worldId);
  }
}

export function referenceComparisons(results) {
  const comparisons = [];
  for (const geometry of GEOMETRIES) {
    for (const friction of FRICTIONS) {
      const selected = results.filter(r => r.config.geometry === geometry && r.config.friction === friction);
      if (selected.length !== 2) throw new Error(`Incomplete reference pair: ${geometry}, ${friction}`);
      const a = selected.find(r => r.config.creationOrder === 'tow-first');
      const b = selected.find(r => r.config.creationOrder === 'barge-first');
      if (!a || !b) throw new Error(`Missing reference creation-order pair: ${geometry}, ${friction}`);
      comparisons.push({
        geometry, friction, a: a.id, b: b.id,
        order: { towboat: compareOrder(a.final.towboat, b.final.towboat),
          barge: compareOrder(a.final.barge, b.final.barge) },
        signedTowPostContactOmega: [a.metrics.towPostContactAngularVelocityDegps,
          b.metrics.towPostContactAngularVelocityDegps],
        orderOmegaResidualDegps: Math.abs(a.metrics.towPostContactAngularVelocityDegps -
          b.metrics.towPostContactAngularVelocityDegps),
        idealZeroOmegaResidualDegps: Math.max(
          Math.abs(a.metrics.towPostContactAngularVelocityDegps),
          Math.abs(b.metrics.towPostContactAngularVelocityDegps))
      });
    }
  }
  return comparisons;
}
