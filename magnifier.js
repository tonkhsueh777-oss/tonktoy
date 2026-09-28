// Precision magnifier: preview lives above crop-ratio controls. Visual aid only.
(() => {
  const stage = E.stage;
  const toolbar = document.querySelector('.toolbar-actions');
  const controlsPanel = document.querySelector('.controls-panel');
  const uploadSection = controlsPanel?.querySelector('.upload-section');
  const ratioSection = uploadSection?.nextElementSibling;
  if (!stage || !toolbar || !controlsPanel || !ratioSection) return;

  document.getElementById('magnifierControls')?.remove();
  document.getElementById('magnifierPanel')?.remove();
  document.getElementById('magnifierLens')?.remove();

  const controls = document.createElement('div');
  controls.id = 'magnifierControls';
  controls.innerHTML = `
    <button id="magnifierMinus" type="button" title="降低放大倍率">🔍−</button>
    <button id="magnifierToggle" type="button" title="开启/关闭放大镜">放大镜 2×</button>
    <button id="magnifierPlus" type="button" title="提高放大倍率">🔍＋</button>
  `;
  toolbar.prepend(controls);

  const style = document.createElement('style');
  style.textContent = `
    #magnifierControls{display:inline-flex;align-items:center;gap:5px;margin-right:4px}
    #magnifierControls button{height:32px;padding:0 9px;border:1px solid #29445f;border-radius:7px;background:#0c1725;color:#d6e3ef;cursor:pointer;font-size:12px;white-space:nowrap}
    #magnifierControls button:hover{border-color:#3a95ff;color:#fff}
    #magnifierControls button.active{background:#0d5fc8;border-color:#55adff;color:#fff}
    #magnifierControls button:disabled{opacity:.4;cursor:default}

    #magnifierPanel{padding-top:12px;padding-bottom:12px}
    #magnifierPanel .magnifier-panel-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
    #magnifierPanel .magnifier-panel-heading strong{font-size:13px;color:#e5eef8}
    #magnifierPanel .magnifier-panel-heading span{font-size:10px;color:#71859a}
    #magnifierLens{position:relative;width:100%;height:160px;border:1px solid #3f7fb5;border-radius:10px;background:#07111f;box-shadow:inset 0 0 0 1px rgba(127,192,255,.08);pointer-events:none;overflow:hidden;display:none}
    #magnifierLens canvas{width:100%;height:100%;display:block;image-rendering:pixelated}
    #magnifierBadge{position:absolute;left:50%;bottom:7px;transform:translateX(-50%);padding:4px 8px;border-radius:999px;background:rgba(4,12,22,.9);color:#eaf5ff;font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap;border:1px solid rgba(127,192,255,.4)}
    #magnifierHint{position:absolute;left:8px;top:7px;padding:3px 6px;border-radius:5px;background:rgba(4,12,22,.82);color:#9fc8ee;font-size:9px;border:1px solid rgba(127,192,255,.25)}
    #magnifierOff{display:flex;height:100%;align-items:center;justify-content:center;color:#61768b;font-size:11px}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.id = 'magnifierPanel';
  panel.className = 'control-section';
  panel.innerHTML = `
    <div class="magnifier-panel-heading">
      <strong>放大预览</strong>
      <span>移动鼠标查看细节</span>
    </div>
  `;

  const lens = document.createElement('div');
  lens.id = 'magnifierLens';
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 320;
  const badge = document.createElement('div');
  badge.id = 'magnifierBadge';
  const hint = document.createElement('div');
  hint.id = 'magnifierHint';
  hint.textContent = '移动鼠标查看细节';
  lens.append(canvas, hint, badge);

  const off = document.createElement('div');
  off.id = 'magnifierOff';
  off.textContent = '点击上方「放大镜」开启';

  panel.append(lens, off);
  controlsPanel.insertBefore(panel, ratioSection);

  const ctx = canvas.getContext('2d');
  const minus = document.getElementById('magnifierMinus');
  const plus = document.getElementById('magnifierPlus');
  const toggle = document.getElementById('magnifierToggle');

  const LEVELS = [2, 3, 4, 6, 8];
  let levelIndex = 0;
  let enabled = false;
  let lastClient = null;

  const mag = () => LEVELS[levelIndex];

  function imageCenterClient() {
    const r = E.img.getBoundingClientRect();
    return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
  }

  function renderLens(pointer) {
    if (!enabled || !S.file || !E.img.naturalWidth || !S.nw || !S.nh) {
      lens.style.display = 'none';
      off.style.display = 'flex';
      return;
    }

    const imageRect = E.img.getBoundingClientRect();
    if (!imageRect.width || !imageRect.height) {
      lens.style.display = 'none';
      off.style.display = 'flex';
      return;
    }

    const p = pointer || imageCenterClient();
    const clampedX = Math.max(imageRect.left, Math.min(imageRect.right, p.clientX));
    const clampedY = Math.max(imageRect.top, Math.min(imageRect.bottom, p.clientY));
    const sourceX = ((clampedX - imageRect.left) / imageRect.width) * S.nw;
    const sourceY = ((clampedY - imageRect.top) / imageRect.height) * S.nh;

    const factor = mag();
    const sampleCssW = 280 / factor;
    const sampleCssH = 160 / factor;
    const sampleW = Math.max(1, sampleCssW / imageRect.width * S.nw);
    const sampleH = Math.max(1, sampleCssH / imageRect.height * S.nh);
    let sx = sourceX - sampleW / 2;
    let sy = sourceY - sampleH / 2;
    sx = Math.max(0, Math.min(Math.max(0, S.nw - sampleW), sx));
    sy = Math.max(0, Math.min(Math.max(0, S.nh - sampleH), sy));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#06101d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(E.img, sx, sy, sampleW, sampleH, 0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = '#32a8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.restore();

    badge.textContent = `${factor}× · X${Math.round(sourceX)} Y${Math.round(sourceY)}`;
    off.style.display = 'none';
    lens.style.display = 'block';
  }

  function syncUI() {
    toggle.textContent = `放大镜 ${mag()}×`;
    toggle.classList.toggle('active', enabled);
    minus.disabled = levelIndex === 0;
    plus.disabled = levelIndex === LEVELS.length - 1;
    if (!enabled) {
      lens.style.display = 'none';
      off.style.display = 'flex';
    } else {
      renderLens(lastClient || imageCenterClient());
    }
  }

  stage.addEventListener('pointermove', (event) => {
    const r = E.img.getBoundingClientRect();
    if (event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom) {
      lastClient = { clientX: event.clientX, clientY: event.clientY };
      renderLens(lastClient);
    }
  }, true);

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
