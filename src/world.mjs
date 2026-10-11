import {
  b2CreateWorldArray,
  b2DefaultWorldDef,
  b2CreateWorld,
  b2DestroyWorld,
  b2World_Step,
  b2Vec2,
  b2DefaultBodyDef,
  b2BodyType,
  b2CreateBody,
  b2DefaultShapeDef,
  b2MakeBox,
  b2CreatePolygonShape,
  b2Body_GetMass,
  b2Body_SetMassData,
  b2ComputeHull,
  b2ComputePolygonMass,
  b2MakePolygon
} from './box2d.mjs';

let initialized = false;
export function createWorld() {
  if (!initialized) { b2CreateWorldArray(); initialized = true; }
  const worldDef = b2DefaultWorldDef();
  // Top-down water surface: no vertical gravitational acceleration in the XY plane.
  worldDef.gravity = new b2Vec2(0, 0);
  worldDef.enableSleep = false;
  worldDef.enableContinuous = true;
  const worldId = b2CreateWorld(worldDef);
  if (!worldId?.index1) throw new Error('Box2D world allocation failed.');
  return worldId;
}
export function destroyWorld(worldId) { b2DestroyWorld(worldId); }
export function advance(worldId, dt = 1 / 60, substeps = 4) {
  b2World_Step(worldId, dt, substeps);
}
/** Physical mass is specified explicitly (kg). Density is therefore kg/m². */
export function createRectangle(worldId, specification) {
  const { lengthM, beamM, massKg, xM, yM = 0, speedMps = 0,
    restitution = 0, friction = 0.3, bowStyle = 'flat' } = specification;
  for (const [name, value] of Object.entries({ lengthM, beamM, massKg, xM, yM, speedMps, restitution, friction })) {
    if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  }
  if (lengthM <= 0 || beamM <= 0 || massKg <= 0) throw new RangeError('Dimensions and mass must be positive.');
  if (!['flat', 'chamfered'].includes(bowStyle)) throw new RangeError('Unknown bow geometry.');
  const bodyDef = b2DefaultBodyDef();
  bodyDef.type = b2BodyType.b2_dynamicBody;
  bodyDef.position = new b2Vec2(xM, yM);
  bodyDef.linearVelocity = new b2Vec2(speedMps, 0);
  bodyDef.linearDamping = 0;
  bodyDef.angularDamping = 0;
  bodyDef.enableSleep = false;
  bodyDef.isAwake = true;
  bodyDef.fixedRotation = false;
  const bodyId = b2CreateBody(worldId, bodyDef);
  if (!bodyId?.index1) throw new Error('Box2D body allocation failed.');
  const shapeDef = b2DefaultShapeDef();
  // Keep Phase 0A's original rectangle path byte-for-byte equivalent.
  // The symmetric six-vertex bow is a contact-geometry probe, NOT a real hull.
  let polygon = b2MakeBox(lengthM / 2, beamM / 2);
  let densityAreaM2 = lengthM * beamM;
  if (bowStyle === 'chamfered') {
    const hL = lengthM / 2, hB = beamM / 2;
    const inset = Math.min(lengthM * 0.15, hB);
    const points = [
      new b2Vec2(-hL, -hB), new b2Vec2(hL - inset, -hB),
      new b2Vec2(hL, -hB * 0.3), new b2Vec2(hL, hB * 0.3),
      new b2Vec2(hL - inset, hB), new b2Vec2(-hL, hB)
    ];
    const hull = b2ComputeHull(points, points.length);
    polygon = b2MakePolygon(hull, 0);
    if (!polygon || polygon.count !== 6) throw new Error('Chamfered polygon construction failed.');
    densityAreaM2 = b2ComputePolygonMass(polygon, 1).mass;
  }
  shapeDef.density = massKg / densityAreaM2;
  shapeDef.friction = friction;
  shapeDef.restitution = restitution;
  b2CreatePolygonShape(bodyId, shapeDef, polygon);
  if (bowStyle === 'chamfered') {
    // Diagnostic isolation: match the rectangle's mass, COM and inertia.
    // This deliberately overrides the polygon's natural mass distribution.
    b2Body_SetMassData(bodyId, {
      mass: massKg,
      center: new b2Vec2(0, 0),
      rotationalInertia: massKg * (lengthM ** 2 + beamM ** 2) / 12
    });
  }
  const actualMassKg = b2Body_GetMass(bodyId);
  if (!Number.isFinite(actualMassKg) || actualMassKg <= 0) throw new Error('Invalid solver mass.');
  return { bodyId, actualMassKg, specification };
}
