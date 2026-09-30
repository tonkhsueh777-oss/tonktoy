import { FFmpeg } from './vendor/ffmpeg/index.js';

const $ = (selector) => document.querySelector(selector);
const E = {
  input: $('#movInput'), drop: $('#movDrop'), dropTitle: $('#movDropTitle'), dropHint: $('#movDropHint'),
  details: $('#movDetails'), name: $('#movName'), size: $('#movSize'),
  compression: $('#compressionPreset'), sizePreset: $('#sizePreset'), customSize: $('#customSize'),
  maxWidth: $('#maxWidth'), maxHeight: $('#maxHeight'),
  convert: $('#convertBtn'), cancel: $('#cancelBtn'), status: $('#videoStatus'),
  progressWrap: $('#videoProgressWrap'), phase: $('#videoPhase'), percent: $('#videoPercent'), progress: $('#videoProgress'),
  empty: $('#videoEmpty'), preview: $('#videoPreview'), outputDetails: $('#outputDetails'),
  outputName: $('#outputName'), outputSize: $('#outputSize'), outputResolution: $('#outputResolution'), download: $('#videoDownload'),
};
const MAX_INPUT_BYTES = 1024 * 1024 * 1024;
const CORE_URL = new URL('./vendor/core/ffmpeg-core.js', import.meta.url).href;
const WASM_GZIP_URLS = [0, 1].map((part) => new URL(`./vendor/core/ffmpeg-core.wasm.gz.${part}`, import.meta.url).href);

async function loadWasmURL() {
  const responses = await Promise.all(WASM_GZIP_URLS.map((url) => fetch(url)));
  if (responses.some((response) => !response.ok)) throw new Error('转档核心下载失败');
  const chunks = await Promise.all(responses.map((response) => response.arrayBuffer()));
  const stream = new Blob(chunks).stream().pipeThrough(new DecompressionStream('gzip'));
  const wasm = await new Response(stream).blob();
  return URL.createObjectURL(new Blob([wasm], { type: 'application/wasm' }));
}
let selectedFile = null;
let ffmpeg = null;
let outputURL = null;
let runId = 0;
let busy = false;

const formatBytes = (size) => size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
const outputFilename = (name) => `${name.replace(/\.mov$/i, '') || 'video'}.mp4`;

function status(message, kind = '') {
  E.status.textContent = message;
  E.status.className = `video-status${kind ? ` ${kind}` : ''}`;
}
function resetOutput() {
  if (outputURL) URL.revokeObjectURL(outputURL);
  outputURL = null;
  E.preview.pause();
  E.preview.removeAttribute('src');
  E.preview.load();
  E.preview.hidden = true;
  E.empty.hidden = false;
  E.outputDetails.hidden = true;
  E.outputResolution.textContent = '—';
  E.download.hidden = true;
  E.download.removeAttribute('href');
}
function setBusy(next) {
  busy = next;
  E.convert.disabled = next || !selectedFile;
  E.cancel.hidden = !next;
  E.input.disabled = next;
  E.drop.disabled = next;
  for (const control of [E.compression, E.sizePreset, E.maxWidth, E.maxHeight]) control.disabled = next;
  E.convert.textContent = next ? '正在转档…' : '开始转档';
  E.progressWrap.hidden = !next;
  if (next) { E.progress.removeAttribute('value'); E.percent.textContent = '—'; }
}
function rejectFile(message) {
  selectedFile = null;
  resetOutput();
  E.details.hidden = true;
  E.drop.classList.remove('has-file');
  E.dropTitle.textContent = '拖入 MOV 影片';
  E.dropHint.textContent = '或点击选择档案';
  E.convert.disabled = true;
  status(message, 'error');
}
function choose(file) {
  if (!file || busy) return;
  if (!/\.mov$/i.test(file.name)) { rejectFile('请选择 .mov 影片档案。'); return; }
  if (file.size === 0) { rejectFile('这个 MOV 档案为空，请重新选择。'); return; }
  if (file.size >= MAX_INPUT_BYTES) { rejectFile('档案超过 1 GB。浏览器转档容易耗尽记忆体，请改用电脑上的转档软件。'); return; }
  selectedFile = file;
  resetOutput();
  E.drop.classList.add('has-file');
  E.dropTitle.textContent = file.name;
  E.dropHint.textContent = '点击更换 MOV 影片';
  E.name.textContent = file.name;
  E.size.textContent = formatBytes(file.size);
  E.details.hidden = false;
  E.convert.disabled = false;
  status(file.size > 500 * 1024 * 1024 ? '已选择影片。这个档案较大，转档可能需要较长时间和更多记忆体。' : '已选择影片，可以开始转档。');
}
function phase(message, percent = null) {
  E.phase.textContent = message;
  if (percent == null) { E.progress.removeAttribute('value'); E.percent.textContent = '—'; return; }
  const value = Math.max(0, Math.min(99, Math.round(percent)));
  E.progress.value = value;
  E.percent.textContent = `${value}%`;
}
function decodeText(data) { return typeof data === 'string' ? data : new TextDecoder().decode(data); }
async function probe(ff, input, logs) {
  const start = logs.length;
  // A metadata-only ffmpeg call avoids ffprobe's -1 return in some wasm cores.
  await ff.exec(['-hide_banner', '-i', input]);
  const lines = logs.slice(start);
  const videoLine = lines.find((line) => /Stream #0:\d+.*Video:/.test(line));
  const audioLine = lines.find((line) => /Stream #0:\d+.*Audio:/.test(line));
  if (!videoLine) throw new Error('找不到影片画面轨道，档案可能已损坏或使用不支援的编码。');
  const video = {
    codec_name: videoLine.match(/Video:\s*([\w]+)/)?.[1] || '',
    pix_fmt: videoLine.match(/,\s*(yuv[\w]+)(?:\(|,)/)?.[1] || '',
  };
  const audio = audioLine ? { codec_name: audioLine.match(/Audio:\s*([\w]+)/)?.[1] || '' } : null;
  const durationText = lines.find((line) => /Duration:\s*\d{2}:/.test(line))?.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const duration = durationText ? Number(durationText[1]) * 3600 + Number(durationText[2]) * 60 + Number(durationText[3]) : 0;
  return { video, audio, duration };
}
function settings() {
  const size = E.sizePreset.value;
  const preset = { '1080': [1920, 1080], '720': [1280, 720], '480': [854, 480] }[size];
  const width = size === 'custom' ? Number(E.maxWidth.value) : preset?.[0];
  const height = size === 'custom' ? Number(E.maxHeight.value) : preset?.[1];
  if (size !== 'original' && (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2 || width > 7680 || height > 7680)) {
    throw new Error('最大宽度与高度请填写 2～7680 的整数。');
  }
  return { compression: E.compression.value, width, height };
}
function argsFor(info, options) {
  const resizing = Boolean(options.width && options.height);
  const copyVideo = !resizing && options.compression === 'original' && info.video.codec_name === 'h264' && info.video.pix_fmt === 'yuv420p';
  const copyAudio = options.compression === 'original' && (!info.audio || info.audio.codec_name === 'aac');
  const args = ['-i', 'input.mov', '-map', '0:v:0', '-map', '0:a:0?', '-map_metadata', '0'];
  if (copyVideo) args.push('-c:v', 'copy');
  else {
    const crf = { original: '23', balanced: '28', small: '32' }[options.compression];
    args.push('-c:v', 'libx264', '-preset', options.compression === 'original' ? 'ultrafast' : 'veryfast', '-crf', crf, '-pix_fmt', 'yuv420p');
    if (resizing) args.push('-vf', `scale=w='min(iw,${options.width})':h='min(ih,${options.height})':force_original_aspect_ratio=decrease:force_divisible_by=2`);
  }
  args.push(...(!info.audio ? ['-an'] : copyAudio ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', options.compression === 'small' ? '96k' : options.compression === 'balanced' ? '128k' : '160k']));
  args.push('-movflags', '+faststart', 'output.mp4');
  return { args, fast: copyVideo && copyAudio };
}
async function convert() {
  if (!selectedFile || busy) return;
  let options;
  try { options = settings(); } catch (error) { status(error.message, 'error'); return; }
  const current = ++runId;
  const file = selectedFile;
  setBusy(true);
  resetOutput();
  const logs = [];
  const engine = new FFmpeg();
  ffmpeg = engine;
  try {
    engine.on('log', ({ message }) => { logs.push(message); if (logs.length > 300) logs.shift(); });
    let duration = 0;
    engine.on('progress', ({ progress, time }) => {
      if (current !== runId) return;
      const estimate = duration && time > 0 ? time / 1e6 / duration : progress;
      if (Number.isFinite(estimate) && estimate > 0) phase('正在处理影片…', estimate * 100);
    });
    status('正在载入转档核心，首次需要下载约 10 MB…');
    phase('载入转档核心…');
    const wasmURL = await loadWasmURL();
    try {
      await engine.load({ coreURL: CORE_URL, wasmURL });
    } finally {
      URL.revokeObjectURL(wasmURL);
    }
    if (current !== runId) return;
    status('正在读取 MOV 影片…');
    phase('读取影片…');
    await engine.writeFile('input.mov', new Uint8Array(await file.arrayBuffer()));
    if (current !== runId) return;
    const info = await probe(engine, 'input.mov', logs);
    duration = info.duration;
    const { args, fast } = argsFor(info, options);
    status(fast ? '影片编码已相容，正在快速转换封装…' : '正在转换与压缩影片；这可能需要一些时间。');
    phase(fast ? '快速转换封装…' : '重新编码中…', 0);
    const code = await engine.exec(args);
    if (current !== runId) return;
    if (code !== 0) throw new Error(`转档失败。可能是 MOV 编码不受支援或浏览器记忆体不足。${logs.at(-1) ? `（${logs.at(-1).slice(0, 110)}）` : ''}`);
    phase('整理输出影片…', 99);
    const data = await engine.readFile('output.mp4');
    if (current !== runId) return;
    if (!data?.length) throw new Error('没有产生 MP4 档案，请换一部影片重试。');
    const blob = new Blob([data], { type: 'video/mp4' });
    outputURL = URL.createObjectURL(blob);
    E.preview.src = outputURL;
    E.preview.hidden = false;
    E.empty.hidden = true;
    E.outputName.textContent = outputFilename(file.name);
    const change = Math.round((1 - blob.size / file.size) * 100);
    E.outputSize.textContent = `${formatBytes(blob.size)}（${change > 0 ? `比原档小 ${change}%` : change < 0 ? `比原档大 ${-change}%` : '与原档相近'}）`;
    E.outputDetails.hidden = false;
    E.download.href = outputURL;
    E.download.download = outputFilename(file.name);
    E.download.hidden = false;
    status('转档完成，可以预览或下载 MP4。', 'success');
  } catch (error) {
    if (current === runId) status(error?.message || '转档失败，请换一部 MOV 影片重试。', 'error');
  } finally {
    engine.terminate();
    if (ffmpeg === engine) ffmpeg = null;
    if (current === runId) setBusy(false);
  }
}
function cancel() {
  if (!busy) return;
  ++runId;
  ffmpeg?.terminate();
  ffmpeg = null;
  setBusy(false);
  status('已取消转档。');
}

E.drop.addEventListener('click', () => E.input.click());
E.input.addEventListener('change', () => { choose(E.input.files?.[0]); E.input.value = ''; });
for (const type of ['dragenter', 'dragover']) E.drop.addEventListener(type, (event) => { event.preventDefault(); if (!busy) E.drop.classList.add('drag-over'); });
E.drop.addEventListener('dragleave', (event) => { if (!E.drop.contains(event.relatedTarget)) E.drop.classList.remove('drag-over'); });
E.drop.addEventListener('drop', (event) => { event.preventDefault(); E.drop.classList.remove('drag-over'); choose(event.dataTransfer?.files?.[0]); });
E.convert.addEventListener('click', convert);
E.cancel.addEventListener('click', cancel);
E.preview.addEventListener('loadedmetadata', () => {
  if (outputURL && E.preview.videoWidth && E.preview.videoHeight) E.outputResolution.textContent = `${E.preview.videoWidth} × ${E.preview.videoHeight}`;
});
E.sizePreset.addEventListener('change', () => { E.customSize.hidden = E.sizePreset.value !== 'custom'; resetOutput(); });
for (const control of [E.compression, E.maxWidth, E.maxHeight]) control.addEventListener('change', resetOutput);
window.addEventListener('beforeunload', () => { if (outputURL) URL.revokeObjectURL(outputURL); ffmpeg?.terminate(); });
