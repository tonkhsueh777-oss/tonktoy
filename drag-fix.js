// Fix source-image positioning, dragging, and preview aspect under a fixed crop frame.
(() => {
  // Root cause fix: the old drawImageView wrote `inset:auto` after left/top,
  // which reset left/top back to auto. Keep inset reset BEFORE coordinates.
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

  // Keep the right-side preview frame in the same aspect ratio as the selected output size.
  const previewFrame = E.preview?.closest('.preview-frame');
  function syncPreviewAspect() {
    if (!previewFrame) return;
    const width = Number(E.w.value);
    const height = Number(E.h.value);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    previewFrame.style.aspectRatio = `${width} / ${height}`;
  }

  const originalSummary = summary;
  summary = function summaryWithPreviewAspect() {
    originalSummary();
    syncPreviewAspect();
  };
  syncPreviewAspect();

  const stage = E.stage;
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
  stage.title = '按住鼠标左键拖动原图；使用下方滑杆缩放';
  stage.addEventListener('mousedown', begin, true);
  window.addEventListener('mousemove', move, true);
  window.addEventListener('mouseup', end, true);
})();
