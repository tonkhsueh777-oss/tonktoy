// Preserve source image position/scale while crop dimensions change.
(() => {
  const baseComputeCropFrame = computeCropFrame;
  const baseResetImageView = resetImageView;

  let forceImageReset = false;

  // The Fit button is the only UI action that is allowed to re-fit/re-center the source image.
  E.fit?.addEventListener('click', () => {
    forceImageReset = true;
    setTimeout(() => { forceImageReset = false; }, 0);
  }, true);

  // Prevent ResizeObserver and crop-size changes from silently re-centering/re-scaling the source image.
  resetImageView = function resetImageViewOnlyWhenRequested() {
    const firstLayout = !S.view.width || !S.view.height || !S.fitScale;
    if (forceImageReset || firstLayout) {
      const result = baseResetImageView();
      forceImageReset = false;
      return result;
    }
    drawImageView();
    updateZoomUI();
  };

  // Once a crop already exists, passive stage/window resize must not replace it.
  computeCropFrame = function stableCropFrame() {
    if (S.file && S.crop) return { ...S.crop };
    return baseComputeCropFrame();
  };

  // Clamp source position only. Never enlarge the source image automatically.
  clampViewIntoFrame = function clampPositionWithoutAutoScale() {
    if (!S.crop || !S.view.width || !S.view.height) return;

    if (S.view.width >= S.crop.width) {
      const minX = S.crop.x + S.crop.width - S.view.width;
      const maxX = S.crop.x;
      S.view.x = Math.min(Math.max(S.view.x, minX), maxX);
    }

    if (S.view.height >= S.crop.height) {
      const minY = S.crop.y + S.crop.height - S.view.height;
      const maxY = S.crop.y;
      S.view.y = Math.min(Math.max(S.view.y, minY), maxY);
    }
  };

  // Width/height fields, ratio buttons and presets change only the white crop frame.
  // The source image keeps exactly the same x/y position and scale.
  updateFrame = function updateCropWithoutMovingImage(message = '') {
    if (!S.file) return;

    const next = baseComputeCropFrame();
    let width = next.width;
    let height = next.height;
    let x = S.crop?.x ?? next.x;
    let y = S.crop?.y ?? next.y;

    // The crop can never be larger than the currently displayed source image.
    if (S.view.width > 0) width = Math.min(width, S.view.width);
    if (S.view.height > 0) height = Math.min(height, S.view.height);

    // Keep the current crop origin as much as possible, but keep the frame inside the displayed image.
    if (S.view.width > 0 && S.view.height > 0) {
      const left = S.view.x;
      const top = S.view.y;
      const right = S.view.x + S.view.width;
      const bottom = S.view.y + S.view.height;
      x = Math.min(Math.max(x, left), Math.max(left, right - width));
      y = Math.min(Math.max(y, top), Math.max(top, bottom - height));
    }

    S.crop = { x, y, width, height };
    drawCropFrame();
    drawImageView();
    updateZoomUI();

    if (message) markDirty(message);
  };
})();
