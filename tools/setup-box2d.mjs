/**
 * Reproduce the corrected vendor *source* without touching a developer's
 * existing phaser-box2d working copy or consuming an old dist build.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOX2D_PIN } from '../src/pin.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, '.vendor', 'phaser-box2d');
const sibling = resolve(root, '..', 'phaser-box2d');

function git(args, options = {}) {
  const result = execFileSync('git', args, { stdio: options.stdio ?? 'pipe', encoding: 'utf8' });
  return typeof result === 'string' ? result.trim() : '';
}
function getHead(path) {
  return git(['-C', path, 'rev-parse', 'HEAD']);
}
function isPinned(path) {
  try { return getHead(path).startsWith(BOX2D_PIN.revision); }
  catch { return false; }
}

if (existsSync(target)) {
  if (!isPinned(target)) {
    throw new Error(`${target} exists but is not at pinned commit ${BOX2D_PIN.revision}.\nDo not overwrite it automatically. Inspect it, then remove it manually if disposable.`);
  }
  console.log(`Box2D already available at pinned revision ${getHead(target)}.`);
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
const cloneSource = existsSync(resolve(sibling, '.git')) ? sibling : BOX2D_PIN.repository;
console.log(`Cloning from ${cloneSource} (committed objects only; no source-tree changes).`);
try {
  // Local git clone avoids any network use when the user's sibling clone is present.
  const args = ['clone', '--no-checkout'];
  if (cloneSource === sibling) args.push('--no-hardlinks');
  args.push(cloneSource, target);
  git(args, { stdio: 'inherit' });
  git(['-C', target, 'checkout', '--detach', BOX2D_PIN.revision], { stdio: 'inherit' });
  if (!isPinned(target)) throw new Error('Pinned SHA verification failed.');
  if (!existsSync(resolve(target, BOX2D_PIN.expectedSource))) {
    throw new Error('Expected vendor src/main.js is missing.');
  }
  console.log(`Ready: ${getHead(target)}. Tests import src/main.js, not the outdated dist bundle.`);
} catch (error) {
  // Keep failed clones visible for debugging, not silently delete user content.
  console.error('Vendor setup failed. Inspect .vendor/phaser-box2d before retrying.');
  throw error;
}
