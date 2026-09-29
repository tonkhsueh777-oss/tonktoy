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

    // Shrinking is allowed, but the image's left/top edges may never cross ruler 0,0.
    window.__workspacePrecision?.clampImageToRulerBounds?.();
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

// Personalized Xue Dao branding: change the main title and place the supplied image
// directly above the crop-ratio controls without adding another upload dependency.
(() => {
  const title = '我是薛导，我来帮你裁剪图片。';
  document.title = title;
  const heading = document.querySelector('.brand h1');
  if (heading) heading.textContent = title;

  const controls = document.querySelector('.controls-panel');
  const firstSection = controls?.querySelector('.control-section');
  if (!controls || !firstSection || document.getElementById('xuedaoSidebarCard')) return;

  const brandingStyle = document.createElement('style');
  brandingStyle.id = 'xuedaoBrandingStyle';
  brandingStyle.textContent = `
    #xuedaoSidebarCard{width:100%;box-sizing:border-box;margin:0 0 18px;border:1px solid #27405b;border-radius:14px;overflow:hidden;background:#0a1421;box-shadow:0 10px 24px rgba(0,0,0,.22)}
    #xuedaoSidebarCard img{display:block;width:100%;height:180px;object-fit:cover;object-position:center 24%;background:#07111f}
    @media (max-width:1180px){#xuedaoSidebarCard img{height:160px}}
  `;
  document.head.appendChild(brandingStyle);

  const card = document.createElement('div');
  card.id = 'xuedaoSidebarCard';
  card.setAttribute('aria-label', '薛导图片');
  const img = document.createElement('img');
  img.alt = '薛导帮你裁剪图片';
  img.decoding = 'async';
  img.src = 'data:image/webp;base64,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';
  card.appendChild(img);
  controls.insertBefore(card, firstSection);
})();
