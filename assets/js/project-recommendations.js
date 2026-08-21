/**
 * Project materials page script
 *
 * CONTENTS
 * 1. Saved-build and Project Power state
 * 2. Filters and recommendation cards
 * 3. Selection persistence
 * 4. Consultation handoff
 */

(async () => {
  "use strict";

  const DESIGN_KEY = "shynetymeDesignChainDraft";
  const CONTACT_KEY = "shynetymeContactDraft";
  const params = new URLSearchParams(window.location.search);
  const requestedType = params.get("type");
  const requestedEnvironment = params.get("environment");

  const projectLabels = {
    bike: "LED Bike Simulator",
    home: "LED Home Simulator",
    auto: "LED Auto Simulator"
  };
  const simulatorPages = {
    bike: "ledbikesim.html",
    home: "ledhomesim.html",
    auto: "ledautosim.html"
  };
  const fallbackSupport = [
    { id: "service-measurement-layout", name: "Measurement and Layout Package", category: "Design", description: "Final lengths, zones, wire routes and controller positions are verified before products are ordered." },
    { id: "service-installation-hardware", name: "Installation Hardware and Fabrication", category: "Installation", description: "Mounting, brackets, channels, fasteners, adhesives, sealing and custom fabrication are finalized for the project." },
    { id: "service-power-design", name: "Power, Fusing and Distribution Design", category: "Power", description: "Supply capacity, conversion, fusing, wire gauge and power injection are calculated from the exact selected rows." }
  ];

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const readDraft = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(DESIGN_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const [Project Power, sets] = await Promise.all([
    window.SHYNETYME_BTF_READY.catch(() => null),
    Promise.resolve(window.SHYNETYME_BTF_RECOMMENDATION_SETS || {})
  ]);
  const allProducts = Array.isArray(Project Power?.products) ? Project Power.products : [];
  const productMap = new Map();
  const legacyProject PowerIds = {
    "strip-ws2811-smd5050-rgb": "ws2811-smd5050-rgb-ordinary",
    "fcob-solid-white-warm-white": "fcob-solid-warm-white-ip65",
    "fcob-solid-white-natural-white": "fcob-solid-natural-white-ip65",
    "fcob-solid-white-cold-white": "fcob-solid-cold-white-ip65",
    "fcob-cct-2700-6000": "fcob-cct-2700-6000k-ip65",
    "fcob-spi-rgbic-addressable": "fcob-spi-rgbic-addressable-ip66",
    "fcob-spi-rgbw-addressable": "fcob-spi-rgbw-addressable-ip66"
  };
  allProducts.forEach((product) => {
    productMap.set(product.id, product);
    productMap.set(`strip-${product.id}`, product);
    (product.legacyIds || []).forEach((legacyId) => productMap.set(legacyId, product));
  });
  Object.entries(legacyProject PowerIds).forEach(([legacyId, currentId]) => {
    const product = productMap.get(currentId);
    if (product) productMap.set(legacyId, product);
  });
  const canonicalizeIds = (ids = []) => [...new Set(ids
    .map((id) => productMap.get(id)?.id)
    .filter(Boolean))];

  const savedDraft = readDraft();
  const projectType = ["bike", "home", "auto"].includes(requestedType)
    ? requestedType
    : ["bike", "home", "auto"].includes(savedDraft?.projectType) ? savedDraft.projectType : "home";
  const environment = ["indoor", "outdoor"].includes(requestedEnvironment)
    ? requestedEnvironment
    : ["indoor", "outdoor"].includes(savedDraft?.environment) ? savedDraft.environment : "indoor";

  const poolIds = canonicalizeIds((sets?.[projectType]?.[environment] || []).map((entry) => entry.id));
  const savedIds = Array.isArray(savedDraft?.recommendedFamilyIds)
    ? canonicalizeIds(savedDraft.recommendedFamilyIds)
    : [];
  const recommendedIds = savedIds.length ? savedIds : poolIds;
  const savedSelectedIds = Array.isArray(savedDraft?.selectedFamilyIds)
    ? canonicalizeIds(savedDraft.selectedFamilyIds)
    : [];

  const draft = {
    version: 2,
    source: savedDraft?.source || "recommendations-page",
    projectType,
    projectLabel: savedDraft?.projectLabel || projectLabels[projectType],
    simulatorPage: savedDraft?.simulatorPage || simulatorPages[projectType],
    environment,
    selections: Array.isArray(savedDraft?.selections) ? savedDraft.selections : [],
    summary: savedDraft?.summary || "",
    recommendedFamilyIds: recommendedIds,
    recommendedProducts: recommendedIds.map((id) => {
      const product = productMap.get(id);
      return product ? {
        id: product.id,
        name: product.name,
        category: product.category,
        voltages: product.voltages,
        waterproof: product.waterproof,
        image: product.image || "",
        sourceItems: product.sourceItems
      } : null;
    }).filter(Boolean),
    selectedFamilyIds: savedSelectedIds.some((id) => recommendedIds.includes(id))
      ? savedSelectedIds.filter((id) => recommendedIds.includes(id))
      : [...recommendedIds],
    supportItems: Array.isArray(savedDraft?.supportItems) && savedDraft.supportItems.length ? savedDraft.supportItems : fallbackSupport,
    selectedSupportIds: Array.isArray(savedDraft?.selectedSupportIds) ? savedDraft.selectedSupportIds : fallbackSupport.map((item) => item.id),
    selectionCustomized: Boolean(savedDraft?.selectionCustomized),
    flags: savedDraft?.flags || {},
    updatedAt: new Date().toISOString()
  };

  const elements = {
    back: document.getElementById("backToSimulator"),
    projectType: document.getElementById("projectType"),
    selectionCount: document.getElementById("selectionCount"),
    suggestedCount: document.getElementById("suggestedCount"),
    recordedSelections: document.getElementById("recordedSelections"),
    familyGrid: document.getElementById("familyGrid"),
    supportGrid: document.getElementById("supportGrid"),
    familyCount: document.getElementById("familyCount"),
    supportCount: document.getElementById("supportCount"),
    comingSoon: document.getElementById("comingSoonSection"),
    requestTop: document.getElementById("requestConsultationTop"),
    requestBottom: document.getElementById("requestConsultation")
  };

  const selectedFamilies = new Set(draft.selectedFamilyIds);
  const selectedSupport = new Set(draft.selectedSupportIds);
  const recommendedProducts = recommendedIds.map((id) => productMap.get(id)).filter(Boolean);
  let query = "";
  let category = "all";

  const injectControls = () => {
    const section = document.getElementById("recommendedMaterials");
    const heading = section?.querySelector(".recommendations-section-heading");
    if (!section || !heading || document.getElementById("recommendationFilters")) return;

    const controls = document.createElement("div");
    controls.id = "recommendationFilters";
    controls.className = "recommendation-filters";
    const categories = [...new Set(recommendedProducts.map((product) => product.category))].sort();
    controls.innerHTML = `
      <label class="recommendation-filter-field">
        <span>Search suggested items</span>
        <input id="recommendationSearch" class="form-control" type="search" placeholder="WS2812B, IP67, 5V, connector, rope, controller...">
      </label>
      <label class="recommendation-filter-field">
        <span>Category</span>
        <select id="recommendationCategory" class="form-select">
          <option value="all">All suggested categories</option>
          ${categories.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}
        </select>
      </label>
      <button id="selectVisibleRecommendations" class="btn btn-outline-light" type="button">Select Visible</button>
      <button id="clearVisibleRecommendations" class="btn btn-outline-light" type="button">Clear Visible</button>`;
    heading.insertAdjacentElement("afterend", controls);

    document.getElementById("recommendationSearch")?.addEventListener("input", (event) => {
      query = event.target.value.trim().toLowerCase();
      renderFamilyGrid();
    });
    document.getElementById("recommendationCategory")?.addEventListener("change", (event) => {
      category = event.target.value;
      renderFamilyGrid();
    });
    document.getElementById("selectVisibleRecommendations")?.addEventListener("click", () => {
      visibleProducts().forEach((product) => selectedFamilies.add(product.id));
      saveSelections();
      renderFamilyGrid();
    });
    document.getElementById("clearVisibleRecommendations")?.addEventListener("click", () => {
      visibleProducts().forEach((product) => selectedFamilies.delete(product.id));
      saveSelections();
      renderFamilyGrid();
    });
  };

  const writeDraft = () => {
    draft.selectionCustomized = true;
    draft.selectedFamilyIds = [...selectedFamilies];
    draft.selectedSupportIds = [...selectedSupport];
    draft.updatedAt = new Date().toISOString();
    localStorage.setItem(DESIGN_KEY, JSON.stringify(draft));
  };

  const productSearchText = (product) => [
    product.id, product.name, product.category, product.model, product.productDetails,
    product.control, product.colors, product.voltages, product.waterproof, product.densities,
    product.widths, product.length, product.sourceItems, product.searchText, ...(product.tags || [])
  ].join(" ").toLowerCase();

  const visibleProducts = () => recommendedProducts.filter((product) =>
    (category === "all" || product.category === category) &&
    (!query || productSearchText(product).includes(query))
  );

  const updateCounts = () => {
    elements.familyCount.textContent = `${selectedFamilies.size} selected · ${recommendedProducts.length} matched`;
    elements.supportCount.textContent = `${selectedSupport.size} selected`;
    elements.suggestedCount.textContent = String(selectedFamilies.size + selectedSupport.size);
  };

  const renderSelections = () => {
    elements.selectionCount.textContent = String(draft.selections.length);
    elements.projectType.textContent = `${draft.projectLabel} · ${draft.environment}`;
    elements.back.href = simulatorPages[projectType] || "index.html";
    if (!draft.selections.length) {
      elements.recordedSelections.innerHTML = "<p>No detailed options were recorded. Return to the simulator to refine the build, or use the voltage-and-protection matches shown here.</p>";
      return;
    }
    elements.recordedSelections.innerHTML = draft.selections.map((selection) => `
      <div class="recorded-selection"><strong>${escapeHtml(selection.label)}</strong><span>${escapeHtml(selection.value)}</span></div>`).join("");
  };

  function renderFamilyGrid() {
    const products = visibleProducts();
    if (!products.length) {
      elements.familyGrid.innerHTML = '<div class="recommendations-empty">No matched Project Power rows fit this filter. Clear the search or choose another category.</div>';
      updateCounts();
      return;
    }
    elements.familyGrid.innerHTML = products.map((product) => {
      const checked = selectedFamilies.has(product.id);
      return `
        <article class="recommendation-card${checked ? "" : " is-unselected"}" data-family-card="${escapeHtml(product.id)}">
          <div class="recommendation-card__image">
            ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.imageAlt || product.name)}" loading="lazy">` : `<span>${escapeHtml(product.control || product.category)}</span>`}
          </div>
          <div class="recommendation-card__top">
            <span class="recommendation-card__category">${escapeHtml(product.category)}</span>
            <label class="recommendation-card__toggle"><input type="checkbox" data-family-toggle="${escapeHtml(product.id)}"${checked ? " checked" : ""}> Include</label>
          </div>
          <div class="recommendation-card__body">
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.productDetails || product.description)}</p>
            <div class="recommendation-card__chips">
              <span class="recommendation-card__chip">${escapeHtml(product.voltages)}</span>
              <span class="recommendation-card__chip">${escapeHtml(product.waterproof)}</span>
              <span class="recommendation-card__chip">${escapeHtml(product.densities)}</span>
              <span class="recommendation-card__chip">${escapeHtml(product.length)}</span>
            </div>
            <div class="recommendation-card__source">${escapeHtml(product.sourceItems)}</div>
          </div>
        </article>`;
    }).join("");
    updateCounts();
  }

  const renderSupportGrid = () => {
    elements.supportGrid.innerHTML = draft.supportItems.map((item) => {
      const checked = selectedSupport.has(item.id);
      return `
        <article class="recommendation-card${checked ? "" : " is-unselected"}" data-support-card="${escapeHtml(item.id)}">
          <div class="recommendation-card__top">
            <span class="recommendation-card__category">${escapeHtml(item.category)}</span>
            <label class="recommendation-card__toggle"><input type="checkbox" data-support-toggle="${escapeHtml(item.id)}"${checked ? " checked" : ""}> Include</label>
          </div>
          <div class="recommendation-card__body"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><div class="recommendation-card__chips"><span class="recommendation-card__chip">Finalized after measurement</span><span class="recommendation-card__chip">Included in project quote</span></div></div>
        </article>`;
    }).join("");
  };

  const saveSelections = () => {
    writeDraft();
    updateCounts();
  };

  const materialSummary = () => {
    const selectedProducts = [...selectedFamilies].map((id) => productMap.get(id)).filter(Boolean);
    const buildLines = draft.selections.length
      ? draft.selections.map((item) => `- ${item.label}: ${item.value}`).join("\n")
      : "- Exact simulator options to be confirmed during consultation.";
    const productLines = selectedProducts.length
      ? selectedProducts.map((product) => `- ${product.name} (${product.voltages}; ${product.waterproof}; ${product.sourceItems})`).join("\n")
      : "- Exact Project Power rows to be finalized during consultation.";
    const supportLines = draft.supportItems.filter((item) => selectedSupport.has(item.id)).map((item) => `- ${item.name}`).join("\n");
    return [
      draft.projectLabel,
      `Environment: ${draft.environment}`,
      "",
      "Simulator selections:", buildLines,
      "",
      "Selected exact Project Power items:", productLines,
      "",
      "Selected project services:", supportLines,
      draft.flags?.garagePanelStories ? "\nComing soon interest: Garage-door LED panel story animations." : ""
    ].filter(Boolean).join("\n");
  };

  const continueToConsultation = () => {
    saveSelections();
    const now = new Date().toISOString();
    const selectedProducts = [...selectedFamilies].map((id) => productMap.get(id)).filter(Boolean);
    const chosenSupport = draft.supportItems.filter((item) => selectedSupport.has(item.id));
    const project = [
      ...selectedProducts.map((product) => ({
        key: `recommendation-${product.id}`,
        productId: product.id,
        productName: product.name,
        category: product.category,
        sourceItems: product.sourceItems,
        variant: {
          item: product.sourceItem || "Selected",
          length: product.length,
          voltage: product.voltages,
          density: product.densities,
          waterproof: product.waterproof,
          width: product.widths,
          detail: product.productDetails || product.description
        },
        addedAt: now
      })),
      ...chosenSupport.map((item) => ({
        key: `recommendation-${item.id}`,
        productId: item.id,
        productName: item.name,
        category: item.category,
        sourceItems: item.description,
        variant: null,
        addedAt: now
      }))
    ];
    localStorage.setItem(CONTACT_KEY, JSON.stringify({
      source: "project-recommendations",
      createdAt: now,
      project,
      summary: materialSummary(),
      requestType: "Complete LED materials and installation consultation",
      pricingModel: "ShyneTyme.Works-supplied materials, design, controls, fabrication and installation",
      designDraft: draft
    }));
    window.location.href = "contact.html?source=project-recommendations#contact-request";
  };

  elements.familyGrid.addEventListener("change", (event) => {
    const toggle = event.target.closest("[data-family-toggle]");
    if (!toggle) return;
    toggle.checked ? selectedFamilies.add(toggle.dataset.familyToggle) : selectedFamilies.delete(toggle.dataset.familyToggle);
    toggle.closest(".recommendation-card")?.classList.toggle("is-unselected", !toggle.checked);
    saveSelections();
  });
  elements.supportGrid.addEventListener("change", (event) => {
    const toggle = event.target.closest("[data-support-toggle]");
    if (!toggle) return;
    toggle.checked ? selectedSupport.add(toggle.dataset.supportToggle) : selectedSupport.delete(toggle.dataset.supportToggle);
    toggle.closest(".recommendation-card")?.classList.toggle("is-unselected", !toggle.checked);
    saveSelections();
  });
  elements.requestTop.addEventListener("click", continueToConsultation);
  elements.requestBottom.addEventListener("click", continueToConsultation);

  injectControls();
  renderSelections();
  renderFamilyGrid();
  renderSupportGrid();
  elements.comingSoon.hidden = !(draft.flags?.garagePanelStories || draft.flags?.garageBorder);
  updateCounts();
  localStorage.setItem(DESIGN_KEY, JSON.stringify(draft));
})();
