(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WorkspaceZoomCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const LEVELS = Object.freeze([0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]);

  function clampZoom(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1;
    return Math.min(LEVELS[LEVELS.length - 1], Math.max(LEVELS[0], n));
  }

  function screenDeltaToLogical(delta, zoom) {
    return Number(delta) / clampZoom(zoom);
  }

  function logicalSnapDistance(zoom, screenTolerance = 12) {
    return Number(screenTolerance) / clampZoom(zoom);
  }

  function preserveViewportCenter(oldScroll, viewportSize, oldZoom, newZoom) {
    const oldZ = clampZoom(oldZoom);
    const newZ = clampZoom(newZoom);
    const centerLogical = (Number(oldScroll) + Number(viewportSize) / 2) / oldZ;
    return centerLogical * newZ - Number(viewportSize) / 2;
  }

  function preserveViewportStart(oldScroll, oldZoom, newZoom, origin = 0) {
    const oldZ = clampZoom(oldZoom);
    const newZ = clampZoom(newZoom);
    const anchor = Number.isFinite(Number(origin)) ? Number(origin) : 0;
    const old = Number.isFinite(Number(oldScroll)) ? Number(oldScroll) : 0;
    const logicalStart = anchor + (old - anchor) / oldZ;
    const next = anchor + (logicalStart - anchor) * newZ;
    return Math.max(0, Math.round(next * 1000) / 1000);
  }

  return {
    LEVELS,
    clampZoom,
    screenDeltaToLogical,
    logicalSnapDistance,
    preserveViewportCenter,
    preserveViewportStart,
  };
});
