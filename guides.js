// Draggable ruler guides + crop snapping for precision alignment.
(() => {
  const stage = E.stage;
  const box = E.box;
  const toolbar = document.querySelector('.toolbar-actions');
  const rulerX = stage.querySelector('.ruler-x');
  const rulerY = stage.querySelector('.ruler-y');
  if (!stage || !box || !toolbar || !rulerX || !rulerY) return;

  const style = document.createElement('style');
  style.textContent = `
    #guideControls{display:inline-flex;gap:5px;align-items:center;margin-right:4px}
    #guideControls button{height:32px;padding:0 9px;border:1px solid #29445f;border-radius:7px;background:#0c1725;color:#d6e3ef;cursor:pointer;font-size:12px;white-space:nowrap}
    #guideControls button.active{background:#0d5fc8;border-color:#55adff;color:#fff}
    #guideControls button:hover{border-color:#3a95ff;color:#fff}
    .ruler-x,.ruler-y{pointer-events:auto!important}
    .ruler-x{cursor:ns-resize}.ruler-y{cursor:ew-resize}
    .precision-guide{position:absolute;z-index:35;pointer-events:auto;user-select:none;touch-action:none}
    .precision-guide.h{left:0;right:0;height:1px;background:#26b7ff;cursor:ns-resize;box-shadow:0 0 0 1px rgba(38,183,255,.15)}
    .precision-guide.v{top:0;bottom:0;width:1px;background:#26b7ff;cursor:ew-resize;box-shadow:0 0 0 1px rgba(38,183,255,.15)}
    .precision-guide::after{content:attr(data-label);position:absolute;background:rgba(3,18,31,.94);border:1px solid #2a91cf;color:#bfeaff;font-size:9px;line-height:1;padding:3px 5px;border-radius:4px;white-space:nowrap}
    .precision-guide.h::after{left:34px;top:4px}.precision-guide.v::after{left:4px;top:34px}
    .precision-guide.hidden-guide{display:none}
  `;
  document.head.appendChild(style);

  const controls = document.createElement('div');
  controls.id = 'guideControls';
  controls.innerHTML = `
    <button id="guideToggle" type="button" class="active">参考线 开</button>
    <button id="snapToggle" type="button" class="active">吸附 开</button>
    <button id="clearGuides" type="button">清除线</button>
  `;
  toolbar.prepend(controls);

  const guideToggle = document.getElementById('guideToggle');
  const snapToggle = document.getElementById('snapToggle');
  const clearGuides = document.getElementById('clearGuides');

  let guidesVisible = true;
  let snapEnabled = true;
  let guideDrag = null;
  let cropDrag = null;
  const SNAP = 8;

  function stagePoint(event) {
    const r = stage.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }

  function imageBounds() {
    const sr = stage.getBoundingClientRect();
    const ir = E.img.getBoundingClientRect();
    return {
      left: ir.left - sr.left,
      top: ir.top - sr.top,
      right: ir.right - sr.left,
      bottom: ir.bottom - sr.top,
    };
  }

  function sourceCoordsFromStage(x, y) {
    const b = imageBounds();
    return {
      x: Math.round((x - b.left) / Math.max(1, b.right - b.left) * (S.nw || 0)),
      y: Math.round((y - b.top) / Math.max(1, b.bottom - b.top) * (S.nh || 0)),
    };
  }

  function createGuide(axis, pos) {
    const line = document.createElement('div');
    line.className = `precision-guide ${axis}`;
    line.dataset.axis = axis;
    stage.appendChild(line);
    setGuidePosition(line, pos);

    line.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      guideDrag = { line, axis, pointerId: event.pointerId };
      line.setPointerCapture?.(event.pointerId);
    });

    line.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
      line.remove();
    });
    return line;
  }

  function setGuidePosition(line, pos) {
    const b = imageBounds();
    const axis = line.dataset.axis;
    if (axis === 'v') {
      const x = Math.max(b.left, Math.min(b.right, pos));
      line.style.left = `${x}px`;
      const c = sourceCoordsFromStage(x, b.top);
      line.dataset.label = `X ${Math.max(0, Math.min(S.nw || 0, c.x))}`;
    } else {
      const y = Math.max(b.top, Math.min(b.bottom, pos));
      line.style.top = `${y}px`;
      const c = sourceCoordsFromStage(b.left, y);
      line.dataset.label = `Y ${Math.max(0, Math.min(S.nh || 0, c.y))}`;
    }
  }

  function allGuides(axis) {
    return [...stage.querySelectorAll(`.precision-guide.${axis}:not(.hidden-guide)`)]
      .map((el) => ({ el, pos: axis === 'v' ? parseFloat(el.style.left) : parseFloat(el.style.top) }))
      .filter((g) => Number.isFinite(g.pos));
  }

  function nearest(value, list) {
    let best = null;
    for (const item of list) {
      const d = item.pos - value;
      if (Math.abs(d) <= SNAP && (!best || Math.abs(d) < Math.abs(best.delta))) best = { ...item, delta: d };
    }
    return best;
  }

  function clampCrop(crop) {
    const b = imageBounds();
    crop.width = Math.min(crop.width, Math.max(1, b.right - b.left));
    crop.height = Math.min(crop.height, Math.max(1, b.bottom - b.top));
    crop.x = Math.min(Math.max(crop.x, b.left), Math.max(b.left, b.right - crop.width));
    crop.y = Math.min(Math.max(crop.y, b.top), Math.max(b.top, b.bottom - crop.height));
    return crop;
  }

  function snapCrop(mode) {
    if (!snapEnabled || !S.crop) return;
    const v = allGuides('v');
    const h = allGuides('h');
    if (!v.length && !h.length) return;

    const c = { ...S.crop };
    const left = c.x, right = c.x + c.width, cx = c.x + c.width / 2;
    const top = c.y, bottom = c.y + c.height, cy = c.y + c.height / 2;

    if (mode === 'move') {
      const vx = [nearest(left, v), nearest(right, v), nearest(cx, v)].filter(Boolean).sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta))[0];
      const hy = [nearest(top, h), nearest(bottom, h), nearest(cy, h)].filter(Boolean).sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta))[0];
      if (vx) c.x += vx.delta;
      if (hy) c.y += hy.delta;
    } else {
      if (mode.includes('w')) {
        const hit = nearest(left, v); if (hit) { const oldRight = c.x + c.width; c.x = hit.pos; c.width = Math.max(1, oldRight - c.x); }
      }
      if (mode.includes('e')) {
        const hit = nearest(right, v); if (hit) c.width = Math.max(1, hit.pos - c.x);
      }
      if (mode.includes('n')) {
        const hit = nearest(top, h); if (hit) { const oldBottom = c.y + c.height; c.y = hit.pos; c.height = Math.max(1, oldBottom - c.y); }
      }
      if (mode.includes('s')) {
        const hit = nearest(bottom, h); if (hit) c.height = Math.max(1, hit.pos - c.y);
      }
    }

    S.crop = clampCrop(c);
    drawCropFrame();
    updateReadout();
  }

  rulerX.addEventListener('pointerdown', (event) => {
    if (!S.file || !guidesVisible || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const p = stagePoint(event);
    const line = createGuide('h', p.y);
    guideDrag = { line, axis:'h', pointerId:event.pointerId };
  });

  rulerY.addEventListener('pointerdown', (event) => {
    if (!S.file || !guidesVisible || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const p = stagePoint(event);
    const line = createGuide('v', p.x);
    guideDrag = { line, axis:'v', pointerId:event.pointerId };
  });

  box.addEventListener('pointerdown', (event) => {
    if (!S.file) return;
    const handle = event.target.closest('[data-resize]');
    cropDrag = { pointerId:event.pointerId, mode:handle?.dataset.resize || 'move' };
  }, true);

  window.addEventListener('pointermove', (event) => {
    if (guideDrag && event.pointerId === guideDrag.pointerId) {
      const p = stagePoint(event);
      setGuidePosition(guideDrag.line, guideDrag.axis === 'v' ? p.x : p.y);
      return;
    }
    if (cropDrag && event.pointerId === cropDrag.pointerId) {
      requestAnimationFrame(() => snapCrop(cropDrag?.mode || 'move'));
    }
  });

  window.addEventListener('pointerup', (event) => {
    if (guideDrag && event.pointerId === guideDrag.pointerId) guideDrag = null;
    if (cropDrag && event.pointerId === cropDrag.pointerId) {
      snapCrop(cropDrag.mode);
      cropDrag = null;
      markDirty('已对齐参考线，请按「确认裁切」。');
    }
  });

  guideToggle.addEventListener('click', () => {
    guidesVisible = !guidesVisible;
    guideToggle.classList.toggle('active', guidesVisible);
    guideToggle.textContent = `参考线 ${guidesVisible ? '开' : '关'}`;
    stage.querySelectorAll('.precision-guide').forEach((el) => el.classList.toggle('hidden-guide', !guidesVisible));
  });

  snapToggle.addEventListener('click', () => {
    snapEnabled = !snapEnabled;
    snapToggle.classList.toggle('active', snapEnabled);
    snapToggle.textContent = `吸附 ${snapEnabled ? '开' : '关'}`;
  });

  clearGuides.addEventListener('click', () => {
    stage.querySelectorAll('.precision-guide').forEach((el) => el.remove());
  });
})();
