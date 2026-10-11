import {
  b2Body_GetPosition,
  b2Body_GetRotation,
  b2Rot_GetAngle,
  b2Body_GetLinearVelocity,
  b2Body_GetAngularVelocity,
  b2Body_GetMass
} from './box2d.mjs';

const DEG_PER_RAD = 180 / Math.PI;
export function snapshot(bodyId) {
  const position = b2Body_GetPosition(bodyId);
  const velocity = b2Body_GetLinearVelocity(bodyId);
  return {
    xM: position.x,
    yM: position.y,
    vxMps: velocity.x,
    vyMps: velocity.y,
    angleDeg: b2Rot_GetAngle(b2Body_GetRotation(bodyId)) * DEG_PER_RAD,
    angularVelocityDegps: b2Body_GetAngularVelocity(bodyId) * DEG_PER_RAD,
    massKg: b2Body_GetMass(bodyId)
  };
}
export function allFinite(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allFinite);
  if (value && typeof value === 'object') return Object.values(value).every(allFinite);
  return true;
}
export function compareMirrors(left, right) {
  // Angles/omega/Y velocity invert under Y reflection; X movement is invariant.
  return {
    xPositionDiffM: Math.abs(left.xM - right.xM),
    yPositionMirrorDiffM: Math.abs(left.yM + right.yM),
    xVelocityDiffMps: Math.abs(left.vxMps - right.vxMps),
    yVelocityMirrorDiffMps: Math.abs(left.vyMps + right.vyMps),
    angleMirrorDiffDeg: Math.abs(left.angleDeg + right.angleDeg),
    angularVelocityMirrorDiffDegps: Math.abs(left.angularVelocityDegps + right.angularVelocityDegps)
  };
}
export function compareOrder(a, b) {
  return {
    xPositionDiffM: Math.abs(a.xM - b.xM),
    yPositionDiffM: Math.abs(a.yM - b.yM),
    xVelocityDiffMps: Math.abs(a.vxMps - b.vxMps),
    yVelocityDiffMps: Math.abs(a.vyMps - b.vyMps),
    angleDiffDeg: Math.abs(a.angleDeg - b.angleDeg),
    angularVelocityDiffDegps: Math.abs(a.angularVelocityDegps - b.angularVelocityDegps)
  };
}
