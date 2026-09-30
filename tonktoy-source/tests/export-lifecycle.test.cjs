const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the actual application functions; only browser DOM/canvas encoding are doubles.
function editor() {
  const elements = new Map();
  const pending = [];
  const revoked = [];
  let serial = 0;
  function element() {
    return { style: {}, dataset: {}, disabled: false, value: '', textContent: '',
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      prepend() {}, appendChild() {}, insertAdjacentElement() {}, setAttribute() {},
      removeAttribute(key) { delete this[key]; }, querySelector() { return null; },
      querySelectorAll() { return []; }, getBoundingClientRect() { return {width:800,height:500}; } };
  }
  function get(selector) {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  }
  get('#outputWidth').value = '1200'; get('#outputHeight').value = '750';
  get('#qualityRange').value = '80';
  get('input[name="format"]:checked').value = 'webp';
  const context = vm.createContext({ console, setTimeout, clearTimeout, Blob,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    URL: { createObjectURL: () => `blob:${++serial}`, revokeObjectURL: (url) => revoked.push(url) },
    window: { dispatchEvent() {} }, CustomEvent: class {},
    document: { querySelector: get, querySelectorAll: () => [], head: element(), body: element(),
      getElementById: (id) => get(`#${id}`),
      createElement(tag) {
        if (tag !== 'canvas') return element();
        return { getContext: () => ({ fillRect() {}, drawImage() {} }),
          toBlob(callback, type) { pending.push(() => callback(new Blob(['image'], { type }))); } };
      } },
  });
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  vm.runInContext(source.slice(0, source.indexOf('const openPicker =')), context);
  vm.runInContext(`Object.assign(S,{file:{name:'source.png',size:1000},nw:2048,nh:2048,crop:{x:0,y:0,width:100,height:100},view:{x:0,y:0,width:200,height:200,scale:1}})`, context);
  return { get, pending, revoked, run: (code) => vm.runInContext(code, context) };
}

test('moving the crop invalidates an encoding already in flight', async () => {
  const e = editor(); const work = e.run('render()');
  e.run('markDirty()'); e.pending.shift()(); await work;
  assert.equal(e.get('#downloadBtn').disabled, true);
  assert.equal(e.get('#previewImage').src, undefined);
});

test('clearing while encoding cannot restore the old preview', async () => {
  const e = editor(); const work = e.run('render()');
  e.run('clearImage()'); e.pending.shift()(); await work;
  assert.equal(e.get('#downloadBtn').disabled, true);
  assert.equal(e.get('#previewImage').src, undefined);
});

test('invalid dimensions cannot be overwritten by an older successful render', async () => {
  const e = editor(); const work = e.run('render()');
  e.get('#outputWidth').value = '';
  e.run("syncDimensions('w')"); e.pending.shift()(); await work;
  assert.equal(e.get('#downloadBtn').disabled, true);
});

test('changing output format disables stale download immediately, before debounce', async () => {
  const e = editor(); const work = e.run('render()'); e.pending.shift()(); await work;
  assert.equal(e.get('#downloadBtn').disabled, false);
  e.get('input[name="format"]:checked').value = 'png';
  e.run('requestRender()');
  assert.equal(e.get('#downloadBtn').disabled, true);
  e.run('clearTimeout(S.timer)');
});

test('only the latest render publishes a preview', async () => {
  const e = editor(); const first = e.run('render()'); const second = e.run('render()');
  e.pending[1](); await second; const result = e.get('#previewImage').src;
  e.pending[0](); await first;
  assert.equal(e.get('#previewImage').src, result);
});
