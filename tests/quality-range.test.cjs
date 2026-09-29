const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('image quality slider supports 10% through 100% while default remains 80%', () => {
  const match = html.match(/<input[^>]+id="qualityRange"[^>]*>/);
  assert.ok(match, 'qualityRange input should exist');
  assert.match(match[0], /min="10"/);
  assert.match(match[0], /max="100"/);
  assert.match(match[0], /value="80"/);
});
