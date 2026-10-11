import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOX2D_PIN } from '../src/pin.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(root, '.vendor', 'phaser-box2d');
function fail(message) { console.error(message); process.exit(1); }
if (!existsSync(resolve(path, BOX2D_PIN.expectedSource))) {
  fail('Corrected Box2D source missing. Run: npm.cmd run setup:box2d');
}
let revision;
try { revision = execFileSync('git', ['-C', path, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
catch { fail('Pinned Box2D folder is not a valid Git checkout.'); }
if (!revision.startsWith(BOX2D_PIN.revision)) {
  fail(`Box2D revision mismatch. Expected ${BOX2D_PIN.revision}, found ${revision}. Refusing to run tests against an unreviewed engine.`);
}
let dirty;
try { dirty = execFileSync('git', ['-C', path, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim(); }
catch { fail('Cannot inspect corrected Box2D source working tree.'); }
if (dirty) fail('Pinned Box2D source has tracked local changes. Refusing to run reproducibility-sensitive tests.');
console.log(`Verified Box2D source revision ${revision}.`);
