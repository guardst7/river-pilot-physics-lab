import { createWorld, destroyWorld, advance, createRectangle } from './world.mjs';
import { snapshot, allFinite, compareMirrors, compareOrder } from './measure.mjs';
import { readContactStep, readRotationalInertia } from './contact-diagnostics.mjs';
import { RECTANGULAR_COLLISION } from './fixtures.mjs';

export const EXPERIMENT_SETTINGS = Object.freeze({
  frictionValues: [0, 0.3],
  offsetsM: [0, -0.001, 0.001, -0.01, 0.01, -0.1, 0.1, -1.5, 1.5],
  timesteps: [
    { dtSeconds: 1 / 60, substeps: 1, label: '60hz-1sub' },
    { dtSeconds: 1 / 60, substeps: 4, label: '60hz-4sub' },
    { dtSeconds: 1 / 60, substeps: 8, label: '60hz-8sub' },
    { dtSeconds: 1 / 120, substeps: 4, label: '120hz-4sub' }
  ]
});

export function experiments() {
  const cases = [];
  const add = (family, props) => {
    const id = [family, props.bowStyle ?? 'flat', `offset${props.offsetM}`, props.creationOrder,
      `friction${props.friction}`, `${props.dtSeconds === 1 / 120 ? 120 : 60}hz`, `${props.substeps}sub`].join('--');
    cases.push({ id, family, ...props });
  };
  for (const friction of EXPERIMENT_SETTINGS.frictionValues) {
    for (const offsetM of EXPERIMENT_SETTINGS.offsetsM) {
      for (const creationOrder of ['tow-first', 'barge-first']) {
        add('friction-offset', { offsetM, creationOrder, friction,
          dtSeconds: 1 / 60, substeps: 4, bowStyle: 'flat' });
      }
    }
  }
  for (const { dtSeconds, substeps } of EXPERIMENT_SETTINGS.timesteps) {
    for (const offsetM of [0, -1.5, 1.5]) {
      for (const creationOrder of ['tow-first', 'barge-first']) {
        // Duplicate the friction=0.3 / 60Hz / 4 sub case intentionally;
        // it is a cross-family reproducibility control.
        add('timestep', { offsetM, creationOrder, friction: 0.3,
          dtSeconds, substeps, bowStyle: 'flat' });
      }
    }
  }
  for (const offsetM of [0, -1.5, 1.5]) {
    for (const creationOrder of ['tow-first', 'barge-first']) {
      add('bow-geometry', { offsetM, creationOrder, friction: 0.3,
        dtSeconds: 1 / 60, substeps: 4, bowStyle: 'chamfered' });
    }
  }
  return cases;
}

const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

/** A diagnostic run. First-touch is the first *reported solver contact*, not
 * the first geometrical overlap or the first instant of physical compression. */
export function runDiagnosticCase(config, base = RECTANGULAR_COLLISION) {
  const worldId = createWorld();
  try {
    const tow = base.towboat, barge = base.barge;
    const t = { ...tow, xM: -tow.lengthM / 2 - base.gapM / 2,
      yM: config.offsetM, friction: config.friction, bowStyle: config.bowStyle };
    const b = { ...barge, xM: barge.lengthM / 2 + base.gapM / 2,
      yM: 0, friction: config.friction };
    const bodies = {};
    for (const label of (config.creationOrder === 'barge-first' ? ['barge', 'towboat'] : ['towboat', 'barge'])) {
      bodies[label] = createRectangle(worldId, label === 'barge' ? b : t);
    }
    const ticks = Math.round(base.durationSeconds / config.dtSeconds);
    if (!near(ticks * config.dtSeconds, base.durationSeconds)) throw new Error('Non-integral experiment duration.');
    const take = () => ({ towboat: snapshot(bodies.towboat.bodyId), barge: snapshot(bodies.barge.bodyId) });
    const first = take();
    const all = [{ tick: 0, seconds: 0, ...first }];
    // Keep a small contact window rather than all per-tick native manifolds:
    // compact reports are easier to review/share across short sessions.
    const earlyContactFrames = [];
    const lateContactFrames = [];
    let activeContactFrames = 0;
    let firstContactTick = null;
    let lastContactTick = null;
    let contactEverObserved = false;
    for (let tick = 1; tick <= ticks; ++tick) {
      advance(worldId, config.dtSeconds, config.substeps);
      const states = take();
      const observation = readContactStep(worldId, bodies.towboat.bodyId);
      const active = observation.contacts.length > 0 || observation.beginCount > 0;
      if (observation.contacts.length > 0) activeContactFrames += 1;
      if (active) {
        contactEverObserved = true;
        if (firstContactTick === null) firstContactTick = tick;
        lastContactTick = tick;
      }
      if (active || observation.endCount > 0) {
        const row = { tick, seconds: tick * config.dtSeconds, ...observation };
        if (firstContactTick !== null && tick <= firstContactTick + 7) {
          earlyContactFrames.push(row);
        }
        if (observation.endCount > 0) earlyContactFrames.push(row);
        lateContactFrames.push(row);
        if (lateContactFrames.length > 3) lateContactFrames.shift();
      }
      all.push({ tick, seconds: tick * config.dtSeconds, ...states });
    }
    const last = all.at(-1);
    const contactTimeline = [...new Map(
      [...earlyContactFrames, ...lateContactFrames].map(frame => [frame.tick, frame])
    ).values()].sort((a, b) => a.tick - b.tick);
    const impactWindow = firstContactTick === null ? [] : all.filter(
      s => s.tick >= Math.max(0, firstContactTick - 2) &&
        s.tick <= Math.min(ticks, firstContactTick + 5));
    const justBefore = firstContactTick === null ? null : all[firstContactTick - 1];
    const justAfter = firstContactTick === null ? null : all[Math.min(ticks, firstContactTick + 3)];
    const p0x = tow.massKg * first.towboat.vxMps + barge.massKg * first.barge.vxMps;
    const p1x = tow.massKg * last.towboat.vxMps + barge.massKg * last.barge.vxMps;
    const p1y = tow.massKg * last.towboat.vyMps + barge.massKg * last.barge.vyMps;
    const result = {
      id: config.id, config,
      geometry: { tow: { lengthM: tow.lengthM, beamM: tow.beamM, bowStyle: config.bowStyle },
        barge: { lengthM: barge.lengthM, beamM: barge.beamM },
        towInertiaKgM2: readRotationalInertia(bodies.towboat.bodyId),
        bargeInertiaKgM2: readRotationalInertia(bodies.barge.bodyId) },
      firstContactTick, lastContactTick, contactEverObserved,
      contactTimeline,
      impactWindow,
      beforeContact: justBefore,
      shortlyAfterContact: justAfter,
      final: last,
      metrics: {
        towPostContactAngularVelocityDegps: justAfter?.towboat.angularVelocityDegps ?? null,
        bargePostContactAngularVelocityDegps: justAfter?.barge.angularVelocityDegps ?? null,
        towFinalAngularVelocityDegps: last.towboat.angularVelocityDegps,
        bargeFinalAngularVelocityDegps: last.barge.angularVelocityDegps,
        towFinalYawDeg: last.towboat.angleDeg,
        bargeFinalYawDeg: last.barge.angleDeg,
        bargeDeltaVxMps: last.barge.vxMps - first.barge.vxMps,
        xMomentumDeltaKgMps: p1x - p0x,
        yMomentumDeltaKgMps: p1y,
        activeContactFrames
      }
    };
    if (!allFinite(result)) throw new Error(`Non-finite result in ${config.id}`);
    return result;
  } finally { destroyWorld(worldId); }
}

export function diagnosticComparisons(results) {
  const lookup = new Map(results.map(r => [r.id, r]));
  const tests = [];
  // No acceptance thresholds here: an experiment measures differences.
  const paired = results.filter(r => r.config.creationOrder === 'tow-first');
  for (const a of paired) {
    const config = a.config;
    const reverseId = config.id.replace('--tow-first--', '--barge-first--');
    const reversed = lookup.get(reverseId);
    if (!reversed) throw new Error(`Missing creation-order pair: ${reverseId}`);
    tests.push({ family: config.family, comparison: 'creation-order',
      a: a.id, b: reversed.id,
      tow: compareOrder(a.final.towboat, reversed.final.towboat),
      barge: compareOrder(a.final.barge, reversed.final.barge),
      postContactAngularVelocityDifferenceDegps: Math.abs(
        (a.metrics.towPostContactAngularVelocityDegps ?? 0) -
        (reversed.metrics.towPostContactAngularVelocityDegps ?? 0)) });
    if (config.offsetM > 0) {
      const mirrorId = config.id.replace(`--offset${config.offsetM}--`, `--offset${-config.offsetM}--`);
      const mirror = lookup.get(mirrorId);
      if (!mirror) throw new Error(`Missing mirror pair: ${mirrorId}`);
      tests.push({ family: config.family, comparison: 'reflection',
        a: a.id, b: mirror.id,
        tow: compareMirrors(a.final.towboat, mirror.final.towboat),
        barge: compareMirrors(a.final.barge, mirror.final.barge),
        postContactAngularVelocityMirrorResidualDegps: Math.abs(
          (a.metrics.towPostContactAngularVelocityDegps ?? 0) +
          (mirror.metrics.towPostContactAngularVelocityDegps ?? 0)) });
    }
  }
  return tests;
}
