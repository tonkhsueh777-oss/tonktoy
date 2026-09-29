// Photoshop-style whole-workspace view zoom. Visual-only: logical crop/image coordinates stay unchanged.
(() => {
  const Core = window.WorkspaceZoomCore;
  const stage = E.stage;
  const toolbar = document.querySelector('.toolbar-actions');
  if (!Core || !stage || !toolbar) return;

  if (!Number.isFinite(S.viewZoom)) S.viewZoom = 1;

  document.getElementById('magnifierControls')?.remove();
  document.getElementById('magnifierPanel')?.remove();
  document.getElementById('magnifierLens')?.remove();

  const parent = stage.parentElement;
  let viewport = document.getElementById('editorViewport');
  let sizer = document.getElementById('editorWorkspaceSizer');
  if (!viewport) {
    viewport = document.createElement('div');
    viewport.id = 'editorViewport';
    sizer = document.createElement('div');
    sizer.id = 'editorWorkspaceSizer';
    parent.insertBefore(viewport, stage);
    viewport.appendChild(sizer);
    sizer.appendChild(stage);
  }

  const style = document.createElement('style');
  style.id = 'workspaceZoomStyle';
  style.textContent = `
    #editorViewport{position:relative;overflow:auto;width:100%;max-height:min(70vh,760px);border-radius:10px;background:#07121f;overscroll-behavior:contain}
    #editorWorkspaceSizer{position:relative;min-width:100%;min-height:100%}
    #editorViewport #editorStage{position:absolute!important;left:0;top:0;transform-origin:0 0!important;margin:0!important}
    #workspaceViewZoomControls{display:inline-flex;align-items:center;gap:4px;margin-right:4px;position:relative}
    #workspaceViewZoomControls button{height:32px;min-width:32px;padding:0 8px;border:1px solid #29445f;border-radius:7px;background:#0c1725;color:#d6e3ef;cursor:pointer;font-size:12px;white-space:nowrap}
    #workspaceViewZoomControls button:hover{border-color:#3a95ff;color:#fff}
    #workspaceZoomValue{min-width:78px;font-variant-numeric:tabular-nums}
    #workspaceZoomMenu{position:absolute;right:36px;top:36px;z-index:100;display:none;grid-template-columns:repeat(2,72px);gap:4px;padding:7px;border:1px solid #29445f;border-radius:9px;background:#081522;box-shadow:0 12px 30px rgba(0,0,0,.35)}
    #workspaceZoomMenu.open{display:grid}
    #workspaceZoomMenu button{width:72px}
  `;
  document.head.appendChild(style);

  const controls = document.createElement('div');
  controls.id = 'workspaceViewZoomControls';
  controls.innerHTML = `
    <button id="workspaceZoomOut" type="button" title="缩小编辑视图">−</button>
    <button id="workspaceZoomValue" type="button" title="选择编辑视图倍率">视图 100%</button>
    <button id="workspaceZoomIn" type="button" title="放大编辑视图">＋</button>
    <div id="workspaceZoomMenu"></div>
  `;
  toolbar.prepend(controls);

  const outBtn = controls.querySelector('#workspaceZoomOut');
  const valueBtn = controls.querySelector('#workspaceZoomValue');
  const inBtn = controls.querySelector('#workspaceZoomIn');
  const menu = controls.querySelector('#workspaceZoomMenu');

  Core.LEVELS.forEach((level) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.zoom = String(level);
    b.textContent = `${Math.round(level * 100)}%`;
    menu.appendChild(b);
  });

  function logicalSize() {
    return { width: stage.offsetWidth, height: stage.offsetHeight };
  }

  function syncVisualSize() {
    const { width, height } = logicalSize();
    stage.style.transform = `scale(${S.viewZoom})`;
    sizer.style.width = `${Math.ceil(width * S.viewZoom)}px`;
    sizer.style.height = `${Math.ceil(height * S.viewZoom)}px`;
    valueBtn.textContent = `视图 ${Math.round(S.viewZoom * 100)}%`;
    const idx = Core.LEVELS.indexOf(S.viewZoom);
    outBtn.disabled = idx <= 0;
    inBtn.disabled = idx < 0 || idx >= Core.LEVELS.length - 1;
  }

  function getZoom() { return S.viewZoom || 1; }

  function setZoom(next) {
    const normalized = Core.LEVELS.includes(Number(next)) ? Number(next) : Core.clampZoom(next);
    const old = getZoom();
    if (normalized === old) return;
    const oldLeft = viewport.scrollLeft;
    const oldTop = viewport.scrollTop;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    S.viewZoom = normalized;
    syncVisualSize();
    viewport.scrollLeft = Math.max(0, Core.preserveViewportCenter(oldLeft, vw, old, normalized));
    viewport.scrollTop = Math.max(0, Core.preserveViewportCenter(oldTop, vh, old, normalized));
    menu.classList.remove('open');
  }

  function clientToWorkspace(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    return { x: (clientX - rect.left) / getZoom(), y: (clientY - rect.top) / getZoom() };
  }

  function workspaceToClient(x, y) {
    const rect = stage.getBoundingClientRect();
    return { x: rect.left + x * getZoom(), y: rect.top + y * getZoom() };
  }

  function screenDeltaToWorkspace(dx, dy) {
    return {
      dx: Core.screenDeltaToLogical(dx, getZoom()),
      dy: Core.screenDeltaToLogical(dy, getZoom()),
    };
  }

  outBtn.addEventListener('click', () => {
    const i = Core.LEVELS.indexOf(getZoom());
    if (i > 0) setZoom(Core.LEVELS[i - 1]);
  });
  inBtn.addEventListener('click', () => {
    const i = Core.LEVELS.indexOf(getZoom());
    if (i >= 0 && i < Core.LEVELS.length - 1) setZoom(Core.LEVELS[i + 1]);
  });
  valueBtn.addEventListener('click', () => menu.classList.toggle('open'));
  menu.addEventListener('click', (event) => {
    const b = event.target.closest('button[data-zoom]');
    if (b) setZoom(Number(b.dataset.zoom));
  });
  document.addEventListener('click', (event) => {
    if (!controls.contains(event.target)) menu.classList.remove('open');
  });

  new ResizeObserver(syncVisualSize).observe(stage);
  syncVisualSize();

  window.WorkspaceViewZoom = {
    getZoom,
    setZoom,
    clientToWorkspace,
    workspaceToClient,
    screenDeltaToWorkspace,
    getViewport: () => viewport,
  };
})();
