const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../workspace-zoom-core.js');

test('exposes the exact supported view zoom levels', () => {
  assert.deepEqual(Core.LEVELS, [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]);
});

test('converts screen drag distance into logical workspace distance', () => {
  assert.equal(Core.screenDeltaToLogical(4, 4), 1);
  assert.equal(Core.screenDeltaToLogical(20, 2), 10);
});

test('keeps snapping tolerance visually constant across view zoom', () => {
  assert.equal(Core.logicalSnapDistance(1), 12);
  assert.equal(Core.logicalSnapDistance(2), 6);
  assert.equal(Core.logicalSnapDistance(4), 3);
});

test('clamps zoom to the supported range', () => {
  assert.equal(Core.clampZoom(0.1), 0.5);
  assert.equal(Core.clampZoom(8), 4);
  assert.equal(Core.clampZoom(1.5), 1.5);
});

test('preserves the same logical viewport center after zoom', () => {
  assert.equal(Core.preserveViewportCenter(200, 600, 1, 2), 700);
});

test('keeps the viewport at the 0,0 origin when zooming from the top-left', () => {
  assert.equal(Core.preserveViewportStart(0, 1, 3, 36), 0);
  assert.equal(Core.preserveViewportStart(0, 1, 4, 36), 0);
});

test('preserves a manually scrolled logical start position across zoom', () => {
  assert.equal(Core.preserveViewportStart(100, 1, 3, 36), 228);
  assert.equal(Core.preserveViewportStart(228, 3, 1, 36), 100);
});
