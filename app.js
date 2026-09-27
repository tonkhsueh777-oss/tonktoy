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
  if (S.view.width < S.crop.width || S.view.height < S.crop.height) {
    const nextScale = Math.max(S.crop.width / S.nw, S.crop.height / S.nh, S.view.scale);
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
}

function markDirty(message = '已调整原图位置或缩放，请按「确认裁切」。') {
  if (!S.file) return;
  S.dirty = true;
  E.apply.disabled = false;
  E.download.disabled = true;
  setStatus(message);
}

function requestRender() {
  summary();
  if (!S.file || S.dirty) return;
  clearTimeout(S.timer);
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

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('浏览器无法输出这个图片格式。'))),
      currentMime(),
      currentFormat() === 'png' ? undefined : Number(E.quality.value) / 100,
    );
  });
}

async function render(quiet = true) {
  if (!S.file || !S.crop) return null;
  const dims = validDims();
  if (!dims) {
    E.download.disabled = true;
    if (!quiet) setStatus('请输入 1～12000 之间的有效宽高。', 'error');
    return null;
  }
  const token = ++S.token;
  try {
    const source = cropSourceRect();
    if (!source || source.sw <= 0 || source.sh <= 0) throw new Error('裁切区域无效，请重新调整。');
    const canvas = document.createElement('canvas');
    canvas.width = dims[0];
    canvas.height = dims[1];
    const ctx = canvas.getContext('2d', { alpha: currentMime() !== 'image/jpeg' });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (currentMime() === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(E.img, source.sx, source.sy, source.sw, source.sh, 0, 0, canvas.width, canvas.height);
    const blob = await toBlob(canvas);
    if (token !== S.token) return null;
    if (S.previewUrl) URL.revokeObjectURL(S.previewUrl);
    S.previewUrl = URL.createObjectURL(blob);
    E.preview.src = S.previewUrl;
    E.preview.style.display = 'block';
    E.previewEmpty.style.display = 'none';
    E.previewMeta.textContent = `${dims[0]} × ${dims[1]}  |  ${currentFormat().toUpperCase()}  |  ${fmtBytes(blob.size)}`;
    E.sumFile.textContent = fmtBytes(blob.size);
    E.download.disabled = false;
    summary();
    if (!quiet) setStatus('裁切已确认，处理完成，可以下载。', 'success');
    return blob;
  } catch (error) {
    console.error(error);
    E.download.disabled = true;
    setStatus(error.message || '图片处理失败，请重试。', 'error');
    return null;
  }
}

async function confirmCrop() {
  if (!S.file) return;
  S.dirty = false;
  E.apply.disabled = true;
  await render(false);
}

function clearImage(show = true) {
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
  if (show) setStatus('已清除图片。');
}

async function load(file) {
  if (!file) return;
  if (!types.has(file.type)) {
    setStatus('目前仅支持 JPG、PNG、WebP。', 'error');
    return;
  }
  clearImage(false);
  S.file = file;
  S.srcUrl = URL.createObjectURL(file);
  E.sourceName.textContent = file.name;
  E.sourceInfo.textContent = fmtBytes(file.size);
  E.name.value = cleanName(file.name);
  E.keep.checked = false;
  E.name.disabled = false;
  setStatus('正在读取图片…');
  await new Promise((resolve, reject) => {
    E.img.onload = resolve;
    E.img.onerror = reject;
    E.img.src = S.srcUrl;
  });
  S.nw = E.img.naturalWidth;
  S.nh = E.img.naturalHeight;
  if (!S.nw || !S.nh) throw new Error('无法读取图片');
  E.sourceInfo.textContent = `${S.nw} × ${S.nh}  |  ${fmtBytes(file.size)}`;
  E.empty.style.display = 'none';
  E.img.style.display = 'block';
  E.reset.disabled = false;
  E.fit.disabled = false;
  E.clear.disabled = false;
  E.apply.disabled = false;
  S.outRatio = outputRatio();
  summary();
  requestAnimationFrame(() => requestAnimationFrame(async () => {
    S.crop = computeCropFrame();
    drawCropFrame();
    resetImageView();
    await confirmCrop();
    setStatus('先设定尺寸，再拖动或滚轮缩放原图，然后按「确认裁切」。', 'success');
  }));
}

function selectRatio(aspect, button) {
  $$('.ratio-btn').forEach((item) => item.classList.toggle('active', item === button));
  const dims = validDims();
  if (aspect !== 'free') {
    const ratio = Number(aspect);
    if (Number.isFinite(ratio) && ratio > 0) {
      if (dims && E.lock.checked) E.h.value = Math.max(1, Math.round(Number(E.w.value) / ratio));
      S.outRatio = ratio;
    }
  } else if (dims) {
    S.outRatio = dims[0] / dims[1];
  }
  if (S.file) updateFrame('输出比例已更新，请移动/缩放原图后确认裁切。');
  summary();
}

function syncDimensions(changed) {
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
  if (S.dirty) await confirmCrop();
  const blob = await render(false);
  if (!blob) return;
  const name = outputName();
  const saved = await saveBlob(blob, name);
  if (saved) setStatus(`已准备下载：${name}`, 'success');
}

function startPan(event) {
  if (!S.file || !S.crop || event.target.closest('button')) return;
  event.preventDefault();
  S.dragging = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: S.view.x, y: S.view.y };
  E.stage.setPointerCapture?.(event.pointerId);
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
  markDirty('已移动原图，请按「确认裁切」。');
}

function zoomImage(event) {
  if (!S.file || !S.crop) return;
  event.preventDefault();
  const rect = stageRect();
  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  const factor = event.deltaY < 0 ? 1.06 : 0.94;
  const nextScale = clamp(S.view.scale * factor, S.fitScale, S.fitScale * 12);
  const relX = (pointerX - S.view.x) / S.view.width;
  const relY = (pointerY - S.view.y) / S.view.height;
  S.view.scale = nextScale;
  S.view.width = S.nw * nextScale;
  S.view.height = S.nh * nextScale;
  S.view.x = pointerX - relX * S.view.width;
  S.view.y = pointerY - relY * S.view.height;
  clampViewIntoFrame();
  drawImageView();
  markDirty('已缩放原图，请按「确认裁切」。');
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

summary();
