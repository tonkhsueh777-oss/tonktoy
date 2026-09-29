const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('loads whole-workspace zoom integration and removes local magnifier', () => {
  assert.equal(html.includes('magnifier.js'), false);
  assert.equal(html.includes('workspace-zoom-core.js'), true);
  assert.equal(html.includes('workspace-zoom.js'), true);
  const app = html.indexOf('app.js');
  const core = html.indexOf('workspace-zoom-core.js');
  const zoom = html.indexOf('workspace-zoom.js');
  const precision = html.indexOf('precision-crop.js');
  const guides = html.indexOf('guides.js');
  assert.ok(app >= 0 && core > app && zoom > core && precision > zoom && guides > zoom);
});

test('loads unified precision interaction after legacy geometry scripts', () => {
  assert.equal(html.includes('workspace-precision.js'), true);
  assert.ok(html.indexOf('workspace-precision.js') > html.indexOf('origin-align.js'));
});

test('loads numeric X/Y guide positioning before final precision controller', () => {
  assert.equal(html.includes('guide-coordinate.js'), true);
  assert.ok(html.indexOf('guide-coordinate.js') > html.indexOf('origin-align.js'));
  assert.ok(html.indexOf('guide-coordinate.js') < html.indexOf('workspace-precision.js'));
  const guideSource = fs.readFileSync(path.join(__dirname, '..', 'guide-coordinate.js'), 'utf8');
  assert.equal(guideSource.includes('guideXInput'), true);
  assert.equal(guideSource.includes('guideYInput'), true);
  assert.equal(guideSource.includes('guideLocateBtn'), true);
  assert.equal(guideSource.includes('guideLockToggle'), true);
  assert.equal(guideSource.includes('guidesLocked'), true);
  assert.equal(guideSource.includes("classList.add('numeric-guide')"), true);
});
