# ShyneTyme SIM production object map

## Production routes

```text
ledbikesim.html  -> LED Bike SIM
ledhomesim.html  -> LED Home SIM
ledautosim.html  -> LED Auto SIM
```

## Shared presentation files

```text
assets/css/site-navigation.css
  BEGIN: Shared simulator stylesheet loader
  END:   Shared simulator stylesheet loader

assets/css/sim-controls-shared.css
  BEGIN: Shared ShyneTyme simulator design tokens
  END:   Shared simulator form controls
```

The shared simulator stylesheet is imported by the canonical navigation
stylesheet, so Bike, Home, and Auto receive the same control skin without
replacing their existing simulator event logic.

## Home SIM production objects

```text
ledhomesim.html
  homeSimApp             Complete simulator application shell
  homeSurface            Fixed 1448 x 1086 image and overlay viewport
  homeSourceImage        Approved Front or Back View image
  homeLedCanvas          Animated LED particle layer
  homeTraceSvg           Fixed selectable installation geometry
  homeZoneGrid           Current-view installation buttons
  homeBuildSummary       Customer-facing selected-build summary
  copyBuild              Copies the completed Home SIM selection
  resetBuild             Clears all Home SIM installation selections
  homeZoneDialog         Shared settings dialog used by every LED area
```

## Home SIM data and media

```text
assets/data/home-sim-approved-geometry.json
  Locked coordinate source for Front and Back View installation zones

assets/images/home-sim-front-1.b64
  Approved 1448 x 1086 Front View image

assets/images/home-sim-rear-1.b64
  Approved 1448 x 1086 Back View image
```

## Shared effect registry

```text
assets/js/sim-preset-core.js
  solid       WLED 00
  breathe     WLED 02
  wipe        WLED 03
  scanner     WLED 06
  rainbow     WLED 09
  theater     WLED 13
  twinkle     WLED 17
  chase       WLED 28
  starlight   WLED 80
  sections    ShyneTyme custom section preset
```

## Home SIM loader and formatted controller package

```text
assets/js/home-sim.js
  BEGIN OBJECT: Production Home SIM source package
  BEGIN API CALL: Load and execute the formatted Home SIM controller
  BEGIN OBJECT: Public Home SIM loader API

assets/js/home-sim-source/home-sim-part-01.txt through part-04.txt
  Plain readable JavaScript source, concatenated in numeric order at runtime
  No minification, eval call, or compressed run-on source string
```

## Formatted Home SIM controller sections

```text
BEGIN OBJECT: Home SIM application constants and DOM references
BEGIN OBJECT: Mutable Home SIM state
BEGIN OBJECT: General data helpers
BEGIN OBJECT: Shared preset menu creation
BEGIN OBJECT: Approved geometry validation
BEGIN API CALL: Load locked Home SIM geometry
BEGIN API CALL: Load an approved Home SIM image from the assets tree
BEGIN OBJECT: Zone path and LED particle generation
BEGIN OBJECT: Canvas LED renderer and effect animation engine
BEGIN OBJECT: Fixed SVG hotspot rendering
BEGIN OBJECT: Zone button rendering
BEGIN OBJECT: Customer summary and stored build payload
BEGIN OBJECT: Dialog value reading and dynamic option visibility
BEGIN OBJECT: Dialog open, cancel, apply, and disable actions
BEGIN OBJECT: Scene, light mode, and full UI synchronization
BEGIN OBJECT: Clipboard and reset actions
BEGIN OBJECT: Home SIM event bindings
BEGIN OBJECT: Home SIM initialization and public test hooks
```

Every listed block has a matching `END OBJECT` or `END API CALL` marker.
