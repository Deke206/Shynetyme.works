# Home Builder validation

Validated before merge on 2026-07-23.

- New page uses the shared site stylesheet, bright shared hero stylesheet, shared navigation loader, shared site-wide Chuck component and existing footer structure.
- JavaScript syntax checks passed for the UI, SVG art, builder controller and shared navigation changes.
- Browser behavior checks passed for all four views: site plan, front with garage, rear face and garden with gazebo.
- Selecting a front, rear, plan or garden zone opens its corresponding view.
- One-story mode hides second-story details.
- No-garage mode removes the front garage; one-car and two-car door layouts update.
- Rear view includes the patio door, wall lamps, second-story landing and exterior staircase.
- Garden view includes patio, gazebo, path, garden beds, fence and tree zones.
- Summary updates with dimensions, selected lighting zones, controls, weather exposure, budget and notes.
- The feature branch was created from the latest main and was zero commits behind before PR creation.
