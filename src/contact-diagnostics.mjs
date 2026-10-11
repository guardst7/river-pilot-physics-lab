import { b2Body_GetContactCapacity, b2Body_GetContactData, b2ContactData,
  b2World_GetContactEvents, b2Body_GetRotationalInertia } from './box2d.mjs';

/** Copy native API contact values immediately; never retain mutable solver objects. */
export function readContactStep(worldId, bodyId) {
  const capacity = b2Body_GetContactCapacity(bodyId);
  const buffer = Array.from({ length: capacity }, () => new b2ContactData());
  const count = capacity > 0 ? b2Body_GetContactData(bodyId, buffer, capacity) : 0;
  const contacts = buffer.slice(0, count).map(c => ({
    pointCount: c.manifold.pointCount,
    normalX: c.manifold.normalX,
    normalY: c.manifold.normalY,
    points: c.manifold.points.slice(0, c.manifold.pointCount).map(pt => ({
      xM: pt.pointX, yM: pt.pointY, separationM: pt.separation,
      normalImpulse: pt.normalImpulse, tangentImpulse: pt.tangentImpulse,
      persisted: pt.persisted
    }))
  }));
  const events = b2World_GetContactEvents(worldId);
  return {
    beginCount: events.beginCount,
    endCount: events.endCount,
    hitCount: events.hitCount,
    contacts
  };
}

export function readRotationalInertia(bodyId) {
  return b2Body_GetRotationalInertia(bodyId);
}
