// Fixed rulers + movable/resizable crop frame bounded by the displayed source image.
(() => {
  const stage = E.stage;
  const box = E.box;
  const RULER_SIZE = 28;
  const GAP = 8;
  const EDGE = 12;
  const BASE_X_RANGE = 2000;
  const BASE_Y_RANGE = 1000;
  const RANGE_STEP = 100;
  const MIN_BOX = 18;

  let rangeKey = '';
  let lockedXRange = BASE_X_RANGE;
  let lockedYRange = BASE_Y_RANGE;
  let lockedStageWidth = 0;

  drawImageView = function drawImageViewFixed() {
    Object.assign(E.img.style, {
      display: 'block', position: 'absolute', inset: 'auto', margin: '0',
      left: `${S.view.x}px`, top: `${S.view.y}px`, right: 'auto', bottom: 'auto',
      width: `${S.view.width}px`, height: `${S.view.height}px`,
      maxWidth: 'none', maxHeight: 'none', transform: 'none',
    });
    updateReadout();
  };

  // Important: moving or resizing the crop frame must NEVER resize the image.
  // This replacement only repositions the current image when necessary to keep
  // the crop frame covered. Image dimensions change only through explicit zoom/fit.
  clampViewIntoFrame = function clampViewIntoFrameWithoutAutoScale() {
    if (!S.crop || !S.view.width || !S.view.height) return;

    if (S.view.width >= S.crop.width) {
      const minX = S.crop.x + S.crop.width - S.view.width;
      const maxX = S.crop.x;
      S.view.x = Math.min(Math.max(S.view.x, minX), maxX);
    }

    if (S.view.height >= S.crop.height) {
      const minY = S.crop.y + S.crop.height - S.view.height;
      const maxY = S.crop.y;
      S.view.y = Math.min(Math.max(S.view.y, minY), maxY);
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .editor-card{overflow-x:auto}
    #editorStage{flex:0 0 auto}
    .ruler-overlay{position:absolute;z-index:8;pointer-events:none;color:#a9bdd3;font-size:9px;font-variant-numeric:tabular-nums;user-select:none}
    .ruler-x{height:${RULER_SIZE}px;background:#0b1725;border:1px solid #29445f;border-bottom-color:#6f93b7;overflow:hidden}
    .ruler-y{width:${RULER_SIZE}px;background:#0b1725;border:1px solid #29445f;border-right-color:#6f93b7;overflow:hidden}
    .ruler-corner{width:${RULER_SIZE}px;height:${RULER_SIZE}px;display:grid;place-items:center;background:#102238;border:1px solid #355778;color:#e3f0fc;font-size:8px;font-weight:800}
    .ruler-tick{position:absolute;background:#6686a7;opacity:.95}
    .ruler-x .ruler-tick{bottom:0;width:1px;height:6px}.ruler-x .ruler-tick.major{height:12px;background:#d2e3f3}
    .ruler-y .ruler-tick{right:0;height:1px;width:6px}.ruler-y .ruler-tick.major{width:12px;background:#d2e3f3}
    .ruler-label{position:absolute;color:#d0dfed;line-height:1;white-space:nowrap;text-shadow:0 1px 1px #000}
    .ruler-x .ruler-label{top:3px;transform:translateX(-50%)}.ruler-x .ruler-label.first{transform:none}
    .ruler-y .ruler-label{left:3px;transform:translateY(-50%)}.ruler-y .ruler-label.first{transform:none;top:2px!important}
    .ruler-dim-badge{position:absolute;z-index:10;pointer-events:none;padding:4px 7px;border-radius:5px;background:rgba(7,18,31,.94);border:1px solid #355778;color:#d7e8f8;font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap}
    #cropBox{pointer-events:auto!important;cursor:move!important;z-index:9!important}
    #cropBox .crop-handle{display:block!important;position:absolute;background:#fff;border:1px solid #0a68d8;z-index:12}
    #cropBox .crop-handle.nw,#cropBox .crop-handle.ne,#cropBox .crop-handle.sw,#cropBox .crop-handle.se{width:12px;height:12px;border-radius:2px;background:#fff}
    #cropBox .crop-handle.nw{left:-6px;top:-6px;cursor:nwse-resize}#cropBox .crop-handle.ne{right:-6px;top:-6px;cursor:nesw-resize}
    #cropBox .crop-handle.sw{left:-6px;bottom:-6px;cursor:nesw-resize}#cropBox .crop-handle.se{right:-6px;bottom:-6px;cursor:nwse-resize}
    #cropBox .edge-handle{position:absolute;z-index:11;background:transparent}
    #cropBox .edge-handle.n{left:10px;right:10px;top:-7px;height:14px;cursor:ns-resize}
    #cropBox .edge-handle.s{left:10px;right:10px;bottom:-7px;height:14px;cursor:ns-resize}
    #cropBox .edge-handle.w{top:10px;bottom:10px;left:-7px;width:14px;cursor:ew-resize}
    #cropBox .edge-handle.e{top:10px;bottom:10px;right:-7px;width:14px;cursor:ew-resize}
  `;
  document.head.appendChild(style);

  const rulerX = document.createElement('div'); rulerX.className = 'ruler-overlay ruler-x';
  const rulerY = document.createElement('div'); rulerY.className = 'ruler-overlay ruler-y';
  const rulerCorner = document.createElement('div'); rulerCorner.className = 'ruler-overlay ruler-corner'; rulerCorner.textContent = '0,0';
  const dimBadge = document.createElement('div'); dimBadge.className = 'ruler-dim-badge';
  stage.append(rulerX, rulerY, rulerCorner, dimBadge);

  ['n','e','s','w'].forEach((dir) => {
    if (box.querySelector(`.edge-handle.${dir}`)) return;
    const h = document.createElement('span'); h.className = `edge-handle ${dir}`; h.dataset.resize = dir; box.appendChild(h);
  });
  [['nw','nw'],['ne','ne'],['sw','sw'],['se','se']].forEach(([cls, dir]) => {
    const h = box.querySelector(`.crop-handle.${cls}`); if (h) { h.style.display = 'block'; h.dataset.resize = dir; }
  });
  box.style.pointerEvents = 'auto';

  const roundUp = (value, step = RANGE_STEP) => Math.ceil(Math.max(0, value) / step) * step;

  function currentDims() {
    const width = Number(E.w.value), height = Number(E.h.value);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
    return { width, height };
  }

  function sourceRangeKey() {
    if (!S.file) return 'empty';
    return `${S.file.name}|${S.file.size}|${S.nw}x${S.nh}`;
  }

  // Ruler range is based on source image dimensions only. Output fields never expand the ruler.
  function workspaceRanges() {
    const key = sourceRangeKey();
    if (key !== rangeKey) {
      rangeKey = key;
      lockedXRange = roundUp(Math.max(BASE_X_RANGE, S.nw || 0));
      lockedYRange = roundUp(Math.max(BASE_Y_RANGE, S.nh || 0));
      const measured = Math.round(stage.getBoundingClientRect().width);
      lockedStageWidth = Math.max(520, measured || 520);
      stage.style.width = `${lockedStageWidth}px`;
      stage.style.minWidth = `${lockedStageWidth}px`;
      stage.style.maxWidth = 'none';
    }
    return { xRange: lockedXRange, yRange: lockedYRange };
  }

  function rulerGeometry() {
    const { xRange, yRange } = workspaceRanges();
    const rect = stageRect();
    const originX = GAP + RULER_SIZE, originY = GAP + RULER_SIZE;
    const stableWidth = lockedStageWidth || rect.width;
    const availableWidth = Math.max(220, stableWidth - originX - EDGE);
    const scale = availableWidth / xRange;
    const axisWidth = xRange * scale;
    const axisHeight = yRange * scale;
    const desiredHeight = Math.max(300, Math.ceil(originY + axisHeight + EDGE));
    if (Math.abs(rect.height - desiredHeight) > 1) {
      stage.style.height = `${desiredHeight}px`;
      stage.style.minHeight = `${desiredHeight}px`;
      stage.style.maxHeight = 'none';
    }
    return { originX, originY, axisWidth, axisHeight, scale, xRange, yRange };
  }

  // Crop bounds follow the image as it is currently displayed on screen.
  // If the user zooms or pans the image, these bounds move with it.
  function sourceBounds(g = rulerGeometry()) {
    const workspaceRight = g.originX + g.axisWidth;
    const workspaceBottom = g.originY + g.axisHeight;
    const imageLeft = S.view.width ? S.view.x : g.originX;
    const imageTop = S.view.height ? S.view.y : g.originY;
    const imageRight = S.view.width ? S.view.x + S.view.width : g.originX + (S.nw || g.xRange) * g.scale;
    const imageBottom = S.view.height ? S.view.y + S.view.height : g.originY + (S.nh || g.yRange) * g.scale;
    return {
      left: Math.max(g.originX, imageLeft),
      top: Math.max(g.originY, imageTop),
      right: Math.min(workspaceRight, imageRight),
      bottom: Math.min(workspaceBottom, imageBottom),
    };
  }

  function majorStep(range) {
    if (range <= 1600) return 200;
    if (range <= 3000) return 500;
    if (range <= 6000) return 1000;
    return 2000;
  }

  function buildAxis(container, range, horizontal) {
    container.replaceChildren();
    const major = majorStep(range);
    const minor = Math.max(25, major / 4);
    for (let value = 0; value <= range + 0.001; value += minor) {
      const exact = Math.min(value, range);
      const pct = exact / range * 100;
      const isMajor = Math.abs(exact / major - Math.round(exact / major)) < 0.001 || exact === 0 || exact === range;
      const tick = document.createElement('span'); tick.className = `ruler-tick${isMajor ? ' major' : ''}`;
      horizontal ? tick.style.left = `${pct}%` : tick.style.top = `${pct}%`; container.appendChild(tick);
      if (isMajor) {
        const label = document.createElement('span'); label.className = `ruler-label${exact === 0 ? ' first' : ''}`; label.textContent = String(Math.round(exact));
        horizontal ? label.style.left = `${pct}%` : label.style.top = `${pct}%`; container.appendChild(label);
      }
      if (exact >= range) break;
    }
  }

  function cropMetrics() {
    if (!S.crop) return { x:0, y:0, width:0, height:0 };
    const g = rulerGeometry();
    return {
      x: Math.max(0, Math.min(S.nw || g.xRange, Math.round((S.crop.x - g.originX) / g.scale))),
      y: Math.max(0, Math.min(S.nh || g.yRange, Math.round((S.crop.y - g.originY) / g.scale))),
      width: Math.max(1, Math.min(S.nw || g.xRange, Math.round(S.crop.width / g.scale))),
      height: Math.max(1, Math.min(S.nh || g.yRange, Math.round(S.crop.height / g.scale))),
    };
  }

  function syncRulers() {
    const g = rulerGeometry();
    Object.assign(rulerCorner.style,{display:'grid',left:`${GAP}px`,top:`${GAP}px`});
    Object.assign(rulerX.style,{display:'block',left:`${g.originX}px`,top:`${GAP}px`,width:`${g.axisWidth}px`});
    Object.assign(rulerY.style,{display:'block',left:`${GAP}px`,top:`${g.originY}px`,height:`${g.axisHeight}px`});
    buildAxis(rulerX,g.xRange,true); buildAxis(rulerY,g.yRange,false);
    if (S.crop) {
      const m = cropMetrics();
      Object.assign(dimBadge.style,{display:'block',left:`${Math.min(stageRect().width-170,S.crop.x+8)}px`,top:`${Math.min(stageRect().height-28,S.crop.y+S.crop.height+7)}px`});
      dimBadge.textContent = `${m.width} × ${m.height}px · X${m.x} Y${m.y}`;
    } else dimBadge.style.display = 'none';
  }

  computeCropFrame = function computeCropFrameFromRuler() {
    const g = rulerGeometry(), dims = currentDims() || { width:1200, height:750 };
    const maxWidth = Math.max(1, S.nw || dims.width);
    const maxHeight = Math.max(1, S.nh || dims.height);
    const logicalWidth = Math.min(dims.width, maxWidth);
    const logicalHeight = Math.min(dims.height, maxHeight);
    return {
      x:g.originX,
      y:g.originY,
      width:Math.max(MIN_BOX, logicalWidth*g.scale),
      height:Math.max(MIN_BOX, logicalHeight*g.scale),
    };
  };

  const baseDrawCropFrame = drawCropFrame;
  drawCropFrame = function drawCropFrameWithFixedRulers() { baseDrawCropFrame(); syncRulers(); };

  const previewFrame = E.preview?.closest('.preview-frame');
  function syncPreviewAspect() { const dims=currentDims(); if (previewFrame && dims) previewFrame.style.aspectRatio=`${dims.width} / ${dims.height}`; }
  const baseSummary = summary;
  summary = function summaryWithCropEditor() { baseSummary(); syncPreviewAspect(); syncRulers(); };

  updateReadout = function updateReadoutFromRuler() {
    if (!S.file || !S.crop) { E.readout.textContent='—'; return; }
    const m=cropMetrics(); E.readout.textContent=`${m.width} × ${m.height}px`;
  };

  function syncFieldsFromCrop() {
    const m=cropMetrics(); E.w.value=String(m.width); E.h.value=String(m.height); S.outRatio=m.width/m.height;
    summary(); syncPreviewAspect(); updateReadout();
  }

  // Resizing/moving the crop frame must not touch the image view.
  function commitCrop(message) {
    drawCropFrame();
    syncFieldsFromCrop();
    markDirty(message || '已调整裁切范围，请按「确认裁切」。');
  }

  let cropDrag=null;
  function startCropDrag(event) {
    if (!S.file || !S.crop || (event.pointerType==='mouse' && event.button!==0)) return;
    event.preventDefault(); event.stopPropagation();
    const handle=event.target.closest('[data-resize]'), mode=handle?.dataset.resize || 'move', g=rulerGeometry();
    cropDrag={pointerId:event.pointerId,mode,startX:event.clientX,startY:event.clientY,crop:{...S.crop},bounds:sourceBounds(g)};
    box.setPointerCapture?.(event.pointerId);
  }

  function moveCropDrag(event) {
    if (!cropDrag || event.pointerId!==cropDrag.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    const dx=event.clientX-cropDrag.startX, dy=event.clientY-cropDrag.startY, c=cropDrag.crop, b=cropDrag.bounds, mode=cropDrag.mode;
    let x=c.x,y=c.y,w=c.width,h=c.height;
    if (mode==='move') {
      x=Math.min(Math.max(c.x+dx,b.left),Math.max(b.left,b.right-c.width));
      y=Math.min(Math.max(c.y+dy,b.top),Math.max(b.top,b.bottom-c.height));
    } else {
      if (mode.includes('e')) w=Math.min(Math.max(MIN_BOX,c.width+dx),Math.max(MIN_BOX,b.right-c.x));
      if (mode.includes('s')) h=Math.min(Math.max(MIN_BOX,c.height+dy),Math.max(MIN_BOX,b.bottom-c.y));
      if (mode.includes('w')) { const nx=Math.min(Math.max(c.x+dx,b.left),c.x+c.width-MIN_BOX); w=c.width+(c.x-nx); x=nx; }
      if (mode.includes('n')) { const ny=Math.min(Math.max(c.y+dy,b.top),c.y+c.height-MIN_BOX); h=c.height+(c.y-ny); y=ny; }
    }
    S.crop={x,y,width:w,height:h}; drawCropFrame(); updateReadout();
  }

  function endCropDrag(event) {
    if (!cropDrag || event.pointerId!==cropDrag.pointerId) return;
    event.preventDefault(); event.stopPropagation(); box.releasePointerCapture?.(event.pointerId); cropDrag=null; commitCrop('已调整白色裁切框；原图大小保持不变。');
  }
  box.addEventListener('pointerdown',startCropDrag,true);
  window.addEventListener('pointermove',moveCropDrag,{capture:true,passive:false});
  window.addEventListener('pointerup',endCropDrag,{capture:true,passive:false});
  window.addEventListener('pointercancel',endCropDrag,{capture:true,passive:false});

  let imageDrag=null;
  function startImageDrag(event) {
    if (!S.file || !S.crop || event.button!==0 || event.target.closest('#cropBox, button, input, #zoomControls')) return;
    event.preventDefault(); imageDrag={x:event.clientX,y:event.clientY,moved:false}; stage.style.cursor='grabbing'; document.body.style.userSelect='none';
  }
  function moveImageDrag(event) {
    if (!imageDrag) return;
    const dx=event.clientX-imageDrag.x,dy=event.clientY-imageDrag.y;
    imageDrag.x=event.clientX; imageDrag.y=event.clientY;
    if (!dx && !dy) return;
    S.view.x+=dx; S.view.y+=dy; clampViewIntoFrame(); drawImageView(); imageDrag.moved=true;
  }
  function endImageDrag() {
    if (!imageDrag) return;
    const moved=imageDrag.moved; imageDrag=null; stage.style.cursor='grab'; document.body.style.userSelect='';
    if (moved) markDirty('已移动原图，请按「确认裁切」。');
  }
  stage.addEventListener('mousedown',startImageDrag,true);
  window.addEventListener('mousemove',moveImageDrag,true);
  window.addEventListener('mouseup',endImageDrag,true);

  syncPreviewAspect(); syncRulers();
  stage.title='尺标固定；拉白色裁切框不会改变原图大小；白框不能超过当前原图边界';
})();