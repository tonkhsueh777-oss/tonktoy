# Workspace View Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the local magnifier with Photoshop-style whole-workspace zoom while preserving exact crop, ruler, guide, snapping, image-lock, crop-size-lock, and export behavior.

**Architecture:** Keep all editing state in 100% logical workspace coordinates and add a separate view-only zoom factor. A scrollable viewport contains the logical editor workspace; the workspace is visually scaled, while all pointer deltas are converted back to logical coordinates through one shared coordinate utility. Crop/export data remains untouched by view zoom.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, GitHub Pages, Node built-in `node:test` for pure coordinate-math regression tests.

**Spec:** `docs/superpowers/specs/2026-09-29-workspace-view-zoom-design.md`

## Global Constraints

- View zoom levels are exactly: 50%, 75%, 100%, 125%, 150%, 200%, 300%, 400%; default is 100%.
- View zoom must not modify source-image scale `S.view.scale`, crop logical values, output width/height, or export pixels.
- Ruler origin stays fixed at workspace `0,0`; moving the source image never moves rulers or guides.
- Guide coordinates and crop coordinates use the same logical workspace coordinate system at every view zoom.
- Snapping keeps an approximately 12-screen-pixel visual tolerance by using logical tolerance `12 / S.viewZoom`.
- Existing source-image lock and crop-size lock must continue to work.
- Existing source-image zoom controls remain labeled and behave as `原图缩放`.
- Existing local magnifier UI is removed from the page.
- No new runtime dependency is added.

## Review Focus

- Browser resize while view zoom is above 100% must not mutate crop/image/guide logical coordinates.
- A 400% view must convert 4 screen pixels of drag to approximately 1 logical workspace pixel.
- Switching 100% → 400% → 100% must preserve crop X/Y/W/H and guide coordinates exactly.
- Source-image lock must block image pan/zoom while still allowing workspace view zoom.
- Export must be byte-dimensionally independent of view zoom: the requested output width/height stay identical at 50% and 400%.

---

### Task 1: Add tested view-zoom coordinate math

**Files:**
- Create: `workspace-zoom-core.js`
- Create: `tests/workspace-zoom-core.test.cjs`

**Interfaces:**
- Produces browser/CommonJS global `WorkspaceZoomCore` with:
  - `LEVELS: number[]`
  - `clampZoom(value: number): number`
  - `screenDeltaToLogical(delta: number, zoom: number): number`
  - `logicalSnapDistance(zoom: number, screenTolerance?: number): number`
  - `preserveViewportCenter(oldScroll: number, viewportSize: number, oldZoom: number, newZoom: number): number`
- Later tasks consume these helpers; no DOM access belongs in this file.

- [ ] **Step 1: Write failing coordinate tests**

Create tests asserting:
- levels equal `[0.5,0.75,1,1.25,1.5,2,3,4]`;
- `screenDeltaToLogical(4,4) === 1`;
- `logicalSnapDistance(4) === 3` and `logicalSnapDistance(2) === 6`;
- viewport-center preservation returns the scroll offset that keeps the same logical center after zoom.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/workspace-zoom-core.test.cjs`

Expected: FAIL because `workspace-zoom-core.js` does not yet exist or required exports are missing.

- [ ] **Step 3: Implement the minimal pure math module**

Implement only the interfaces above with no DOM code and no external dependency.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `node --test tests/workspace-zoom-core.test.cjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

Commit message: `test: add workspace zoom coordinate core`

---

### Task 2: Build the Photoshop-style viewport and toolbar controls

**Files:**
- Create: `workspace-zoom.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`
- Delete: `magnifier.js`

**Interfaces:**
- Consumes: `WorkspaceZoomCore` from Task 1.
- Produces global `window.WorkspaceViewZoom` with:
  - `getZoom(): number`
  - `setZoom(zoom: number): void`
  - `clientToWorkspace(clientX: number, clientY: number): {x:number,y:number}`
  - `screenDeltaToWorkspace(dx: number, dy: number): {dx:number,dy:number}`
  - `workspaceToClient(x: number, y: number): {x:number,y:number}`
  - `getViewport(): HTMLElement`
- Adds `S.viewZoom = 1` without changing `S.view.scale`.

- [ ] **Step 1: Write failing static/UI contract checks**

Add `tests/workspace-zoom-dom.test.cjs` that reads `index.html` and asserts:
- `magnifier.js` is no longer loaded;
- `workspace-zoom-core.js` and `workspace-zoom.js` are loaded before crop/guide interaction scripts;
- the page still loads `app.js` before zoom integration.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/workspace-zoom-dom.test.cjs`

Expected: FAIL because the old magnifier script is still present and new scripts are not loaded.

- [ ] **Step 3: Implement viewport structure and toolbar UI**

`workspace-zoom.js` wraps `#editorStage` in an `#editorViewport` scrolling container, keeps `#editorStage` as the logical workspace, and applies `transform: scale(S.viewZoom)` with `transform-origin: 0 0`. Create toolbar controls `− / 视图 100% / +` plus a percentage menu using the exact eight levels. Preserve current viewport logical center when zoom changes.

- [ ] **Step 4: Add CSS for scaled workspace and scroll area**

In `styles.css`, make the viewport clip/scroll the scaled visual bounds while the editor workspace retains logical width/height. Do not resize `#editorStage` based on the view multiplier.

- [ ] **Step 5: Remove local magnifier integration**

Remove the `magnifier.js` script reference, remove/delete `magnifier.js`, and ensure no `magnifierPanel`, `magnifierLens`, or `magnifierControls` UI is created.

- [ ] **Step 6: Run tests**

Run: `node --test tests/workspace-zoom-core.test.cjs tests/workspace-zoom-dom.test.cjs`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

Commit message: `feat: add whole workspace view zoom`

---

### Task 3: Make image and crop interactions zoom-safe

**Files:**
- Modify: `app.js`
- Modify: `drag-fix.js`
- Modify: `precision-crop.js`
- Modify: `interaction-fix.js`
- Modify: `origin-align.js`

**Interfaces:**
- Consumes: `window.WorkspaceViewZoom.screenDeltaToWorkspace()` and `clientToWorkspace()`.
- Produces: all pan/resize interactions mutate `S.view` and `S.crop` only in logical 100% coordinates.

- [ ] **Step 1: Add failing tests for pointer delta conversion**

Extend the core test to pin these invariants:
- 4px screen drag at 400% → 1 logical px;
- 20px screen drag at 200% → 10 logical px;
- changing view zoom does not mathematically alter an existing logical crop object.

- [ ] **Step 2: Verify RED for the new assertions where appropriate**

Run: `node --test tests/workspace-zoom-core.test.cjs`

Expected: FAIL until any missing helper/invariant support is implemented.

- [ ] **Step 3: Convert source-image pan to logical delta**

In both `app.js` and any active duplicate image-drag handler in `drag-fix.js`, convert pointer movement through `screenDeltaToWorkspace()` before mutating `S.view.x/y`. Ensure exactly one handler owns image pan to avoid double movement.

- [ ] **Step 4: Convert crop move/resize to logical delta**

In `precision-crop.js`, store drag start in workspace coordinates or divide deltas through the shared zoom adapter. Crop-size lock must still allow move while blocking resize. Do not mutate width/height when only view zoom changes.

- [ ] **Step 5: Make geometry queries logical rather than transformed-screen geometry**

Replace transformed `getBoundingClientRect()` values used as logical dimensions with unscaled `offsetWidth/clientWidth` plus shared coordinate conversion. `origin-align.js` must align source-image top-left to ruler logical `0,0` independently of view zoom.

- [ ] **Step 6: Remove or neutralize duplicate crop drag ownership**

Keep one authoritative crop interaction path. `drag-fix.js` may own ruler rendering/edge-handle creation, but must not run a second simultaneous crop drag if `precision-crop.js` owns it.

- [ ] **Step 7: Run tests**

Run: `node --test tests/workspace-zoom-core.test.cjs tests/workspace-zoom-dom.test.cjs`

Expected: all tests PASS.

- [ ] **Step 8: Commit**

Commit message: `fix: keep crop and image coordinates stable across view zoom`

---

### Task 4: Store guides and snapping in logical coordinates

**Files:**
- Modify: `guides.js`
- Modify: `precision-crop.js`
- Remove from runtime or delete if unused: `snap-fix.js`

**Interfaces:**
- Consumes: `WorkspaceViewZoom.clientToWorkspace()` and `WorkspaceZoomCore.logicalSnapDistance()`.
- Produces guide state in logical values: each guide element carries `data-value` as the logical workspace coordinate, not transformed CSS pixels.

- [ ] **Step 1: Add failing snapping math tests**

Add assertions that visual snapping tolerance stays 12 screen pixels:
- zoom 1 → logical tolerance 12;
- zoom 2 → 6;
- zoom 4 → 3.

Also test nearest-guide selection using pure logical coordinate values if extracted into `workspace-zoom-core.js`.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/workspace-zoom-core.test.cjs`

Expected: FAIL for any newly introduced nearest-guide helper before implementation.

- [ ] **Step 3: Convert guide creation and drag to logical values**

From top ruler create horizontal guide value from logical Y; from left ruler create vertical guide value from logical X. Rendering converts logical guide values to workspace CSS positions without using transformed screen pixels as stored state.

- [ ] **Step 4: Convert snapping to logical coordinates**

In `precision-crop.js`, compare logical crop edges/centers with logical guide values and use `12 / S.viewZoom` tolerance. On snap, assign the exact guide logical coordinate so 100%, 200%, and 400% all land on the same X/Y.

- [ ] **Step 5: Eliminate the second snap pass**

Do not load or invoke `snap-fix.js` when the unified precision-crop snap path is active.

- [ ] **Step 6: Run tests**

Run: `node --test tests/workspace-zoom-core.test.cjs tests/workspace-zoom-dom.test.cjs`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

Commit message: `fix: make guides and snapping zoom independent`

---

### Task 5: Regression cleanup and release verification

**Files:**
- Modify: `index.html`
- Modify: `README.md`
- Modify: cache-busting query strings for changed scripts/styles
- Test: `tests/workspace-zoom-core.test.cjs`
- Test: `tests/workspace-zoom-dom.test.cjs`

**Interfaces:**
- Consumes all prior tasks.
- Produces final GitHub Pages build with one view-zoom system and no local magnifier.

- [ ] **Step 1: Add final static regression assertions**

Assert in DOM test that:
- only one workspace view zoom controller script is loaded;
- `magnifier.js` is absent;
- `workspace-zoom.js` loads before `precision-crop.js` and `guides.js`;
- cache-busting versions are updated.

- [ ] **Step 2: Run full automated test suite**

Run: `node --test tests/*.test.cjs`

Expected: 0 failures.

- [ ] **Step 3: Run syntax checks for every changed JS file**

Run: `node --check app.js && node --check workspace-zoom-core.js && node --check workspace-zoom.js && node --check drag-fix.js && node --check precision-crop.js && node --check guides.js && node --check interaction-fix.js && node --check origin-align.js`

Expected: exit code 0 for every file.

- [ ] **Step 4: Manual browser verification checklist**

Verify in the deployed page:
- new image opens at view 100%; source image top-left aligns to fixed ruler `0,0`;
- view zoom 100% → 200% → 400% visually scales image/ruler/crop/guides together;
- crop X/Y/W/H readout does not change merely because view zoom changes;
- at 400%, dragging 4 screen px changes the logical position by about 1px;
- guide at `X=713` remains `X=713` at every zoom;
- crop edge snaps exactly to that guide;
- moving source image never moves rulers/guides;
- source-image lock blocks image movement but not view zoom;
- crop-size lock preserves crop W/H while allowing move;
- output preview/download dimensions are identical at 50% and 400%.

- [ ] **Step 5: Update README**

Document `视图缩放` as an editing aid separate from `原图缩放` and mention fixed rulers/guides/snapping.

- [ ] **Step 6: Commit**

Commit message: `feat: ship precision workspace zoom`
