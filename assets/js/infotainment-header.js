/* ShyneTyme.Works standalone spotlight header object. */
(() => {
  "use strict";

  if (window.ShynetymeInfotainmentLoaded?.initialized) {
    window.ShynetymeInfotainmentLoaded.init?.();
    return;
  }

  const SLIDE_MS = 10000;
  const FEED_REFRESH_MS = 10 * 60 * 1000;
  const PROXY_PREFIX = "https://api.allorigins.win/raw?url=";

  const rssSearch = (domain) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(`site:${domain}`)}&hl=en-US&gl=US&ceid=US:en`;

  const ORGANIZATIONS = Object.freeze([
    {
      key: "redcross",
      group: "Humanitarian",
      name: "American Red Cross",
      domain: "redcross.org",
      summary: "Disaster relief, blood services, emergency training, humanitarian response and support for military families.",
      home: "https://www.redcross.org/",
      donate: "https://www.redcross.org/donate/donation.html/",
      news: "https://www.redcross.org/about-us/news-and-events/latest-news.html",
      feed: rssSearch("redcross.org"),
      feedLabel: "Live Red Cross coverage",
      scene: "assets/images/hero-scene-marina.webp"
    },
    {
      key: "habitat",
      group: "Community",
      name: "Habitat for Humanity",
      domain: "habitat.org",
      summary: "Affordable housing, homebuilding and repair, neighborhood revitalization, disaster recovery and community development.",
      home: "https://www.habitat.org/",
      donate: "https://www.habitat.org/support",
      news: "https://www.habitat.org/newsroom",
      feed: rssSearch("habitat.org"),
      feedLabel: "Live Habitat coverage",
      scene: "assets/images/hero-scene-work.webp"
    },
    {
      key: "ldf",
      group: "Civil Rights",
      name: "NAACP Legal Defense Fund",
      domain: "naacpldf.org",
      summary: "Litigation, advocacy and public education focused on racial justice, voting rights, education and equal citizenship.",
      home: "https://www.naacpldf.org/",
      donate: "https://www.naacpldf.org/support/ways-to-give/",
      news: "https://www.naacpldf.org/news/",
      feed: rssSearch("naacpldf.org"),
      feedLabel: "Live LDF coverage",
      scene: "assets/images/hero-scene-dance.webp"
    },
    {
      key: "naacp",
      group: "Civil Rights",
      name: "NAACP",
      domain: "naacp.org",
      summary: "Civil-rights advocacy, civic engagement, policy work and community action focused on equal rights and opportunity.",
      home: "https://naacp.org/",
      donate: "https://naacp.org/donate",
      news: "https://naacp.org/news",
      feed: rssSearch("naacp.org"),
      feedLabel: "Live NAACP coverage",
      scene: "assets/images/hero-scene-school.webp"
    },
    {
      key: "dvids",
      group: "Service",
      name: "DVIDS · U.S. Military Service Stories",
      domain: "dvidshub.net",
      summary: "Current public-service reporting on service members, readiness, teamwork, deployments, training and military community work.",
      home: "https://www.dvidshub.net/",
      donate: "",
      news: "https://www.dvidshub.net/news",
      feed: "https://www.dvidshub.net/rss/news",
      feedLabel: "Official DVIDS RSS",
      scene: "assets/images/hero-scene-work.webp"
    },
    {
      key: "hfot",
      group: "Veterans",
      name: "Homes For Our Troops",
      domain: "hfotusa.org",
      summary: "Specially adapted homes and long-term support that help severely injured post-9/11 veterans rebuild independence.",
      home: "https://www.hfotusa.org/",
      donate: "https://www.hfotusa.org/get-involved/support_our_mission/",
      news: "https://www.hfotusa.org/blog/",
      feed: "https://www.hfotusa.org/blog/feed/",
      feedLabel: "Official HFOT RSS",
      scene: "assets/images/hero-scene-work.webp"
    }
  ]);

  const feedCache = new Map();
  const roots = new WeakSet();

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const iconUrl = (domain, size = 128) =>
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;

  const stripMarkup = (value = "") => {
    const doc = new DOMParser().parseFromString(String(value), "text/html");
    return (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  };

  const parseFeed = (text) => {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.querySelector("parsererror")) return [];

    const rssItems = [...xml.querySelectorAll("item")].map((item) => ({
      title: item.querySelector("title")?.textContent?.trim() || "",
      url: item.querySelector("link")?.textContent?.trim() || "",
      description: stripMarkup(item.querySelector("description")?.textContent || "").slice(0, 240),
      published: item.querySelector("pubDate")?.textContent?.trim() || ""
    }));

    const atomItems = [...xml.querySelectorAll("entry")].map((entry) => ({
      title: entry.querySelector("title")?.textContent?.trim() || "",
      url: entry.querySelector("link")?.getAttribute("href")?.trim() || "",
      description: stripMarkup(entry.querySelector("summary")?.textContent || entry.querySelector("content")?.textContent || "").slice(0, 240),
      published: entry.querySelector("published")?.textContent?.trim() || entry.querySelector("updated")?.textContent?.trim() || ""
    }));

    const seen = new Set();
    return [...rssItems, ...atomItems].filter((item) => {
      const key = `${item.title}|${item.url}`;
      if (!item.title || !item.url || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
  };

  const fetchText = async (url) => {
    const attempts = [url, `${PROXY_PREFIX}${encodeURIComponent(url)}`];
    for (const requestUrl of attempts) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 7000);
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
        // Continue to the proxy/fallback transport.
      } finally {
        window.clearTimeout(timer);
      }
    }
    return "";
  };

  const loadFeed = async (organization, force = false) => {
    const cached = feedCache.get(organization.key);
    if (!force && cached && Date.now() - cached.loadedAt < FEED_REFRESH_MS) return cached.items;
    const text = await fetchText(organization.feed);
    const items = text ? parseFeed(text) : [];
    if (items.length) feedCache.set(organization.key, { loadedAt: Date.now(), items });
    return items.length ? items : (cached?.items || []);
  };

  const actionLink = (href, label, className = "") => href ?
    `<a class="spotlight-action ${className}" href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : "";

  const slideMarkup = (organization, index) => `
    <article class="spotlight-slide${index === 0 ? " is-active" : ""}" data-spotlight-slide="${organization.key}" aria-hidden="${index === 0 ? "false" : "true"}">
      <img class="spotlight-bg" src="${organization.scene}" alt="" loading="${index === 0 ? "eager" : "lazy"}">
      <span class="spotlight-wash" aria-hidden="true"></span>
      <div class="container spotlight-shell">
        <div class="spotlight-card">
          <div class="spotlight-heading-row">
            <img class="spotlight-logo" src="${iconUrl(organization.domain)}" alt="" width="44" height="44" loading="lazy">
            <div>
              <p class="spotlight-kicker">${escapeHtml(organization.group)} spotlight</p>
              <h2>${escapeHtml(organization.name)}</h2>
            </div>
          </div>
          <p class="spotlight-summary">${escapeHtml(organization.summary)}</p>
          <p class="spotlight-live" data-spotlight-live="${organization.key}">
            <span>RSS LIVE</span>
            <a href="${organization.news}" target="_blank" rel="noopener noreferrer">Loading latest update…</a>
          </p>
          <div class="spotlight-actions">
            ${actionLink(organization.home, "Visit")}
            ${actionLink(organization.news, "News")}
            ${actionLink(organization.donate, "Support", "spotlight-action--support")}
          </div>
        </div>
      </div>
    </article>`;

  const updateLiveLine = (root, organization, item) => {
    const line = root.querySelector(`[data-spotlight-live="${organization.key}"]`);
    const anchor = line?.querySelector("a");
    if (!line || !anchor) return;
    if (item) {
      anchor.textContent = item.title;
      anchor.href = item.url;
      anchor.title = organization.feedLabel;
      line.dataset.state = "live";
    } else {
      anchor.textContent = `${organization.name} latest news`;
      anchor.href = organization.news;
      anchor.title = "Feed temporarily unavailable — opening the organization news page";
      line.dataset.state = "fallback";
    }
  };

  const refreshFeeds = async (root, force = false) => {
    await Promise.all(ORGANIZATIONS.map(async (organization) => {
      const items = await loadFeed(organization, force);
      updateLiveLine(root, organization, items[0] || null);
    }));
  };

  const initSlider = (root) => {
    if (!root || roots.has(root) || root.dataset.spotlightObjectReady === "true") return;
    roots.add(root);
    root.dataset.spotlightObjectReady = "true";
    root.classList.add("spotlight-object");
    root.tabIndex = root.tabIndex >= 0 ? root.tabIndex : 0;
    root.innerHTML = `
      <div class="spotlight-stage">
        ${ORGANIZATIONS.map(slideMarkup).join("")}
        <div class="spotlight-progress" aria-hidden="true"><span></span></div>
        <div class="spotlight-count" aria-live="polite"><span data-spotlight-index>1</span> / ${ORGANIZATIONS.length}</div>
      </div>`;
    root.classList.add("is-ready");

    const slides = [...root.querySelectorAll("[data-spotlight-slide]")];
    const count = root.querySelector("[data-spotlight-index]");
    const progress = root.querySelector(".spotlight-progress span");
    let index = 0;
    let timer = 0;
    let paused = false;

    const schedule = () => {
      window.clearTimeout(timer);
      if (paused || document.hidden) return;
      timer = window.setTimeout(() => show(index + 1), SLIDE_MS);
    };

    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });
      if (count) count.textContent = String(index + 1);
      if (progress) {
        progress.style.animation = "none";
        void progress.offsetWidth;
        progress.style.animation = `spotlight-progress ${SLIDE_MS}ms linear forwards`;
      }
      schedule();
    };

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

    root.addEventListener("mouseenter", () => {
      paused = true;
      root.classList.add("is-paused");
      schedule();
    });
    root.addEventListener("mouseleave", () => {
      paused = false;
      root.classList.remove("is-paused");
      schedule();
    });

    document.addEventListener("visibilitychange", schedule);
    refreshFeeds(root);
    window.setInterval(() => refreshFeeds(root, true), FEED_REFRESH_MS);
    show(0);
  };

  const init = () => {
    document.querySelectorAll("header[data-shynetyme-infotainment]").forEach(initSlider);
  };

  window.ShynetymeInfotainmentLoaded = {
    initialized: true,
    version: "2026-08-25-standalone-rss-v1",
    organizations: ORGANIZATIONS,
    init,
    refresh: () => document.querySelectorAll("header[data-shynetyme-infotainment]").forEach((root) => refreshFeeds(root, true))
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
