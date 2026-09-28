// Precision magnifier for crop alignment. Visual aid only; never changes image/export size.
(() => {
  const stage = E.stage;
  const toolbar = document.querySelector('.toolbar-actions');
  if (!stage || !toolbar) return;

  const controls = document.createElement('div');
  controls.id = 'magnifierControls';
  controls.innerHTML = `
    <button id="magnifierMinus" type="button" title="降低放大镜倍率" aria-label="降低放大镜倍率">🔍−</button>
    <button id="magnifierToggle" type="button" title="开启/关闭放大镜">放大镜 2×</button>
    <button id="magnifierPlus" type="button" title="提高放大镜倍率" aria-label="提高放大镜倍率">🔍＋</button>
  `;
  toolbar.prepend(controls);

  const style = document.createElement('style');
  style.textContent = `
    #magnifierControls{display:inline-flex;align-items:center;gap:5px;margin-right:4px}
    #magnifierControls button{height:32px;padding:0 9px;border:1px solid #203650;border-radius:7px;background:#0c1725;color:#c9d7e7;cursor:pointer;font-size:12px;white-space:nowrap}
    #magnifierControls button:hover{border-color:#3a95ff;color:#fff}
    #magnifierControls button.active{background:#0d5fc8;border-color:#3a95ff;color:#fff}
    #magnifierLens{position:absolute;z-index:60;width:184px;height:184px;border:2px solid #7fc0ff;border-radius:50%;background:#07111f;box-shadow:0 12px 36px rgba(0,0,0,.5),0 0 0 3px rgba(22,119,255,.16);pointer-events:none;overflow:hidden;display:none}
    #magnifierLens canvas{width:180px;height:180px;display:block}
    #magnifierBadge{position:absolute;left:50%;bottom:7px;transform:translateX(-50%);padding:3px 7px;border-radius:999px;background:rgba(4,12,22,.86);color:#eaf5ff;font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap;border:1px solid rgba(127,192,255,.35)}
    @media(max-width:900px){#magnifierControls{order:-1;width:100%}}
  `;
  document.head.appendChild(style);

  const lens = document.createElement('div');
  lens.id = 'magnifierLens';
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 180;
  const badge = document.createElement('div');
  badge.id = 'magnifierBadge';
  lens.append(canvas, badge);
  stage.appendChild(lens);

  const ctx = canvas.getContext('2d');
  const minus = document.getElementById('magnifierMinus');
  const plus = document.getElementById('magnifierPlus');
  const toggle = document.getElementById('magnifierToggle');

  const LEVELS = [2, 3, 4, 6, 8];
  let levelIndex = 0;
  let enabled = false;
  let lastPointer = null;

  function magnification() { return LEVELS[levelIndex]; }

  function syncUI() {
    const mag = magnification();
    toggle.textContent = `放大镜 ${mag}×`;
    toggle.classList.toggle('active', enabled);
    minus.disabled = levelIndex === 0;
    plus.disabled = levelIndex === LEVELS.length - 1;
    if (!enabled) lens.style.display = 'none';
    else if (lastPointer) renderLens(lastPointer);
  }

  function stagePoint(event) {
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
  }

  function renderLens(point) {
    if (!enabled || !S.file || !S.view.width || !S.view.height || !E.img.naturalWidth) {
      lens.style.display = 'none';
      return;
    }

    const x = point.x;
    const y = point.y;
    const insideImage = x >= S.view.x && x <= S.view.x + S.view.width && y >= S.view.y && y <= S.view.y + S.view.height;
    if (!insideImage) {
      lens.style.display = 'none';
      return;
    }

    const mag = magnification();
    const sourceX = ((x - S.view.x) / S.view.width) * S.nw;
    const sourceY = ((y - S.view.y) / S.view.height) * S.nh;
    const sampleCss = canvas.width / mag;
    const sampleW = (sampleCss / S.view.width) * S.nw;
    const sampleH = (sampleCss / S.view.height) * S.nh;
    let sx = sourceX - sampleW / 2;
    let sy = sourceY - sampleH / 2;
    sx = Math.max(0, Math.min(Math.max(0, S.nw - sampleW), sx));
    sy = Math.max(0, Math.min(Math.max(0, S.nh - sampleH), sy));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#06101d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(E.img, sx, sy, sampleW, sampleH, 0, 0, canvas.width, canvas.height);

    // Draw current crop-frame edges inside the magnifier when they pass through the sampled area.
    try {
      const crop = cropSourceRect();
      if (crop) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        const left = ((crop.sx - sx) / sampleW) * canvas.width;
        const right = (((crop.sx + crop.sw) - sx) / sampleW) * canvas.width;
        const top = ((crop.sy - sy) / sampleH) * canvas.height;
        const bottom = (((crop.sy + crop.sh) - sy) / sampleH) * canvas.height;
        [left, right].forEach((px) => { if (px >= 0 && px <= canvas.width) { ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height); ctx.stroke(); } });
        [top, bottom].forEach((py) => { if (py >= 0 && py <= canvas.height) { ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); ctx.stroke(); } });
        ctx.restore();
      }
    } catch (_) {}

    // Center crosshair for precise visual alignment.
    ctx.save();
    ctx.strokeStyle = '#35a2ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.restore();

    badge.textContent = `${mag}× · X${Math.round(sourceX)} Y${Math.round(sourceY)}`;

    const lensSize = 184;
    const stageRectNow = stage.getBoundingClientRect();
    let left = x + 22;
    let top = y + 22;
    if (left + lensSize > stageRectNow.width - 8) left = x - lensSize - 22;
    if (top + lensSize > stageRectNow.height - 8) top = y - lensSize - 22;
    left = Math.max(8, left);
    top = Math.max(8, top);
    lens.style.left = `${left}px`;
    lens.style.top = `${top}px`;
    lens.style.display = 'block';
  }

  stage.addEventListener('mousemove', (event) => {
    lastPointer = stagePoint(event);
    renderLens(lastPointer);
  }, true);

  stage.addEventListener('mouseleave', () => {
    lastPointer = null;
    lens.style.display = 'none';
  });

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    syncUI();
  });

  minus.addEventListener('click', () => {
    if (levelIndex > 0) levelIndex -= 1;
    enabled = true;
    syncUI();
  });

  plus.addEventListener('click', () => {
    if (levelIndex < LEVELS.length - 1) levelIndex += 1;
    enabled = true;
    syncUI();
  });

  syncUI();
})();
