import { createWorld, destroyWorld, advance, createRectangle } from './world.mjs';
import { snapshot, allFinite } from './measure.mjs';
import { RECTANGULAR_COLLISION } from './fixtures.mjs';

/** Runs one fully isolated scenario; never combines separate physics worlds. */
export function runCollisionScenario(configuration, fixture = RECTANGULAR_COLLISION) {
  const worldId = createWorld();
  try {
    const tow = fixture.towboat;
    const barge = fixture.barge;
    // Face-to-face initial gap; vessel COM positions deliberately asymmetric in X.
    const towboat = { ...tow, xM: -tow.lengthM / 2 - fixture.gapM / 2,
      yM: configuration.offsetM };
    const bargeBody = { ...barge, xM: barge.lengthM / 2 + fixture.gapM / 2,
      yM: 0 };
    const byName = {};
    for (const name of (configuration.creationOrder === 'barge-first' ? ['barge', 'towboat'] : ['towboat', 'barge'])) {
      byName[name] = createRectangle(worldId, name === 'barge' ? bargeBody : towboat);
    }
    const ticks = Math.round(fixture.durationSeconds / fixture.dtSeconds);
    const sampleTicks = new Set(fixture.sampledAtSeconds.map(t => Math.round(t / fixture.dtSeconds)));
    const samples = [];
    let maxAbsoluteTowYawDeg = 0;
    let maxAbsoluteBargeYawDeg = 0;
    let maxTowAngularVelocityDegps = 0;
    for (let tick = 0; tick <= ticks; ++tick) {
      const towState = snapshot(byName.towboat.bodyId);
      const bargeState = snapshot(byName.barge.bodyId);
      maxAbsoluteTowYawDeg = Math.max(maxAbsoluteTowYawDeg, Math.abs(towState.angleDeg));
      maxAbsoluteBargeYawDeg = Math.max(maxAbsoluteBargeYawDeg, Math.abs(bargeState.angleDeg));
      maxTowAngularVelocityDegps = Math.max(maxTowAngularVelocityDegps, Math.abs(towState.angularVelocityDegps));
      if (sampleTicks.has(tick)) samples.push({ seconds: tick * fixture.dtSeconds, towboat: towState, barge: bargeState });
      if (tick < ticks) advance(worldId, fixture.dtSeconds, fixture.substeps);
    }
    const initial = samples[0];
    const final = samples[samples.length - 1];
    const result = {
      id: configuration.id, configuration, samples,
      metrics: {
        maxAbsoluteTowYawDeg,
        maxAbsoluteBargeYawDeg,
        maxTowAngularVelocityDegps,
        bargeChangeInSpeedXMps: final.barge.vxMps - initial.barge.vxMps,
        towChangeInSpeedXMps: final.towboat.vxMps - initial.towboat.vxMps,
        actualTowMassKg: initial.towboat.massKg,
        actualBargeMassKg: initial.barge.massKg
      }
    };
    if (!allFinite(result)) throw new Error(`Non-finite physics results in ${configuration.id}`);
    return result;
  } finally { destroyWorld(worldId); }
}
