/**
 * Sole runtime Box2D entry point. Never import a build from dist/ or an
 * unpinned sibling working tree; these may omit the registry-lifecycle fix.
 * `npm test` and `npm run scenarios` verify the pinned checkout first.
 */
export * from '../.vendor/phaser-box2d/src/main.js';
