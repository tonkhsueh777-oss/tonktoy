const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('loads source zoom lock integration', () => {
  assert.equal(html.includes('source-zoom-lock.js'), true);
});

test('source zoom can shrink below 100 percent and has a dedicated scale lock', () => {
  const js = fs.readFileSync(path.join(root, 'source-zoom-lock.js'), 'utf8');
  assert.ok(js.includes('MIN_ZOOM = 25'));
  assert.ok(js.includes('MAX_ZOOM = 400'));
  assert.ok(js.includes('sourceZoomLock'));
  assert.ok(js.includes('缩放已锁'));
});
