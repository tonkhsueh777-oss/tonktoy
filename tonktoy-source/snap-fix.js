// Final magnetic snapping pass. Runs after the crop drag handler so snapped positions
// cannot be overwritten by the base drag calculation on the same pointer event.
(() => {
  const stage = E.stage;
  const box = E.box;
  if (!stage || !box) return;

  const SNAP_DISTANCE = 20;
  let drag = null;
  let lastHitX = null;
  let lastHitY = null;

  function stageRect() { return stage.getBoundingClientRect(); }

  function guideList(axis) {
    const sr = stageRect();
    return [...stage.querySelectorAll(`.precision-guide.${axis}:not(.hidden-guide)`)].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        pos: axis === 'v' ? (r.left - sr.left) : (r.top - sr.top),
      };
    });
  }

  function nearest(value, guides) {
    let best = null;
    for (const g of guides) {
      const delta = g.pos - value;
      if (Math.abs(delta) <= SNAP_DISTANCE && (!best || Math.abs(delta) < Math.abs(best.delta))) {
        best = { ...g, delta };
      }
    }
    return best;
  }

  function imageBounds() {
    const sr = stageRect();
    const ir = E.img.getBoundingClientRect();
    return {
      left: ir.left - sr.left,
      top: ir.top - sr.top,
      right: ir.right - sr.left,
      bottom: ir.bottom - sr.top,
      width: ir.width,
      height: ir.height,
    };
  }

  function clampCrop(c) {
    const b = imageBounds();
    c.width = Math.min(c.width, Math.max(1, b.width));
    c.height = Math.min(c.height, Math.max(1, b.height));
    c.x = Math.min(Math.max(c.x, b.left), Math.max(b.left, b.right - c.width));
    c.y = Math.min(Math.max(c.y, b.top), Math.max(b.top, b.bottom - c.height));
    return c;
  }

  function flash(hit) {
    if (!hit?.el) return;
    hit.el.classList.add('snapped');
    clearTimeout(hit.el.__magnetTimer);
    hit.el.__magnetTimer = setTimeout(() => hit.el.classList.remove('snapped'), 220);
  }

  function snapNow(mode) {
    const snapButton = document.getElementById('snapToggle');
    const guidesButton = document.getElementById('guideToggle');
    if (!S.file || !S.crop) return false;
    if (snapButton && !snapButton.classList.contains('active')) return false;
    if (guidesButton && !guidesButton.classList.contains('active')) return false;

    const vertical = guideList('v');
    const horizontal = guideList('h');
    if (!vertical.length && !horizontal.length) return false;

    const c = { ...S.crop };
    const left = c.x;
    const right = c.x + c.width;
    const centerX = c.x + c.width / 2;
    const top = c.y;
    const bottom = c.y + c.height;
    const centerY = c.y + c.height / 2;

    let hitX = null;
    let hitY = null;

    if (mode === 'move') {
      hitX = [nearest(left, vertical), nearest(right, vertical), nearest(centerX, vertical)]
        .filter(Boolean).sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0] || null;
      hitY = [nearest(top, horizontal), nearest(bottom, horizontal), nearest(centerY, horizontal)]
        .filter(Boolean).sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0] || null;
      if (hitX) c.x += hitX.delta;
      if (hitY) c.y += hitY.delta;
    } else {
      if (mode.includes('w')) {
        hitX = nearest(left, vertical);
        if (hitX) {
          const fixedRight = c.x + c.width;
          c.x = hitX.pos;
          c.width = Math.max(1, fixedRight - c.x);
        }
      }
      if (mode.includes('e')) {
        hitX = nearest(right, vertical);
        if (hitX) c.width = Math.max(1, hitX.pos - c.x);
      }
      if (mode.includes('n')) {
        hitY = nearest(top, horizontal);
        if (hitY) {
          const fixedBottom = c.y + c.height;
          c.y = hitY.pos;
          c.height = Math.max(1, fixedBottom - c.y);
        }
      }
      if (mode.includes('s')) {
        hitY = nearest(bottom, horizontal);
        if (hitY) c.height = Math.max(1, hitY.pos - c.y);
      }
    }

    if (!hitX && !hitY) {
      lastHitX = null;
      lastHitY = null;
      return false;
    }

    S.crop = clampCrop(c);
    drawCropFrame();
    updateReadout();

    if (hitX?.el !== lastHitX) flash(hitX);
    if (hitY?.el !== lastHitY) flash(hitY);
    lastHitX = hitX?.el || null;
    lastHitY = hitY?.el || null;
    return true;
  }

  box.addEventListener('pointerdown', (event) => {
    if (!S.file) return;
    const handle = event.target.closest('[data-resize]');
    drag = {
      pointerId: event.pointerId,
      mode: handle?.dataset.resize || 'move',
    };
    lastHitX = null;
    lastHitY = null;
  }, true);

  // drag-fix.js is registered before this file. On window capture it updates S.crop first;
  // this listener then performs the magnetic correction synchronously in the same event.
  window.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    snapNow(drag.mode);
  }, { capture: true, passive: true });

  window.addEventListener('pointerup', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const mode = drag.mode;
    const snapped = snapNow(mode);
    drag = null;
    lastHitX = null;
    lastHitY = null;
    if (snapped) {
      markDirty('已吸附到参考线，请按「确认裁切」。');
    }
  }, { capture: true, passive: true });

  window.addEventListener('pointercancel', () => {
    drag = null;
    lastHitX = null;
    lastHitY = null;
  }, { capture: true, passive: true });
})();
