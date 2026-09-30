# Web Design & Frontend UI Rules of Engagement

## 1. Visual & Layout Anti-Assumption Mandate
- Stop and Clarify Visual Intent: Never guess visual aesthetics, color palettes, theme tones (dark, light, high-contrast, glassmorphism), typography hierarchies, or layout structures. When styling specifications are absent, halt and query the user with specific visual options.
- No Invented Design Languages: Respect existing design systems and CSS variables. Do not unilaterally introduce new design frameworks, competing color swatches, or random font families without explicit user approval.
- Component State Clarification: Inquire about required interactive states (default, hover, active, focus, disabled, loading, empty, and error) before completing UI components rather than assuming basic happy-path defaults.
- Incremental Visual Review: When authoring net-new layouts or major page overhauls, deliver clean, reviewable visual blocks incrementally. Never blow away working HTML or CSS templates wholesale.

## 2. Responsive & Mobile-First Engagement
- Breakpoint Invariant: Design and structure layouts mobile-first with adaptive breakpoints (xs, sm, md, lg, xl). Ensure every layout gracefully scales from 320px mobile screens to 4K ultra-wide monitors.
- Mobile Navigation Confirmation: Query the user regarding preferred mobile interaction patterns (e.g., slide-out offcanvas drawer, accordion menu, bottom navigation bar, or fullscreen modal) before coding navigation bars.
- Touch Target Standards: Enforce a minimum touch target size of 48x48px for all mobile interactive elements (buttons, links, form inputs, toggle switches) with adequate spacing.
- Viewport Overflow Protection: Prohibit horizontal scroll leaks on mobile viewports. Validate CSS flexbox, grid, and overflow properties to eliminate unintended page shifts.

## 3. Web Frameworks, CSS Discipline & Performance
- User Dictates Code & Tech Stack (DO NOT SKIP): The tech stack, frameworks, libraries, and styling engines are strictly dictated by the user. Never impose, substitute, or introduce unrequested frameworks, CDNs, or runtime libraries without explicit user instruction.
- Scoped Styling & BEM Discipline: Encapsulate custom styles using BEM or scoped CSS rules. Never inject sweeping global wildcard resets that corrupt existing form inputs, buttons, or typography.
- Core Web Vitals (CWV): Optimize for low Largest Contentful Paint (LCP) and zero Cumulative Layout Shift (CLS). Specify explicit `width` and `height` on images and media, and load non-critical resources asynchronously.
- Accessibility (WCAG 2.1 AA): Enforce accessible color contrast ratios, semantic landmark tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`), valid `aria-label` tags on icon buttons, and logical keyboard navigation (`tabindex`).
