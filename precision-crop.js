// Unified crop interaction controller: stable dragging, magnetic snapping, and crop-size lock.
(() => {
  const stage = E.stage;
  const box = E.box;
  const sizeSection = E.w?.closest('.control-section');
  if (!stage || !box || !sizeSection) return;

  const SNAP_DISTANCE = 18;
  const MIN_BOX = 12;
  let sizeLocked = false;
  let drag = null;
  let lastSnapX = null;
  let lastSnapY = null;

  const style = document.createElement('style');
  style.textContent = `
    .crop-size-lock-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(74,111,145,.18)}
    .crop-size-lock-row .lock-note{font-size:10px;color:#6f8499}
    .crop-size-lock-row .check-label{margin:0;white-space:nowrap}
    #editorStage.crop-size-locked #cropBox{cursor:move!important}
    #editorStage.crop-size-locked #cropBox .crop-handle,
    #editorStage.crop-size-locked #cropBox .edge-handle{opacity:.22!important;pointer-events:none!important}
    #editorStage.crop-size-locked #cropBox::after{content:'大小已锁';position:absolute;right:6px;top:6px;padding:3px 6px;border-radius:5px;background:rgba(122,76,0,.9);border:1px solid #ffb74d;color:#fff;font-size:9px;pointer-events:none}
    .precision-guide.snap-hold{background:#fff36a!important;box-shadow:0 0 8px rgba(255,243,106,.95)!important}
  `;
  document.head.appendChild(style);

  const row = document.createElement('div');
  row.className = 'crop-size-lock-row';
  row.innerHTML = `
    <span class="lock-note">锁定后白框只能移动，宽高保持不变</span>
    <label class="check-label"><input id="lockCropSize" type="checkbox" /> <span>锁定裁切框大小</span></label>
  `;
  const microcopy = sizeSection.querySelector('.microcopy');
  if (microcopy) microcopy.insertAdjacentElement('afterend', row);
  else sizeSection.appendChild(row);

  const lockInput = row.querySelector('#lockCropSize');

  function stageRect() {
    return stage.getBoundingClientRect();
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

  function clampCrop(crop) {
    const b = imageBounds();
    const c = { ...crop };
    c.width = Math.max(MIN_BOX, Math.min(c.width, Math.max(MIN_BOX, b.width)));
    c.height = Math.max(MIN_BOX, Math.min(c.height, Math.max(MIN_BOX, b.height)));
    c.x = Math.min(Math.max(c.x, b.left), Math.max(b.left, b.right - c.width));
    c.y = Math.min(Math.max(c.y, b.top), Math.max(b.top, b.bottom - c.height));
    return c;
  }

  function cropSourceMetrics(crop = S.crop) {
    const b = imageBounds();
    if (!crop || !b.width || !b.height || !S.nw || !S.nh) return { x:0, y:0, width:0, height:0 };
    const x1 = ((crop.x - b.left) / b.width) * S.nw;
    const y1 = ((crop.y - b.top) / b.height) * S.nh;
    const x2 = ((crop.x + crop.width - b.left) / b.width) * S.nw;
    const y2 = ((crop.y + crop.height - b.top) / b.height) * S.nh;
    return {
      x: Math.max(0, Math.min(S.nw, Math.round(x1))),
      y: Math.max(0, Math.min(S.nh, Math.round(y1))),
      width: Math.max(1, Math.min(S.nw, Math.round(x2 - x1))),
      height: Math.max(1, Math.min(S.nh, Math.round(y2 - y1))),
    };
  }

  function updateStableBadge() {
    const badge = stage.querySelector('.ruler-dim-badge');
    if (!badge || !S.crop) return;
    const m = cropSourceMetrics();
    const sr = stageRect();
    const left = Math.max(4, Math.min(sr.width - 190, S.crop.x + 8));
    const top = Math.max(4, Math.min(sr.height - 30, S.crop.y + S.crop.height + 7));
    badge.style.display = 'block';
    badge.style.left = `${left}px`;
    badge.style.top = `${top}px`;
    badge.textContent = `${m.width} × ${m.height}px · X${m.x} Y${m.y}`;
  }

  function renderCropLive(crop) {
    S.crop = clampCrop(crop);
    Object.assign(box.style, {
      left: `${S.crop.x}px`,
      top: `${S.crop.y}px`,
      width: `${S.crop.width}px`,
      height: `${S.crop.height}px`,
    });
    box.hidden = false;
    const m = cropSourceMetrics();
    E.readout.textContent = `${m.width} × ${m.height}px`;
    updateStableBadge();
  }

  function syncFieldsAfterDrag() {
    const m = cropSourceMetrics();
    if (!sizeLocked) {
      E.w.value = String(m.width);
      E.h.value = String(m.height);
      S.outRatio = m.width / Math.max(1, m.height);
    }
    summary();
    E.readout.textContent = `${m.width} × ${m.height}px`;
    updateStableBadge();
  }

  function guideList(axis) {
    const sr = stageRect();
    return [...stage.querySelectorAll(`.precision-guide.${axis}:not(.hidden-guide)`)].map((el) => {
      const r = el.getBoundingClientRect();
      return { el, pos: axis === 'v' ? r.left - sr.left : r.top - sr.top };
    });
  }

  function nearest(value, guides) {
    let best = null;
    for (const g of guides) {
      const delta = g.pos - value;
      if (Math.abs(delta) <= SNAP_DISTANCE && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { ...g, delta };
    }
    return best;
  }

  function clearSnapHighlight() {
    stage.querySelectorAll('.precision-guide.snap-hold').forEach((el) => el.classList.remove('snap-hold'));
    lastSnapX = null;
    lastSnapY = null;
  }

  function highlight(hitX, hitY) {
    if (lastSnapX && lastSnapX !== hitX?.el) lastSnapX.classList.remove('snap-hold');
    if (lastSnapY && lastSnapY !== hitY?.el) lastSnapY.classList.remove('snap-hold');
    if (hitX?.el) hitX.el.classList.add('snap-hold');
    if (hitY?.el) hitY.el.classList.add('snap-hold');
    lastSnapX = hitX?.el || null;
    lastSnapY = hitY?.el || null;
  }

  function snapEnabled() {
    const snap = document.getElementById('snapToggle');
    const guides = document.getElementById('guideToggle');
    return (!snap || snap.classList.contains('active')) && (!guides || guides.classList.contains('active'));
  }

  function applySnap(crop, mode) {
    if (!snapEnabled()) {
      clearSnapHighlight();
      return crop;
    }

    const v = guideList('v');
    const h = guideList('h');
    if (!v.length && !h.length) return crop;

    const c = { ...crop };
    const left = c.x;
    const right = c.x + c.width;
    const centerX = c.x + c.width / 2;
    const top = c.y;
    const bottom = c.y + c.height;
    const centerY = c.y + c.height / 2;
    let hitX = null;
    let hitY = null;

    if (mode === 'move') {
      hitX = [nearest(left, v), nearest(right, v), nearest(centerX, v)]
        .filter(Boolean).sort((a,b) => Math.abs(a.delta) - Math.abs(b.delta))[0] || null;
      hitY = [nearest(top, h), nearest(bottom, h), nearest(centerY, h)]
        .filter(Boolean).sort((a,b) => Math.abs(a.delta) - Math.abs(b.delta))[0] || null;
      if (hitX) c.x += hitX.delta;
      if (hitY) c.y += hitY.delta;
    } else {
      if (mode.includes('w')) {
        hitX = nearest(left, v);
        if (hitX) {
          const fixedRight = c.x + c.width;
          c.x = hitX.pos;
          c.width = Math.max(MIN_BOX, fixedRight - c.x);
        }
      }
      if (mode.includes('e')) {
        hitX = nearest(right, v);
        if (hitX) c.width = Math.max(MIN_BOX, hitX.pos - c.x);
      }
      if (mode.includes('n')) {
        hitY = nearest(top, h);
        if (hitY) {
          const fixedBottom = c.y + c.height;
          c.y = hitY.pos;
          c.height = Math.max(MIN_BOX, fixedBottom - c.y);
        }
      }
      if (mode.includes('s')) {
        hitY = nearest(bottom, h);
        if (hitY) c.height = Math.max(MIN_BOX, hitY.pos - c.y);
      }
    }

    highlight(hitX, hitY);
    return clampCrop(c);
  }

  function computeDraggedCrop(event) {
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const c = drag.crop;
    const b = drag.bounds;
    const mode = drag.mode;
    let x = c.x;
    let y = c.y;
    let width = c.width;
    let height = c.height;

    if (mode === 'move') {
      x = Math.min(Math.max(c.x + dx, b.left), Math.max(b.left, b.right - c.width));
      y = Math.min(Math.max(c.y + dy, b.top), Math.max(b.top, b.bottom - c.height));
    } else {
      if (mode.includes('e')) width = Math.min(Math.max(MIN_BOX, c.width + dx), Math.max(MIN_BOX, b.right - c.x));
      if (mode.includes('s')) height = Math.min(Math.max(MIN_BOX, c.height + dy), Math.max(MIN_BOX, b.bottom - c.y));
      if (mode.includes('w')) {
        const nx = Math.min(Math.max(c.x + dx, b.left), c.x + c.width - MIN_BOX);
        width = c.width + (c.x - nx);
        x = nx;
      }
      if (mode.includes('n')) {
        const ny = Math.min(Math.max(c.y + dy, b.top), c.y + c.height - MIN_BOX);
        height = c.height + (c.y - ny);
        y = ny;
      }
    }

    return applySnap({ x, y, width, height }, mode);
  }

  function startCropDrag(event) {
    if (!S.file || !S.crop || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const handle = event.target.closest('[data-resize]');
    const mode = handle?.dataset.resize || 'move';

    event.preventDefault();
    event.stopImmediatePropagation();

    if (sizeLocked && mode !== 'move') {
      setStatus('裁切框大小已锁定；可以移动，不能改变宽高。');
      return;
    }

    drag = {
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      crop: { ...S.crop },
      bounds: imageBounds(),
    };
    box.setPointerCapture?.(event.pointerId);
    document.body.style.userSelect = 'none';
  }

  function moveCropDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    renderCropLive(computeDraggedCrop(event));
  }

  function endCropDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    const mode = drag.mode;
    renderCropLive(computeDraggedCrop(event));
    box.releasePointerCapture?.(event.pointerId);
    drag = null;
    document.body.style.userSelect = '';
    clearSnapHighlight();
    syncFieldsAfterDrag();
    markDirty(mode === 'move' ? '已移动裁切框，请按「确认裁切」。' : '已调整裁切框大小，请按「确认裁切」。');
  }

  function setSizeLocked(next) {
    sizeLocked = !!next;
    lockInput.checked = sizeLocked;
    stage.classList.toggle('crop-size-locked', sizeLocked);
    E.w.disabled = sizeLocked;
    E.h.disabled = sizeLocked;
    setStatus(sizeLocked ? '裁切框大小已锁定：现在只能移动白框。' : '裁切框大小已解锁：可以继续调整宽高。');
  }

  lockInput.addEventListener('change', () => setSizeLocked(lockInput.checked));

  document.addEventListener('click', (event) => {
    if (!sizeLocked) return;
    const blocked = event.target.closest('#ratioGrid button,#presetGrid button,#resetCropBtn');
    if (!blocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('裁切框大小已锁定；请先解除「锁定裁切框大小」。');
  }, true);

  box.addEventListener('pointerdown', startCropDrag, true);
  window.addEventListener('pointermove', moveCropDrag, { capture:true, passive:false });
  window.addEventListener('pointerup', endCropDrag, { capture:true, passive:false });
  window.addEventListener('pointercancel', endCropDrag, { capture:true, passive:false });

  window.__precisionCropController = {
    get sizeLocked() { return sizeLocked; },
    setSizeLocked,
    cropSourceMetrics,
  };
})();
