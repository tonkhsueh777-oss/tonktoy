// Keep the source image aligned to the fixed ruler origin on load / Fit.
// The ruler is the workspace coordinate system; image size is mapped to the same pixel scale.
(() => {
  const stage = E.stage;
  if (!stage) return;

  const baseResetImageView = resetImageView;

  function rulerInfo() {
    const rulerX = stage.querySelector('.ruler-x');
    const rulerY = stage.querySelector('.ruler-y');
    if (!rulerX || !rulerY) return null;

    const sr = stage.getBoundingClientRect();
    const xr = rulerX.getBoundingClientRect();
    const yr = rulerY.getBoundingClientRect();
    if (!xr.width || !yr.height) return null;

    const labels = [...rulerX.querySelectorAll('.ruler-label')]
      .map((el) => Number(String(el.textContent || '').replace(/[^0-9.-]/g, '')))
      .filter(Number.isFinite);
    const maxX = labels.length ? Math.max(...labels) : 0;
    if (!maxX) return null;

    return {
      originX: xr.left - sr.left,
      originY: yr.top - sr.top,
      scale: xr.width / maxX,
    };
  }

  function alignImageToOrigin() {
    if (!S.file || !S.nw || !S.nh) return false;
    const info = rulerInfo();
    if (!info || !Number.isFinite(info.scale) || info.scale <= 0) return false;

    S.fitScale = info.scale;
    S.view.scale = info.scale;
    S.view.width = S.nw * info.scale;
    S.view.height = S.nh * info.scale;
    S.view.x = info.originX;
    S.view.y = info.originY;

    // Initial crop origin is also 0,0 in the fixed ruler workspace.
    if (S.crop) {
      S.crop.x = info.originX;
      S.crop.y = info.originY;
    }

    drawImageView();
    if (S.crop) drawCropFrame();
    updateZoomUI();
    return true;
  }

  // Every new image load and the Fit button use the same predictable origin:
  // source image top-left == ruler 0,0. No centering.
  resetImageView = function resetImageViewAtRulerOrigin() {
    if (alignImageToOrigin()) return;
    return baseResetImageView();
  };

  // Expose a tiny hook for debugging / future UI without coupling other modules.
  window.__alignImageToRulerOrigin = alignImageToOrigin;
})();
