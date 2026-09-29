const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const precisionSource = fs.readFileSync(path.join(__dirname, '..', 'workspace-precision.js'), 'utf8');

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

test('precision workspace provides numeric X/Y guide positioning and guide lock', () => {
  assert.equal(precisionSource.includes('guideXInput'), true);
  assert.equal(precisionSource.includes('guideYInput'), true);
  assert.equal(precisionSource.includes('guideLocateBtn'), true);
  assert.equal(precisionSource.includes('guideLockToggle'), true);
  assert.equal(precisionSource.includes('guidesLocked'), true);
  assert.equal(precisionSource.includes("classList.add('numeric-guide')"), true);
});
