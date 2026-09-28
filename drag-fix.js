// Fixed ruler coordinate system + resizable crop frame + reliable source dragging.
(() => {
  // Keep source image positioned by explicit left/top coordinates.
  drawImageView = function drawImageViewFixed() {
    Object.assign(E.img.style, {
      display: 'block',
      position: 'absolute',
      inset: 'auto',
      margin: '0',
      left: `${S.view.x}px`,
      top: `${S.view.y}px`,
      right: 'auto',
      bottom: 'auto',
      width: `${S.view.width}px`,
      height: `${S.view.height}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      transform: 'none',
    });
    updateReadout();
  };

  const stage = E.stage;
  const RULER_SIZE = 28;
  const GAP = 8;
  const EDGE = 12;
  const MIN_RANGE = 2000;

  const rulerStyle = document.createElement('style');
  rulerStyle.textContent = `
    .ruler-overlay{position:absolute;z-index:8;pointer-events:none;color:#a9bdd3;font-size:9px;font-variant-numeric:tabular-nums;user-select:none}
    .ruler-x{height:${RULER_SIZE}px;background:#0b1725;border:1px solid #29445f;border-bottom-color:#6f93b7;overflow:hidden}
    .ruler-y{width:${RULER_SIZE}px;background:#0b1725;border:1px solid #29445f;border-right-color:#6f93b7;overflow:hidden}
    .ruler-corner{width:${RULER_SIZE}px;height:${RULER_SIZE}px;display:grid;place-items:center;background:#102238;border:1px solid #355778;color:#e3f0fc;font-size:8px;font-weight:800}
    .ruler-tick{position:absolute;background:#6686a7;opacity:.95}
    .ruler-x .ruler-tick{bottom:0;width:1px;height:6px}
    .ruler-x .ruler-tick.major{height:12px;background:#d2e3f3}
    .ruler-y .ruler-tick{right:0;height:1px;width:6px}
    .ruler-y .ruler-tick.major{width:12px;background:#d2e3f3}
    .ruler-label{position:absolute;color:#d0dfed;line-height:1;white-space:nowrap;text-shadow:0 1px 1px #000}
    .ruler-x .ruler-label{top:3px;transform:translateX(-50%)}
    .ruler-x .ruler-label.first{transform:none}
    .ruler-y .ruler-label{left:3px;transform:translateY(-50%)}
    .ruler-y .ruler-label.first{transform:none;top:2px!important}
    .ruler-dim-badge{position:absolute;z-index:9;pointer-events:none;padding:4px 7px;border-radius:5px;background:rgba(7,18,31,.94);border:1px solid #355778;color:#d7e8f8;font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap}
  `;
  document.head.appendChild(rulerStyle);

  const rulerX = document.createElement('div');
  rulerX.className = 'ruler-overlay ruler-x';
  const rulerY = document.createElement('div');
  rulerY.className = 'ruler-overlay ruler-y';
  const rulerCorner = document.createElement('div');
  rulerCorner.className = 'ruler-overlay ruler-corner';
  rulerCorner.textContent = '0,0';
  const dimBadge = document.createElement('div');
  dimBadge.className = 'ruler-dim-badge';
  stage.append(rulerX, rulerY, rulerCorner, dimBadge);

  function currentDims() {
    const width = Number(E.w.value);
    const height = Number(E.h.value);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
    return { width, height };
  }

  function rulerGeometry() {
    const rect = stageRect();
    const dims = currentDims() || { width: 1200, height: 750 };
    const originX = GAP + RULER_SIZE;
    const originY = GAP + RULER_SIZE;
    const availableWidth = Math.max(120, rect.width - originX - EDGE);
    const availableHeight = Math.max(120, rect.height - originY - EDGE - 26);
    const axisLength = Math.max(120, Math.min(availableWidth, availableHeight));
    const largestDimension = Math.max(dims.width, dims.height, MIN_RANGE);
    const range = Math.max(MIN_RANGE, Math.ceil(largestDimension / 500) * 500);
    const scale = axisLength / range;
    return { originX, originY, axisLength, range, scale, dims };
  }

  function niceMajorStep(range) {
    const target = range / 10;
    const options = [100, 200, 250, 500, 1000, 2000, 2500, 5000];
    return options.find((value) => value >= target) || 5000;
  }

  function buildAxis(container, range, horizontal) {
    container.replaceChildren();
    const major = niceMajorStep(range);
    const minor = Math.max(10, major / 4);

    for (let value = 0; value <= range + 0.001; value += minor) {
      const exact = Math.min(value, range);
      const pct = (exact / range) * 100;
      const isMajor = Math.abs(exact / major - Math.round(exact / major)) < 0.001 || exact === 0 || exact === range;

      const tick = document.createElement('span');
      tick.className = `ruler-tick${isMajor ? ' major' : ''}`;
      if (horizontal) tick.style.left = `${pct}%`;
      else tick.style.top = `${pct}%`;
      container.appendChild(tick);

      if (isMajor) {
        const label = document.createElement('span');
        label.className = `ruler-label${exact === 0 ? ' first' : ''}`;
        label.textContent = String(Math.round(exact));
        if (horizontal) label.style.left = `${pct}%`;
        else label.style.top = `${pct}%`;
        container.appendChild(label);
      }

      if (exact >= range) break;
    }
  }

  function syncRulers() {
    const g = rulerGeometry();
    Object.assign(rulerCorner.style, {
      display: 'grid',
      left: `${GAP}px`,
      top: `${GAP}px`,
    });
    Object.assign(rulerX.style, {
      display: 'block',
      left: `${g.originX}px`,
      top: `${GAP}px`,
      width: `${g.axisLength}px`,
    });
    Object.assign(rulerY.style, {
      display: 'block',
      left: `${GAP}px`,
      top: `${g.originY}px`,
      height: `${g.axisLength}px`,
    });

    buildAxis(rulerX, g.range, true);
    buildAxis(rulerY, g.range, false);

    if (S.crop) {
      Object.assign(dimBadge.style, {
        display: 'block',
        left: `${S.crop.x + S.crop.width + 6}px`,
        top: `${S.crop.y + S.crop.height + 6}px`,
      });
      dimBadge.textContent = `${Math.round(g.dims.width)} × ${Math.round(g.dims.height)}px`;
    } else {
      dimBadge.style.display = 'none';
    }
  }

  // The ruler never follows the crop box. Only the crop box changes size.
  // Its top-left is permanently anchored to the fixed 0,0 ruler origin.
  computeCropFrame = function computeCropFrameFromFixedRuler() {
    const g = rulerGeometry();
    return {
      x: g.originX,
      y: g.originY,
      width: Math.max(1, g.dims.width * g.scale),
      height: Math.max(1, g.dims.height * g.scale),
    };
  };

  const originalDrawCropFrame = drawCropFrame;
  drawCropFrame = function drawCropFrameWithFixedRulers() {
    originalDrawCropFrame();
    syncRulers();
  };

  // Right-side preview follows output aspect ratio.
  const previewFrame = E.preview?.closest('.preview-frame');
  function syncPreviewAspect() {
    if (!previewFrame) return;
    const dims = currentDims();
    if (!dims) return;
    previewFrame.style.aspectRatio = `${dims.width} / ${dims.height}`;
  }

  const originalSummary = summary;
  summary = function summaryWithFixedRulerEditor() {
    originalSummary();
    syncPreviewAspect();
    syncRulers();
  };

  syncPreviewAspect();
  syncRulers();

  // Reliable desktop dragging under the fixed crop frame.
  let drag = null;
  const clampAxis = (value, min, max) => Math.min(Math.max(value, min), max);

  function applyDelta(dx, dy) {
    if (!S.file || !S.crop || !S.view.width || !S.view.height) return;
    const minX = S.crop.x + S.crop.width - S.view.width;
    const maxX = S.crop.x;
    const minY = S.crop.y + S.crop.height - S.view.height;
    const maxY = S.crop.y;
    S.view.x = clampAxis(S.view.x + dx, minX, maxX);
    S.view.y = clampAxis(S.view.y + dy, minY, maxY);
    drawImageView();
  }

  function begin(event) {
    if (!S.file || !S.crop || event.button !== 0) return;
    if (event.target.closest('button, input, #zoomControls')) return;
    event.preventDefault();
    S.dragging = null;
    drag = { x: event.clientX, y: event.clientY, moved: false };
    stage.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function move(event) {
    if (!drag) return;
    event.preventDefault();
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!dx && !dy) return;
    applyDelta(dx, dy);
    drag.moved = true;
  }

  function end() {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    stage.style.cursor = 'grab';
    document.body.style.userSelect = '';
    if (moved) markDirty('已移动原图，请按「确认裁切」。');
  }

  stage.style.cursor = 'grab';
  stage.title = '尺标固定；裁切框从左上角 0,0 原点改变宽高；拖动原图调整构图';
  stage.addEventListener('mousedown', begin, true);
  window.addEventListener('mousemove', move, true);
  window.addEventListener('mouseup', end, true);
})();