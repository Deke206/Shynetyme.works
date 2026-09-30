# Bootstrap Web & Web App Coding Standard
## Official Bootstrap 5.3–Grounded Rules + Explicit Project Conventions

> **Authority:** This standard is grounded in the official Bootstrap 5.3 documentation at https://getbootstrap.com/docs/5.3/.
>
> Rules labeled **BOOTSTRAP-DOCUMENTED** are directly supported by Bootstrap documentation.
>
> Rules labeled **PROJECT CONVENTION** are additional conventions required for this project/workflow. They are useful engineering rules, but they are **not presented as Bootstrap requirements**.

---

# 1. Responsive Architecture

## BOOTSTRAP-DOCUMENTED — Mobile First

Bootstrap explicitly describes its responsive system as **mobile first**.

Bootstrap applies the minimum styles needed at the smallest breakpoint, then layers additional styles for larger viewports.

Use the base rules for the smallest viewport.

Use `min-width` breakpoints to progressively enhance the layout.

Bootstrap 5.3 default breakpoints:

```text
xs   < 576px
sm   >= 576px
md   >= 768px
lg   >= 992px
xl   >= 1200px
xxl  >= 1400px
```

Bootstrap documentation:

- https://getbootstrap.com/docs/5.3/layout/breakpoints/
- https://getbootstrap.com/docs/5.3/layout/grid/

Example:

```css
/* Base: smallest viewport / mobile-first */
.component {
  display: block;
  width: 100%;
}

/* sm */
@media (min-width: 576px) {
  .component {
    /* Enhancement for sm and larger */
  }
}

/* md */
@media (min-width: 768px) {
  .component {
    /* Enhancement for md and larger */
  }
}

/* lg */
@media (min-width: 992px) {
  .component {
    /* Enhancement for lg and larger */
  }
}

/* xl */
@media (min-width: 1200px) {
  .component {
    /* Enhancement for xl and larger */
  }
}

/* xxl */
@media (min-width: 1400px) {
  .component {
    /* Enhancement for xxl and larger */
  }
}
```

---

# 2. Do Not Target Every Device Model

## BOOTSTRAP-DOCUMENTED

Bootstrap states that its breakpoints represent useful viewport ranges and are **not intended to target every individual device or use case**.

Do not generate separate CSS rules for every phone model.

Avoid patterns such as:

```css
@media (width: 390px) {}
@media (width: 412px) {}
@media (width: 428px) {}
```

Prefer Bootstrap's breakpoint system unless the actual layout requires a justified custom breakpoint.

Source:

https://getbootstrap.com/docs/5.3/layout/breakpoints/

---

# 3. Grid Structure

## BOOTSTRAP-DOCUMENTED

Bootstrap's default grid is:

- Mobile first
- Flexbox based
- Twelve columns
- Responsive across six default breakpoint tiers
- Built around containers, rows, and columns

Use the normal relationship:

```html
<div class="container">
  <div class="row">
    <div class="col-12 col-md-6 col-xl-4">
      ...
    </div>
  </div>
</div>
```

This means the same content can progress from:

```text
Mobile  -> full width
md      -> half width
xl      -> one-third width
```

Source:

https://getbootstrap.com/docs/5.3/layout/grid/

---

# 4. Containers

## BOOTSTRAP-DOCUMENTED

Bootstrap provides:

```text
.container
.container-fluid
.container-{breakpoint}
```

Use `.container` when content should receive responsive maximum widths and horizontal padding.

Use `.container-fluid` when content should remain `width: 100%` at every viewport.

Use responsive containers when fluid behavior should stop at a particular breakpoint.

Do not invent a replacement container system without a design reason.

Source:

https://getbootstrap.com/docs/5.3/layout/containers/
https://getbootstrap.com/docs/5.3/layout/grid/

---

# 5. Rows, Columns, and Gutters

## BOOTSTRAP-DOCUMENTED

Rows wrap columns.

Bootstrap columns receive horizontal padding to create gutters, and rows compensate for that spacing.

Use Bootstrap gutter utilities where appropriate:

```text
g-*
gx-*
gy-*
```

Example:

```html
<div class="row g-3">
  <div class="col-12 col-md-6">
    ...
  </div>

  <div class="col-12 col-md-6">
    ...
  </div>
</div>
```

Do not casually override Bootstrap's `.row` or `.col-*` mechanics globally.

Source:

https://getbootstrap.com/docs/5.3/layout/grid/
https://getbootstrap.com/docs/5.3/layout/gutters/

---

# 6. Responsive Utilities

## BOOTSTRAP-DOCUMENTED

Bootstrap utilities can provide responsive behavior across breakpoints.

Use Bootstrap utilities when they already express the required behavior.

Example:

```html
<div class="d-flex flex-column flex-md-row gap-3">
  ...
</div>
```

Do not write custom CSS merely to reproduce an existing Bootstrap utility without a reason.

Bootstrap's Utility API can also generate custom responsive utility families when using Sass.

Source:

https://getbootstrap.com/docs/5.3/utilities/api/

---

# 7. Customizing Bootstrap

## BOOTSTRAP-DOCUMENTED

Bootstrap documents two primary customization paths:

1. Use Bootstrap source files through a package manager and customize through Sass.
2. Use compiled Bootstrap files and add your own styles that override or extend Bootstrap.

Bootstrap specifically recommends avoiding direct modification of core Bootstrap source files when customizing with Sass.

Project customization should live in project-owned source.

Example structure:

```text
scss/
  custom.scss

node_modules/
  bootstrap/
```

Source:

https://getbootstrap.com/docs/5.3/customize/overview/
https://getbootstrap.com/docs/5.3/customize/sass/

---

# 8. Do Not Modify Bootstrap Core Files

## BOOTSTRAP-DOCUMENTED

When using Bootstrap source, create your own stylesheet that imports and extends Bootstrap.

Do not treat Bootstrap's distributed source as the project's custom stylesheet.

Keep Bootstrap replaceable and upgradeable.

Source:

https://getbootstrap.com/docs/5.3/customize/sass/

---

# 9. CSS Variables

## BOOTSTRAP-DOCUMENTED

Bootstrap 5.3 exposes many CSS custom properties prefixed with:

```text
--bs-
```

Use Bootstrap variables where they provide the intended customization point.

Example:

```css
.component {
  color: var(--bs-body-color);
  background: var(--bs-body-bg);
}
```

Bootstrap increasingly uses local CSS variables on components so components can be customized without rebuilding all of Bootstrap.

Source:

https://getbootstrap.com/docs/5.3/customize/css-variables/

---

# 10. Sass Variables, Maps, Mixins, and Functions

## BOOTSTRAP-DOCUMENTED

When Bootstrap is consumed from source, prefer Bootstrap's supported Sass mechanisms instead of editing framework internals.

Bootstrap allows customization through:

```text
Variables
Maps
Mixins
Functions
Options
Utility API
```

Source:

https://getbootstrap.com/docs/5.3/customize/sass/
https://getbootstrap.com/docs/5.3/customize/options/
https://getbootstrap.com/docs/5.3/utilities/api/

---

# 11. Use Bootstrap Components as Designed

## BOOTSTRAP-DOCUMENTED

Bootstrap components have documented:

- Required markup
- Classes
- JavaScript dependencies
- ARIA relationships
- Responsive behavior
- Sass variables
- CSS variables

When generating a Bootstrap component, use the markup for the project's installed Bootstrap version.

Do not mix Bootstrap 4 component examples into Bootstrap 5 code.

Consult the component's current documentation before changing its internal structure.

Main component documentation:

https://getbootstrap.com/docs/5.3/components/

---

# 12. Navbar Responsiveness

## BOOTSTRAP-DOCUMENTED

Bootstrap navbars use:

```text
.navbar
.navbar-expand-sm
.navbar-expand-md
.navbar-expand-lg
.navbar-expand-xl
.navbar-expand-xxl
```

The selected `.navbar-expand-*` class controls the breakpoint where collapsed navigation expands.

Bootstrap also supports responsive offcanvas navigation.

Example:

```html
<nav class="navbar navbar-expand-lg">
  ...
</nav>
```

Use a `<nav>` element where appropriate.

Bootstrap also recommends identifying current navigation with:

```html
aria-current="page"
```

Source:

https://getbootstrap.com/docs/5.3/components/navbar/

---

# 13. Forms

## BOOTSTRAP-DOCUMENTED

Use appropriate input types.

Example:

```html
<label for="customer-email" class="form-label">
  Email
</label>

<input
  id="customer-email"
  type="email"
  class="form-control">
```

Bootstrap states that form controls need an appropriate accessible name.

A visible `<label>` is generally the preferred approach.

Do not rely on placeholder text as the normal substitute for a visible label.

Source:

https://getbootstrap.com/docs/5.3/forms/overview/

---

# 14. Accessibility

## BOOTSTRAP-DOCUMENTED

Bootstrap provides accessible foundations, but Bootstrap explicitly states that the overall accessibility of a project still depends on the author's:

```text
Markup
Additional styling
Scripting
```

Use semantic HTML and follow the accessibility requirements documented for each component.

Do not assume that adding Bootstrap classes automatically makes arbitrary markup accessible.

Source:

https://getbootstrap.com/docs/5.3/getting-started/accessibility/

---

# 15. Reduced Motion

## BOOTSTRAP-DOCUMENTED

Bootstrap contains support for `prefers-reduced-motion`.

Do not remove or defeat reduced-motion behavior without a specific reason.

Bootstrap exposes:

```text
$enable-reduced-motion
```

and uses reduced-motion handling in various animated components.

Source:

https://getbootstrap.com/docs/5.3/customize/options/
https://getbootstrap.com/docs/5.3/getting-started/accessibility/

---

# 16. Keep Bootstrap Lean

## BOOTSTRAP-DOCUMENTED

Bootstrap recommends keeping builds lean.

When building from Sass source, import only the Bootstrap portions the project actually needs when practical.

When bundling Bootstrap JavaScript, import only the components required when practical.

Bootstrap specifically documents selective imports for both CSS/Sass and JavaScript.

Source:

https://getbootstrap.com/docs/5.3/customize/optimize/

---

# 17. Production Optimization

## BOOTSTRAP-DOCUMENTED

Bootstrap's optimization documentation recommends:

- Minifying delivered code
- Compressing assets
- Avoiding unnecessary Bootstrap modules
- Deferring non-critical JavaScript or CSS where appropriate
- Serving production sites and assets over HTTPS

Source:

https://getbootstrap.com/docs/5.3/customize/optimize/

---

# 18. Bootstrap JavaScript

## BOOTSTRAP-DOCUMENTED

Only load Bootstrap JavaScript required by the components in use when using a modular build.

Bootstrap documents individual component imports such as:

```javascript
import Modal from 'bootstrap/js/dist/modal';
```

Some Bootstrap JavaScript components depend on Popper.

Consult the component documentation instead of guessing dependencies.

Source:

https://getbootstrap.com/docs/5.3/customize/optimize/
https://getbootstrap.com/docs/5.3/getting-started/javascript/

---

# 19. Utility `!important`

## BOOTSTRAP-DOCUMENTED

Bootstrap's Utility API-generated utilities use `!important` by default.

That behavior is intentional and controlled by:

```text
$enable-important-utilities
```

Therefore:

Do **not** establish a false blanket rule that "`!important` is never valid in Bootstrap."

Instead distinguish between:

1. Bootstrap utility classes, where `!important` is intentionally generated.
2. Project custom CSS, where unnecessary specificity escalation should still be avoided.

Source:

https://getbootstrap.com/docs/5.3/utilities/api/
https://getbootstrap.com/docs/5.3/customize/options/

---

# 20. CSS Grid

## BOOTSTRAP-DOCUMENTED

Bootstrap 5.3 includes an alternate CSS Grid system.

Bootstrap documents this system as **experimental and opt-in**.

The normal Bootstrap flexbox grid remains the default.

Do not assume Bootstrap CSS Grid is active unless the project explicitly enables it.

Source:

https://getbootstrap.com/docs/5.3/layout/css-grid/

---

# 21. PROJECT CONVENTION — Vertical First

> This rule is compatible with Bootstrap's mobile-first architecture, but the wording below is a project convention rather than an official Bootstrap rule.

At the smallest viewport:

1. Establish usable vertical flow.
2. Keep controls inside the viewport.
3. Stack content where necessary.
4. Introduce horizontal arrangements only when sufficient width exists.
5. Continue progressively through Bootstrap breakpoints.

Example:

```css
.control-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .control-group {
    flex-direction: row;
  }
}
```

---

# 22. PROJECT CONVENTION — HTML Section Descriptors

> Bootstrap does not prescribe this commenting format.

For maintainability, major custom sections should identify their page, object, purpose, and related source files.

```html
<!-- =========================================================
     PROJECT CONVENTION
     PAGE: /app/dashboard.html
     SECTION: Driver Status
     OBJECT: #driver-status-panel
     PURPOSE: Displays current driver state and controls
     CSS: assets/css/pages/dashboard.css
     JS: assets/js/pages/dashboard.js
     ========================================================= -->

<section id="driver-status-panel">
  ...
</section>
```

---

# 23. PROJECT CONVENTION — CSS-to-Page Cross-Reference

> Bootstrap does not require CSS comments to point back to a page or HTML object. This is an additional project traceability rule.

```css
/* ============================================================
   PROJECT CONVENTION
   PAGE: /app/dashboard.html
   SECTION: Driver Status
   OBJECT: #driver-status-panel
   HTML TARGET: <section id="driver-status-panel">
   PURPOSE: Layout for the driver status section
   RESPONSIVE: Mobile base; enhanced at md and lg
   ============================================================ */

#driver-status-panel {
  display: flex;
  flex-direction: column;
}
```

---

# 24. PROJECT CONVENTION — Responsive Override Descriptor

> This is a project documentation convention.

```css
/* ============================================================
   PROJECT CONVENTION — RESPONSIVE OVERRIDE
   PAGE: /app/dashboard.html
   OBJECT: #driver-status-panel
   BREAKPOINT: md / 768px
   CHANGE: Converts stacked controls to horizontal layout
   ============================================================ */

@media (min-width: 768px) {
  #driver-status-panel {
    flex-direction: row;
  }
}
```

---

# 25. PROJECT CONVENTION — JavaScript Traceability

> Bootstrap does not require this exact comment format.

```javascript
/* ============================================================
   PROJECT CONVENTION
   PAGE: /app/dashboard.html
   OBJECT: #driver-status-panel
   ACTION: Updates current driver state
   ============================================================ */
```

---

# 26. PROJECT CONVENTION — Shared vs Page-Specific CSS

Keep reusable design rules in shared stylesheets.

Create page-specific CSS only when a page has genuinely unique layout or behavior.

This is project architecture, not a Bootstrap mandate.

Example:

```text
assets/css/
  global.css
  components.css
  pages/
    dashboard.css
```

---

# 27. PROJECT CONVENTION — Additional Large-Display Breakpoints

Bootstrap's final default breakpoint is:

```text
xxl >= 1400px
```

Bootstrap allows breakpoints to be customized through Sass.

If the project genuinely needs a special large-monitor or TV layout, a custom breakpoint may be added.

Example:

```css
@media (min-width: 1800px) {
  .dashboard-shell {
    max-width: 1680px;
  }
}
```

This `1800px` value is **not a Bootstrap default**.

It must be treated as a project-specific design decision.

Official breakpoint customization:

https://getbootstrap.com/docs/5.3/layout/breakpoints/

---

# 28. PROJECT CONVENTION — Do Not Redesign During a Repair

When modifying an established Bootstrap project:

```text
Inspect current HTML
-> Inspect Bootstrap classes
-> Inspect existing custom CSS
-> Identify required change
-> Make the smallest valid edit
-> Verify responsive behavior
```

This is a project/source-protection rule, not a Bootstrap documentation rule.

---

# 29. REQUIRED CODE-GENERATION CHECKLIST

## BOOTSTRAP-DOCUMENTED FOUNDATION

Before generating or modifying Bootstrap code:

```text
[ ] Confirm the Bootstrap version.
[ ] Use the current version's documented component markup.
[ ] Start with the smallest viewport.
[ ] Use Bootstrap's min-width breakpoint model.
[ ] Use containers, rows, and columns correctly.
[ ] Use Bootstrap utilities where appropriate.
[ ] Use supported Bootstrap customization mechanisms.
[ ] Preserve documented accessibility requirements.
[ ] Check component JavaScript dependencies.
[ ] Avoid unnecessary Bootstrap CSS/JS modules in optimized builds.
[ ] Verify behavior across Bootstrap breakpoints.
```

## PROJECT CONVENTION

```text
[ ] Identify the page.
[ ] Identify the section.
[ ] Identify the custom object.
[ ] Add an HTML descriptor for major custom sections.
[ ] Add CSS comments that point to the relative page/object.
[ ] Add JS comments for significant page-specific behavior.
[ ] Keep shared rules in shared source.
[ ] Keep genuinely page-specific rules in page source.
[ ] Preserve established working structure.
[ ] Do not turn a repair into an unrelated redesign.
```

---

# 30. THINGS NOT TO GENERATE

## Based on Bootstrap's documented architecture

Do not:

```text
Build desktop first and treat mobile as an afterthought.

Target every individual phone width instead of using responsive breakpoint ranges.

Break the documented container -> row -> column grid relationship.

Globally destroy Bootstrap .row, .col-*, navbar, modal, or other component mechanics.

Modify Bootstrap core files when supported extension/customization mechanisms exist.

Use markup from a different Bootstrap major version without verifying compatibility.

Assume Bootstrap's experimental CSS Grid is enabled by default.

Assume arbitrary markup becomes accessible merely because Bootstrap classes were added.

Load unnecessary Bootstrap modules when using an optimized custom build.

Ignore documented component JavaScript or Popper dependencies.

Remove accessible names from form controls.

Remove documented ARIA relationships from interactive components.

Defeat reduced-motion behavior without a justified requirement.
```

---

# 31. MASTER RESPONSIVE PATTERN

```css
/* ============================================================
   PROJECT CONVENTION
   PAGE: /relative/page.html
   OBJECT: .component-name
   PURPOSE: Describe component
   ============================================================ */

/* Bootstrap mobile-first base */
.component-name {
  display: flex;
  flex-direction: column;
}

/* Bootstrap sm */
@media (min-width: 576px) {
  .component-name {
  }
}

/* Bootstrap md */
@media (min-width: 768px) {
  .component-name {
  }
}

/* Bootstrap lg */
@media (min-width: 992px) {
  .component-name {
  }
}

/* Bootstrap xl */
@media (min-width: 1200px) {
  .component-name {
  }
}

/* Bootstrap xxl */
@media (min-width: 1400px) {
  .component-name {
  }
}

/* Optional PROJECT breakpoint — not part of Bootstrap defaults */
@media (min-width: 1800px) {
  .component-name {
  }
}
```

---

# 32. SOURCE OF TRUTH

When this standard conflicts with memory, generated assumptions, old examples, or third-party tutorials:

```text
CURRENT OFFICIAL BOOTSTRAP DOCUMENTATION WINS
```

Primary documentation:

- Getting Started: https://getbootstrap.com/docs/5.3/getting-started/introduction/
- Accessibility: https://getbootstrap.com/docs/5.3/getting-started/accessibility/
- Breakpoints: https://getbootstrap.com/docs/5.3/layout/breakpoints/
- Containers: https://getbootstrap.com/docs/5.3/layout/containers/
- Grid: https://getbootstrap.com/docs/5.3/layout/grid/
- Gutters: https://getbootstrap.com/docs/5.3/layout/gutters/
- CSS Grid: https://getbootstrap.com/docs/5.3/layout/css-grid/
- Utilities: https://getbootstrap.com/docs/5.3/utilities/api/
- Forms: https://getbootstrap.com/docs/5.3/forms/overview/
- Navbar: https://getbootstrap.com/docs/5.3/components/navbar/
- Components: https://getbootstrap.com/docs/5.3/components/
- Customize: https://getbootstrap.com/docs/5.3/customize/overview/
- Sass: https://getbootstrap.com/docs/5.3/customize/sass/
- CSS Variables: https://getbootstrap.com/docs/5.3/customize/css-variables/
- Options: https://getbootstrap.com/docs/5.3/customize/options/
- Optimize: https://getbootstrap.com/docs/5.3/customize/optimize/

---

# FINAL RULE

```text
BOOTSTRAP DOCUMENTATION
-> MOBILE-FIRST BASE
-> BOOTSTRAP LAYOUT/COMPONENT MECHANICS
-> SUPPORTED CUSTOMIZATION
-> ACCESSIBILITY
-> RESPONSIVE VERIFICATION
-> PROJECT CONVENTIONS ONLY WHERE EXPLICITLY LABELED
```

Do not present a project preference as though Bootstrap itself requires it.

Do not invent Bootstrap rules.

When uncertain, inspect the current official Bootstrap documentation first.
