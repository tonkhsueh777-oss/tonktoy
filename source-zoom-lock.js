// Allow source image zoom below 100% and provide a dedicated scale-only lock.
(() => {
  const stage = E.stage;
  if (!stage || typeof Z === 'undefined') return;

  const MIN_ZOOM = 25;
  const MAX_ZOOM = 400;
  let zoomLocked = false;

  Z.input.min = String(MIN_ZOOM);
  Z.input.max = String(MAX_ZOOM);
  Z.input.step = '1';

  const lock = document.createElement('button');
  lock.id = 'sourceZoomLock';
  lock.type = 'button';
  lock.title = '锁定原图缩放比例，但仍可拖动原图位置';
  lock.setAttribute('aria-pressed', 'false');
  lock.textContent = '🔓';
  Z.value.insertAdjacentElement('afterend', lock);

  const style = document.createElement('style');
  style.textContent = `
    #sourceZoomLock{width:32px;height:30px;border:1px solid #29445f;border-radius:7px;background:#0c1725;color:#d6e3ef;cursor:pointer;font-size:14px;line-height:1;display:grid;place-items:center}
    #sourceZoomLock:hover{border-color:#3a95ff;color:#fff}
    #sourceZoomLock.locked{background:#7a4c00;border-color:#ffb74d;color:#fff}
  `;
  document.head.appendChild(style);

  function sourceZoomPercent() {
    if (!S.file || !S.fitScale) return 100;
    return Math.round((S.view.scale / S.fitScale) * 100);
  }

  function refreshDisabledState() {
    const imageLocked = stage.classList.contains('image-locked');
    const disabled = !S.file || imageLocked || zoomLocked;
    Z.input.disabled = disabled;
    Z.in.disabled = disabled;
    Z.out.disabled = disabled;
  }

  updateZoomUI = function updateZoomUIWithShrink() {
    const percent = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, sourceZoomPercent()));
    Z.input.value = String(percent);
    Z.value.textContent = `${percent}%`;
    refreshDisabledState();
  };

  setZoomPercent = function setZoomPercentWithShrink(percent, message = '已缩放原图，请按「确认裁切」。') {
    if (!S.file || !S.crop || !S.fitScale || zoomLocked || stage.classList.contains('image-locked')) return;
    const nextPercent = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(percent) || 100));
    const anchorX = S.crop.x + S.crop.width / 2;
    const anchorY = S.crop.y + S.crop.height / 2;
    const relX = S.view.width ? (anchorX - S.view.x) / S.view.width : 0.5;
    const relY = S.view.height ? (anchorY - S.view.y) / S.view.height : 0.5;

    S.view.scale = S.fitScale * (nextPercent / 100);
    S.view.width = S.nw * S.view.scale;
    S.view.height = S.nh * S.view.scale;
    S.view.x = anchorX - relX * S.view.width;
    S.view.y = anchorY - relY * S.view.height;

    // Do not force the image back up to crop size. Shrinking below 100% is intentional.
    drawImageView();
    updateZoomUI();
    markDirty(message);
  };

  // Stop the original wheel zoom handler before it runs when scale is locked.
  stage.addEventListener('wheel', (event) => {
    if (!zoomLocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('原图缩放已锁定；仍可拖动原图位置。');
  }, { capture: true, passive: false });

  lock.addEventListener('click', () => {
    zoomLocked = !zoomLocked;
    lock.classList.toggle('locked', zoomLocked);
    lock.setAttribute('aria-pressed', String(zoomLocked));
    lock.textContent = zoomLocked ? '🔒' : '🔓';
    lock.title = zoomLocked ? '缩放已锁：比例固定，仍可拖动原图' : '缩放未锁：可缩小或放大原图';
    refreshDisabledState();
    setStatus(zoomLocked ? `缩放已锁：固定 ${sourceZoomPercent()}%，仍可拖动原图位置。` : '缩放已解锁：可以缩小或放大原图。');
  });

  // Keep the dedicated zoom lock compatible with the existing full image lock and file-load state.
  new MutationObserver(refreshDisabledState).observe(stage, { attributes: true, attributeFilter: ['class'] });
  document.getElementById('fileInput')?.addEventListener('change', () => setTimeout(refreshDisabledState, 0));

  window.SourceZoomLock = {
    get locked() { return zoomLocked; },
    setLocked(next) {
      if (!!next !== zoomLocked) lock.click();
    },
  };

  updateZoomUI();
})();
