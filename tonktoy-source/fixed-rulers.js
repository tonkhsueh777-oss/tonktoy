// Photoshop-style fixed screen rulers for zoomed workspace.
// The hidden legacy rulers keep logical geometry; these visible rulers stay pinned to the viewport.
(() => {
  const stage = E.stage;
  const Zoom = window.WorkspaceViewZoom;
  const Precision = window.__workspacePrecision;
  const viewport = Zoom?.getViewport?.();
  const host = viewport?.parentElement;
  const oldRulerX = stage?.querySelector('.ruler-x');
  const oldRulerY = stage?.querySelector('.ruler-y');
  const oldCorner = stage?.querySelector('.ruler-corner');
  if (!stage || !Zoom || !viewport || !host || !oldRulerX || !oldRulerY || !Precision) return;

  oldRulerX.style.opacity = '0';
  oldRulerY.style.opacity = '0';
  if (oldCorner) oldCorner.style.opacity = '0';
  oldRulerX.style.setProperty('pointer-events', 'none', 'important');
  oldRulerY.style.setProperty('pointer-events', 'none', 'important');
  if (oldCorner) oldCorner.style.setProperty('pointer-events', 'none', 'important');

  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  const style = document.createElement('style');
  style.textContent = `
    #fixedRulerViewportOverlay{position:absolute;z-index:85;pointer-events:none;overflow:hidden;border-radius:10px}
    #fixedRulerX,#fixedRulerY,#fixedRulerCorner{position:absolute;background:#0b1725;color:#c8d9ea;font-size:10px;font-variant-numeric:tabular-nums;user-select:none}
    #fixedRulerX{height:28px;border-bottom:1px solid #6f93b7;pointer-events:auto;cursor:ns-resize;overflow:hidden}
    #fixedRulerY{width:28px;border-right:1px solid #6f93b7;pointer-events:auto;cursor:ew-resize;overflow:hidden}
    #fixedRulerCorner{width:28px;height:28px;display:grid;place-items:center;background:#102238;border-right:1px solid #355778;border-bottom:1px solid #355778;color:#eef7ff;font-size:9px;font-weight:800;pointer-events:auto}
    .fixed-ruler-tick{position:absolute;background:#6f8dac;opacity:.95}
    #fixedRulerX .fixed-ruler-tick{bottom:0;width:1px;height:6px}
    #fixedRulerY .fixed-ruler-tick{right:0;height:1px;width:6px}
    .fixed-ruler-tick.major{background:#d9e7f4}
    #fixedRulerX .fixed-ruler-tick.major{height:12px}
    #fixedRulerY .fixed-ruler-tick.major{width:12px}
    .fixed-ruler-label{position:absolute;color:#d7e5f2;line-height:1;white-space:nowrap;text-shadow:0 1px 1px #000;pointer-events:none}
    #fixedRulerX .fixed-ruler-label{top:3px;transform:translateX(-50%)}
    #fixedRulerY .fixed-ruler-label{left:3px;transform:translateY(-50%)}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'fixedRulerViewportOverlay';
  overlay.innerHTML = `
    <div id="fixedRulerX"></div>
    <div id="fixedRulerY"></div>
    <div id="fixedRulerCorner">0,0</div>
  `;
  host.appendChild(overlay);

  const rulerX = overlay.querySelector('#fixedRulerX');
  const rulerY = overlay.querySelector('#fixedRulerY');
  const corner = overlay.querySelector('#fixedRulerCorner');
  const RULER = 28;
  let dragGuide = null;
  let lastSignature = '';

  function geometry() {
    return Precision.rulerGeometry?.() || null;
  }

  function chooseMajor(scale, zoom) {
    const choices = [10,20,25,50,100,200,250,500,1000,2000,5000];
    return choices.find((value) => value * scale * zoom >= 78) || choices[choices.length - 1];
  }

  function appendTick(container, pos, label, horizontal, major) {
    const tick = document.createElement('span');
    tick.className = `fixed-ruler-tick${major ? ' major' : ''}`;
    if (horizontal) tick.style.left = `${pos}px`;
    else tick.style.top = `${pos}px`;
    container.appendChild(tick);
    if (!major) return;
    const text = document.createElement('span');
    text.className = 'fixed-ruler-label';
    text.textContent = String(Math.round(label));
    if (horizontal) text.style.left = `${pos}px`;
    else text.style.top = `${pos}px`;
    container.appendChild(text);
  }

  function drawAxis(container, horizontal, geo, zoom) {
    container.replaceChildren();
    const max = horizontal ? geo.maxX : geo.maxY;
    const scale = horizontal ? geo.scaleX : geo.scaleY;
    const origin = horizontal ? geo.originX : geo.originY;
    const scroll = horizontal ? viewport.scrollLeft : viewport.scrollTop;
    const visibleSize = horizontal ? viewport.clientWidth : viewport.clientHeight;
    const major = chooseMajor(scale, zoom);
    const minor = major / 4;

    for (let value = 0; value <= max + 0.001; value += minor) {
      const screen = origin + value * scale * zoom - scroll;
      const pos = screen - RULER;
      if (screen < RULER - 20 || screen > visibleSize + 20) continue;
      const isMajor = Math.abs(value / major - Math.round(value / major)) < 0.001;
      appendTick(container, pos, value, horizontal, isMajor);
    }
  }

  function syncOverlay() {
    const geo = geometry();
    if (!geo) return;
    const zoom = Zoom.getZoom();
    overlay.style.left = `${viewport.offsetLeft}px`;
    overlay.style.top = `${viewport.offsetTop}px`;
    overlay.style.width = `${viewport.clientWidth}px`;
    overlay.style.height = `${viewport.clientHeight}px`;

    Object.assign(rulerX.style, { left:`${RULER}px`, top:'0px', width:`${Math.max(0, viewport.clientWidth - RULER)}px` });
    Object.assign(rulerY.style, { left:'0px', top:`${RULER}px`, height:`${Math.max(0, viewport.clientHeight - RULER)}px` });
    Object.assign(corner.style, { left:'0px', top:'0px' });

    drawAxis(rulerX, true, geo, zoom);
    drawAxis(rulerY, false, geo, zoom);
  }

  function ensureGuidesVisible() {
    const toggle = document.getElementById('guideToggle');
    if (toggle && !toggle.classList.contains('active')) toggle.click();
  }

  function guideValueFromPointer(axis, event) {
    const geo = geometry();
    if (!geo) return 0;
    const p = Zoom.clientToWorkspace(event.clientX, event.clientY);
    const raw = axis === 'v'
      ? (p.x - geo.originX) / Math.max(0.0001, geo.scaleX)
      : (p.y - geo.originY) / Math.max(0.0001, geo.scaleY);
    const max = axis === 'v' ? geo.maxX : geo.maxY;
    return Math.max(0, Math.min(max, Math.round(raw)));
  }

  function createGuide(axis, value) {
    const el = document.createElement('div');
    el.className = `precision-guide workspace-guide ${axis}`;
    el.dataset.axis = axis;
    el.dataset.value = String(value);
    stage.appendChild(el);
    Precision.renderAllGuides?.();
    return el;
  }

  function beginRulerDrag(axis, event) {
    if (!S.file || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (stage.classList.contains('guides-locked')) {
      setStatus('参考线已锁定；请用 X / Y 数字输入调整位置。');
      return;
    }
    ensureGuidesVisible();
    const guide = createGuide(axis, guideValueFromPointer(axis, event));
    dragGuide = { pointerId:event.pointerId, axis, guide };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  rulerX.addEventListener('pointerdown', (event) => beginRulerDrag('h', event));
  rulerY.addEventListener('pointerdown', (event) => beginRulerDrag('v', event));

  document.addEventListener('pointermove', (event) => {
    if (!dragGuide || event.pointerId !== dragGuide.pointerId) return;
    event.preventDefault();
    dragGuide.guide.dataset.value = String(guideValueFromPointer(dragGuide.axis, event));
    Precision.renderAllGuides?.();
  }, { capture:true, passive:false });

  document.addEventListener('pointerup', (event) => {
    if (!dragGuide || event.pointerId !== dragGuide.pointerId) return;
    dragGuide.guide.dataset.value = String(guideValueFromPointer(dragGuide.axis, event));
    Precision.renderAllGuides?.();
    dragGuide = null;
  }, true);

  viewport.addEventListener('scroll', syncOverlay, { passive:true });
  window.addEventListener('workspaceviewzoomchange', () => requestAnimationFrame(syncOverlay));
  new ResizeObserver(() => requestAnimationFrame(syncOverlay)).observe(viewport);

  function watch() {
    const geo = geometry();
    if (geo) {
      const signature = [
        viewport.offsetLeft, viewport.offsetTop, viewport.clientWidth, viewport.clientHeight,
        viewport.scrollLeft, viewport.scrollTop, Zoom.getZoom(),
        geo.originX, geo.originY, geo.axisWidth, geo.axisHeight, geo.maxX, geo.maxY,
      ].join('|');
      if (signature !== lastSignature) {
        lastSignature = signature;
        syncOverlay();
      }
    }
    requestAnimationFrame(watch);
  }

  syncOverlay();
  requestAnimationFrame(watch);
})();
