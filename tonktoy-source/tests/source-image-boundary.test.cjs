const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('source image drag clamps left and top edges to ruler origin', () => {
  const js = fs.readFileSync(path.join(root, 'workspace-precision.js'), 'utf8');
  assert.ok(js.includes('clampImageToRulerBounds'));
  assert.ok(js.includes('S.view.x < geo.originX'));
  assert.ok(js.includes('S.view.y < geo.originY'));
});

test('source image zoom also reapplies ruler boundary clamp', () => {
  const js = fs.readFileSync(path.join(root, 'source-zoom-lock.js'), 'utf8');
  assert.ok(js.includes('clampImageToRulerBounds'));
});
