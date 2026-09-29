// Import a remote image URL into the existing local crop workflow.
// Works when the remote image server permits browser CORS access.
(() => {
  const toolbar = document.querySelector('.editor-toolbar');
  if (!toolbar || document.getElementById('imageUrlBar')) return;

  const style = document.createElement('style');
  style.id = 'imageUrlImportStyle';
  style.textContent = `
    #imageUrlBar{display:flex;align-items:center;gap:8px;padding:8px 4px 10px;border-bottom:1px solid rgba(117,148,183,.12);color:#8fa5bd;font-size:11px}
    #imageUrlBar .url-title{font-weight:700;color:#cbd9e8;white-space:nowrap}
    #imageUrlInput{flex:1;min-width:180px;height:32px;border:1px solid #29445f;border-radius:7px;background:#091522;color:#edf5ff;padding:0 10px;outline:0}
    #imageUrlInput:focus{border-color:#3a95ff;box-shadow:0 0 0 1px rgba(58,149,255,.18)}
    #imageUrlLoadBtn{height:32px;padding:0 12px;border:1px solid #2b69aa;border-radius:7px;background:#0d5fc8;color:#fff;cursor:pointer;font-weight:700;white-space:nowrap}
    #imageUrlLoadBtn:hover{background:#1472e5}
    #imageUrlLoadBtn:disabled{opacity:.55;cursor:wait}
    #imageUrlHint{color:#667f9c;white-space:nowrap}
    @media(max-width:900px){#imageUrlBar{flex-wrap:wrap}#imageUrlInput{order:2;flex-basis:calc(100% - 84px)}#imageUrlLoadBtn{order:3}#imageUrlHint{width:100%;order:4}}
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.id = 'imageUrlBar';
  bar.innerHTML = `
    <span class="url-title">图片网址</span>
    <input id="imageUrlInput" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="粘贴直接图片网址 https://..." />
    <button id="imageUrlLoadBtn" type="button">载入</button>
    <span id="imageUrlHint">载入后可照常裁切、压缩并下载</span>
  `;

  const coordinateBar = document.getElementById('guideCoordinateBar');
  (coordinateBar || toolbar).insertAdjacentElement('afterend', bar);

  const input = document.getElementById('imageUrlInput');
  const button = document.getElementById('imageUrlLoadBtn');

  function extensionFor(type) {
    return ({ 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' })[type] || 'jpg';
  }

  function filenameFromUrl(url, type) {
    try {
      const parsed = new URL(url);
      let name = decodeURIComponent(parsed.pathname.split('/').pop() || '').trim();
      name = name.replace(/[?#].*$/, '').replace(/[\\/:*?"<>|]+/g, '_');
      if (!name || !/\.(jpe?g|png|webp)$/i.test(name)) name = `url-image.${extensionFor(type)}`;
      return name;
    } catch {
      return `url-image.${extensionFor(type)}`;
    }
  }

  async function importFromUrl() {
    const raw = input.value.trim();
    if (!raw) {
      setStatus('请先贴上图片网址。', 'error');
      input.focus();
      return;
    }

    let url;
    try {
      url = new URL(raw);
      if (!/^https?:$/.test(url.protocol)) throw new Error('bad protocol');
    } catch {
      setStatus('请输入完整的 http:// 或 https:// 图片网址。', 'error');
      return;
    }

    button.disabled = true;
    input.disabled = true;
    const originalText = button.textContent;
    button.textContent = '读取中…';
    setStatus('正在从图片网址读取图片…');

    try {
      const response = await fetch(url.href, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const type = String(blob.type || '').toLowerCase();
      if (!['image/jpeg','image/png','image/webp'].includes(type)) {
        throw new Error('网址不是可读取的 JPG、PNG 或 WebP 图片。');
      }

      const file = new File([blob], filenameFromUrl(url.href, type), {
        type,
        lastModified: Date.now(),
      });

      if (typeof load !== 'function') throw new Error('图片载入功能尚未准备好。');
      await load(file);
      setStatus('图片网址已载入，可以直接裁切、压缩并下载。', 'success');
    } catch (error) {
      console.error(error);
      const isCors = error instanceof TypeError || /Failed to fetch|NetworkError|CORS/i.test(String(error?.message || ''));
      setStatus(
        isCors
          ? '这个图片网站禁止浏览器直接读取（CORS）。请换“直接图片网址”，或先下载图片再拖进来。'
          : (error?.message || '图片网址读取失败，请检查网址。'),
        'error',
      );
    } finally {
      button.disabled = false;
      input.disabled = false;
      button.textContent = originalText;
    }
  }

  button.addEventListener('click', importFromUrl);
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    importFromUrl();
  });

  window.ImageUrlImport = { importFromUrl };
})();
