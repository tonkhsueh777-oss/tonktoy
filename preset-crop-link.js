// Make “常用尺寸” presets explicitly drive the white crop frame.
// Loaded before precision-crop.js so a preset click may intentionally unlock crop-size lock.
(() => {
  const presets = E.presets || document.getElementById('presetGrid');
  const stage = E.stage || document.getElementById('editorStage');
  const image = E.img || document.getElementById('editorImage');
  if (!presets || !stage || !image) return;

  function imageBounds() {
    const sr = stage.getBoundingClientRect();
    const ir = image.getBoundingClientRect();
    return {
      left: ir.left - sr.left,
      top: ir.top - sr.top,
      right: ir.right - sr.left,
      bottom: ir.bottom - sr.top,
      width: ir.width,
      height: ir.height,
    };
  }

  function matchingRatioButton(ratio) {
    const buttons = [...document.querySelectorAll('#ratioGrid .ratio-btn')];
    return buttons.find((button) => {
      if (button.dataset.aspect === 'free') return false;
      const value = Number(button.dataset.aspect);
      return Number.isFinite(value) && Math.abs(value - ratio) < 0.0005;
    }) || null;
  }

  // Runs before precision-crop.js' document capture listener.
  // Choosing a preset is an explicit request to change crop size, so unlock the size lock first.
  document.addEventListener('click', (event) => {
    const button = event.target.closest('#presetGrid button[data-width][data-height]');
    if (!button) return;
    const controller = window.__precisionCropController;
    if (controller?.sizeLocked) controller.setSizeLocked(false);
  }, true);

  function applyPresetCrop(button) {
    if (!S.file || !S.nw || !S.nh || !S.view.width || !S.view.height) return;

    const targetW = Number(button.dataset.width);
    const targetH = Number(button.dataset.height);
    if (!(targetW > 0) || !(targetH > 0)) return;

    const b = imageBounds();
    if (!(b.width > 0) || !(b.height > 0)) return;

    // Convert requested source pixels to displayed crop pixels.
    const pxX = b.width / S.nw;
    const pxY = b.height / S.nh;
    let width = targetW * pxX;
    let height = targetH * pxY;

    // If preset is larger than the source, keep its aspect ratio and fit inside the source image.
    const fit = Math.min(1, b.width / width, b.height / height);
    width *= fit;
    height *= fit;

    // Keep the current crop center when possible so the composition does not jump unexpectedly.
    const fallbackCenterX = b.left + b.width / 2;
    const fallbackCenterY = b.top + b.height / 2;
    const centerX = S.crop ? S.crop.x + S.crop.width / 2 : fallbackCenterX;
    const centerY = S.crop ? S.crop.y + S.crop.height / 2 : fallbackCenterY;

    let x = centerX - width / 2;
    let y = centerY - height / 2;
    x = Math.min(Math.max(x, b.left), Math.max(b.left, b.right - width));
    y = Math.min(Math.max(y, b.top), Math.max(b.top, b.bottom - height));

    S.crop = { x, y, width, height };
    S.outRatio = targetW / targetH;

    // Keep output fields and ratio selector in sync with the preset.
    E.w.value = String(targetW);
    E.h.value = String(targetH);
    document.querySelectorAll('#ratioGrid .ratio-btn').forEach((item) => item.classList.remove('active'));
    const ratioButton = matchingRatioButton(S.outRatio);
    (ratioButton || document.querySelector('#ratioGrid .ratio-btn[data-aspect="free"]'))?.classList.add('active');

    drawCropFrame();
    summary();
    markDirty(`已套用常用尺寸 ${targetW}×${targetH}，裁切框已同步。`);
  }

  // app.js applies the output preset first; this listener then makes the crop frame match it exactly.
  presets.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-width][data-height]');
    if (!button) return;
    applyPresetCrop(button);
  });

  window.__presetCropLink = { applyPresetCrop };
})();
