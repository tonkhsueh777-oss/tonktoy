// Numeric reference-line positioning and guide lock.
// Runs before workspace-precision.js so locked guides can block pointer edits early.
(() => {
  const stage = E.stage;
  const editorToolbar = document.querySelector('.editor-toolbar');
  if (!stage || !editorToolbar) return;

  let guidesLocked = false;

  const style = document.createElement('style');
  style.textContent = `
    #guideCoordinateBar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 4px 10px;border-bottom:1px solid rgba(117,148,183,.12);color:#8fa5bd;font-size:11px}
    #guideCoordinateBar .guide-coordinate-title{font-weight:700;color:#cbd9e8;margin-right:2px}
    #guideCoordinateBar label{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
    #guideCoordinateBar .guide-coordinate-field{display:inline-flex;align-items:center;height:30px;border:1px solid #29445f;border-radius:7px;background:#091522;overflow:hidden}
    #guideCoordinateBar input{width:72px;height:28px;border:0;outline:0;background:transparent;color:#edf5ff;padding:0 7px;text-align:right;font-variant-numeric:tabular-nums}
    #guideCoordinateBar .unit{padding-right:7px;color:#667f9c}
    #guideCoordinateBar button{height:30px;padding:0 9px;border:1px solid #29445f;border-radius:7px;background:#0c1725;color:#d6e3ef;cursor:pointer;font-size:11px;white-space:nowrap}
    #guideCoordinateBar button:hover{border-color:#3a95ff;color:#fff}
    #guideCoordinateBar button.locked{background:#7a4c00;border-color:#ffb74d;color:#fff}
    #guideCoordinateBar .guide-coordinate-note{color:#667f9c}
    #editorStage.guides-locked .workspace-guide{cursor:not-allowed!important}
    @media(max-width:900px){#guideCoordinateBar{gap:6px}.guide-coordinate-note{width:100%}}
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.id = 'guideCoordinateBar';
  bar.innerHTML = `
    <span class="guide-coordinate-title">参考线坐标</span>
    <label>竖线 X
      <span class="guide-coordinate-field"><input id="guideXInput" type="number" min="0" step="1" inputmode="numeric" placeholder="X" /><span class="unit">px</span></span>
    </label>
    <label>横线 Y
      <span class="guide-coordinate-field"><input id="guideYInput" type="number" min="0" step="1" inputmode="numeric" placeholder="Y" /><span class="unit">px</span></span>
    </label>
    <button id="guideLocateBtn" type="button">定位</button>
    <button id="guideLockToggle" type="button">参考线 未锁</button>
    <span class="guide-coordinate-note">输入数字后按 Enter 或「定位」</span>
  `;
  editorToolbar.insertAdjacentElement('afterend', bar);

  const guideXInput = document.getElementById('guideXInput');
  const guideYInput = document.getElementById('guideYInput');
  const guideLocateBtn = document.getElementById('guideLocateBtn');
  const guideLockToggle = document.getElementById('guideLockToggle');

  function maxOf(el, fallback) {
    const values = [...el.querySelectorAll('.ruler-label')]
      .map((node) => Number(String(node.textContent || '').replace(/[^0-9.-]/g, '')))
      .filter(Number.isFinite);
    return values.length ? Math.max(...values) : fallback;
  }

  function rulerGeometry() {
    const rx = stage.querySelector('.ruler-x');
    const ry = stage.querySelector('.ruler-y');
    if (!rx || !ry || !rx.offsetWidth || !ry.offsetHeight) return null;
    const maxX = maxOf(rx, S.nw || 1200);
    const maxY = maxOf(ry, S.nh || 1000);
    return {
      originX: rx.offsetLeft,
      originY: ry.offsetTop,
      axisWidth: rx.offsetWidth,
      axisHeight: ry.offsetHeight,
      maxX,
      maxY,
      scaleX: rx.offsetWidth / Math.max(1, maxX),
      scaleY: ry.offsetHeight / Math.max(1, maxY),
    };
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

  function ensureGuide(axis, value) {
    let el = stage.querySelector(`.workspace-guide.numeric-guide.${axis}`);
    if (!el) {
      el = document.createElement('div');
      el.className = `precision-guide workspace-guide ${axis}`;
      el.classList.add('numeric-guide');
      el.dataset.axis = axis;
      stage.appendChild(el);
    }
    el.dataset.value = String(value);
    el.classList.remove('hidden-guide');
    renderGuide(el);
    return el;
  }

  function parseInput(input, max) {
    if (!input.value.trim()) return null;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return null;
    const clamped = Math.round(Math.max(0, Math.min(max, value)));
    input.value = String(clamped);
    return clamped;
  }

  function ensureGuidesVisible() {
    const toggle = document.getElementById('guideToggle');
    if (toggle && !toggle.classList.contains('active')) toggle.click();
  }

  function locateGuides() {
    if (!S.file) {
      setStatus('请先选择图片，再输入参考线坐标。');
      return;
    }
    const geo = rulerGeometry();
    if (!geo) {
      setStatus('尺标尚未准备完成，请稍后再定位参考线。');
      return;
    }
    guideXInput.max = String(Math.round(geo.maxX));
    guideYInput.max = String(Math.round(geo.maxY));
    const x = parseInput(guideXInput, geo.maxX);
    const y = parseInput(guideYInput, geo.maxY);
    if (x === null && y === null) {
      setStatus('请输入竖线 X 或横线 Y 的像素坐标。');
      return;
    }
    ensureGuidesVisible();
    if (x !== null) ensureGuide('v', x);
    if (y !== null) ensureGuide('h', y);
    setStatus(`参考线已定位${x !== null ? ` · X ${x}px` : ''}${y !== null ? ` · Y ${y}px` : ''}${guidesLocked ? ' · 已锁定' : ''}。`);
  }

  function syncInputFromGuide(el) {
    if (!el?.classList.contains('workspace-guide')) return;
    const value = Math.round(Number(el.dataset.value));
    if (!Number.isFinite(value)) return;
    if (el.dataset.axis === 'v') guideXInput.value = String(value);
    else guideYInput.value = String(value);
  }

  function setGuidesLocked(next) {
    guidesLocked = !!next;
    stage.classList.toggle('guides-locked', guidesLocked);
    guideLockToggle.classList.toggle('locked', guidesLocked);
    guideLockToggle.textContent = `参考线 ${guidesLocked ? '已锁' : '未锁'}`;
    setStatus(guidesLocked ? '参考线已锁定：鼠标不会误拖，只能用 X / Y 数字重新定位。' : '参考线已解锁：可以从尺标拖出或直接拖动参考线。');
  }

  guideLocateBtn.addEventListener('click', locateGuides);
  [guideXInput, guideYInput].forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      locateGuides();
    });
  });
  guideLockToggle.addEventListener('click', () => setGuidesLocked(!guidesLocked));

  // This listener is registered before workspace-precision.js. When locked, it
  // prevents both the legacy ruler handlers and the final precision handler from
  // moving/creating/deleting guides with the mouse.
  document.addEventListener('pointerdown', (event) => {
    const guide = event.target.closest?.('.workspace-guide');
    const ruler = event.target.closest?.('.ruler-x,.ruler-y');
    if (guide) syncInputFromGuide(guide);
    if (!guidesLocked || (!guide && !ruler)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('参考线已锁定；请用 X / Y 数字输入调整位置。');
  }, true);

  document.addEventListener('pointerup', (event) => {
    const guide = event.target.closest?.('.workspace-guide');
    if (!guide || guidesLocked) return;
    setTimeout(() => syncInputFromGuide(guide), 0);
  }, true);

  document.addEventListener('dblclick', (event) => {
    const guide = event.target.closest?.('.workspace-guide');
    if (!guide || !guidesLocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('参考线已锁定，不能用双击删除；请先解除锁定。');
  }, true);

  document.getElementById('clearGuides')?.addEventListener('click', () => {
    guideXInput.value = '';
    guideYInput.value = '';
  });

  const observer = new ResizeObserver(() => {
    stage.querySelectorAll('.workspace-guide.numeric-guide').forEach(renderGuide);
    const geo = rulerGeometry();
    if (geo) {
      guideXInput.max = String(Math.round(geo.maxX));
      guideYInput.max = String(Math.round(geo.maxY));
    }
  });
  observer.observe(stage);

  window.GuideCoordinateControls = {
    get locked() { return guidesLocked; },
    setLocked: setGuidesLocked,
    locate: locateGuides,
  };
})();
