// Final zoom-safe interaction layer. Owns crop/image/guide pointer interactions in logical workspace coordinates.
(() => {
  const stage = E.stage;
  const box = E.box;
  const Zoom = window.WorkspaceViewZoom;
  const Core = window.WorkspaceZoomCore;
  if (!stage || !box || !Zoom || !Core) return;

  let action = null;
  let fitRequested = false;

  function rulerGeometry() {
    const rx = stage.querySelector('.ruler-x');
    const ry = stage.querySelector('.ruler-y');
    if (!rx || !ry || !rx.offsetWidth || !ry.offsetHeight) return null;
    const maxOf = (el, fallback) => {
      const values = [...el.querySelectorAll('.ruler-label')]
        .map((n) => Number(String(n.textContent || '').replace(/[^0-9.-]/g, '')))
        .filter(Number.isFinite);
      return values.length ? Math.max(...values) : fallback;
    };
    const maxX = maxOf(rx, S.nw || 1200);
    const maxY = maxOf(ry, S.nh || 1000);
    return {
      rx, ry,
      originX: rx.offsetLeft,
      originY: ry.offsetTop,
      axisWidth: rx.offsetWidth,
      axisHeight: ry.offsetHeight,
      maxX, maxY,
      scaleX: rx.offsetWidth / Math.max(1, maxX),
      scaleY: ry.offsetHeight / Math.max(1, maxY),
    };
  }

  function sourceMetrics(crop = S.crop) {
    if (!crop || !S.view.width || !S.view.height || !S.nw || !S.nh) return { x:0,y:0,width:0,height:0 };
    const x1 = ((crop.x - S.view.x) / S.view.width) * S.nw;
    const y1 = ((crop.y - S.view.y) / S.view.height) * S.nh;
    const x2 = ((crop.x + crop.width - S.view.x) / S.view.width) * S.nw;
    const y2 = ((crop.y + crop.height - S.view.y) / S.view.height) * S.nh;
    return {
      x: Math.round(x1), y: Math.round(y1),
      width: Math.max(1, Math.round(x2 - x1)),
      height: Math.max(1, Math.round(y2 - y1)),
    };
  }

  function imageBounds() {
    return { left:S.view.x, top:S.view.y, right:S.view.x+S.view.width, bottom:S.view.y+S.view.height };
  }

  function clampCrop(c) {
    const b = imageBounds();
    const min = 12;
    const out = { ...c };
    out.width = Math.max(min, Math.min(out.width, Math.max(min, b.right - b.left)));
    out.height = Math.max(min, Math.min(out.height, Math.max(min, b.bottom - b.top)));
    out.x = Math.min(Math.max(out.x, b.left), Math.max(b.left, b.right - out.width));
    out.y = Math.min(Math.max(out.y, b.top), Math.max(b.top, b.bottom - out.height));
    return out;
  }

  function renderCrop() {
    if (!S.crop) return;
    Object.assign(box.style, { left:`${S.crop.x}px`, top:`${S.crop.y}px`, width:`${S.crop.width}px`, height:`${S.crop.height}px` });
    box.hidden = false;
    const m = sourceMetrics();
    E.readout.textContent = `${m.width} × ${m.height}px`;
    const badge = stage.querySelector('.ruler-dim-badge');
    if (badge) {
      badge.style.display = 'block';
      badge.style.left = `${S.crop.x + 8}px`;
      badge.style.top = `${S.crop.y + S.crop.height + 7}px`;
      badge.textContent = `${m.width} × ${m.height}px · X${m.x} Y${m.y}`;
    }
  }

  function guideElements(axis) {
    return [...stage.querySelectorAll(`.workspace-guide.${axis}:not(.hidden-guide)`)]
      .map((el) => ({ el, value:Number(el.dataset.value) }))
      .filter((g) => Number.isFinite(g.value));
  }

  function guideStagePos(g, axis) {
    const geo = rulerGeometry();
    if (!geo) return 0;
    return axis === 'v' ? geo.originX + g.value * geo.scaleX : geo.originY + g.value * geo.scaleY;
  }

  function renderGuide(el) {
    const geo = rulerGeometry();
    if (!geo) return;
    const axis = el.dataset.axis;
    const max = axis === 'v' ? geo.maxX : geo.maxY;
    const value = Math.max(0, Math.min(max, Number(el.dataset.value) || 0));
    el.dataset.value = String(value);
    el.dataset.label = `${axis === 'v' ? 'X' : 'Y'} ${Math.round(value)}`;
    if (axis === 'v') {
      el.style.left = `${geo.originX + value * geo.scaleX}px`;
      el.style.top = `${geo.originY}px`;
      el.style.height = `${geo.axisHeight}px`;
    } else {
      el.style.top = `${geo.originY + value * geo.scaleY}px`;
      el.style.left = `${geo.originX}px`;
      el.style.width = `${geo.axisWidth}px`;
    }
  }

  function renderAllGuides() {
    stage.querySelectorAll('.workspace-guide').forEach(renderGuide);
  }

  function createGuide(axis, value) {
    const el = document.createElement('div');
    el.className = `precision-guide workspace-guide ${axis}`;
    el.dataset.axis = axis;
    el.dataset.value = String(value);
    stage.appendChild(el);
    renderGuide(el);
    return el;
  }

  function nearestEdge(value, guides, axis) {
    const tolerance = Core.logicalSnapDistance(Zoom.getZoom(), 12);
    let best = null;
    for (const g of guides) {
      const pos = guideStagePos(g, axis);
      const delta = pos - value;
      if (Math.abs(delta) <= tolerance && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { ...g, pos, delta };
    }
    return best;
  }

  function snapCrop(c, mode) {
    const snapBtn = document.getElementById('snapToggle');
    const guideBtn = document.getElementById('guideToggle');
    if ((snapBtn && !snapBtn.classList.contains('active')) || (guideBtn && !guideBtn.classList.contains('active'))) return c;
    const v = guideElements('v');
    const h = guideElements('h');
    const out = { ...c };
    let hx = null, hy = null;
    const candidatesX = [out.x, out.x + out.width, out.x + out.width / 2];
    const candidatesY = [out.y, out.y + out.height, out.y + out.height / 2];
    if (mode === 'move') {
      hx = candidatesX.map((x) => nearestEdge(x, v, 'v')).filter(Boolean).sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta))[0] || null;
      hy = candidatesY.map((y) => nearestEdge(y, h, 'h')).filter(Boolean).sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta))[0] || null;
      if (hx) out.x += hx.delta;
      if (hy) out.y += hy.delta;
    } else {
      if (mode.includes('w')) { hx = nearestEdge(out.x, v, 'v'); if (hx) { const r=out.x+out.width; out.x=hx.pos; out.width=r-out.x; } }
      if (mode.includes('e')) { hx = nearestEdge(out.x+out.width, v, 'v'); if (hx) out.width=hx.pos-out.x; }
      if (mode.includes('n')) { hy = nearestEdge(out.y, h, 'h'); if (hy) { const b=out.y+out.height; out.y=hy.pos; out.height=b-out.y; } }
      if (mode.includes('s')) { hy = nearestEdge(out.y+out.height, h, 'h'); if (hy) out.height=hy.pos-out.y; }
    }
    stage.querySelectorAll('.workspace-guide.snapped').forEach((el)=>el.classList.remove('snapped'));
    if (hx?.el) hx.el.classList.add('snapped');
    if (hy?.el) hy.el.classList.add('snapped');
    return clampCrop(out);
  }

  function cropFromPointer(point) {
    const d = action;
    const dx = point.x - d.start.x, dy = point.y - d.start.y;
    const c = d.crop, b = d.bounds, mode = d.mode;
    let x=c.x,y=c.y,width=c.width,height=c.height;
    if (mode === 'move') {
      x = Math.min(Math.max(c.x + dx, b.left), Math.max(b.left, b.right - c.width));
      y = Math.min(Math.max(c.y + dy, b.top), Math.max(b.top, b.bottom - c.height));
    } else {
      if (mode.includes('e')) width = Math.min(Math.max(12,c.width+dx), Math.max(12,b.right-c.x));
      if (mode.includes('s')) height = Math.min(Math.max(12,c.height+dy), Math.max(12,b.bottom-c.y));
      if (mode.includes('w')) { const nx=Math.min(Math.max(c.x+dx,b.left),c.x+c.width-12); width=c.width+(c.x-nx); x=nx; }
      if (mode.includes('n')) { const ny=Math.min(Math.max(c.y+dy,b.top),c.y+c.height-12); height=c.height+(c.y-ny); y=ny; }
    }
    return snapCrop({x,y,width,height}, mode);
  }

  function begin(event) {
    if (!S.file || !stage.contains(event.target)) return;
    const point = Zoom.clientToWorkspace(event.clientX, event.clientY);
    const guide = event.target.closest('.workspace-guide');
    const rulerX = event.target.closest('.ruler-x');
    const rulerY = event.target.closest('.ruler-y');
    const crop = event.target.closest('#cropBox');

    if (guide) {
      event.preventDefault(); event.stopImmediatePropagation();
      action = { type:'guide', pointerId:event.pointerId, guide };
      return;
    }
    if (rulerX || rulerY) {
      const geo = rulerGeometry(); if (!geo) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const axis = rulerX ? 'h' : 'v';
      const value = axis === 'v' ? (point.x-geo.originX)/geo.scaleX : (point.y-geo.originY)/geo.scaleY;
      action = { type:'guide', pointerId:event.pointerId, guide:createGuide(axis,value) };
      return;
    }
    if (crop && S.crop) {
      event.preventDefault(); event.stopImmediatePropagation();
      const handle = event.target.closest('[data-resize]');
      const mode = handle?.dataset.resize || 'move';
      if (stage.classList.contains('crop-size-locked') && mode !== 'move') {
        setStatus('裁切框大小已锁定；可以移动，不能改变宽高。');
        return;
      }
      action = { type:'crop', pointerId:event.pointerId, mode, start:point, crop:{...S.crop}, bounds:imageBounds() };
      return;
    }
    if (stage.classList.contains('image-locked') || event.target.closest('button,input')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    action = { type:'image', pointerId:event.pointerId, start:point, view:{...S.view} };
    stage.style.cursor='grabbing';
  }

  function move(event) {
    if (!action || event.pointerId !== action.pointerId) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const point = Zoom.clientToWorkspace(event.clientX,event.clientY);
    if (action.type === 'image') {
      S.view.x = action.view.x + (point.x-action.start.x);
      S.view.y = action.view.y + (point.y-action.start.y);
      drawImageView();
    } else if (action.type === 'crop') {
      S.crop = cropFromPointer(point);
      renderCrop();
    } else if (action.type === 'guide') {
      const geo=rulerGeometry(); if(!geo) return;
      const axis=action.guide.dataset.axis;
      action.guide.dataset.value=String(axis==='v'?(point.x-geo.originX)/geo.scaleX:(point.y-geo.originY)/geo.scaleY);
      renderGuide(action.guide);
    }
  }

  function end(event) {
    if (!action || event.pointerId !== action.pointerId) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const type=action.type, mode=action.mode;
    action=null; stage.style.cursor='grab';
    stage.querySelectorAll('.workspace-guide.snapped').forEach((el)=>el.classList.remove('snapped'));
    if (type==='crop') {
      const m=sourceMetrics();
      if (!stage.classList.contains('crop-size-locked')) { E.w.value=String(m.width); E.h.value=String(m.height); S.outRatio=m.width/Math.max(1,m.height); }
      summary(); markDirty(mode==='move'?'已移动裁切框，请按「确认裁切」。':'已调整裁切框大小，请按「确认裁切」。');
    } else if (type==='image') markDirty('已移动原图，请按「确认裁切」。');
  }

  document.addEventListener('pointerdown', begin, true);
  document.addEventListener('pointermove', move, {capture:true,passive:false});
  document.addEventListener('pointerup', end, {capture:true,passive:false});
  document.addEventListener('pointercancel', end, {capture:true,passive:false});
  document.addEventListener('mousedown', (event) => {
    if (S.file && stage.contains(event.target) && !event.target.closest('button,input')) event.stopImmediatePropagation();
  }, true);
  document.addEventListener('dblclick', (event) => {
    const guide=event.target.closest('.workspace-guide');
    if (!guide) return;
    event.preventDefault(); event.stopImmediatePropagation(); guide.remove();
  }, true);

  function alignToRulerOrigin() {
    const geo=rulerGeometry();
    if (!geo || !S.file || !S.nw || !S.nh) return false;
    S.fitScale=geo.scaleX;
    S.view.scale=geo.scaleX;
    S.view.width=S.nw*geo.scaleX;
    S.view.height=S.nh*geo.scaleX;
    S.view.x=geo.originX;
    S.view.y=geo.originY;
    drawImageView(); updateZoomUI(); renderCrop(); return true;
  }
  E.fit?.addEventListener('click',()=>{fitRequested=true;},true);
  resetImageView=function zoomSafeResetImageView(){
    const first=!S.view.width||!S.view.height||!S.fitScale;
    if (fitRequested||first) { fitRequested=false; if (alignToRulerOrigin()) return; }
    drawImageView(); updateZoomUI();
  };

  new ResizeObserver(()=>requestAnimationFrame(renderAllGuides)).observe(stage);
  window.__workspacePrecision = { rulerGeometry, sourceMetrics, renderAllGuides, alignToRulerOrigin };
})();
