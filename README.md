# Sedan Zone Selector Pack

A standalone, responsive selector for a generic four-door sedan. Adobe Firefly generated the reference views. SVG groups provide independently clickable and keyboard-accessible hit zones.

## Files

- `index.html` — working demo and SVG zone geometry
- `sedan-zones.css` — highlight, layout, responsive, and focus styles
- `sedan-zones.js` — selection logic and integration API
- `zone-manifest.json` — canonical exterior/interior IDs

## JavaScript integration

```js
const zones = window.getSelectedSedanZones();

window.addEventListener('sedanZoneChange', event => {
  console.log(event.detail.selected);
});

window.setSelectedSedanZones(['headlights', 'underglow']);
```

Use `getSelectedSedanZones()` when building the quote/contact payload. It returns the exact IDs from `zone-manifest.json`.

## Production asset note

The demo currently references Adobe result URLs directly. Before deployment, save each generated image into the site's local assets directory and replace the five remote `img src` values. This prevents future URL expiration and keeps the SIM page self-contained.

## Geometry note

The SVG hit areas are aligned to a 2688 × 1536 viewBox. Keep the image and SVG in the same responsive container; do not change the SVG viewBox.
