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
  b2Body_GetMass
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
    restitution = 0, friction = 0.3 } = specification;
  for (const [name, value] of Object.entries({ lengthM, beamM, massKg, xM, yM, speedMps, restitution, friction })) {
    if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  }
  if (lengthM <= 0 || beamM <= 0 || massKg <= 0) throw new RangeError('Dimensions and mass must be positive.');
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
  shapeDef.density = massKg / (lengthM * beamM);
  shapeDef.friction = friction;
  shapeDef.restitution = restitution;
  b2CreatePolygonShape(bodyId, shapeDef, b2MakeBox(lengthM / 2, beamM / 2));
  const actualMassKg = b2Body_GetMass(bodyId);
  if (!Number.isFinite(actualMassKg) || actualMassKg <= 0) throw new Error('Invalid solver mass.');
  return { bodyId, actualMassKg, specification };
}
