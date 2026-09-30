(() => {
  "use strict";

  if (window.ShynetymeDesignChain?.initialized) return;

  const chuck = window.ShynetymeChuck;
  if (!chuck?.showMessage || !chuck?.showChoices) return;

  const scriptUrl = document.currentScript?.src
    ? new URL(document.currentScript.src, window.location.href)
    : new URL("assets/js/customer-design-chain.js", window.location.href);
  const siteRoot = new URL("../../", scriptUrl);
  const pageKey = (window.location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();

  const DESIGN_KEY = "shynetymeDesignChainDraft";
  const CONTACT_KEY = "shynetymeContactDraft";
  const RECOMMENDATIONS_URL = new URL("project-recommendations.html", siteRoot);
  const CONTACT_URL = new URL("contact.html", siteRoot);
  const CATALOG_URL = new URL("assets/data/btf-catalog-items.json", siteRoot);
  const SETS_URL = new URL("assets/data/btf-recommendation-sets.js?v=20260809-product-catalog-1", siteRoot);

  const projectPages = {
    "ledbikesim.html": { type: "bike", label: "LED Bike Simulator" },
    "ledhomesim.html": { type: "home", label: "LED Home Simulator" },
    "ledautosim.html": { type: "auto", label: "LED Auto Simulator" }
  };

  const serviceSupport = {
    measurement: {
      id: "service-measurement-layout",
      name: "Measurement and Layout Package",
      category: "Design",
      description: "Final lengths, zone map, wire routes, controller placement and power-injection points are verified before ordering."
    },
    installation: {
      id: "service-installation-hardware",
      name: "Installation Hardware and Fabrication",
      category: "Installation",
      description: "Mounting, brackets, channels, fasteners, adhesives, sealing and custom fabrication are finalized for the selected project."
    },
    power: {
      id: "service-power-design",
      name: "Power, Fusing and Distribution Design",
      category: "Power",
      description: "Wire gauge, fusing, conversion, supply capacity and injection are calculated from the exact selected lighting rows."
    }
  };

  const catalogPromise = fetch(CATALOG_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Catalog data request failed");
      return response.json();
    })
    .catch(() => ({ products: [] }));

  const setsPromise = new Promise((resolve) => {
    if (window.SHYNETYME_BTF_RECOMMENDATION_SETS) {
      resolve(window.SHYNETYME_BTF_RECOMMENDATION_SETS);
      return;
    }
    const existing = document.querySelector("script[data-btf-recommendation-sets]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.SHYNETYME_BTF_RECOMMENDATION_SETS || {}), { once: true });
      existing.addEventListener("error", () => resolve({}), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SETS_URL.href;
    script.defer = true;
    script.dataset.btfRecommendationSets = "true";
    script.addEventListener("load", () => resolve(window.SHYNETYME_BTF_RECOMMENDATION_SETS || {}), { once: true });
    script.addEventListener("error", () => resolve({}), { once: true });
    document.head.appendChild(script);
  });

  let inputTimer = 0;
  let hasAnnouncedSuggestions = false;

  const readDraft = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(DESIGN_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const isVisible = (element) => {
    if (!(element instanceof HTMLElement) || element.hidden) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  };

  const fieldLabel = (field) => {
    const explicit = field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null;
    const wrapping = field.closest("label");
    return String(
      explicit?.textContent ||
      wrapping?.textContent ||
      field.getAttribute("aria-label") ||
      field.getAttribute("title") ||
      field.name ||
      field.id ||
      "Option"
    ).replace(/\s+/g, " ").trim().slice(0, 120);
  };

  const collectSelections = () => {
    const selections = [];
    const fields = [...document.querySelectorAll("main input, main select, main textarea, form input, form select, form textarea")];

    for (const field of fields) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) continue;
      if (field.disabled || field.type === "hidden" || field.closest("#dekeChuckWidget")) continue;
      if (!isVisible(field) && !["checkbox", "radio"].includes(field.type)) continue;

      let value = "";
      if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) {
        if (!field.checked) continue;
        value = field.value && field.value !== "on" ? field.value : "Selected";
      } else if (field instanceof HTMLSelectElement) {
        value = field.selectedOptions[0]?.textContent?.trim() || field.value;
        if (!value || /^(select|choose|none)/i.test(value)) continue;
      } else {
        value = String(field.value || "").trim();
        if (!value) continue;
      }

      selections.push({
        label: fieldLabel(field),
        value: String(value).replace(/\s+/g, " ").trim().slice(0, 180)
      });
      if (selections.length >= 90) break;
    }

    [...document.querySelectorAll("main [aria-pressed='true'], main .is-selected, main .selected")]
      .filter((element) => !element.closest("nav, .navbar, #dekeChuckWidget, .carousel-indicators"))
      .map((element) => String(element.getAttribute("aria-label") || element.textContent || "").replace(/\s+/g, " ").trim())
      .filter((value) => value && value.length <= 140)
      .slice(0, 30)
      .forEach((value) => selections.push({ label: "Selected area or effect", value }));

    return selections.filter((selection, index, list) =>
      list.findIndex((item) => `${item.label}|${item.value}` === `${selection.label}|${selection.value}`) === index
    );
  };

  const collectVisibleSummary = () => {
    const candidates = [
      document.getElementById("buildSummary"),
      document.getElementById("homeBuildSummary"),
      document.querySelector(".build-summary"),
      document.querySelector("[id*='build'][id*='summary']"),
      document.querySelector("[class*='build'][class*='summary']")
    ].filter(Boolean);
    return candidates
      .map((element) => String(element.textContent || "").replace(/\s+/g, " ").trim())
      .find((value) => value.length >= 20)
      ?.slice(0, 5000) || "";
  };

  const selectionText = (selections) => selections
    .map((selection) => `${selection.label}: ${selection.value}`)
    .join("\n");

  const detectsOutdoor = (type, text) => {
    const normalized = String(text || "").toLowerCase();
    if (type === "bike") {
      return /wheel|frame|basket|flag|turn signal|tail|brake|delivery|rain|outdoor|exterior|waterproof/.test(normalized);
    }
    if (type === "auto") {
      return /underglow|underbody|rocker|wheel|grille|exterior|outside|roof|truck bed|bumper|rain|waterproof/.test(normalized);
    }
    return /garage|path|yard|outdoor|exterior|soffit|patio|roof|landscape|porch|driveway|fence|pool|waterproof/.test(normalized);
  };

  const buildProductMap = (items = []) => {
    const map = new Map();
    items.forEach((product) => {
      map.set(product.id, product);
      (product.legacyIds || []).forEach((legacyId) => map.set(legacyId, product));
    });
    return map;
  };

  const recommendationEngine = async (type, selections, existing = {}) => {
    const [catalog, sets] = await Promise.all([catalogPromise, setsPromise]);
    const summary = `${selectionText(selections)} ${existing.summary || ""}`;
    const environment = detectsOutdoor(type, summary) ? "outdoor" : "indoor";
    const pool = Array.isArray(sets?.[type]?.[environment]) ? sets[type][environment] : [];
    const productMap = buildProductMap(catalog.products || []);
    const recommendations = [...new Map(pool
      .map((entry) => productMap.get(entry.id))
      .filter(Boolean)
      .map((product) => [product.id, product])).values()]
      .map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        voltages: product.voltages,
        waterproof: product.waterproof,
        image: product.image || "",
        sourceItems: product.sourceItems
      }));

    const flags = { ...(existing.flags || {}) };
    if (type === "home" && /garage/i.test(summary)) flags.garageBorder = true;
    if (type === "home" && /panel|story animation/i.test(summary)) flags.garagePanelStories = true;

    return {
      environment,
      recommendedProducts: recommendations,
      recommendedFamilyIds: recommendations.map((product) => product.id),
      supportItems: [serviceSupport.measurement, serviceSupport.installation, serviceSupport.power],
      flags
    };
  };

  const saveDraft = async (reason = "simulator-input") => {
    const page = projectPages[pageKey];
    if (!page) return readDraft();

    const previous = readDraft() || {};
    const sameProject = previous.projectType === page.type;
    const selections = collectSelections();
    const visibleSummary = collectVisibleSummary();
    const recommendation = await recommendationEngine(page.type, selections, {
      ...(sameProject ? previous : {}),
      summary: visibleSummary || (sameProject ? previous.summary : "") || ""
    });

    const selectedIds = sameProject && previous.selectionCustomized && Array.isArray(previous.selectedFamilyIds)
      ? previous.selectedFamilyIds.filter((id) => recommendation.recommendedFamilyIds.includes(id))
      : recommendation.recommendedFamilyIds;

    const draft = {
      version: 2,
      source: "simulator",
      reason,
      projectType: page.type,
      projectLabel: page.label,
      simulatorPage: pageKey,
      environment: recommendation.environment,
      selections,
      summary: visibleSummary || selectionText(selections),
      recommendedProducts: recommendation.recommendedProducts,
      recommendedFamilyIds: recommendation.recommendedFamilyIds,
      selectedFamilyIds: selectedIds,
      supportItems: recommendation.supportItems,
      selectedSupportIds: sameProject && previous.selectionCustomized && Array.isArray(previous.selectedSupportIds)
        ? previous.selectedSupportIds
        : recommendation.supportItems.map((item) => item.id),
      selectionCustomized: Boolean(sameProject && previous.selectionCustomized),
      flags: recommendation.flags,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(DESIGN_KEY, JSON.stringify(draft));
    return draft;
  };

  const materialSummary = (draft) => {
    const productMap = new Map((draft.recommendedProducts || []).map((product) => [product.id, product]));
    const selectedProducts = (draft.selectedFamilyIds || draft.recommendedFamilyIds || [])
      .map((id) => productMap.get(id))
      .filter(Boolean);
    const selectionLines = draft.selections?.length
      ? draft.selections.map((item) => `- ${item.label}: ${item.value}`).join("\n")
      : "- Simulator options will be finalized during consultation.";
    const productLines = selectedProducts.length
      ? selectedProducts.map((product) => `- ${product.name} (${product.voltages}; ${product.waterproof})`).join("\n")
      : "- Exact catalog rows will be finalized during consultation.";
    const supportLines = (draft.supportItems || [])
      .filter((item) => !draft.selectedSupportIds || draft.selectedSupportIds.includes(item.id))
      .map((item) => `- ${item.name}`)
      .join("\n");

    return [
      draft.projectLabel || "ShyneTyme LED Project",
      `Environment: ${draft.environment || "indoor"}`,
      "",
      "Simulator selections:",
      selectionLines,
      "",
      "Selected exact catalog items:",
      productLines,
      "",
      "Project services:",
      supportLines,
      draft.flags?.garagePanelStories ? "\nComing soon interest: Garage-door LED panel story animations." : ""
    ].filter(Boolean).join("\n");
  };

  const writeContactDraft = async (draft = readDraft()) => {
    if (!draft) return null;
    const catalog = await catalogPromise;
    const productMap = buildProductMap(catalog.products || []);
    const selectedProducts = [...new Map((draft.selectedFamilyIds || draft.recommendedFamilyIds || [])
      .map((id) => productMap.get(id))
      .filter(Boolean)
      .map((product) => [product.id, product])).values()];
    const selectedSupport = (draft.supportItems || [])
      .filter((item) => !draft.selectedSupportIds || draft.selectedSupportIds.includes(item.id));
    const now = new Date().toISOString();

    const project = [
      ...selectedProducts.map((product) => ({
        key: `design-${product.id}`,
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
      ...selectedSupport.map((item) => ({
        key: `design-${item.id}`,
        productId: item.id,
        productName: item.name,
        category: item.category,
        sourceItems: item.description,
        variant: null,
        addedAt: now
      }))
    ];

    const contactDraft = {
      source: "design-chain",
      createdAt: now,
      project,
      summary: materialSummary(draft),
      requestType: "Complete LED materials and installation consultation",
      pricingModel: "ShyneTyme-supplied materials, design, controls, fabrication and installation",
      designDraft: draft
    };
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contactDraft));
    return contactDraft;
  };

  const recommendationsHref = (draft = readDraft()) => {
    const url = new URL(RECOMMENDATIONS_URL);
    if (draft?.projectType) url.searchParams.set("type", draft.projectType);
    if (draft?.environment) url.searchParams.set("environment", draft.environment);
    return url.href;
  };

  const showSuggestionsReady = (draft) => {
    if (!draft) return;
    const total = draft.recommendedFamilyIds?.length || 0;
    chuck.showChoices(
      `I matched ${total} exact catalog items\nfor this ${draft.environment} ${draft.projectType} build.`,
      [
        { label: "Suggested Items", href: recommendationsHref(draft), primary: true },
        { label: "Keep Designing", action: "dismiss" }
      ],
      0
    );
  };

  const showBuildDecision = async () => {
    const draft = await saveDraft("build-output");
    if (!draft) return;
    await writeContactDraft(draft);
    chuck.showChoices(
      "How about reviewing the exact catalog items matched to your selections?",
      [
        { label: "Go Here", href: recommendationsHref(draft), primary: true },
        { label: "Consultation", action: "consultation" }
      ],
      0
    );
  };

  const installStyles = () => {
    if (document.getElementById("designChainStyles")) return;
    const style = document.createElement("style");
    style.id = "designChainStyles";
    style.textContent = `
      .design-chain-start-target{outline:3px solid rgba(114,239,255,.78)!important;outline-offset:4px!important;box-shadow:0 0 0 7px rgba(114,239,255,.12)!important}
      .design-chain-coming-soon{margin:.8rem 0;padding:.85rem;border:1px dashed rgba(255,120,199,.6);border-radius:.85rem;background:linear-gradient(135deg,rgba(255,90,185,.1),rgba(49,230,255,.08))}
      .design-chain-coming-soon strong{display:block;color:#fff;margin-bottom:.25rem}
      .design-chain-coming-soon p{margin:0 0 .65rem;color:#c7d8e5;font-size:.84rem}
      .design-chain-coming-soon button{font-weight:800}`;
    document.head.appendChild(style);
  };

  const findStartTarget = () => {
    if (!projectPages[pageKey]) return null;
    const selectors = [
      "main form input:not([type='hidden']):not([disabled])",
      "main form select:not([disabled])",
      "main [role='button']",
      "main button:not([disabled])",
      "main input:not([type='hidden']):not([disabled])",
      "main select:not([disabled])"
    ];
    for (const selector of selectors) {
      const target = [...document.querySelectorAll(selector)]
        .find((element) => isVisible(element) && !element.closest("nav, footer, #dekeChuckWidget"));
      if (target) return target;
    }
    return document.querySelector("main");
  };

  const showSimulatorStart = (attempt = 0) => {
    const page = projectPages[pageKey];
    if (!page) return;
    const target = findStartTarget();
    if (!target && attempt < 12) {
      window.setTimeout(() => showSimulatorStart(attempt + 1), 300);
      return;
    }
    if (!target) return;
    if (!target.id) target.id = "designChainStart";
    target.classList.add("design-chain-start-target");
    window.setTimeout(() => target.classList.remove("design-chain-start-target"), 9000);
    chuck.showMessage({
      text: `You picked the\n${page.label}.\nStart here.`,
      label: "Start Here",
      href: `#${target.id}`,
      theme: "cyan"
    }, 0);
  };

  const installHomeComingSoon = (attempt = 0) => {
    if (pageKey !== "ledhomesim.html" || document.getElementById("garagePanelStoryComingSoon")) return;
    const candidates = [...document.querySelectorAll("main label, main button, main h2, main h3, main h4, main .form-check, main .option-card, main .accordion-item")]
      .filter((element) => /garage/i.test(element.textContent || ""));
    const anchor = candidates.sort((a, b) => (a.textContent || "").length - (b.textContent || "").length)[0]
      || document.querySelector("main form")
      || document.querySelector("main");
    if (!anchor && attempt < 12) {
      window.setTimeout(() => installHomeComingSoon(attempt + 1), 350);
      return;
    }
    if (!anchor) return;

    const card = document.createElement("div");
    card.id = "garagePanelStoryComingSoon";
    card.className = "design-chain-coming-soon";
    card.innerHTML = `
      <strong>Garage-Door LED Panel Story Animations</strong>
      <p>Animated panel stories for children, holidays and custom scenes are planned. Garage-door border lighting can be designed now.</p>
      <button class="btn btn-outline-light btn-sm" type="button">Coming Soon</button>`;
    const block = anchor.closest(".accordion-item, .option-card, .form-check, section, fieldset") || anchor;
    block.insertAdjacentElement("afterend", card);

    card.querySelector("button")?.addEventListener("click", async () => {
      const draft = await saveDraft("garage-panel-coming-soon") || {};
      draft.flags = { ...(draft.flags || {}), garagePanelStories: true, garageBorder: true };
      draft.environment = "outdoor";
      localStorage.setItem(DESIGN_KEY, JSON.stringify(draft));
      chuck.showChoices(
        "Panel story animations are coming soon. Garage border items can be reviewed now.",
        [
          { label: "Suggested Border Items", href: recommendationsHref(draft), primary: true },
          { label: "Keep Designing", action: "dismiss" }
        ],
        0
      );
    });
  };

  const isBuildOutputControl = (control) => {
    const label = [control.textContent, control.getAttribute("aria-label"), control.getAttribute("title"), control.id, control.getAttribute("name")]
      .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    const isCopy = /copy.*(build|summary|notes)|(?:build|summary|notes).*copy/i.test(label);
    const isSend = /(send|request|submit|contact|consult).*(build|quote|project|notes|install)|(?:build|quote|project|notes).*(send|request|submit|contact|consult)/i.test(label);
    const contactLink = control instanceof HTMLAnchorElement
      && /contact\.html/i.test(control.getAttribute("href") || "")
      && Boolean(control.closest("main"));
    return { isCopy, isSend: isSend || contactLink };
  };

  const bindSimulatorEvents = () => {
    if (!projectPages[pageKey]) return;
    const scheduleSave = () => {
      window.clearTimeout(inputTimer);
      inputTimer = window.setTimeout(async () => {
        const draft = await saveDraft("simulator-input");
        if (!draft || hasAnnouncedSuggestions || !draft.selections.length) return;
        hasAnnouncedSuggestions = true;
        showSuggestionsReady(draft);
      }, 650);
    };
    document.addEventListener("change", scheduleSave, true);
    document.addEventListener("input", scheduleSave, true);
    document.addEventListener("click", (event) => {
      const control = event.target.closest("button, a, input[type='button'], input[type='submit']");
      if (!control || control.closest("nav, footer, #dekeChuckWidget")) return;
      const output = isBuildOutputControl(control);
      if (output.isCopy) {
        window.setTimeout(showBuildDecision, 120);
      } else if (output.isSend) {
        event.preventDefault();
        event.stopPropagation();
        showBuildDecision();
      }
    }, true);
  };

  const showHomepagePrompt = () => {
    chuck.showChoices(
      "What do you want\nto light up?",
      [
        { label: "Bike", href: new URL("ledbikesim.html?from=chuck", siteRoot).href, primary: true },
        { label: "Home", href: new URL("ledhomesim.html?from=chuck", siteRoot).href },
        { label: "Auto", href: new URL("ledautosim.html?from=chuck", siteRoot).href },
        { label: "Consultation", action: "consultation" }
      ],
      0
    );
  };

  document.addEventListener("shynetyme:chuck-choice", async (event) => {
    if (event.detail?.action !== "consultation") return;
    const draft = projectPages[pageKey] ? await saveDraft("consultation") : readDraft();
    if (draft) await writeContactDraft(draft);
    const url = new URL(CONTACT_URL);
    url.searchParams.set("source", "design-chain");
    url.hash = "contact-request";
    window.location.href = url.href;
  });

  installStyles();
  installHomeComingSoon();
  bindSimulatorEvents();

  if (pageKey === "index.html") {
    window.setTimeout(showHomepagePrompt, 650);
  } else if (projectPages[pageKey]) {
    window.setTimeout(showSimulatorStart, 700);
  } else if (pageKey === "project-recommendations.html") {
    window.setTimeout(() => chuck.showMessage({
      text: "These exact rows match the voltage and protection needed for this build.",
      label: "Review Items",
      href: "#recommendedMaterials"
    }, 9000), 700);
  }

  window.ShynetymeDesignChain = {
    initialized: true,
    readDraft,
    saveDraft,
    writeContactDraft,
    recommendationsHref,
    recommendationEngine
  };
})();
