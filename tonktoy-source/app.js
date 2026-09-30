const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const E = {
  file: $('#fileInput'),
  drop: $('#dropZone'),
  emptyUpload: $('#emptyUploadBtn'),
  empty: $('#emptyState'),
  stage: $('#editorStage'),
  img: $('#editorImage'),
  box: $('#cropBox'),
  sourceName: $('#sourceName'),
  sourceInfo: $('#sourceInfo'),
  readout: $('#cropReadout'),
  w: $('#outputWidth'),
  h: $('#outputHeight'),
  lock: $('#lockRatio'),
  quality: $('#qualityRange'),
  qualityValue: $('#qualityValue'),
  qualityHint: $('#qualityHint'),
  name: $('#filenameInput'),
  keep: $('#keepOriginalName'),
  ext: $('#extensionLabel'),
  preview: $('#previewImage'),
  previewEmpty: $('#previewPlaceholder'),
  previewMeta: $('#previewMeta'),
  sumSize: $('#summarySize'),
  sumFormat: $('#summaryFormat'),
  sumQuality: $('#summaryQuality'),
  sumFile: $('#summaryFileSize'),
  download: $('#downloadBtn'),
  status: $('#statusMessage'),
  ratios: $('#ratioGrid'),
  presets: $('#presetGrid'),
  reset: $('#resetCropBtn'),
  fit: $('#fitBtn'),
  clear: $('#clearBtn'),
};

const apply = document.createElement('button');
apply.id = 'applyCropBtn';
apply.className = 'icon-button';
apply.type = 'button';
apply.textContent = '确认裁切';
apply.title = '确认当前裁切范围';
apply.disabled = true;
$('.toolbar-actions')?.prepend(apply);
E.apply = apply;

const webpRadio = $('input[name="format"][value="webp"]');
if (webpRadio) webpRadio.checked = true;

E.box.style.pointerEvents = 'none';
$$('.crop-handle').forEach((handle) => {
  handle.style.display = 'none';
});

const zoomBar = document.createElement('div');
zoomBar.id = 'zoomControls';
zoomBar.innerHTML = `
  <button id="zoomOutBtn" type="button" aria-label="缩小原图">−</button>
  <span class="zoom-label">原图缩放</span>
  <input id="zoomRange" type="range" min="100" max="400" step="1" value="100" disabled />
  <button id="zoomInBtn" type="button" aria-label="放大原图">＋</button>
  <strong id="zoomValue">100%</strong>
  <span class="zoom-help">放大后可拖动原图调整构图</span>
`;
E.stage.insertAdjacentElement('afterend', zoomBar);
const Z = {
  bar: zoomBar,
  out: $('#zoomOutBtn'),
  input: $('#zoomRange'),
  in: $('#zoomInBtn'),
  value: $('#zoomValue'),
};
const zoomStyle = document.createElement('style');
zoomStyle.textContent = `
  #zoomControls{display:flex;align-items:center;gap:10px;padding:10px 4px 2px;color:#8fa5bd;font-size:12px}
  #zoomControls button{width:32px;height:30px;border:1px solid #203650;border-radius:7px;background:#0c1725;color:#edf5ff;cursor:pointer;font-size:18px;line-height:1}
  #zoomControls button:disabled,#zoomControls input:disabled{opacity:.4;cursor:not-allowed}
  #zoomControls .zoom-label{white-space:nowrap;color:#b9c7d7}
  #zoomControls input{flex:1;min-width:120px;accent-color:#1677ff}
  #zoomControls strong{min-width:44px;text-align:right;color:#edf5ff}
  #zoomControls .zoom-help{white-space:nowrap;color:#667f9c}
  @media(max-width:900px){#zoomControls{flex-wrap:wrap}.zoom-help{width:100%}}
`;
document.head.appendChild(zoomStyle);
E.stage.style.cursor = 'grab';
E.stage.title = '拖动原图调整位置；滚轮或下方滑杆缩放';

const S = {
  file: null,
  srcUrl: null,
  previewUrl: null,
  nw: 0,
  nh: 0,
  crop: null,
  outRatio: 1200 / 750,
  fitScale: 1,
  view: { x: 0, y: 0, width: 0, height: 0, scale: 1 },
  dragging: null,
  dirty: false,
  timer: 0,
  token: 0,
  loadToken: 0,
  blob: null,
  loading: false,
  rendering: false,
  saving: false,
};

const types = new Set(['image/jpeg', 'image/png', 'image/webp']);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const fmtBytes = (n) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1048576).toFixed(2)} MB`;

const cleanName = (value = '') => {
  const name = String(value)
    .trim()
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return name || 'image';
};

const currentFormat = () => $('input[name="format"]:checked')?.value || 'webp';
const currentMime = () => ({ jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' })[currentFormat()];
const currentExt = () => ({ jpg: 'jpg', png: 'png', webp: 'webp' })[currentFormat()];

function setStatus(message, kind = '') {
  E.status.textContent = message;
  E.status.className = `status-message${kind ? ` ${kind}` : ''}`;
}

// All preview/export transitions share one revision. Stale encodes never publish.
function syncWorkflow() {
  const dims = validDims();
  const ready = !!S.file && !!S.blob && !S.dirty && !S.loading && !S.rendering && !!dims;
  E.download.disabled = !ready || S.saving;
  E.download.textContent = S.saving ? '正在保存…' : '↓ 下载图片';
  E.apply.disabled = !S.file || S.loading || S.rendering || !dims || (!S.dirty && !!S.blob);
  E.apply.textContent = S.rendering ? '正在处理…' : '确认裁切';
  E.preview.setAttribute('aria-busy', String(S.rendering));
  const note = document.getElementById('previewState');
  if (note) {
    note.textContent = S.loading ? '正在读取图片…' : !S.file ? '尚未导入图片' : !dims ? '请检查输出尺寸' : S.rendering ? '正在生成预览…' : S.dirty ? '构图已变更 · 请确认裁切' : ready ? '预览已更新 · 可以下载' : '等待生成预览';
    note.dataset.state = ready ? 'ready' : S.dirty ? 'pending' : 'idle';
  }
  const change = document.getElementById('changeImageBtn');
  if (change) change.textContent = S.file ? '更换图片' : '选择图片';
  E.w.setAttribute('aria-invalid', String(!Number.isInteger(Number(E.w.value)) || Number(E.w.value) < 1 || Number(E.w.value) > 12000));
  E.h.setAttribute('aria-invalid', String(!Number.isInteger(Number(E.h.value)) || Number(E.h.value) < 1 || Number(E.h.value) > 12000));
}

function invalidatePreview() {
  ++S.token;
  clearTimeout(S.timer);
  S.blob = null;
  S.rendering = false;
  E.sumFile.textContent = '—';
  syncWorkflow();
}

function validDims() {
  const width = Number(E.w.value);
  const height = Number(E.h.value);
  return Number.isInteger(width) && width > 0 && width <= 12000 && Number.isInteger(height) && height > 0 && height <= 12000
    ? [width, height]
    : null;
}

function outputRatio() {
  const dims = validDims();
  return dims ? dims[0] / dims[1] : S.outRatio || 1;
}

function summary() {
  const fmt = currentFormat();
  E.sumSize.textContent = `${E.w.value || 0} × ${E.h.value || 0}`;
  E.sumFormat.textContent = fmt.toUpperCase();
  E.sumQuality.textContent = fmt === 'png' ? '无损' : `${E.quality.value}%`;
  E.ext.textContent = `.${currentExt()}`;
  E.qualityValue.textContent = fmt === 'png' ? '无损' : `${E.quality.value}%`;
  E.quality.disabled = fmt === 'png';
  const ratioButtons = $$('.ratio-btn');
  const activeRatio = ratioButtons.find((button) => button.classList.contains('active'));
  if (activeRatio && activeRatio.dataset.aspect !== 'free' && validDims()) {
    const ratio = Number(E.w.value) / Number(E.h.value);
    if (Math.abs(Number(activeRatio.dataset.aspect) - ratio) > .002) {
      const matching = ratioButtons.find((button) => Math.abs(Number(button.dataset.aspect) - ratio) < .002);
      ratioButtons.forEach((button) => button.classList.toggle('active', button === matching || (!matching && button.dataset.aspect === 'free')));
    }
  }
  ratioButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
  $$('#presetGrid button').forEach((button) => {
    const selected = button.dataset.width === E.w.value && button.dataset.height === E.h.value;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  E.qualityHint.textContent = fmt === 'png'
    ? 'PNG 为无损输出，品质滑杆不生效；缩小尺寸可有效降低体积。'
    : fmt === 'webp'
      ? 'WebP 推荐用于网页；80% 通常兼顾清晰度与档案大小。'
      : 'JPG 适合一般照片；80% 通常适合网页使用。';
}

function stageRect() {
  return E.stage.getBoundingClientRect();
}

function updateReadout() {
  if (!S.file || !S.crop || !S.view.width || !S.view.height) {
    E.readout.textContent = '—';
    return;
  }
  const width = Math.round((S.crop.width / S.view.width) * S.nw);
  const height = Math.round((S.crop.height / S.view.height) * S.nh);
  E.readout.textContent = `${width} × ${height}px`;
}

function drawCropFrame() {
  if (!S.crop) return;
  Object.assign(E.box.style, {
    left: `${S.crop.x}px`,
    top: `${S.crop.y}px`,
    width: `${S.crop.width}px`,
    height: `${S.crop.height}px`,
  });
  E.box.hidden = false;
  updateReadout();
}

function computeCropFrame() {
  const rect = stageRect();
  const margin = 18;
  const maxWidth = Math.max(120, rect.width - margin * 2);
  const maxHeight = Math.max(120, rect.height - margin * 2);
  const ratio = outputRatio();
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  return {
    x: (rect.width - width) / 2,
    y: (rect.height - height) / 2,
    width,
    height,
  };
}

function drawImageView() {
  Object.assign(E.img.style, {
    display: 'block',
    position: 'absolute',
    left: `${S.view.x}px`,
    top: `${S.view.y}px`,
    width: `${S.view.width}px`,
    height: `${S.view.height}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    transform: 'none',
    margin: '0',
    inset: 'auto',
  });
  updateReadout();
}

function clampViewIntoFrame() {
  if (!S.crop) return;
  const minWidth = S.crop.width;
  const minHeight = S.crop.height;
  if (S.view.width < minWidth || S.view.height < minHeight) {
    const nextScale = Math.max(minWidth / S.nw, minHeight / S.nh, S.view.scale);
    S.view.scale = nextScale;
    S.view.width = S.nw * nextScale;
    S.view.height = S.nh * nextScale;
  }
  if (S.view.x > S.crop.x) S.view.x = S.crop.x;
  if (S.view.y > S.crop.y) S.view.y = S.crop.y;
  if (S.view.x + S.view.width < S.crop.x + S.crop.width) S.view.x = S.crop.x + S.crop.width - S.view.width;
  if (S.view.y + S.view.height < S.crop.y + S.crop.height) S.view.y = S.crop.y + S.crop.height - S.view.height;
}

function resetImageView() {
  if (!S.file || !S.crop) return;
  S.fitScale = Math.max(S.crop.width / S.nw, S.crop.height / S.nh);
  S.view.scale = S.fitScale;
  S.view.width = S.nw * S.view.scale;
  S.view.height = S.nh * S.view.scale;
  S.view.x = S.crop.x + (S.crop.width - S.view.width) / 2;
  S.view.y = S.crop.y + (S.crop.height - S.view.height) / 2;
  clampViewIntoFrame();
  drawImageView();
  updateZoomUI();
}

function updateZoomUI() {
  if (!S.file || !S.fitScale) {
    Z.input.value = '100';
    Z.value.textContent = '100%';
    return;
  }
  const percent = Math.round((S.view.scale / S.fitScale) * 100);
  Z.input.value = String(clamp(percent, 100, 400));
  Z.value.textContent = `${clamp(percent, 100, 400)}%`;
}

function setZoomPercent(percent, message = '已缩放原图，请按「确认裁切」。') {
  if (!S.file || !S.crop || !S.fitScale) return;
  const nextPercent = clamp(Number(percent) || 100, 100, 400);
  const anchorX = S.crop.x + S.crop.width / 2;
  const anchorY = S.crop.y + S.crop.height / 2;
  const relX = (anchorX - S.view.x) / S.view.width;
  const relY = (anchorY - S.view.y) / S.view.height;
  S.view.scale = S.fitScale * (nextPercent / 100);
  S.view.width = S.nw * S.view.scale;
  S.view.height = S.nh * S.view.scale;
  S.view.x = anchorX - relX * S.view.width;
  S.view.y = anchorY - relY * S.view.height;
  clampViewIntoFrame();
  drawImageView();
  updateZoomUI();
  markDirty(message);
}

function markDirty(message = '已调整原图位置或缩放，请按「确认裁切」。') {
  if (!S.file) return;
  S.dirty = true;
  invalidatePreview();
  setStatus(message);
}

function requestRender() {
  summary();
  invalidatePreview();
  if (!S.file || S.dirty || S.loading) return;
  S.timer = setTimeout(() => {
    render(true);
  }, 160);
}

function updateFrame(message = '') {
  if (!S.file) return;
  S.crop = computeCropFrame();
  drawCropFrame();
  resetImageView();
  if (message) markDirty(message);
}

function cropSourceRect() {
  if (!S.crop) return null;
  return {
    sx: ((S.crop.x - S.view.x) / S.view.width) * S.nw,
    sy: ((S.crop.y - S.view.y) / S.view.height) * S.nh,
    sw: (S.crop.width / S.view.width) * S.nw,
    sh: (S.crop.height / S.view.height) * S.nh,
  };
}

function toBlob(canvas, format = currentFormat(), quality = Number(E.quality.value)) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('浏览器无法输出这个图片格式。'))),
      ({ jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' })[format],
      format === 'png' ? undefined : quality / 100,
    );
  });
}

async function render(quiet = true) {
  if (!S.file || !S.crop || S.loading) return null;
  const token = ++S.token;
  const dims = validDims();
  if (!dims) {
    E.download.disabled = true;
    if (!quiet) setStatus('请输入 1～12000 之间的有效宽高。', 'error');
    return null;
  }
  const format = currentFormat();
  const mime = currentMime();
  S.rendering = true;
  syncWorkflow();
  try {
    const source = cropSourceRect();
    if (!source || source.sw <= 0 || source.sh <= 0) throw new Error('裁切区域无效，请重新调整。');
    const canvas = document.createElement('canvas');
    canvas.width = dims[0];
    canvas.height = dims[1];
    const ctx = canvas.getContext('2d', { alpha: mime !== 'image/jpeg' });
    if (!ctx) throw new Error('输出尺寸过大，请减小宽高后重试。');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(E.img, source.sx, source.sy, source.sw, source.sh, 0, 0, canvas.width, canvas.height);
    const blob = await toBlob(canvas, format);
    if (token !== S.token) return null;
    if (blob.type !== mime) throw new Error('浏览器不支持所选输出格式，请改用 PNG 或 JPG。');
    if (S.previewUrl) URL.revokeObjectURL(S.previewUrl);
    S.previewUrl = URL.createObjectURL(blob);
    E.preview.src = S.previewUrl;
    E.preview.style.display = 'block';
    E.previewEmpty.style.display = 'none';
    E.previewMeta.textContent = `${dims[0]} × ${dims[1]}  |  ${currentFormat().toUpperCase()}  |  ${fmtBytes(blob.size)}`;
    E.sumFile.textContent = fmtBytes(blob.size);
    S.blob = blob;
    S.dirty = false;
    const savings = document.getElementById('sizeComparison');
    if (savings) {
      const percent = Math.round((1 - blob.size / S.file.size) * 100);
      savings.textContent = percent >= 0 ? `比原文件小 ${percent}%` : `比原文件大 ${Math.abs(percent)}% · 可降低质量或尺寸`;
    }
    summary();
    if (!quiet) setStatus('裁切已确认，处理完成，可以下载。', 'success');
    return blob;
  } catch (error) {
    if (token !== S.token) return null;
    S.blob = null;
    S.dirty = true;
    setStatus(error.message || '图片处理失败，请重试。', 'error');
    return null;
  } finally {
    if (token === S.token) { S.rendering = false; syncWorkflow(); }
  }
}

async function confirmCrop() {
  if (!S.file || S.loading || S.rendering) return null;
  return render(false);
}

function clearImage(show = true, cancelLoad = true) {
  if (cancelLoad) ++S.loadToken;
  invalidatePreview();
  if (S.srcUrl) URL.revokeObjectURL(S.srcUrl);
  if (S.previewUrl) URL.revokeObjectURL(S.previewUrl);
  Object.assign(S, {
    file: null,
    srcUrl: null,
    previewUrl: null,
    nw: 0,
    nh: 0,
    crop: null,
    fitScale: 1,
    view: { x: 0, y: 0, width: 0, height: 0, scale: 1 },
    dragging: null,
    dirty: false,
    loading: false,
    rendering: false,
    blob: null,
  });
  E.img.removeAttribute('src');
  E.img.style.display = 'none';
  E.box.hidden = true;
  E.empty.style.display = 'flex';
  E.preview.removeAttribute('src');
  E.preview.style.display = 'none';
  E.previewEmpty.style.display = 'block';
  E.previewMeta.textContent = '—';
  E.sumFile.textContent = '—';
  E.sourceName.textContent = '尚未选择图片';
  E.sourceInfo.textContent = '—';
  E.readout.textContent = '—';
  E.file.value = '';
  E.reset.disabled = true;
  E.fit.disabled = true;
  E.clear.disabled = true;
  E.apply.disabled = true;
  E.download.disabled = true;
  Z.input.disabled = true;
  Z.out.disabled = true;
  Z.in.disabled = true;
  updateZoomUI();
  syncWorkflow();
  const savings = document.getElementById('sizeComparison');
  if (savings) savings.textContent = '';
  if (show) setStatus('已清除图片，点击画布可重新选择。');
}

async function load(file) {
  if (!file) return false;
  if (!types.has(file.type)) {
    setStatus('目前仅支持 JPG、PNG、WebP。', 'error');
    return false;
  }
  const request = ++S.loadToken;
  const url = URL.createObjectURL(file);
  const decoded = new Image();
  S.loading = true;
  invalidatePreview();
  setStatus('正在读取图片…');
  try {
    decoded.src = url;
    await decoded.decode();
    if (request !== S.loadToken) { URL.revokeObjectURL(url); return false; }
    if (!decoded.naturalWidth || !decoded.naturalHeight) throw new Error('无法读取图片');
    // Commit only after decoding succeeds: a damaged replacement keeps the old image.
    clearImage(false, false);
    S.loading = true;
    S.file = file;
    S.srcUrl = url;
    S.nw = decoded.naturalWidth;
    S.nh = decoded.naturalHeight;
    E.img.src = url;
    await E.img.decode();
    if (request !== S.loadToken) return false;
    E.sourceName.textContent = file.name;
    E.sourceInfo.textContent = `${S.nw} × ${S.nh}  |  ${fmtBytes(file.size)}`;
    E.name.value = cleanName(file.name);
    E.keep.checked = false;
    E.name.disabled = false;
    E.empty.style.display = 'none';
    E.img.style.display = 'block';
    E.reset.disabled = E.fit.disabled = E.clear.disabled = false;
    window.SourceZoomLock?.setLocked(false);
    window.__precisionCropController?.setSizeLocked(false);
    const imageLock = document.getElementById('imageLockToggle');
    if (E.stage.classList.contains('image-locked')) imageLock?.click();
    window.WorkspaceViewZoom?.setZoom(1);
    const viewport = window.WorkspaceViewZoom?.getViewport();
    if (viewport) { viewport.scrollLeft = 0; viewport.scrollTop = 0; }
    if (!validDims()) { E.w.value = Math.min(S.nw, 12000); E.h.value = Math.min(S.nh, 12000); }
    S.outRatio = outputRatio();
    summary();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (request !== S.loadToken) return false;
    S.crop = computeCropFrame();
    resetImageView();
    drawCropFrame();
    S.loading = false;
    await confirmCrop();
    return request === S.loadToken;
  } catch (error) {
    if (S.srcUrl !== url) URL.revokeObjectURL(url);
    if (request !== S.loadToken) return false;
    S.loading = false;
    if (S.srcUrl === url) clearImage(false);
    else if (S.file) { S.dirty = true; syncWorkflow(); }
    setStatus('无法读取这张图片，文件可能已损坏。请换一张 JPG、PNG 或 WebP。', 'error');
    return false;
  } finally {
    if (request === S.loadToken) { S.loading = false; syncWorkflow(); }
    E.file.value = '';
  }
}

function selectRatio(aspect, button) {
  $$('.ratio-btn').forEach((item) => item.classList.toggle('active', item === button));
  const dims = validDims();
  if (aspect !== 'free') {
    const ratio = Number(aspect);
    if (Number.isFinite(ratio) && ratio > 0) {
      if (dims) {
        if (E.lock.checked) E.h.value = Math.max(1, Math.round(Number(E.w.value) / ratio));
        else E.w.value = Math.max(1, Math.round(Number(E.h.value) * ratio));
      }
      S.outRatio = ratio;
    }
  } else if (dims) {
    S.outRatio = dims[0] / dims[1];
  }
  if (S.file) updateFrame('输出比例已更新，请移动/缩放原图后确认裁切。');
  summary();
}

function syncDimensions(changed) {
  invalidatePreview();
  const dims = validDims();
  if (!dims) {
    E.download.disabled = true;
    setStatus('请输入有效的输出尺寸。', 'error');
    summary();
    return;
  }
  if (E.lock.checked) {
    const ratio = S.outRatio || dims[0] / dims[1];
    if (changed === 'w') E.h.value = Math.max(1, Math.round(Number(E.w.value) / ratio));
    else E.w.value = Math.max(1, Math.round(Number(E.h.value) * ratio));
  }
  const finalDims = validDims();
  if (!finalDims) return;
  S.outRatio = finalDims[0] / finalDims[1];
  if (S.file) updateFrame('尺寸已更新，请移动/缩放原图后确认裁切。');
  summary();
}

function applyPreset(button) {
  E.w.value = button.dataset.width;
  E.h.value = button.dataset.height;
  S.outRatio = Number(button.dataset.width) / Number(button.dataset.height);
  if (S.file) updateFrame('已套用尺寸，请移动/缩放原图后确认裁切。');
  summary();
}

function outputName() {
  const base = E.keep.checked && S.file ? cleanName(S.file.name) : cleanName(E.name.value);
  return `${base}.${currentExt()}`;
}

async function saveBlob(blob, suggestedName) {
  if (window.showSaveFilePicker && window.isSecureContext) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'Image File', accept: { [currentMime()]: [`.${currentExt()}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') return false;
      console.warn('showSaveFilePicker failed, falling back to normal download.', error);
    }
  }
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = suggestedName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
  return true;
}

async function downloadImage() {
  if (!S.file || S.saving || S.loading || !validDims()) return;
  S.saving = true;
  syncWorkflow();
  try {
    const blob = S.blob && !S.dirty ? S.blob : await confirmCrop();
    if (!blob) return;
    const name = outputName();
    const saved = await saveBlob(blob, name);
    setStatus(saved ? `已准备下载：${name}` : '已取消保存，图片仍可继续编辑。', saved ? 'success' : '');
  } catch (error) {
    setStatus('保存失败，请重试或换用浏览器下载。', 'error');
  } finally {
    S.saving = false;
    syncWorkflow();
  }
}

function startPan(event) {
  if (!S.file || !S.crop || event.target.closest('button')) return;
  event.preventDefault();
  S.dragging = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: S.view.x, y: S.view.y };
  E.stage.setPointerCapture?.(event.pointerId);
  E.stage.style.cursor = 'grabbing';
}

function movePan(event) {
  const drag = S.dragging;
  if (!drag || event.pointerId !== drag.id) return;
  event.preventDefault();
  S.view.x = drag.x + (event.clientX - drag.startX);
  S.view.y = drag.y + (event.clientY - drag.startY);
  clampViewIntoFrame();
  drawImageView();
}

function endPan(event) {
  if (!S.dragging || event.pointerId !== S.dragging.id) return;
  S.dragging = null;
  E.stage.style.cursor = 'grab';
  markDirty('已移动原图，请按「确认裁切」。');
}

function zoomImage(event) {
  if (!S.file || !S.crop) return;
  event.preventDefault();
  const currentPercent = (S.view.scale / S.fitScale) * 100;
  const delta = event.deltaY < 0 ? 8 : -8;
  setZoomPercent(currentPercent + delta);
}

const openPicker = () => E.file.click();
E.drop.onclick = openPicker;
E.emptyUpload.onclick = openPicker;
E.file.onchange = () => load(E.file.files?.[0]).catch((error) => setStatus(error.message, 'error'));
['dragenter', 'dragover'].forEach((type) => E.drop.addEventListener(type, (event) => {
  event.preventDefault();
  E.drop.classList.add('dragging');
}));
['dragleave', 'drop'].forEach((type) => E.drop.addEventListener(type, (event) => {
  event.preventDefault();
  E.drop.classList.remove('dragging');
}));
E.drop.addEventListener('drop', (event) => load(event.dataTransfer?.files?.[0]));

E.ratios.onclick = (event) => {
  const button = event.target.closest('.ratio-btn');
  if (button) selectRatio(button.dataset.aspect, button);
};
E.w.oninput = () => syncDimensions('w');
E.h.oninput = () => syncDimensions('h');
E.lock.onchange = () => {
  const dims = validDims();
  if (!dims) return;
  S.outRatio = dims[0] / dims[1];
  if (S.file) updateFrame('比例锁定已更新，请移动/缩放原图后确认裁切。');
};
$$('input[name="format"]').forEach((radio) => {
  radio.onchange = requestRender;
});
E.quality.oninput = requestRender;
E.keep.onchange = () => {
  if (!S.file) return;
  E.name.disabled = E.keep.checked;
  if (E.keep.checked) E.name.value = cleanName(S.file.name);
};
E.presets.onclick = (event) => {
  const button = event.target.closest('button[data-width]');
  if (button) applyPreset(button);
};
Z.input.addEventListener('input', () => setZoomPercent(Z.input.value));
Z.out.addEventListener('click', () => setZoomPercent((S.view.scale / S.fitScale) * 100 - 10));
Z.in.addEventListener('click', () => setZoomPercent((S.view.scale / S.fitScale) * 100 + 10));
E.stage.addEventListener('pointerdown', startPan);
window.addEventListener('pointermove', movePan, { passive: false });
window.addEventListener('pointerup', endPan);
window.addEventListener('pointercancel', endPan);
E.stage.addEventListener('wheel', zoomImage, { passive: false });
E.reset.onclick = () => {
  if (!S.file) return;
  updateFrame('已重置尺寸裁切框，请移动/缩放原图后确认裁切。');
};
E.fit.onclick = () => {
  if (!S.file) return;
  resetImageView();
  drawImageView();
  markDirty('已重新适配原图，请按「确认裁切」。');
};
E.clear.onclick = () => clearImage();
E.apply.onclick = () => confirmCrop();
E.download.onclick = downloadImage;

new ResizeObserver(() => {
  if (!S.file) return;
  S.crop = computeCropFrame();
  drawCropFrame();
  resetImageView();
  if (!S.dirty) requestRender();
}).observe(E.stage);

window.addEventListener('beforeunload', () => {
  if (S.srcUrl) URL.revokeObjectURL(S.srcUrl);
  if (S.previewUrl) URL.revokeObjectURL(S.previewUrl);
});

Z.out.disabled = true;
Z.in.disabled = true;
summary();

syncWorkflow();
