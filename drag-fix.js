// Drag interaction patch: keep the crop frame fixed and move the source image beneath it.
// Loaded after app.js as a classic script so it can use the editor's shared state/functions.
(() => {
  const stage = E.stage;
  let activeDrag = null;

  const canStartDrag = (event) => {
    if (!S.file || !S.crop) return false;
    if (event.pointerType === 'mouse' && event.button !== 0) return false;
    if (event.target.closest('button, input, #zoomControls')) return false;
    return true;
  };

  function beginDrag(event) {
    if (!canStartDrag(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    activeDrag = {
      id: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };

    S.dragging = null;
    stage.setPointerCapture?.(event.pointerId);
    stage.style.cursor = 'grabbing';
  }

  function dragImage(event) {
    if (!activeDrag || event.pointerId !== activeDrag.id) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const dx = event.clientX - activeDrag.lastX;
    const dy = event.clientY - activeDrag.lastY;
    activeDrag.lastX = event.clientX;
    activeDrag.lastY = event.clientY;

    if (!dx && !dy) return;

    S.view.x += dx;
    S.view.y += dy;
    clampViewIntoFrame();
    drawImageView();
    activeDrag.moved = true;
  }

  function finishDrag(event) {
    if (!activeDrag || event.pointerId !== activeDrag.id) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const moved = activeDrag.moved;
    activeDrag = null;
    stage.releasePointerCapture?.(event.pointerId);
    stage.style.cursor = 'grab';

    if (moved) {
      markDirty('已移动原图，请按「确认裁切」。');
    }
  }

  stage.style.touchAction = 'none';
  stage.style.cursor = 'grab';
  stage.title = '按住并拖动原图调整位置；使用下方滑杆缩放';

  // Capture phase intentionally runs before the old drag listeners in app.js.
  stage.addEventListener('pointerdown', beginDrag, true);
  window.addEventListener('pointermove', dragImage, { capture: true, passive: false });
  window.addEventListener('pointerup', finishDrag, { capture: true, passive: false });
  window.addEventListener('pointercancel', finishDrag, { capture: true, passive: false });
})();
