# ShyneTyme.works Web Platform — Operating Directives (GEMINI.md)
# Domain: Responsive Web Design & Web Application Architecture

## 1. Prime Directives & Design Guardrails
- Workspace Boundary: Confine all modifications strictly to `ShyneTyme.works editor`.
- Design Language: Professional dark-mode aesthetic with Glassmorphism, smooth CSS transitions, and high-contrast typography.
- UI Toolkit: Bootstrap 5 and modular custom CSS (`assets/css/`). Maintain clean HTML structure without unnecessary library bloat.
- Mobile-First Responsiveness: Ensure complete responsiveness across mobile, tablet, and desktop viewports. Touch targets must measure at least 48x48px.

## 2. Performance & Code Quality
- Clean Vanilla JS: Prefer modern vanilla ES6+ JavaScript modules. Do not inject heavy runtime frameworks (React/Vue) into static web assets.
- Asset Optimization: Compress images and icons (`assets/img/`). Utilize SVG for logos and iconography where applicable.
- SEO & Meta Tags: Preserve accurate OpenGraph metadata, `robots.txt`, and `sitemap.xml` entries across all page updates.
- Comment Preservation: Retain all existing page comments, copyright notices, and structural markers.
