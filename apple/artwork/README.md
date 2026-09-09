# Apple artwork

`icon.svg` is the original owner-provided Apple logo, copied without changes. `icon.png` is its 1024×1024 transparent PNG export and the build input for Safari and the native Mac icon catalog. Other browsers continue to use the repository-root `icon.png`.

The SVG contains an embedded raster image inside a pattern. AppKit’s SVG decoder misrenders this pattern, so export SVG edits with a renderer that supports the pattern correctly before running `npm run prepare:apple`. The current PNG was rendered with `@resvg/resvg-js` using `fitTo: { mode: 'width', value: 1024 }` and visually compared with Chrome’s rendering. No renderer dependency was added to the project.
