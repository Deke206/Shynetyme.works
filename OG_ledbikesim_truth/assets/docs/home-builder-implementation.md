# Home Builder implementation

The Home Builder is organized as one page-specific feature on top of the shared ShyneTyme site foundation.

- `ledhomesim.html` provides the shared navigation, hero, breadcrumb, page mount, footer and shared scripts.
- `assets/css/home-builder.css` contains only Home Builder layout and SVG presentation rules.
- `assets/js/home-builder-ui.js` creates the form and live-view shell.
- `assets/js/home-builder-art.js` creates the four detailed SVG vantage points.
- `assets/js/home-builder.js` controls view switching, property choices, LED zones, summary and copy/reset behavior.
- `assets/js/site-guide.js` adds Home Builder to the site-wide navigation while preserving the current shared Chuck and bicycle-builder loaders.
