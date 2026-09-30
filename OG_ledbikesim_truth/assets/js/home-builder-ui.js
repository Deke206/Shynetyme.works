(() => {
  "use strict";
  const mount = document.getElementById("homeBuilderMount");
  if (!mount) return;
  mount.innerHTML = `
      <div class="home-builder-shell">
        <form id="homeBuilderForm" class="home-builder-form" novalidate>
          <div class="accordion" id="homeBuilderAccordion">
            <section class="accordion-item">
              <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#propertySetup" aria-expanded="true" aria-controls="propertySetup">1. Home and property</button></h2>
              <div id="propertySetup" class="accordion-collapse collapse show" data-bs-parent="#homeBuilderAccordion"><div class="accordion-body">
                <div class="question-row"><label class="question-label" for="homeStories">House height</label><select id="homeStories" name="homeStories" class="form-select"><option value="one">Single story</option><option value="two" selected>Two story</option></select></div>
                <div class="question-row"><label class="question-label" for="garageBays">Garage</label><select id="garageBays" name="garageBays" class="form-select"><option value="none">No attached garage</option><option value="one">One-car garage</option><option value="two" selected>Two-car garage</option></select></div>
                <div class="question-row"><label class="question-label" for="lotWidth">Approximate lot width</label><select id="lotWidth" name="lotWidth" class="form-select"><option value="compact">Compact / narrow</option><option value="standard" selected>Standard residential lot</option><option value="wide">Wide lot</option></select></div>
                <div class="question-row"><label class="question-label" for="propertyDimensions">Known property or wall dimensions</label><textarea id="propertyDimensions" name="propertyDimensions" class="form-control" rows="3" placeholder="Example: front roofline 42 ft, driveway 18 ft, rear patio 20 × 14 ft"></textarea></div>
                <div class="home-preview-rules mt-3"><div><span class="home-legend home-legend--on" aria-hidden="true"></span>Selected lighting zone</div><div><span class="home-legend home-legend--off" aria-hidden="true"></span>Available but not selected</div><p class="mb-0">Use all four views before copying the summary so the front, rear and yard details are represented.</p></div>
              </div></div>
            </section>
            <section class="accordion-item">
              <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#frontZones" aria-expanded="false" aria-controls="frontZones">2. Front face and garage</button></h2>
              <div id="frontZones" class="accordion-collapse collapse" data-bs-parent="#homeBuilderAccordion"><div class="accordion-body zone-choice-grid">
                <label class="zone-choice"><input type="checkbox" id="roofline" data-zone-input data-view-target="front" checked><span>Front roofline</span></label><label class="zone-choice"><input type="checkbox" id="garage" data-zone-input data-view-target="front" checked><span>Garage outline</span></label><label class="zone-choice"><input type="checkbox" id="porch" data-zone-input data-view-target="front" checked><span>Porch / columns</span></label><label class="zone-choice"><input type="checkbox" id="frontDoor" data-zone-input data-view-target="front"><span>Front-door frame</span></label><label class="zone-choice"><input type="checkbox" id="windows" data-zone-input data-view-target="front"><span>Window outlines</span></label><label class="zone-choice"><input type="checkbox" id="driveway" data-zone-input data-view-target="plan"><span>Driveway edges</span></label><label class="zone-choice"><input type="checkbox" id="frontPath" data-zone-input data-view-target="plan" checked><span>Front walkway</span></label>
              </div></div>
            </section>
            <section class="accordion-item">
              <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#rearZones" aria-expanded="false" aria-controls="rearZones">3. Rear face, patio and stairs</button></h2>
              <div id="rearZones" class="accordion-collapse collapse" data-bs-parent="#homeBuilderAccordion"><div class="accordion-body zone-choice-grid">
                <label class="zone-choice"><input type="checkbox" id="rearRoofline" data-zone-input data-view-target="rear"><span>Rear roofline</span></label><label class="zone-choice"><input type="checkbox" id="patioDoor" data-zone-input data-view-target="rear" checked><span>Patio-door frame</span></label><label class="zone-choice"><input type="checkbox" id="wallLamps" data-zone-input data-view-target="rear" checked><span>Rear wall lamps</span></label><label class="zone-choice"><input type="checkbox" id="stairs" data-zone-input data-view-target="rear" checked><span>Staircase / rail</span></label><label class="zone-choice"><input type="checkbox" id="balcony" data-zone-input data-view-target="rear"><span>Second-story landing</span></label><label class="zone-choice"><input type="checkbox" id="patio" data-zone-input data-view-target="rear" checked><span>Patio perimeter</span></label>
              </div></div>
            </section>
            <section class="accordion-item">
              <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#gardenZones" aria-expanded="false" aria-controls="gardenZones">4. Gazebo, paths and garden</button></h2>
              <div id="gardenZones" class="accordion-collapse collapse" data-bs-parent="#homeBuilderAccordion"><div class="accordion-body zone-choice-grid">
                <label class="zone-choice"><input type="checkbox" id="gazebo" data-zone-input data-view-target="garden" checked><span>Gazebo / pergola</span></label><label class="zone-choice"><input type="checkbox" id="gardenPath" data-zone-input data-view-target="garden" checked><span>Garden pathway</span></label><label class="zone-choice"><input type="checkbox" id="gardenBeds" data-zone-input data-view-target="garden"><span>Garden-bed edges</span></label><label class="zone-choice"><input type="checkbox" id="fence" data-zone-input data-view-target="garden"><span>Fence / gate</span></label><label class="zone-choice"><input type="checkbox" id="tree" data-zone-input data-view-target="garden"><span>Tree accents</span></label>
              </div></div>
            </section>
            <section class="accordion-item">
              <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#controlPower" aria-expanded="false" aria-controls="controlPower">5. Effects, control and power</button></h2>
              <div id="controlPower" class="accordion-collapse collapse" data-bs-parent="#homeBuilderAccordion"><div class="accordion-body">
                <div class="question-row"><label class="question-label" for="effectStyle">Primary effect style</label><select id="effectStyle" name="effectStyle" class="form-select"><option value="warm architectural">Warm architectural white</option><option value="color wash">Slow color wash</option><option value="holiday scenes">Seasonal and holiday scenes</option><option value="music reactive">Music-reactive color</option><option value="custom zones" selected>Independent custom zones</option></select></div>
                <div class="question-row"><div class="question-label">Control methods</div><div class="control-grid"><label class="control-choice"><input type="checkbox" class="control-input" value="Wi-Fi" checked><span>Wi-Fi</span></label><label class="control-choice"><input type="checkbox" class="control-input" value="Bluetooth"><span>Bluetooth</span></label><label class="control-choice"><input type="checkbox" class="control-input" value="Schedule / timer" checked><span>Schedule / timer</span></label><label class="control-choice"><input type="checkbox" class="control-input" value="Motion sensors"><span>Motion sensors</span></label></div></div>
                <div class="question-row"><label class="question-label" for="weatherproofing">Weather exposure</label><select id="weatherproofing" name="weatherproofing" class="form-select"><option value="mostly covered">Mostly covered mounting</option><option value="mixed exposure" selected>Mixed covered and exposed zones</option><option value="fully exposed">Mostly exposed to weather</option></select></div>
                <div class="question-row"><label class="question-label" for="budget">Suggested project budget</label><select id="budget" name="budget" class="form-select"></select></div>
                <div class="question-row"><label class="question-label" for="projectNotes">Installation notes</label><textarea id="projectNotes" name="projectNotes" class="form-control" rows="4" placeholder="Access points, outlets, HOA limits, ladder access, preferred colors, existing smart-home system…"></textarea></div>
              </div></div>
            </section>
          </div>
          <div class="home-summary-box mt-4"><div class="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-2"><h2 class="h5 mb-0">Current home build summary</h2><span id="homeBudgetBadge" class="badge home-budget-badge">Budget: $1,500</span></div><ul id="homeBuildSummary" aria-live="polite"></ul><div class="d-flex flex-wrap gap-2 mt-3"><button id="copyHomeBuild" type="button" class="btn btn-light">Copy home summary</button><button type="reset" class="btn btn-outline-light">Reset builder</button></div><div id="homeCopyStatus" class="small mt-2" aria-live="polite"></div></div>
        </form>
        <aside class="home-preview-card card" aria-label="Interactive exterior home preview">
          <div class="home-preview-toolbar p-3"><div><strong>Property live view</strong><div id="homeViewLabel" class="small text-white-50">Site plan · Two story · Two-car garage</div></div><div class="home-view-buttons" role="group" aria-label="Select home preview view"><button type="button" class="home-view-button active" data-home-view="plan" aria-pressed="true">Site Plan</button><button type="button" class="home-view-button" data-home-view="front" aria-pressed="false">Front + Garage</button><button type="button" class="home-view-button" data-home-view="rear" aria-pressed="false">Rear Face</button><button type="button" class="home-view-button" data-home-view="garden" aria-pressed="false">Garden + Gazebo</button></div></div>
          <div class="home-stage"><svg id="homePreview" viewBox="0 0 1000 680" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="homePreviewTitle homePreviewDesc"></svg></div>
        </aside>
      </div>`;
})();
