const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('loads fixed ruler overlay after workspace precision', () => {
  assert.equal(html.includes('fixed-rulers.js'), true);
  assert.ok(html.indexOf('fixed-rulers.js') > html.indexOf('workspace-precision.js'));
});

test('fixed ruler implementation is viewport anchored, not visually scaled with stage', () => {
  const js = fs.readFileSync(path.join(root, 'fixed-rulers.js'), 'utf8');
  assert.ok(js.includes('viewport.scrollLeft'));
  assert.ok(js.includes('viewport.scrollTop'));
  assert.ok(js.includes("oldRulerX.style.opacity = '0'"));
  assert.ok(js.includes("oldRulerY.style.opacity = '0'"));
});
