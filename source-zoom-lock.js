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

    if (S.view.width >= S.crop.width && S.view.height >= S.crop.height) clampViewIntoFrame();
    else window.__workspacePrecision?.clampImageToRulerBounds?.();
    drawImageView();
    updateZoomUI();
    markDirty(message);
  };

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

// Personalized Xue Dao branding. Keep the supplied portrait fully visible.
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
    #xuedaoSidebarCard{width:100%;box-sizing:border-box;margin:0 0 18px;border:1px solid #27405b;border-radius:14px;overflow:hidden;background:#07111f;box-shadow:0 10px 24px rgba(0,0,0,.22)}
    #xuedaoSidebarCard img{display:block;width:100%;height:auto;max-height:none;object-fit:contain;object-position:center top;background:#07111f}
  `;
  document.head.appendChild(brandingStyle);

  const card = document.createElement('div');
  card.id = 'xuedaoSidebarCard';
  card.setAttribute('aria-label', '薛导图片');
  const img = document.createElement('img');
  img.alt = '薛导帮你裁剪图片';
  img.decoding = 'async';
  img.src = './assets/xuedao.webp?v=20260930-portrait';
  card.appendChild(img);
  controls.insertBefore(card, firstSection);
})();
