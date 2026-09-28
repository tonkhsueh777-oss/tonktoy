// Precision editor: pixel-accurate rulers, draggable guides, snapping and source-image lock.
(() => {
  const stage = E.stage;
  const box = E.box;
  const toolbar = document.querySelector('.toolbar-actions');
  const rulerX = stage?.querySelector('.ruler-x');
  const rulerY = stage?.querySelector('.ruler-y');
  const rulerCorner = stage?.querySelector('.ruler-corner');
  if (!stage || !box || !toolbar || !rulerX || !rulerY) return;

  document.getElementById('guideControls')?.remove();
  stage.querySelectorAll('.precision-guide').forEach((el) => el.remove());

  const style = document.createElement('style');
  style.textContent = `
    #guideControls{display:inline-flex;gap:5px;align-items:center;margin-right:4px}
    #guideControls button{height:32px;padding:0 9px;border:1px solid #29445f;border-radius:7px;background:#0c1725;color:#d6e3ef;cursor:pointer;font-size:12px;white-space:nowrap}
    #guideControls button.active{background:#0d5fc8;border-color:#55adff;color:#fff}
    #guideControls button.locked{background:#7a4c00;border-color:#ffb74d;color:#fff}
    #guideControls button:hover{border-color:#3a95ff;color:#fff}
    .ruler-x,.ruler-y{pointer-events:auto!important}
    .ruler-x{cursor:ns-resize}.ruler-y{cursor:ew-resize}
    .precision-guide{position:absolute;z-index:35;pointer-events:auto;user-select:none;touch-action:none;background:#21b7ff;box-shadow:0 0 0 1px rgba(33,183,255,.15)}
    .precision-guide.h{height:1px;cursor:ns-resize}
    .precision-guide.v{width:1px;cursor:ew-resize}
    .precision-guide.snapped{background:#fff36a;box-shadow:0 0 7px rgba(255,243,106,.95)}
    .precision-guide::after{content:attr(data-label);position:absolute;background:rgba(3,18,31,.96);border:1px solid #2a91cf;color:#c9efff;font-size:9px;line-height:1;padding:3px 5px;border-radius:4px;white-space:nowrap}
    .precision-guide.h::after{left:6px;top:4px}.precision-guide.v::after{left:4px;top:6px}
    .precision-guide.hidden-guide{display:none}
    #editorStage.image-locked{cursor:default!important}
    #editorStage.image-locked #editorImage{cursor:default!important}
  `;
  document.head.appendChild(style);

  const controls = document.createElement('div');
  controls.id = 'guideControls';
  controls.innerHTML = `
    <button id="imageLockToggle" type="button">原图 未锁</button>
    <button id="guideToggle" type="button" class="active">参考线 开</button>
    <button id="snapToggle" type="button" class="active">吸附 开</button>
    <button id="clearGuides" type="button">清除线</button>
  `;
  toolbar.prepend(controls);

  const imageLockToggle = document.getElementById('imageLockToggle');
  const guideToggle = document.getElementById('guideToggle');
  const snapToggle = document.getElementById('snapToggle');
  const clearGuides = document.getElementById('clearGuides');

  let imageLocked = false;
  let lockedView = null;
  let guidesVisible = true;
  let snapEnabled = true;
  let guideDrag = null;
  let cropDrag = null;
  let snapFrame = 0;
  const SNAP_PX = 14;
  const RULER_SIZE = 28;

  function stageBounds() {
    const r = stage.getBoundingClientRect();
    return { rect: r, width: r.width, height: r.height };
  }

  function imageBounds() {
    const sr = stage.getBoundingClientRect();
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

  function stagePoint(event) {
    const r = stage.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }

  function sourceToStageX(value) {
    const b = imageBounds();
    return b.left + (Number(value) / Math.max(1, S.nw || 1)) * b.width;
  }

  function sourceToStageY(value) {
    const b = imageBounds();
    return b.top + (Number(value) / Math.max(1, S.nh || 1)) * b.height;
  }

  function stageToSourceX(value) {
    const b = imageBounds();
    return Math.round(((value - b.left) / Math.max(1, b.width)) * (S.nw || 0));
  }

  function stageToSourceY(value) {
    const b = imageBounds();
    return Math.round(((value - b.top) / Math.max(1, b.height)) * (S.nh || 0));
  }

  function niceStep(sourceSize, displaySize, minGap = 72) {
    const pxPerSource = displaySize / Math.max(1, sourceSize);
    const candidates = [1,2,5,10,20,25,50,100,200,250,500,1000,2000,5000];
    return candidates.find((step) => step * pxPerSource >= minGap) || 10000;
  }

  function rebuildAxis(container, sourceSize, displaySize, horizontal) {
    container.replaceChildren();
    if (!sourceSize || !displaySize) return;
    const major = niceStep(sourceSize, displaySize, horizontal ? 74 : 54);
    const minor = major >= 20 ? major / 4 : Math.max(1, major / 2);
    const add = (value, isMajor) => {
      const pos = (value / sourceSize) * displaySize;
      const tick = document.createElement('span');
      tick.className = `ruler-tick${isMajor ? ' major' : ''}`;
      if (horizontal) tick.style.left = `${pos}px`; else tick.style.top = `${pos}px`;
      container.appendChild(tick);
      if (isMajor) {
        const label = document.createElement('span');
        label.className = `ruler-label${value === 0 ? ' first' : ''}`;
        label.textContent = String(Math.round(value));
        if (horizontal) label.style.left = `${pos}px`; else label.style.top = `${pos}px`;
        container.appendChild(label);
      }
    };
    for (let value = 0; value < sourceSize; value += minor) {
      const isMajor = Math.abs(value / major - Math.round(value / major)) < 0.001;
      add(value, isMajor);
    }
    add(sourceSize, true);
  }

  function syncAccurateRulers() {
    if (!S.file || !E.img.getBoundingClientRect().width || !S.nw || !S.nh) return;
    const b = imageBounds();
    const xTop = Math.max(0, b.top - RULER_SIZE);
    const yLeft = Math.max(0, b.left - RULER_SIZE);

    Object.assign(rulerX.style, {
      display: 'block', left: `${b.left}px`, top: `${xTop}px`, width: `${b.width}px`, height: `${RULER_SIZE}px`,
    });
    Object.assign(rulerY.style, {
      display: 'block', left: `${yLeft}px`, top: `${b.top}px`, width: `${RULER_SIZE}px`, height: `${b.height}px`,
    });
    if (rulerCorner) {
      Object.assign(rulerCorner.style, {
        display: 'grid', left: `${yLeft}px`, top: `${xTop}px`, width: `${RULER_SIZE}px`, height: `${RULER_SIZE}px`,
      });
      rulerCorner.textContent = '0,0';
    }
    rebuildAxis(rulerX, S.nw, b.width, true);
    rebuildAxis(rulerY, S.nh, b.height, false);
    renderGuides();
  }

  function cropSourceMetrics() {
    const b = imageBounds();
    if (!S.crop || !b.width || !b.height) return { x:0, y:0, width:0, height:0 };
    const x1 = Math.max(0, Math.min(S.nw, ((S.crop.x - b.left) / b.width) * S.nw));
    const y1 = Math.max(0, Math.min(S.nh, ((S.crop.y - b.top) / b.height) * S.nh));
    const x2 = Math.max(0, Math.min(S.nw, ((S.crop.x + S.crop.width - b.left) / b.width) * S.nw));
    const y2 = Math.max(0, Math.min(S.nh, ((S.crop.y + S.crop.height - b.top) / b.height) * S.nh));
    return {
      x: Math.round(x1), y: Math.round(y1),
      width: Math.max(1, Math.round(x2 - x1)),
      height: Math.max(1, Math.round(y2 - y1)),
    };
  }

  function syncFieldsAndReadout() {
    if (!S.file || !S.crop) return;
    const m = cropSourceMetrics();
    E.readout.textContent = `${m.width} × ${m.height}px`;
    E.w.value = String(m.width);
    E.h.value = String(m.height);
    S.outRatio = m.width / Math.max(1, m.height);
    summary();
  }

  function createGuide(axis, sourceValue) {
    const line = document.createElement('div');
    line.className = `precision-guide ${axis}`;
    line.dataset.axis = axis;
    line.dataset.source = String(Math.round(sourceValue));
    stage.appendChild(line);

    line.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
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
    renderGuide(line);
    return line;
  }

  function renderGuide(line) {
    if (!S.file) return;
    const b = imageBounds();
    const axis = line.dataset.axis;
    const max = axis === 'v' ? S.nw : S.nh;
    const source = Math.max(0, Math.min(max, Number(line.dataset.source) || 0));
    line.dataset.source = String(Math.round(source));
    line.dataset.label = `${axis === 'v' ? 'X' : 'Y'} ${Math.round(source)}`;
    if (axis === 'v') {
      line.style.left = `${sourceToStageX(source)}px`;
      line.style.top = `${b.top}px`;
      line.style.height = `${b.height}px`;
    } else {
      line.style.top = `${sourceToStageY(source)}px`;
      line.style.left = `${b.left}px`;
      line.style.width = `${b.width}px`;
    }
    line.classList.toggle('hidden-guide', !guidesVisible);
  }

  function renderGuides() {
    stage.querySelectorAll('.precision-guide').forEach(renderGuide);
  }

  function updateGuideFromPointer(line, event) {
    const p = stagePoint(event);
    if (line.dataset.axis === 'v') {
      line.dataset.source = String(Math.max(0, Math.min(S.nw, stageToSourceX(p.x))));
    } else {
      line.dataset.source = String(Math.max(0, Math.min(S.nh, stageToSourceY(p.y))));
    }
    renderGuide(line);
  }

  function guidePositions(axis) {
    return [...stage.querySelectorAll(`.precision-guide.${axis}:not(.hidden-guide)`)].map((el) => ({
      el,
      source: Number(el.dataset.source) || 0,
      pos: axis === 'v' ? sourceToStageX(el.dataset.source) : sourceToStageY(el.dataset.source),
    }));
  }

  function nearestStage(value, guides) {
    let best = null;
    for (const item of guides) {
      const delta = item.pos - value;
      if (Math.abs(delta) <= SNAP_PX && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { ...item, delta };
    }
    return best;
  }

  function flashGuide(hit) {
    if (!hit?.el) return;
    hit.el.classList.add('snapped');
    clearTimeout(hit.el._snapTimer);
    hit.el._snapTimer = setTimeout(() => hit.el.classList.remove('snapped'), 170);
  }

  function clampCropToImage(c) {
    const b = imageBounds();
    c.width = Math.min(c.width, Math.max(1, b.width));
    c.height = Math.min(c.height, Math.max(1, b.height));
    c.x = Math.min(Math.max(c.x, b.left), Math.max(b.left, b.right - c.width));
    c.y = Math.min(Math.max(c.y, b.top), Math.max(b.top, b.bottom - c.height));
    return c;
  }

  function snapCrop(mode) {
    if (!snapEnabled || !guidesVisible || !S.crop) return;
    const vertical = guidePositions('v');
    const horizontal = guidePositions('h');
    if (!vertical.length && !horizontal.length) return;

    const c = { ...S.crop };
    const left = c.x, right = c.x + c.width, centerX = c.x + c.width / 2;
    const top = c.y, bottom = c.y + c.height, centerY = c.y + c.height / 2;
    let hitX = null, hitY = null;

    if (mode === 'move') {
      hitX = [nearestStage(left, vertical), nearestStage(right, vertical), nearestStage(centerX, vertical)]
        .filter(Boolean).sort((a,b) => Math.abs(a.delta) - Math.abs(b.delta))[0] || null;
      hitY = [nearestStage(top, horizontal), nearestStage(bottom, horizontal), nearestStage(centerY, horizontal)]
        .filter(Boolean).sort((a,b) => Math.abs(a.delta) - Math.abs(b.delta))[0] || null;
      if (hitX) c.x += hitX.delta;
      if (hitY) c.y += hitY.delta;
    } else {
      if (mode.includes('w')) {
        hitX = nearestStage(left, vertical);
        if (hitX) { const fixedRight = c.x + c.width; c.x = hitX.pos; c.width = Math.max(1, fixedRight - c.x); }
      }
      if (mode.includes('e')) {
        hitX = nearestStage(right, vertical);
        if (hitX) c.width = Math.max(1, hitX.pos - c.x);
      }
      if (mode.includes('n')) {
        hitY = nearestStage(top, horizontal);
        if (hitY) { const fixedBottom = c.y + c.height; c.y = hitY.pos; c.height = Math.max(1, fixedBottom - c.y); }
      }
      if (mode.includes('s')) {
        hitY = nearestStage(bottom, horizontal);
        if (hitY) c.height = Math.max(1, hitY.pos - c.y);
      }
    }

    if (!hitX && !hitY) return;
    S.crop = clampCropToImage(c);
    drawCropFrame();
    syncFieldsAndReadout();
    flashGuide(hitX);
    flashGuide(hitY);
  }

  function scheduleSnap(mode) {
    cancelAnimationFrame(snapFrame);
    snapFrame = requestAnimationFrame(() => snapCrop(mode));
  }

  rulerX.addEventListener('pointerdown', (event) => {
    if (!S.file || !guidesVisible || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    const line = createGuide('h', 0);
    guideDrag = { line, axis:'h', pointerId:event.pointerId };
    updateGuideFromPointer(line, event);
  });

  rulerY.addEventListener('pointerdown', (event) => {
    if (!S.file || !guidesVisible || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    const line = createGuide('v', 0);
    guideDrag = { line, axis:'v', pointerId:event.pointerId };
    updateGuideFromPointer(line, event);
  });

  box.addEventListener('pointerdown', (event) => {
    if (!S.file) return;
    const handle = event.target.closest('[data-resize]');
    cropDrag = { pointerId:event.pointerId, mode:handle?.dataset.resize || 'move' };
  }, true);

  window.addEventListener('pointermove', (event) => {
    if (guideDrag && event.pointerId === guideDrag.pointerId) {
      updateGuideFromPointer(guideDrag.line, event);
      return;
    }
    if (cropDrag && event.pointerId === cropDrag.pointerId) scheduleSnap(cropDrag.mode);
  });

  window.addEventListener('pointerup', (event) => {
    if (guideDrag && event.pointerId === guideDrag.pointerId) {
      updateGuideFromPointer(guideDrag.line, event);
      guideDrag = null;
    }
    if (cropDrag && event.pointerId === cropDrag.pointerId) {
      snapCrop(cropDrag.mode);
      cropDrag = null;
      syncFieldsAndReadout();
      markDirty('裁切框已按参考线精确对齐，请按「确认裁切」。');
    }
  });

  function isPrecisionTarget(target) {
    return !!target?.closest?.('#cropBox,.precision-guide,.ruler-x,.ruler-y,.ruler-corner');
  }

  stage.addEventListener('pointerdown', (event) => {
    if (!imageLocked || isPrecisionTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    S.dragging = null;
  }, true);

  stage.addEventListener('wheel', (event) => {
    if (!imageLocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture:true, passive:false });

  function enforceLockedView() {
    if (!imageLocked || !lockedView || !S.file) return;
    const changed = ['x','y','width','height','scale'].some((key) => Math.abs((S.view[key] || 0) - (lockedView[key] || 0)) > 0.01);
    if (!changed) return;
    Object.assign(S.view, lockedView);
    drawImageView();
  }

  window.addEventListener('pointermove', () => {
    if (imageLocked) requestAnimationFrame(enforceLockedView);
  }, true);

  function setImageLocked(next) {
    imageLocked = !!next;
    if (imageLocked) {
      lockedView = { ...S.view };
      S.dragging = null;
    } else {
      lockedView = null;
    }
    imageLockToggle.classList.toggle('locked', imageLocked);
    imageLockToggle.textContent = `原图 ${imageLocked ? '已锁' : '未锁'}`;
    stage.classList.toggle('image-locked', imageLocked);
    stage.title = imageLocked ? '原图已锁定；只能调整裁切框和参考线' : '拖动原图调整位置；滚轮或下方滑杆缩放';

    if (typeof Z !== 'undefined') {
      Z.input.disabled = imageLocked || !S.file;
      Z.in.disabled = imageLocked || !S.file;
      Z.out.disabled = imageLocked || !S.file;
    }
    if (E.fit) E.fit.disabled = imageLocked || !S.file;
    setStatus(imageLocked ? '原图已锁定：位置和缩放不会变化。' : '原图已解锁：可以拖动和缩放。');
  }

  imageLockToggle.addEventListener('click', () => setImageLocked(!imageLocked));

  guideToggle.addEventListener('click', () => {
    guidesVisible = !guidesVisible;
    guideToggle.classList.toggle('active', guidesVisible);
    guideToggle.textContent = `参考线 ${guidesVisible ? '开' : '关'}`;
    renderGuides();
  });

  snapToggle.addEventListener('click', () => {
    snapEnabled = !snapEnabled;
    snapToggle.classList.toggle('active', snapEnabled);
    snapToggle.textContent = `吸附 ${snapEnabled ? '开' : '关'}`;
    setStatus(snapEnabled ? `吸附已开启：距离参考线 ${SNAP_PX}px 内会自动吸住。` : '吸附已关闭。');
  });

  clearGuides.addEventListener('click', () => {
    stage.querySelectorAll('.precision-guide').forEach((el) => el.remove());
  });

  // Make readout use the same real-pixel coordinate system as rulers and guides.
  updateReadout = function updateReadoutAccurate() {
    if (!S.file || !S.crop) { E.readout.textContent = '—'; return; }
    const m = cropSourceMetrics();
    E.readout.textContent = `${m.width} × ${m.height}px`;
  };

  const baseDrawCropFrame = drawCropFrame;
  drawCropFrame = function drawCropFramePrecision() {
    baseDrawCropFrame();
    syncAccurateRulers();
    updateReadout();
  };

  const baseDrawImageView = drawImageView;
  drawImageView = function drawImageViewPrecision() {
    baseDrawImageView();
    if (imageLocked && lockedView) Object.assign(S.view, lockedView);
    requestAnimationFrame(syncAccurateRulers);
  };

  const baseSummary = summary;
  summary = function summaryPrecision() {
    baseSummary();
    requestAnimationFrame(syncAccurateRulers);
  };

  // When a new file is selected, unlock it so it can be positioned first.
  E.file?.addEventListener('change', () => {
    if (imageLocked) setImageLocked(false);
    setTimeout(syncAccurateRulers, 80);
  });

  window.addEventListener('resize', () => requestAnimationFrame(syncAccurateRulers));
  setTimeout(syncAccurateRulers, 120);
})();
