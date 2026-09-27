// Desktop drag fix: keep crop frame fixed and move the source image beneath it.
// Uses mouse events directly for reliable Mac/Chrome dragging.
(() => {
  const stage = E.stage;
  let drag = null;

  function clampAxis(value, min, max) {
    if (min > max) return (min + max) / 2;
    return Math.min(Math.max(value, min), max);
  }

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

  function onMouseDown(event) {
    if (!S.file || !S.crop) return;
    if (event.button !== 0) return;
    if (event.target.closest('button, input, #zoomControls')) return;

    event.preventDefault();

    S.dragging = null;
    drag = {
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };

    stage.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function onMouseMove(event) {
    if (!drag) return;
    event.preventDefault();

    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    if (!dx && !dy) return;
    applyDelta(dx, dy);
    drag.moved = true;
  }

  function onMouseUp() {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    stage.style.cursor = 'grab';
    document.body.style.userSelect = '';

    if (moved) {
      markDirty('已移动原图，请按「确认裁切」。');
    }
  }

  function onTouchStart(event) {
    if (!S.file || !S.crop || event.touches.length !== 1) return;
    const touch = event.touches[0];
    drag = { lastX: touch.clientX, lastY: touch.clientY, moved: false };
  }

  function onTouchMove(event) {
    if (!drag || event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    const dx = touch.clientX - drag.lastX;
    const dy = touch.clientY - drag.lastY;
    drag.lastX = touch.clientX;
    drag.lastY = touch.clientY;
    if (!dx && !dy) return;
    applyDelta(dx, dy);
    drag.moved = true;
  }

  function onTouchEnd() {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (moved) markDirty('已移动原图，请按「确认裁切」。');
  }

  stage.style.cursor = 'grab';
  stage.style.touchAction = 'none';
  stage.title = '按住鼠标左键拖动原图；使用下方滑杆缩放';

  stage.addEventListener('mousedown', onMouseDown, true);
  window.addEventListener('mousemove', onMouseMove, true);
  window.addEventListener('mouseup', onMouseUp, true);

  stage.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  stage.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  window.addEventListener('touchend', onTouchEnd, true);
  window.addEventListener('touchcancel', onTouchEnd, true);
})();
