// Fixed workspace rulers/guides + source-image lock.
// Rulers/guides are anchored to the editor workspace and NEVER follow the source image.
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
    .precision-guide{position:absolute;z-index:35;pointer-events:auto;user-select:none;touch-action:none;background:#21b7ff;box-shadow:0 0 0 1px rgba(33,183,255,.16)}
    .precision-guide.h{height:1px;cursor:ns-resize}
    .precision-guide.v{width:1px;cursor:ew-resize}
    .precision-guide.snap-hold,.precision-guide.snapped{background:#fff36a!important;box-shadow:0 0 8px rgba(255,243,106,.95)!important}
    .precision-guide::after{content:attr(data-label);position:absolute;background:rgba(3,18,31,.96);border:1px solid #2a91cf;color:#c9efff;font-size:9px;line-height:1;padding:3px 5px;border-radius:4px;white-space:nowrap}
    .precision-guide.h::after{left:6px;top:4px}.precision-guide.v::after{left:4px;top:6px}
    .precision-guide.hidden-guide{display:none}
    #editorStage.image-locked{cursor:default!important}
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
  let guideDrag = null;

  function stagePoint(event) {
    const r = stage.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }

  function rulerBounds() {
    const sr = stage.getBoundingClientRect();
    const xr = rulerX.getBoundingClientRect();
    const yr = rulerY.getBoundingClientRect();
    return {
      xLeft: xr.left - sr.left,
      xTop: xr.top - sr.top,
      xWidth: xr.width,
      yLeft: yr.left - sr.left,
      yTop: yr.top - sr.top,
      yHeight: yr.height,
    };
  }

  function rulerMax(container, fallback) {
    const nums = [...container.querySelectorAll('.ruler-label')]
      .map((el) => Number(String(el.textContent).replace(/[^0-9.-]/g, '')))
      .filter(Number.isFinite);
    return nums.length ? Math.max(...nums) : fallback;
  }

  function workspaceCoord(axis, stagePos) {
    const b = rulerBounds();
    if (axis === 'v') {
      const max = rulerMax(rulerX, Math.round(b.xWidth));
      const ratio = (stagePos - b.xLeft) / Math.max(1, b.xWidth);
      return Math.round(Math.max(0, Math.min(1, ratio)) * max);
    }
    const max = rulerMax(rulerY, Math.round(b.yHeight));
    const ratio = (stagePos - b.yTop) / Math.max(1, b.yHeight);
    return Math.round(Math.max(0, Math.min(1, ratio)) * max);
  }

  function fixedGuideBounds() {
    const b = rulerBounds();
    return {
      left: b.xLeft,
      top: b.yTop,
      right: b.xLeft + b.xWidth,
      bottom: b.yTop + b.yHeight,
    };
  }

  function renderGuide(line) {
    const bounds = fixedGuideBounds();
    const axis = line.dataset.axis;
    let pos = Number(line.dataset.pos) || 0;
    if (axis === 'v') {
      pos = Math.max(bounds.left, Math.min(bounds.right, pos));
      line.dataset.pos = String(pos);
      line.style.left = `${pos}px`;
      line.style.top = `${bounds.top}px`;
      line.style.height = `${Math.max(1, bounds.bottom - bounds.top)}px`;
      line.dataset.label = `X ${workspaceCoord('v', pos)}`;
    } else {
      pos = Math.max(bounds.top, Math.min(bounds.bottom, pos));
      line.dataset.pos = String(pos);
      line.style.top = `${pos}px`;
      line.style.left = `${bounds.left}px`;
      line.style.width = `${Math.max(1, bounds.right - bounds.left)}px`;
      line.dataset.label = `Y ${workspaceCoord('h', pos)}`;
    }
    line.classList.toggle('hidden-guide', !guidesVisible);
  }

  function renderGuides() {
    stage.querySelectorAll('.precision-guide').forEach(renderGuide);
  }

  function createGuide(axis, pos) {
    const line = document.createElement('div');
    line.className = `precision-guide ${axis}`;
    line.dataset.axis = axis;
    line.dataset.pos = String(pos);
    stage.appendChild(line);
    renderGuide(line);

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
    return line;
  }

  function updateGuideFromPointer(line, event) {
    const p = stagePoint(event);
    line.dataset.pos = String(line.dataset.axis === 'v' ? p.x : p.y);
    renderGuide(line);
  }

  rulerX.addEventListener('pointerdown', (event) => {
    if (!S.file || !guidesVisible || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    const p = stagePoint(event);
    const line = createGuide('h', p.y);
    guideDrag = { line, axis: 'h', pointerId: event.pointerId };
  });

  rulerY.addEventListener('pointerdown', (event) => {
    if (!S.file || !guidesVisible || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    const p = stagePoint(event);
    const line = createGuide('v', p.x);
    guideDrag = { line, axis: 'v', pointerId: event.pointerId };
  });

  window.addEventListener('pointermove', (event) => {
    if (!guideDrag || event.pointerId !== guideDrag.pointerId) return;
    updateGuideFromPointer(guideDrag.line, event);
  }, true);

  window.addEventListener('pointerup', (event) => {
    if (!guideDrag || event.pointerId !== guideDrag.pointerId) return;
    updateGuideFromPointer(guideDrag.line, event);
    guideDrag = null;
  }, true);

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
  }, { capture: true, passive: false });

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
    lockedView = imageLocked ? { ...S.view } : null;
    if (imageLocked) S.dragging = null;

    imageLockToggle.classList.toggle('locked', imageLocked);
    imageLockToggle.textContent = `原图 ${imageLocked ? '已锁' : '未锁'}`;
    stage.classList.toggle('image-locked', imageLocked);

    if (typeof Z !== 'undefined') {
      Z.input.disabled = imageLocked || !S.file;
      Z.in.disabled = imageLocked || !S.file;
      Z.out.disabled = imageLocked || !S.file;
    }
    if (E.fit) E.fit.disabled = imageLocked || !S.file;
    setStatus(imageLocked ? '原图已锁定：尺标、参考线和原图位置都保持固定。' : '原图已解锁：可以拖动和缩放原图。');
  }

  imageLockToggle.addEventListener('click', () => setImageLocked(!imageLocked));

  guideToggle.addEventListener('click', () => {
    guidesVisible = !guidesVisible;
    guideToggle.classList.toggle('active', guidesVisible);
    guideToggle.textContent = `参考线 ${guidesVisible ? '开' : '关'}`;
    stage.querySelectorAll('.precision-guide').forEach((el) => el.classList.toggle('hidden-guide', !guidesVisible));
  });

  snapToggle.addEventListener('click', () => {
    const active = !snapToggle.classList.contains('active');
    snapToggle.classList.toggle('active', active);
    snapToggle.textContent = `吸附 ${active ? '开' : '关'}`;
  });

  clearGuides.addEventListener('click', () => {
    stage.querySelectorAll('.precision-guide').forEach((el) => el.remove());
  });

  // The ruler itself is owned by drag-fix.js. It stays anchored to the workspace.
  // We only resize existing guide lines when the workspace geometry changes.
  const observer = new ResizeObserver(() => renderGuides());
  observer.observe(stage);

  if (rulerCorner) rulerCorner.textContent = '0,0';
  renderGuides();
})();
