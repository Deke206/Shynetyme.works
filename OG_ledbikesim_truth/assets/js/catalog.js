(async () => {
  "use strict";

  const PROJECT_STORAGE_KEY = "shynetymeBtfProject";
  const CONTACT_DRAFT_KEY = "shynetymeContactDraft";
  const catalog = await window.SHYNETYME_BTF_READY.catch(() => null);
  const products = Array.isArray(catalog?.products) ? catalog.products : [];
  const categories = Array.isArray(catalog?.categories) ? catalog.categories : [];

  const injectCatalogStyles = () => {
    if (document.querySelector("link[data-btf-row-catalog]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "assets/css/catalog-row-items.css?v=20260806-catalog-theme-v2";
    link.dataset.btfRowCatalog = "true";
    document.head.appendChild(link);
  };
  injectCatalogStyles();

  const lead = document.querySelector(".catalog-lead");
  if (lead && catalog) {
    lead.innerHTML = `This searchable catalog contains <strong>${catalog.source.quotationRows} exact manufacturer quotation lines</strong> plus <strong>${catalog.source.selectedSystems} previously selected controllers, signal devices, connectors, wiring, ropes, kits and pixel systems</strong>. Every quotation row remains separate so voltage, length, density, width and protection can be selected without losing the original configuration.`;
  }
  const searchInput = document.getElementById("catalogSearch");
  if (searchInput) searchInput.placeholder = "Item number, WS2812B, 5V, 12V, IP67, RGBIC, controller, connector...";

  const elements = {
    search: searchInput,
    clearSearch: document.getElementById("clearSearch"),
    categoryNav: document.getElementById("categoryNav"),
    categorySelect: document.getElementById("categorySelect"),
    searchScope: document.getElementById("searchScope"),
    activeCategory: document.getElementById("activeCategory"),
    catalogCount: document.getElementById("catalogCount"),
    grid: document.getElementById("catalogGrid"),
    projectCount: document.getElementById("projectCount"),
    projectItems: document.getElementById("projectItems"),
    requestQuote: document.getElementById("requestQuote"),
    clearProject: document.getElementById("clearProject"),
    modal: document.getElementById("productModal"),
    modalCategory: document.getElementById("productModalCategory"),
    modalTitle: document.getElementById("productModalTitle"),
    modalDescription: document.getElementById("productModalDescription"),
    modalSummary: document.getElementById("productModalSummary"),
    variantRows: document.getElementById("productVariantRows"),
    modalStatus: document.getElementById("modalStatus"),
    addFamilyFromModal: document.getElementById("addFamilyFromModal")
  };

  if (!catalog || !products.length || !elements.grid) {
    if (elements.grid) elements.grid.innerHTML = '<div class="alert alert-danger" role="alert">The BTF-LIGHTING project catalog could not be loaded.</div>';
    if (elements.catalogCount) elements.catalogCount.textContent = "Catalog unavailable";
    return;
  }

  const productModal = elements.modal && window.bootstrap?.Modal ? new bootstrap.Modal(elements.modal) : null;
  let activeCategory = "all";
  let activeProductId = null;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  const readProject = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  };

  const writeProject = (items) => {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(items));
    renderProject();
  };

  const categoryLabel = (id) => categories.find((c) => c.id === id)?.label || id;
  const productSearchText = (p) => [
    p.id, p.name, p.description, p.category, p.model, p.productDetails, p.control,
    p.colors, p.voltages, p.waterproof, p.densities, p.widths, p.length,
    p.sourceItems, p.searchText, ...(p.tags || [])
  ].join(" ").toLowerCase();

  const visibleProducts = () => {
    const query = elements.search?.value.trim().toLowerCase() || "";
    return products.filter((p) => (activeCategory === "all" || p.category === activeCategory)
      && (!query || productSearchText(p).includes(query)));
  };

  const categoryCount = (id) => id === "all" ? products.length : products.filter((p) => p.category === id).length;

  function populateCategories() {
    if (elements.categoryNav) {
      elements.categoryNav.innerHTML = categories.map((category) => `
        <button class="catalog-category-button${category.id === activeCategory ? " is-active" : ""}" type="button" data-category="${escapeHtml(category.id)}">
          <span>${escapeHtml(category.label)}</span><span class="catalog-category-count">${categoryCount(category.id)}</span>
        </button>`).join("");
    }
    if (elements.categorySelect) {
      elements.categorySelect.innerHTML = categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)} (${categoryCount(category.id)})</option>`).join("");
      elements.categorySelect.value = activeCategory;
    }
  }

  const cardCode = (p) => p.sourceItem
    ? `${p.source.startsWith("FCOB") ? "FCOB" : "PIX"} #${p.sourceItem}`
    : String(p.control || p.category || "LED").slice(0, 22);

  function renderCards() {
    const items = visibleProducts();
    if (elements.activeCategory) elements.activeCategory.textContent = categoryLabel(activeCategory);
    if (elements.searchScope) elements.searchScope.textContent = activeCategory === "all" ? "Searching all categories" : `Searching ${categoryLabel(activeCategory)}`;
    if (elements.catalogCount) elements.catalogCount.textContent = `${items.length} catalog items shown · ${products.length} total`;

    if (!items.length) {
      elements.grid.innerHTML = '<div class="catalog-empty"><strong>No catalog items match that search.</strong><br>Clear the search or choose another category.</div>';
      return;
    }

    elements.grid.innerHTML = items.map((p) => `
      <article class="catalog-product-card" data-product-id="${escapeHtml(p.id)}">
        <div class="catalog-card-visual${p.image ? " has-image" : ""}">
          ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt || p.name)}" loading="lazy" width="720" height="520">` : ""}
          <span class="catalog-card-code">${escapeHtml(cardCode(p))}</span>
        </div>
        <div class="catalog-product-body">
          <p class="catalog-product-category">${escapeHtml(p.category)}</p>
          <h2 class="catalog-product-title">${escapeHtml(p.name)}</h2>
          <p class="catalog-product-description">${escapeHtml(p.productDetails || p.description)}</p>
          <div class="catalog-chip-list">
            <span class="catalog-chip">${escapeHtml(p.voltages)}</span>
            <span class="catalog-chip">${escapeHtml(p.waterproof)}</span>
            <span class="catalog-chip">${escapeHtml(p.densities)}</span>
            <span class="catalog-chip catalog-chip--quote">Project priced</span>
          </div>
          <dl class="catalog-card-meta">
            <div><dt>Model</dt><dd>${escapeHtml(p.model || p.control)}</dd></div>
            <div><dt>Length</dt><dd>${escapeHtml(p.length)}</dd></div>
            <div><dt>Width</dt><dd>${escapeHtml(p.widths)}</dd></div>
            <div><dt>Source</dt><dd>${escapeHtml(p.sourceItems)}</dd></div>
          </dl>
          <div class="catalog-card-actions">
            <button class="btn btn-outline-light" type="button" data-details="${escapeHtml(p.id)}">View Exact Row</button>
            <button class="btn btn-neon-cyan" type="button" data-add-item="${escapeHtml(p.id)}">Add Item</button>
          </div>
        </div>
      </article>`).join("");
  }

  function setModalStatus(message) {
    if (!elements.modalStatus) return;
    elements.modalStatus.textContent = message;
    clearTimeout(elements.modalStatus._timer);
    elements.modalStatus._timer = setTimeout(() => { elements.modalStatus.textContent = ""; }, 2600);
  }

  function addSelection(product) {
    const project = readProject();
    if (project.some((item) => item.productId === product.id)) {
      setModalStatus("Already in project list.");
      return;
    }
    project.push({
      key: product.id,
      productId: product.id,
      productName: product.name,
      category: product.category,
      sourceItems: product.sourceItems,
      applications: product.tags || [],
      variant: {
        item: product.sourceItem || "Selected",
        length: product.length,
        voltage: product.voltages,
        density: product.densities,
        waterproof: product.waterproof,
        width: product.widths,
        detail: product.productDetails || product.description
      },
      addedAt: new Date().toISOString()
    });
    writeProject(project);
    setModalStatus("Exact catalog item added to project.");
  }

  const removeSelection = (key) => writeProject(readProject().filter((item) => item.key !== key));

  function renderProject() {
    const project = readProject();
    if (elements.projectCount) elements.projectCount.textContent = String(project.length);
    if (elements.requestQuote) elements.requestQuote.disabled = !project.length;
    if (elements.clearProject) elements.clearProject.disabled = !project.length;
    if (!elements.projectItems) return;
    if (!project.length) {
      elements.projectItems.innerHTML = '<p class="catalog-project-empty">Add exact catalog rows to build a materials-and-installation request.</p>';
      return;
    }
    elements.projectItems.innerHTML = project.map((item) => `
      <div class="catalog-project-item"><div><strong>${escapeHtml(item.productName)}</strong><span>${escapeHtml([item.variant?.length,item.variant?.voltage,item.variant?.density,item.variant?.waterproof].filter(Boolean).join(" · "))}</span></div><button class="catalog-project-remove" type="button" data-remove-project="${escapeHtml(item.key)}">Remove</button></div>`).join("");
  }

  const modalSummaryCell = (label, value) => `<div class="catalog-summary-cell"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;

  function openProduct(p) {
    activeProductId = p.id;
    elements.modalCategory.textContent = p.category;
    elements.modalTitle.textContent = p.name;
    elements.modalDescription.textContent = p.description;
    let image = elements.modal.querySelector(".catalog-modal-product-image");
    if (!image) {
      image = document.createElement("div");
      image.className = "catalog-modal-product-image";
      elements.modalDescription.insertAdjacentElement("beforebegin", image);
    }
    image.innerHTML = p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt || p.name)}">` : `<span>${escapeHtml(cardCode(p))}</span>`;
    elements.modalSummary.innerHTML = [
      modalSummaryCell("Model", p.model), modalSummaryCell("Control / IC", p.control),
      modalSummaryCell("Voltage", p.voltages), modalSummaryCell("Protection", p.waterproof),
      modalSummaryCell("Length", p.length), modalSummaryCell("Density", p.densities),
      modalSummaryCell("Width", p.widths), modalSummaryCell("Source", p.sourceItems)
    ].join("");
    elements.variantRows.innerHTML = `<tr><td>${escapeHtml(p.sourceItem || "Selected")}</td><td>${escapeHtml(p.length)}</td><td>${escapeHtml(p.voltages)}</td><td>${escapeHtml(p.densities)}</td><td>${escapeHtml(p.waterproof)}</td><td>${escapeHtml(p.widths)}</td><td>${escapeHtml(p.productDetails || p.description)}</td><td><button class="btn btn-sm btn-neon-cyan" type="button" data-add-modal-item="${escapeHtml(p.id)}">Add Item</button></td></tr>`;
    elements.modalStatus.textContent = "";
    productModal?.show();
  }

  function selectionSummary(project) {
    return project.map((item, index) => `${index + 1}. ${item.productName}\n   Category: ${item.category}\n   Selection: ${[item.variant?.length,item.variant?.voltage,item.variant?.density,item.variant?.waterproof,item.variant?.width,item.variant?.detail].filter(Boolean).join("; ")}`).join("\n\n");
  }

  function openContactRequest() {
    const project = readProject();
    if (!project.length) return;
    localStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify({
      source: "btf-catalog", createdAt: new Date().toISOString(), project,
      summary: selectionSummary(project), requestType: "Complete LED materials and installation quote",
      pricingModel: "ShyneTyme-supplied materials, design, controls, fabrication and installation"
    }));
    window.location.href = "contact.html?source=btf-catalog#contact-request";
  }

  function setCategory(id) {
    activeCategory = categories.some((c) => c.id === id) ? id : "all";
    populateCategories(); renderCards();
    document.getElementById("catalog-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  elements.categoryNav?.addEventListener("click", (e) => { const b=e.target.closest("[data-category]"); if(b) setCategory(b.dataset.category); });
  elements.categorySelect?.addEventListener("change", () => setCategory(elements.categorySelect.value));
  elements.search?.addEventListener("input", renderCards);
  elements.clearSearch?.addEventListener("click", () => { elements.search.value=""; elements.search.focus(); renderCards(); });
  elements.grid.addEventListener("click", (e) => {
    const d=e.target.closest("[data-details]"); if(d){ const p=products.find(x=>x.id===d.dataset.details); if(p) openProduct(p); return; }
    const a=e.target.closest("[data-add-item]"); if(a){ const p=products.find(x=>x.id===a.dataset.addItem); if(p) addSelection(p); }
  });
  elements.variantRows?.addEventListener("click", (e) => { const b=e.target.closest("[data-add-modal-item]"); if(b){ const p=products.find(x=>x.id===b.dataset.addModalItem); if(p) addSelection(p); } });
  elements.addFamilyFromModal?.addEventListener("click", () => { const p=products.find(x=>x.id===activeProductId); if(p) addSelection(p); });
  if (elements.addFamilyFromModal) elements.addFamilyFromModal.textContent = "Add Exact Item to Project";
  elements.projectItems?.addEventListener("click", (e) => { const b=e.target.closest("[data-remove-project]"); if(b) removeSelection(b.dataset.removeProject); });
  elements.requestQuote?.addEventListener("click", openContactRequest);
  elements.clearProject?.addEventListener("click", () => writeProject([]));
  elements.modal?.addEventListener("hidden.bs.modal", () => { activeProductId=null; elements.modalStatus.textContent=""; });

  populateCategories(); renderCards(); renderProject();
})();
