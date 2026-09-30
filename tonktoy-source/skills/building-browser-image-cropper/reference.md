# tonktoy Reference Baseline

## Product Goal

A desktop-first, browser-only image utility for fast crop, resize, compression, format conversion, filename control, and precise ruler/guide alignment. Processing stays local in the browser except when importing a remote image URL.

## Current UX Baseline

- Header title: `我是薛导，我来帮你裁剪图片。`
- Branding image lives at `assets/xuedao.webp` and must display fully without face cropping.
- Center editor is also the upload target: click or drag an image directly into it.
- Supported local input: JPG, PNG, WebP.
- Remote image URL import is available above the editor; loaded remote images enter the same editing pipeline.
- Crop ratios: free, 16:9, 4:3, 1:1, 3:4, 9:16.
- Output width/height fields can lock ratio.
- Crop frame has optional size lock: lock keeps width/height fixed while allowing movement.
- Fixed rulers: origin `0,0`; horizontal baseline at least `2000`; ruler range is independent from output width.
- Guides: draggable from rulers, numeric X/Y positioning, lock, clear, snapping.
- Workspace view zoom: 50%–400%, Photoshop-like visual zoom; does not change logical coordinates or output size.
- Source image zoom: 25%–400%, separate from workspace zoom, with zoom-only lock.
- Source image can align to ruler origin using `↖ 0,0` and may not cross above/left of origin.
- Formats: JPG, PNG, WebP.
- Quality: 10%–100% for JPG/WebP; PNG lossless.
- Preview panel shows output size, format, quality, and approximate file size.
- Download uses requested output dimensions, not current view zoom.

## Architecture Guidance

Keep responsibilities separated:

- `app.js`: file state, render/export pipeline, base controls.
- ruler/crop scripts: logical workspace geometry and crop frame.
- guide scripts: guide creation, numeric coordinates, lock/snap.
- workspace zoom scripts: visual viewport zoom only.
- source zoom scripts: source-image scale/position only.
- branding script: branding image/title only.
- URL import script: fetch remote image and convert to `File`, then call the existing load pipeline.

Avoid multiple scripts fighting over the same pointer events or recomputing the same crop/image state. When extending an old layered implementation, prefer consolidating behavior rather than adding another competing override.

## Deployment

Repository: `tonkhsueh777-oss/tonktoy`

GitHub Pages URL: `https://tonkhsueh777-oss.github.io/tonktoy/`

When updating production behavior on `main`:

1. Fetch current file/sha first.
2. Update the minimum required files.
3. Bump script/style cache query strings in `index.html` when necessary.
4. Re-fetch changed files or commit metadata before stating completion.
5. Tell the user to hard-refresh only if Pages/browser cache may still show the old build.
