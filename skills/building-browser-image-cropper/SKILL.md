---
name: building-browser-image-cropper
description: Use when building, restoring, or extending a browser-based image crop, resize, compression, ruler, guide, URL-import, or GitHub Pages image utility similar to tonktoy.
---

# Building Browser Image Cropper

## Overview

Use this skill to reproduce or extend the established tonktoy image-processing workflow quickly and consistently. Preserve logical coordinates, editing precision, local-first image handling, and the existing interaction model.

## Core Invariants

- Keep ruler origin fixed at `0,0`; horizontal ruler baseline is at least `2000px` and must not depend on output width.
- Workspace view zoom and source-image zoom are separate systems. View zoom never changes logical crop coordinates or export dimensions.
- Source-image zoom supports `25%–400%`, with a zoom-only lock; image position remains draggable unless the full image lock is enabled.
- Source image cannot move above `Y=0` or left of `X=0`.
- White crop frame moves/resizes independently from the source image; optional crop-size lock allows move-only behavior.
- Guides support drag-from-ruler plus exact numeric `X/Y` positioning, guide lock, and snapping.
- URL import feeds the same `File`/load pipeline as local uploads. Explain CORS failures instead of silently failing.
- Output supports JPG, PNG, WebP; JPG/WebP quality range is `10%–100%`; PNG is lossless.
- Keep center-stage click/drag upload. Avoid redundant upload boxes.

## Implementation Rules

1. Inspect existing files before editing; never guess current state.
2. For small requested changes, implement directly instead of asking unnecessary confirmation questions.
3. Maintain one interaction owner per behavior. Do not stack competing drag/zoom handlers that recalculate the same coordinates.
4. Coordinate math uses logical workspace units; CSS scale is presentation only.
5. When JS/CSS changes, bump cache-query versions in `index.html` so GitHub Pages does not serve stale behavior.
6. Preserve existing working features unless the user explicitly requests removal.
7. Prefer source assets in `assets/` over embedded base64 for user-replaceable branding.

## Verification Checklist

Before claiming completion, verify:

- `100% → 200% → 300% → 400% → 100%` keeps ruler origin stable.
- Same guide coordinate stays logically identical at all view zoom levels.
- Image cannot cross top/left ruler origin.
- Crop-frame lock, image lock, and zoom lock each affect only their intended behavior.
- Export dimensions remain exactly the requested width/height.
- URL import works for CORS-enabled direct image URLs and shows a useful error otherwise.
- GitHub `main` contains the intended files and cache-busted script versions.

## Project Reference

For the current visual/feature baseline and user-facing behavior, read `reference.md` in this skill folder.
