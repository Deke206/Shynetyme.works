# Web Design & Application Engineering Rules (WEB_RULES.md)
# Project Scope: Web Applications, ShyneTyme Portals & Embedded Web Controllers

## 1. Architecture, Standards & Frameworks
- Baseline Standards: Modern semantic HTML5, modern modular CSS3, and standard ECMAScript modules (ESM).
- UI Toolkits: Bootstrap 5 or utility-first Tailwind CSS. Conform to existing project framework choices without introducing competing CSS libraries.
- Mobile-First Responsiveness: Design layouts mobile-first with adaptive breakpoints (xs, sm, md, lg, xl). Ensure all touch targets measure at least 48x48px.
- Visual Aesthetics: Maintain consistent visual styling across components (custom glassmorphism surfaces, dark backgrounds, high-contrast typography, refined borders).
- Accessibility (a11y): Enforce WCAG 2.1 AA standards: semantic landmark tags (`<header>`, `<nav>`, `<main>`, `<footer>`), explicit `aria-label` attributes on icon buttons, and accessible color contrast.

## 2. Web Bluetooth (WebBLE) & Hardware Interaction
- Explicit User Gesture: Web Bluetooth (`navigator.bluetooth.requestDevice`) calls must originate strictly from explicit user click or tap events. Never trigger scans on page load.
- Service & Characteristic Filtering: Restrict device filters strictly to required service UUIDs. Avoid broad unconstrained scans.
- Disconnection Resilience: Attach `gattserverdisconnected` event listeners to update UI states immediately when hardware disconnects. Provide clean manual reconnect triggers.
- Packet Buffering & Throttling: Throttle rapid user input (e.g., color wheels, brightness sliders) to 20-50ms intervals to prevent choking hardware UART/BLE queues.
- Local Storage State: Persist user preferences (active color presets, custom sequences, paired device names) in `localStorage` with JSON schema validation on read.

## 3. DOM Hygiene, CSS Discipline & Performance
- Scoped Styling: Encapsulate component styles to prevent cross-component layout leakage. Avoid global wildcard CSS rules that override form input styling.
- Core Web Vitals: Optimize for low Largest Contentful Paint (LCP) and zero Cumulative Layout Shift (CLS). Specify explicit image dimensions and avoid unstyled flash of content.
- Asynchronous Loading: Load external scripts and font resources asynchronously (`defer` or `async`). Eliminate render-blocking third-party trackers.
- Single-File Self-Containment: For standalone offline controllers (e.g., `st-ble-ui-preview.html`), maintain clean separation of concerns across core modules while supporting offline local filesystem execution.

## 4. Verification & Browser Compatibility
- Cross-Browser Standards: Test features across modern Chromium browsers (Chrome, Edge, Opera) for Web Bluetooth support; provide clear fallback messaging on unsupported browsers (Firefox, Safari iOS).
- Console Purity: Maintain zero uncaught exceptions and zero unhandled Promise rejections in DevTools console during runtime interaction.
