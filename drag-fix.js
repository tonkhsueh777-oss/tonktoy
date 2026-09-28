// Fixed-frame editor enhancements: source dragging, adaptive preview, and pixel rulers.
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
  const RULER_GAP = 8;
  const EDGE_GAP = 14;

  // Build rulers inside the editor stage.
  const rulerStyle = document.createElement('style');
  rulerStyle.textContent = `
    .ruler-overlay{position:absolute;z-index:7;pointer-events:none;color:#a9bdd3;font-size:9px;font-variant-numeric:tabular-nums;user-select:none}
    .ruler-x{height:${RULER_SIZE}px;background:#0b1725;border:1px solid #29445f;border-bottom-color:#4d7398;overflow:hidden}
    .ruler-y{width:${RULER_SIZE}px;background:#0b1725;border:1px solid #29445f;border-right-color:#4d7398;overflow:hidden}
    .ruler-corner{width:${RULER_SIZE}px;height:${RULER_SIZE}px;display:grid;place-items:center;background:#102238;border:1px solid #355778;border-radius:4px 0 0 0;color:#d7e8f8;font-size:8px;font-weight:700;letter-spacing:-.02em}
    .ruler-tick{position:absolute;background:#6584a4;opacity:.85}
    .ruler-x .ruler-tick{bottom:0;width:1px;height:6px}
    .ruler-x .ruler-tick.major{height:11px;background:#b6cde3}
    .ruler-y .ruler-tick{right:0;height:1px;width:6px}
    .ruler-y .ruler-tick.major{width:11px;background:#b6cde3}
    .ruler-label{position:absolute;color:#c4d5e5;line-height:1;white-space:nowrap;text-shadow:0 1px 1px #000}
    .ruler-x .ruler-label{top:3px;transform:translateX(-50%)}
    .ruler-x .ruler-label.first{transform:none}
    .ruler-y .ruler-label{left:3px;transform:translateY(-50%);writing-mode:horizontal-tb}
    .ruler-y .ruler-label.first{transform:none;top:2px!important}
    .ruler-dim-badge{position:absolute;z-index:8;pointer-events:none;padding:4px 7px;border-radius:5px;background:rgba(7,18,31,.9);border:1px solid #29445f;color:#bcd0e3;font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap}
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

  function niceMajorStep(maxValue) {
    const target = Math.max(1, maxValue / 10);
    const options = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
    return options.find((value) => value >= target) || Math.ceil(target / 5000) * 5000;
  }

  function buildAxis(container, lengthPx, outputSize, horizontal) {
    container.replaceChildren();
    if (!outputSize || !lengthPx) return;

    const major = niceMajorStep(outputSize);
    let minor = major / 5;
    if (outputSize / minor > 160) minor = major / 2;
    minor = Math.max(1, minor);

    for (let value = 0; value <= outputSize + 0.001; value += minor) {
      const exact = Math.min(value, outputSize);
      const pct = (exact / outputSize) * 100;
      const isMajor = Math.abs((exact / major) - Math.round(exact / major)) < 0.001 || exact === 0 || exact === outputSize;
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

      if (exact >= outputSize) break;
    }
  }

  function syncRulers() {
    if (!S.crop) {
      rulerX.style.display = 'none';
      rulerY.style.display = 'none';
      rulerCorner.style.display = 'none';
      dimBadge.style.display = 'none';
      return;
    }

    const width = Number(E.w.value);
    const height = Number(E.h.value);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;

    const c = S.crop;
    const rulerLeft = c.x - RULER_SIZE;
    const rulerTop = c.y - RULER_SIZE;

    Object.assign(rulerX.style, {
      display: 'block',
      left: `${c.x}px`,
      top: `${rulerTop}px`,
      width: `${c.width}px`,
    });
    Object.assign(rulerY.style, {
      display: 'block',
      left: `${rulerLeft}px`,
      top: `${c.y}px`,
      height: `${c.height}px`,
    });
    Object.assign(rulerCorner.style, {
      display: 'grid',
      left: `${rulerLeft}px`,
      top: `${rulerTop}px`,
    });
    Object.assign(dimBadge.style, {
      display: 'block',
      left: `${c.x}px`,
      top: `${c.y + c.height + 6}px`,
    });
    dimBadge.textContent = `${width} × ${height}px`;

    buildAxis(rulerX, c.width, width, true);
    buildAxis(rulerY, c.height, height, false);
  }

  // Crop frame is always anchored at the top-left ruler origin instead of centered.
  computeCropFrame = function computeCropFrameTopLeft() {
    const rect = stageRect();
    const x = RULER_SIZE + RULER_GAP;
    const y = RULER_SIZE + RULER_GAP;
    const maxWidth = Math.max(120, rect.width - x - EDGE_GAP);
    const maxHeight = Math.max(120, rect.height - y - EDGE_GAP - 24);
    const ratio = outputRatio();

    let width = maxWidth;
    let height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    return { x, y, width, height };
  };

  const originalDrawCropFrame = drawCropFrame;
  drawCropFrame = function drawCropFrameWithRulers() {
    originalDrawCropFrame();
    syncRulers();
  };

  // Keep the right preview frame in the same aspect ratio as the chosen output size.
  const previewFrame = E.preview?.closest('.preview-frame');
  function syncPreviewAspect() {
    if (!previewFrame) return;
    const width = Number(E.w.value);
    const height = Number(E.h.value);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    previewFrame.style.aspectRatio = `${width} / ${height}`;
  }

  const originalSummary = summary;
  summary = function summaryWithEditorGuides() {
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
  stage.title = '左上角为 0,0 原点；按住鼠标左键拖动原图；使用下方滑杆缩放';
  stage.addEventListener('mousedown', begin, true);
  window.addEventListener('mousemove', move, true);
  window.addEventListener('mouseup', end, true);
})();
