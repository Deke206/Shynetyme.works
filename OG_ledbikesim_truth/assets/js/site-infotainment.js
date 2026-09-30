(() => {
  "use strict";

  if (window.ShynetymeInfotainmentLoaded?.initialized) {
    window.ShynetymeInfotainmentLoaded.init?.();
    return;
  }

  const SLIDE_MS = 10000;
  const FEED_REFRESH_MS = 15 * 60 * 1000;
  const PROXY_PREFIX = "https://api.allorigins.win/raw?url=";

  const FALLBACK_QUOTES = Object.freeze([
    { text: "The strongest kind of shine is the kind that helps somebody else be seen.", author: "ShyneTyme Works" },
    { text: "A little useful light, shared on purpose, can travel farther than we ever see.", author: "ShyneTyme Works" },
    { text: "Good work compounds when people make room for one another to keep doing it.", author: "ShyneTyme Works" },
    { text: "Progress gets brighter when skill, courage, and compassion are passed forward.", author: "ShyneTyme Works" }
  ]);

  const QUOTE_SOURCE = "https://dummyjson.com/quotes/random/10";

  const FEEDS = Object.freeze({
    hfot: { type: "rss", url: "https://www.hfotusa.org/blog/feed/" },
    dvids: { type: "rss", url: "https://www.dvidshub.net/rss/news" },
    redcross: { type: "html", url: "https://www.redcross.org/about-us/news-and-events/latest-news.html", match: /redcross\.org/i },
    habitat: { type: "html", url: "https://www.habitat.org/newsroom", match: /habitat\.org/i },
    ldf: { type: "html", url: "https://www.naacpldf.org/news/", match: /naacpldf\.org/i },
    naacp: { type: "html", url: "https://naacp.org/news", match: /naacp\.org/i }
  });

  const HUMANITARIAN_SPOTLIGHTS = Object.freeze([
    {
      key: "redcross",
      kicker: "HUMANITARIAN SPOTLIGHT",
      name: "American Red Cross",
      domain: "redcross.org",
      summary: "Disaster relief, lifesaving blood services, emergency training, international humanitarian work, and support for military members, veterans, and their families.",
      donate: "https://www.redcross.org/donate/donation.html/",
      home: "https://www.redcross.org/",
      news: "https://www.redcross.org/about-us/news-and-events/latest-news.html",
      scene: "assets/images/hero-scene-marina.webp"
    },
    {
      key: "habitat",
      kicker: "COMMUNITY SPOTLIGHT",
      name: "Habitat for Humanity",
      domain: "habitat.org",
      summary: "Affordable housing, homebuilding and repair, neighborhood revitalization, disaster recovery, and community development carried out with families and volunteers.",
      donate: "https://www.habitat.org/support",
      home: "https://www.habitat.org/",
      news: "https://www.habitat.org/newsroom",
      scene: "assets/images/hero-scene-work.webp"
    }
  ]);

  const RIGHTS_SPOTLIGHTS = Object.freeze([
    {
      key: "ldf",
      kicker: "CIVIL RIGHTS SPOTLIGHT",
      name: "NAACP Legal Defense Fund",
      domain: "naacpldf.org",
      summary: "Litigation, advocacy, and public education focused on racial justice, equal citizenship, voting rights, education, and a stronger democracy.",
      donate: "https://www.naacpldf.org/support/ways-to-give/",
      home: "https://www.naacpldf.org/",
      news: "https://www.naacpldf.org/news/",
      scene: "assets/images/hero-scene-dance.webp"
    },
    {
      key: "naacp",
      kicker: "CIVIL RIGHTS SPOTLIGHT",
      name: "NAACP",
      domain: "naacp.org",
      summary: "Civil-rights advocacy, civic engagement, policy work, and community action focused on equal rights, equal opportunity, and democratic participation.",
      donate: "https://naacp.org/donate",
      home: "https://naacp.org/",
      news: "https://naacp.org/news",
      scene: "assets/images/hero-scene-school.webp"
    }
  ]);

  const SERVICE_SPOTLIGHTS = Object.freeze([
    {
      kicker: "CURRENT SERVICE · LEADERSHIP · TEAMWORK",
      name: "Master Sgt. Stephania Abdul-Zahir · Air National Guard",
      summary: "A 2026 DVIDS profile follows Abdul-Zahir as she leads medical-detachment support, maintains readiness for fellow Airmen, pursues a doctorate, and mentors others while serving with the 121st Air Refueling Wing.",
      source: "DVIDS",
      domain: "dvidshub.net",
      url: "https://www.dvidshub.net/news/565686/proud-service-air-national-guard",
      image: "https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2605/9695570/1000w_q95.jpg",
      fallbackImage: "assets/images/hero-scene-work.webp"
    },
    {
      kicker: "CURRENT SERVICE · READINESS · TEAMWORK",
      name: "Airman 1st Class Jacob Barnes · U.S. Air Force",
      summary: "DVIDS profiled Barnes in 2026 for expanding beyond aircraft maintenance into security-forces augmentee training, building a wider skill set to strengthen his wing's readiness and teamwork.",
      source: "DVIDS",
      domain: "dvidshub.net",
      url: "https://www.dvidshub.net/news/562835/multi-capable-airman-strengthens-100-arws-readiness",
      image: "https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2604/9618433/1000w_q95.jpg",
      fallbackImage: "assets/images/hero-scene-work.webp"
    },
    {
      kicker: "VETERAN SPOTLIGHT · RESILIENCE · FAMILY",
      name: "Army Sgt. Nate Shumaker · Veteran",
      summary: "Homes For Our Troops highlighted Shumaker in 2026 as a living Army veteran continuing an active family life, pursuing athletic goals, and building greater independence in a specially adapted HFOT home.",
      source: "HFOT",
      domain: "hfotusa.org",
      url: "https://www.hfotusa.org/foundation-for-family-a-fathers-day-tribute/",
      image: "assets/images/hero-scene-work.webp",
      fallbackImage: "assets/images/hero-scene-work.webp"
    }
  ]);

  const GHOST_FALLBACKS = Object.freeze({
    redcross: [{ title: "Red Cross responds as wildfires consume millions of acres out West", description: "Current American Red Cross reporting on disaster response and help for affected communities.", url: "https://www.redcross.org/about-us/news-and-events/latest-news.html" }],
    habitat: [{ title: "Lowe's renews partnership with Habitat for Humanity to support home repair projects", description: "Habitat reported new support for more than 200 home-repair projects across 20 U.S. affiliates.", url: "https://www.habitat.org/newsroom" }],
    ldf: [{ title: "Civil rights groups challenge weakened student civil-rights protections", description: "Current Legal Defense Fund reporting on civil-rights protections, education, voting rights, and equal citizenship.", url: "https://www.naacpldf.org/news/" }],
    naacp: [{ title: "NAACP civil-rights advocacy and community action", description: "Current NAACP news and advocacy on equal rights, civic participation, education, and opportunity.", url: "https://naacp.org/news" }],
    dvids: [{ title: "Multi-Capable Airman strengthens 100 ARW's readiness", description: "DVIDS profiled Airman 1st Class Jacob Barnes expanding his skills to strengthen unit readiness and teamwork.", url: "https://www.dvidshub.net/news/562835/multi-capable-airman-strengthens-100-arws-readiness" }],
    hfot: [{ title: "Foundation for Family: A Father's Day Tribute", description: "Homes For Our Troops highlighted living Army veteran Nate Shumaker's family life, independence, and athletic goals.", url: "https://www.hfotusa.org/foundation-for-family-a-fathers-day-tribute/" }]
  });

  const feedCache = new Map();
  const feedOffsets = new Map();
  let quotePool = [...FALLBACK_QUOTES];
  let lastQuoteKey = "";
  let quoteLoadedAt = 0;
  let humanitarianIndex = Math.floor(Math.random() * HUMANITARIAN_SPOTLIGHTS.length);
  let rightsIndex = Math.floor(Math.random() * RIGHTS_SPOTLIGHTS.length);
  let serviceIndex = Math.floor(Math.random() * SERVICE_SPOTLIGHTS.length);
  let ghostTimer = 0;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const orgIcon = (domain, size = 128) =>
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;

  const resolveUrl = (href, base) => {
    try { return new URL(href, base).href; } catch { return ""; }
  };

  const uniqueItems = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = `${item.url}|${item.title}`;
      if (!item.title || !item.url || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const stripMarkup = (value = "") => {
    const doc = new DOMParser().parseFromString(String(value), "text/html");
    return (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  };

  const parseRss = (text) => {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.querySelector("parsererror")) return [];
    return uniqueItems([...xml.querySelectorAll("item")].map((item) => ({
      title: item.querySelector("title")?.textContent?.trim() || "",
      url: item.querySelector("link")?.textContent?.trim() || "",
      description: stripMarkup(item.querySelector("description")?.textContent || "").slice(0, 260),
      published: item.querySelector("pubDate")?.textContent?.trim() || ""
    })).filter((item) => item.title && item.url)).slice(0, 18);
  };

  const parseHtml = (text, source) => {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const candidates = [...doc.querySelectorAll("h2 a, h3 a, article a, .post-title a, .entry-title a")];
    return uniqueItems(candidates.map((link) => {
      const title = link.textContent?.replace(/\s+/g, " ").trim() || "";
      const url = resolveUrl(link.getAttribute("href") || "", source.url);
      const article = link.closest("article, li, .card, .cmp-teaser, .news-item") || link.parentElement?.parentElement;
      const description = (article?.querySelector("p")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 210);
      return { title, url, description };
    }).filter((item) => item.title.length >= 18 && item.title.length <= 180 && source.match.test(item.url))).slice(0, 12);
  };

  const fetchText = async (url) => {
    const attempts = [url, `${PROXY_PREFIX}${encodeURIComponent(url)}`];
    for (const requestUrl of attempts) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 6500);
      try {
        const response = await fetch(requestUrl, {
          cache: "no-store",
          mode: "cors",
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (text.trim()) return text;
      } catch {
        // Try the next transport. Static fallback content remains usable if both fail.
      } finally {
        window.clearTimeout(timeout);
      }
    }
    return "";
  };

  const loadQuotePool = async (force = false) => {
    if (!force && quoteLoadedAt && Date.now() - quoteLoadedAt < FEED_REFRESH_MS && quotePool.length > FALLBACK_QUOTES.length) {
      return quotePool;
    }

    const text = await fetchText(QUOTE_SOURCE);
    if (!text) return quotePool;

    try {
      const payload = JSON.parse(text);
      const sourceQuotes = Array.isArray(payload) ? payload : [payload];
      const liveQuotes = sourceQuotes
        .map((item) => ({
          text: String(item.quote || item.content || "").replace(/\s+/g, " ").trim(),
          author: String(item.author || "Unknown").replace(/\s+/g, " ").trim()
        }))
        .filter((item) => item.text.length >= 20 && item.text.length <= 180 && item.author);

      if (liveQuotes.length) {
        quotePool = [...liveQuotes, ...FALLBACK_QUOTES];
        quoteLoadedAt = Date.now();
      }
    } catch {
      // Recovered ShyneTyme quotes remain available when the live source is unavailable.
    }
    return quotePool;
  };

  const nextQuote = () => {
    const candidates = quotePool.length ? quotePool : FALLBACK_QUOTES;
    let quote = candidates[Math.floor(Math.random() * candidates.length)] || FALLBACK_QUOTES[0];
    if (candidates.length > 1) {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        const key = `${candidate.text}|${candidate.author}`;
        if (key !== lastQuoteKey) {
          quote = candidate;
          break;
        }
      }
    }
    lastQuoteKey = `${quote.text}|${quote.author}`;
    return quote;
  };

  const loadFeed = async (key, force = false) => {
    const source = FEEDS[key];
    if (!source) return [];
    const cached = feedCache.get(key);
    if (!force && cached && Date.now() - cached.loadedAt < FEED_REFRESH_MS) return cached.items;

    const text = await fetchText(source.url);
    const items = text
      ? (source.type === "rss" ? parseRss(text) : parseHtml(text, source))
      : [];

    if (items.length) feedCache.set(key, { loadedAt: Date.now(), items });
    return items.length ? items : (cached?.items || []);
  };

  const nextFeedItem = (key) => {
    const items = feedCache.get(key)?.items || [];
    if (!items.length) return null;
    const offset = feedOffsets.get(key) || 0;
    const item = items[offset % items.length];
    feedOffsets.set(key, (offset + 1) % items.length);
    return item;
  };

  const iconAction = (href, domain, label) => {
    const initials = domain.split(".")[0].slice(0, 2).toUpperCase();
    return `
      <a class="infotainment-icon-button" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
        <span class="infotainment-icon-fallback" aria-hidden="true">${escapeHtml(initials)}</span>
        <img src="${orgIcon(domain)}" alt="" width="32" height="32" loading="lazy">
      </a>`;
  };

  const liveHeadline = (key, fallbackHref, fallbackText, label) => `
    <p class="infotainment-live-line" data-live-feed="${key}">
      <span>${escapeHtml(label)}</span>
      <a href="${fallbackHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(fallbackText)}</a>
    </p>`;

  const ghostLayer = (keys) => `
    <div class="infotainment-ghost-layer" data-ghost-keys="${keys.join(",")}" aria-hidden="true">
      <div class="infotainment-ghost-card" data-ghost-slot="0"></div>
      <div class="infotainment-ghost-card" data-ghost-slot="1"></div>
      <div class="infotainment-ghost-card" data-ghost-slot="2"></div>
    </div>`;

  const currentHumanitarian = () => HUMANITARIAN_SPOTLIGHTS[humanitarianIndex % HUMANITARIAN_SPOTLIGHTS.length];
  const currentRights = () => RIGHTS_SPOTLIGHTS[rightsIndex % RIGHTS_SPOTLIGHTS.length];

  const nonprofitPanel = (spotlight, panelType) => `
    <div class="infotainment-panel" data-spotlight-panel="${panelType}">
      <p class="infotainment-kicker" data-spotlight-kicker>${escapeHtml(spotlight.kicker)}</p>
      <h2 data-spotlight-title>${escapeHtml(spotlight.name)}</h2>
      <p data-spotlight-summary>${escapeHtml(spotlight.summary)}</p>
      <p class="infotainment-live-line" data-live-feed="${spotlight.key}" data-spotlight-live>
        <span>LATEST</span>
        <a href="${spotlight.news}" target="_blank" rel="noopener noreferrer">${escapeHtml(spotlight.name)} news</a>
      </p>
      <div class="infotainment-actions" data-spotlight-actions>
        ${iconAction(spotlight.donate, spotlight.domain, `Donate to ${spotlight.name}`)}
        ${iconAction(spotlight.home, spotlight.domain, `Visit ${spotlight.name}`)}
      </div>
    </div>`;


  const featureMedia = (spotlight, type) => `
    <a class="infotainment-feature-media" data-feature-media="${type}" href="${spotlight.home || spotlight.url}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(spotlight.name)}">
      <img class="infotainment-feature-scene" data-feature-scene src="${spotlight.scene || spotlight.image || 'assets/images/hero-scene-work.webp'}" alt="" loading="lazy">
      <span class="infotainment-feature-shade" aria-hidden="true"></span>
      <span class="infotainment-feature-mark">
        <img data-feature-icon src="${orgIcon(spotlight.domain, 128)}" alt="" width="64" height="64" loading="lazy">
        <strong data-feature-name>${escapeHtml(spotlight.name)}</strong>
      </span>
    </a>`;

  const splitPanel = (media, panel) => `<div class="infotainment-split">${media}${panel}</div>`;

  const motionArt = (kind) => {
    const art = {
      humanitarian: `
        <g class="motion-art__orbit">
          <circle cx="205" cy="205" r="116"/><path d="M90 205 H320 M205 89 C162 132 162 278 205 321 M205 89 C248 132 248 278 205 321"/>
          <path d="M105 160 C145 145 175 145 205 160 C240 176 270 176 310 160 M105 250 C145 265 175 265 205 250 C240 235 270 235 310 250"/>
          <path d="M500 105 V177 H430 V245 H500 V317 H570 V245 H640 V177 H570 V105 Z"/>
          <path class="motion-art__pulse" d="M348 224 H410 L438 188 L470 260 L515 203 L552 224 H710"/>
        </g>`,
      rights: `
        <g class="motion-art__orbit">
          <path d="M400 72 V310 M300 112 H500 M335 112 L270 230 M465 112 L530 230"/>
          <path d="M225 230 H318 C312 270 232 270 225 230 Z M482 230 H575 C568 270 488 270 482 230 Z"/>
          <path d="M315 310 H485 M350 310 V345 M450 310 V345 M300 345 H500"/>
          <g class="motion-art__people"><circle cx="120" cy="220" r="19"/><path d="M120 239 V325 M86 273 L120 250 L154 273 M95 325 L120 290 L145 325"/><circle cx="680" cy="220" r="19"/><path d="M680 239 V325 M646 273 L680 250 L714 273 M655 325 L680 290 L705 325"/></g>
        </g>`,
      service: `
        <g class="motion-art__orbit">
          <path d="M100 320 V215 C100 158 140 124 184 124 C228 124 268 158 268 215 V320"/>
          <path d="M128 158 C150 125 218 125 240 158 M120 196 H248"/>
          <path d="M372 110 L395 160 L450 166 L408 201 L420 258 L372 230 L324 258 L336 201 L294 166 L349 160 Z"/>
          <path d="M520 320 V214 L626 136 L732 214 V320 H660 V252 H590 V320 Z"/>
          <path class="motion-art__pulse" d="M282 305 H336 L358 277 L386 331 L422 291 L448 305 H500"/>
        </g>`,
      quote: `
        <g class="motion-art__orbit">
          <path d="M135 110 C80 145 76 220 116 250 C156 280 220 252 222 201 C224 163 200 139 170 139 C180 112 198 92 225 74"/>
          <path d="M410 110 C355 145 351 220 391 250 C431 280 495 252 497 201 C499 163 475 139 445 139 C455 112 473 92 500 74"/>
          <path d="M600 90 L642 132 L692 96 L720 151 L772 138"/>
        </g>`
    };
    return `<div class="infotainment-motion-art" aria-hidden="true"><svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" focusable="false">${art[kind] || art.quote}</svg></div>`;
  };

  const imageMedia = (src, alt) => `<img class="infotainment-slide__media" src="${src}" alt="${escapeHtml(alt)}" loading="lazy">`;

  const slideShell = (index, kind, inner, media, ghostKeys = []) => `
    <section class="infotainment-slide${index === 0 ? " is-active" : ""}" data-slide-index="${index}" data-slide-kind="${kind}" aria-hidden="${index === 0 ? "false" : "true"}">
      ${media}
      <div class="infotainment-slide__wash" aria-hidden="true"></div>
      ${motionArt(kind)}
      ${ghostLayer(ghostKeys)}
      <div class="infotainment-shell"><div class="infotainment-frame">${inner}</div></div>
    </section>`;

  const humanitarianSlide = () => {
    const spotlight = currentHumanitarian();
    return slideShell(
      0,
      "humanitarian",
      splitPanel(featureMedia(spotlight, "humanitarian"), nonprofitPanel(spotlight, "humanitarian")),
      imageMedia(spotlight.scene, "Humanitarian and community service spotlight"),
      ["redcross", "habitat"]
    );
  };

  const rightsSlide = () => {
    const spotlight = currentRights();
    return slideShell(
      1,
      "rights",
      splitPanel(featureMedia(spotlight, "rights"), nonprofitPanel(spotlight, "rights")),
      imageMedia(spotlight.scene, "Civil rights and community action spotlight"),
      ["ldf", "naacp"]
    );
  };

  const currentService = () => SERVICE_SPOTLIGHTS[serviceIndex % SERVICE_SPOTLIGHTS.length];

  const servicePanel = (spotlight) => `
    <div class="infotainment-panel infotainment-panel--service" data-service-panel>
      <p class="infotainment-kicker" data-service-kicker>${escapeHtml(spotlight.kicker)}</p>
      <h2 data-service-title>${escapeHtml(spotlight.name)}</h2>
      <p data-service-summary>${escapeHtml(spotlight.summary)}</p>
      <p class="infotainment-live-line" data-service-link>
        <span data-service-source>${escapeHtml(spotlight.source)}</span>
        <a href="${spotlight.url}" target="_blank" rel="noopener noreferrer">Read the original story</a>
      </p>
      <div class="infotainment-actions">
        ${iconAction(spotlight.url, spotlight.domain, `Read the original ${spotlight.source} story about ${spotlight.name}`)}
        ${iconAction("https://www.hfotusa.org/get-involved/support_our_mission/ways_donate/", "hfotusa.org", "Donate to Homes For Our Troops")}
        ${iconAction("https://www.redcross.org/get-help/military-families.html", "redcross.org", "American Red Cross services for military and veteran families")}
      </div>
    </div>`;

  const serviceMedia = (spotlight) => `
    <a class="infotainment-feature-media infotainment-feature-media--person" data-service-media href="${spotlight.url}" target="_blank" rel="noopener noreferrer" aria-label="Read the original ${escapeHtml(spotlight.source)} story about ${escapeHtml(spotlight.name)}">
      <img class="infotainment-feature-person" data-service-image src="${spotlight.image}" data-fallback-src="${spotlight.fallbackImage}" alt="${escapeHtml(spotlight.name)}" loading="lazy">
      <span class="infotainment-feature-shade" aria-hidden="true"></span>
      <span class="infotainment-feature-source"><img src="${orgIcon(spotlight.domain, 128)}" alt="" width="28" height="28"><strong data-service-media-source>${escapeHtml(spotlight.source)}</strong></span>
    </a>`;

  const serviceSlide = () => {
    const spotlight = currentService();
    return slideShell(
      2,
      "service",
      splitPanel(serviceMedia(spotlight), servicePanel(spotlight)),
      imageMedia("assets/images/hero-scene-work.webp", "Current service, courage and teamwork spotlight"),
      ["dvids", "hfot", "redcross"]
    );
  };

  const quoteSlide = () => {
    const quote = nextQuote();
    return slideShell(3, "quote", `
      <div class="infotainment-panel infotainment-panel--quote">
        <p class="infotainment-kicker">A LITTLE LYTE FOR THE ROAD</p>
        <blockquote class="infotainment-quote">
          <p data-infotainment-quote>“${escapeHtml(quote.text)}”</p>
          <footer data-infotainment-author>— ${escapeHtml(quote.author)}</footer>
        </blockquote>
      </div>`,
      imageMedia("assets/images/hero-scene-school.webp", "Community learning and creative lighting scene"),
      ["redcross", "habitat", "ldf", "naacp", "dvids", "hfot"]
    );
  };

  const buildSlides = () => [humanitarianSlide(), rightsSlide(), serviceSlide(), quoteSlide()].join("");

  const renderSpotlight = (root, type, spotlight) => {
    const panel = root.querySelector(`[data-spotlight-panel="${type}"]`);
    if (!panel || !spotlight) return;
    panel.querySelector("[data-spotlight-kicker]").textContent = spotlight.kicker;
    panel.querySelector("[data-spotlight-title]").textContent = spotlight.name;
    panel.querySelector("[data-spotlight-summary]").textContent = spotlight.summary;
    const live = panel.querySelector("[data-spotlight-live]");
    live.dataset.liveFeed = spotlight.key;
    const liveLink = live.querySelector("a");
    liveLink.href = spotlight.news;
    liveLink.textContent = `${spotlight.name} news`;
    panel.querySelector("[data-spotlight-actions]").innerHTML =
      iconAction(spotlight.donate, spotlight.domain, `Donate to ${spotlight.name}`) +
      iconAction(spotlight.home, spotlight.domain, `Visit ${spotlight.name}`);
    const media = root.querySelector(`[data-feature-media="${type}"]`);
    if (media) {
      media.href = spotlight.home;
      const scene = media.querySelector("[data-feature-scene]");
      if (scene) scene.src = spotlight.scene;
      const icon = media.querySelector("[data-feature-icon]");
      if (icon) icon.src = orgIcon(spotlight.domain, 128);
      const name = media.querySelector("[data-feature-name]");
      if (name) name.textContent = spotlight.name;
      media.setAttribute("aria-label", `Visit ${spotlight.name}`);
    }
    const item = nextFeedItem(spotlight.key);
    if (item) {
      liveLink.href = item.url;
      liveLink.textContent = item.title;
    }
  };

  const refreshServiceSpotlight = (root) => {
    const spotlight = currentService();
    const panel = root.querySelector("[data-service-panel]");
    const media = root.querySelector("[data-service-media]");
    if (!panel || !media) return;

    panel.querySelector("[data-service-kicker]").textContent = spotlight.kicker;
    panel.querySelector("[data-service-title]").textContent = spotlight.name;
    panel.querySelector("[data-service-summary]").textContent = spotlight.summary;
    panel.querySelector("[data-service-source]").textContent = spotlight.source;
    const link = panel.querySelector("[data-service-link] a");
    link.href = spotlight.url;
    link.textContent = "Read the original story";

    media.href = spotlight.url;
    media.setAttribute("aria-label", `Read the original ${spotlight.source} story about ${spotlight.name}`);
    const image = media.querySelector("[data-service-image]");
    image.src = spotlight.image;
    image.dataset.fallbackSrc = spotlight.fallbackImage;
    image.alt = spotlight.name;
    const source = media.querySelector("[data-service-media-source]");
    if (source) source.textContent = spotlight.source;
    const sourceIcon = media.querySelector(".infotainment-feature-source img");
    if (sourceIcon) sourceIcon.src = orgIcon(spotlight.domain, 128);
  };

  const ghostItemsForSlide = (slide) => {
    const keys = (slide.querySelector("[data-ghost-keys]")?.dataset.ghostKeys || "")
      .split(",").map((key) => key.trim()).filter(Boolean);
    const pool = [];
    keys.forEach((key) => {
      const liveItems = feedCache.get(key)?.items || [];
      const items = liveItems.length ? liveItems : (GHOST_FALLBACKS[key] || []);
      items.slice(0, 5).forEach((item) => pool.push({ ...item, key }));
    });
    if (pool.length < 3) {
      keys.forEach((key) => {
        (GHOST_FALLBACKS[key] || []).forEach((item) => {
          if (!pool.some((candidate) => candidate.title === item.title)) pool.push({ ...item, key });
        });
      });
    }
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  };

  const FEED_LABELS = Object.freeze({
    redcross: "RED CROSS",
    habitat: "HABITAT",
    ldf: "LDF",
    naacp: "NAACP",
    dvids: "DVIDS",
    hfot: "HFOT"
  });

  const populateGhosts = (slide) => {
    const cards = [...slide.querySelectorAll(".infotainment-ghost-card")];
    if (!cards.length) return;
    const items = ghostItemsForSlide(slide);
    cards.forEach((card, index) => {
      const item = items[index];
      if (!item) {
        card.replaceChildren();
        card.classList.remove("is-readable");
        return;
      }
      const excerpt = item.description ? `<p>${escapeHtml(item.description)}</p>` : "";
      card.innerHTML = `<span>${escapeHtml(FEED_LABELS[item.key] || item.key)}</span><strong>${escapeHtml(item.title)}</strong>${excerpt}`;
      card.classList.toggle("is-readable", index === 0);
    });
  };

  const startGhostCycle = (slide) => {
    window.clearInterval(ghostTimer);
    populateGhosts(slide);
    const cards = [...slide.querySelectorAll(".infotainment-ghost-card")].filter((card) => card.textContent.trim());
    if (cards.length < 2) return;
    let activeGhost = 0;
    ghostTimer = window.setInterval(() => {
      cards[activeGhost].classList.remove("is-readable");
      activeGhost = (activeGhost + 1) % cards.length;
      cards[activeGhost].classList.add("is-readable");
    }, 3000);
  };

  const hydrateFeedTargets = (root, keys = Object.keys(FEEDS)) => {
    keys.forEach((key) => {
      const item = nextFeedItem(key);
      if (!item) return;
      root.querySelectorAll(`[data-live-feed="${key}"] a`).forEach((link) => {
        link.textContent = item.title;
        link.href = item.url;
      });
    });
  };

  const loadAllFeeds = async (root, force = false) => {
    const keys = Object.keys(FEEDS);
    await Promise.allSettled(keys.map((key) => loadFeed(key, force)));
    hydrateFeedTargets(root, keys);
    const activeSlide = root.querySelector(".infotainment-slide.is-active");
    if (activeSlide) {
      if (activeSlide.dataset.slideKind === "service") refreshServiceSpotlight(root);
      startGhostCycle(activeSlide);
    }
  };

  const initSlider = (root) => {
    if (!root || root.dataset.infotainmentReady === "true") return;
    root.dataset.infotainmentReady = "true";
    root.style.setProperty("--infotainment-duration", `${SLIDE_MS}ms`);
    root.setAttribute("tabindex", "0");
    root.setAttribute("aria-roledescription", "rotating spotlight");

    const stage = document.createElement("div");
    stage.className = "infotainment-stage";
    stage.innerHTML = buildSlides();
    root.prepend(stage);
    root.classList.add("is-ready");

    const slides = [...stage.querySelectorAll(".infotainment-slide")];
    stage.addEventListener("error", (event) => {
      const target = event.target;
      if (target.matches?.(".infotainment-icon-button img")) {
        target.style.display = "none";
        return;
      }
      const image = target.closest?.("img[data-fallback-src]");
      if (!image || image.dataset.fallbackApplied === "true") return;
      image.dataset.fallbackApplied = "true";
      image.src = image.dataset.fallbackSrc;
    }, true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;
    let timer = 0;
    let paused = reduceMotion;
    let cycleCount = 0;

    const restartProgress = () => {
      root.classList.remove("is-timing");
      void root.offsetWidth;
      if (!paused) root.classList.add("is-timing");
    };

    const schedule = () => {
      window.clearTimeout(timer);
      if (!paused) timer = window.setTimeout(() => show(index + 1), SLIDE_MS);
      restartProgress();
    };

    const refreshQuote = (slide) => {
      if (slide.dataset.slideKind !== "quote") return;
      const quote = nextQuote();
      const text = slide.querySelector("[data-infotainment-quote]");
      const author = slide.querySelector("[data-infotainment-author]");
      if (text) text.textContent = `“${quote.text}”`;
      if (author) author.textContent = `— ${quote.author}`;
    };

    function show(nextIndex) {
      const normalized = (nextIndex + slides.length) % slides.length;
      const wrapped = nextIndex >= slides.length || nextIndex < 0;
      slides.forEach((slide) => {
        slide.classList.remove("is-active", "is-entering");
        slide.setAttribute("aria-hidden", "true");
      });
      index = normalized;
      const next = slides[index];
      next.classList.add("is-active", "is-entering");
      next.setAttribute("aria-hidden", "false");

      if (next.dataset.slideKind === "humanitarian") {
        humanitarianIndex = (humanitarianIndex + 1) % HUMANITARIAN_SPOTLIGHTS.length;
        renderSpotlight(root, "humanitarian", currentHumanitarian());
      } else if (next.dataset.slideKind === "rights") {
        rightsIndex = (rightsIndex + 1) % RIGHTS_SPOTLIGHTS.length;
        renderSpotlight(root, "rights", currentRights());
      } else if (next.dataset.slideKind === "service") {
        serviceIndex = (serviceIndex + 1) % SERVICE_SPOTLIGHTS.length;
        refreshServiceSpotlight(root);
      }

      refreshQuote(next);
      startGhostCycle(next);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => next.classList.remove("is-entering")));

      if (wrapped && index === 0) {
        cycleCount += 1;
        hydrateFeedTargets(root);
        if (cycleCount % 12 === 0) {
          loadAllFeeds(root, true);
          loadQuotePool(true);
        }
      }
      schedule();
    }

    root.addEventListener("click", (event) => {
      if (event.button !== 0 || event.target.closest("a, button, iframe")) return;
      event.preventDefault();
      show(index - 1);
    });

    root.addEventListener("contextmenu", (event) => {
      if (event.target.closest("a, button, iframe")) return;
      event.preventDefault();
      show(index + 1);
    });

    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        show(index + 1);
      } else if (event.key === " ") {
        event.preventDefault();
        paused = !paused;
        root.classList.toggle("is-paused", paused);
        schedule();
      }
    });

    loadAllFeeds(root);
    loadQuotePool();
    startGhostCycle(slides[0]);
    schedule();
  };

  const init = () => {
    document.querySelectorAll("header[data-shynetyme-infotainment]").forEach(initSlider);
  };

  window.ShynetymeInfotainmentLoaded = { initialized: true, init };
  init();
})();
