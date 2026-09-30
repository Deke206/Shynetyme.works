(() => {
  "use strict";

  if (window.ShynetymeChuck?.mounted) return;

  const scriptElement = document.currentScript;
  const scriptUrl = scriptElement?.src
    ? new URL(scriptElement.src, window.location.href)
    : new URL("assets/js/site-chuck.js", window.location.href);
  const siteRoot = new URL("../../", scriptUrl);

  const chuckCssUrl = new URL("assets/css/site-chuck.css?v=20260724-cloud-guidance", siteRoot).href;
  const cloudCssUrl = new URL("assets/css/site-chuck-cloud.css?v=20260806-compact-cloud-v2", siteRoot).href;
  const chuckSpriteUrl = new URL("assets/js/chuck-sprite.js?v=20260725-phone-scroll-v2", siteRoot).href;
  const designChainUrl = new URL("assets/js/customer-design-chain.js?v=20260809-product-catalog-1", siteRoot).href;
  const scanAtlasUrl = new URL("assets/brand/chuck-search-map.webp", siteRoot).href;
  const laptopAtlasUrl = new URL("assets/brand/chuck-search-laptop.webp", siteRoot).href;
  const fallbackImageUrl = new URL("assets/brand/pet-chuck-mark.png", siteRoot).href;
  const aboutDekeUrl = new URL("aboutme.html", siteRoot).href;
  const bikeBuilderUrl = new URL("ledbikesim.html", siteRoot).href;
  const homeBuilderUrl = new URL("ledhomesim.html", siteRoot).href;
  const autoBuilderUrl = new URL("ledautosim.html", siteRoot).href;

  const loadStylesheet = (href, attribute) => {
    const existing = document.querySelector(`link[${attribute}]`);
    if (existing) {
      if (existing.href !== href) existing.href = href;
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute(attribute, "true");
    document.head.appendChild(link);
  };

  const loadScript = (src, attribute) => new Promise((resolve) => {
    const existing = document.querySelector(`script[${attribute}]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.setAttribute(attribute, "true");
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve(true);
    }, { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    document.head.appendChild(script);
  });

  const removeRetiredGuide = () => {
    document.querySelectorAll(".site-guide-button, #siteGuidePanel").forEach((element) => element.remove());
  };

  const ensureWidget = () => {
    const existing = document.getElementById("dekeChuckWidget");
    if (existing) {
      removeRetiredGuide();
      return existing;
    }

    removeRetiredGuide();
    const widget = document.createElement("div");
    widget.className = "deke-chuck-widget";
    widget.id = "dekeChuckWidget";
    widget.innerHTML = `
      <div class="deke-chuck-thought deke-chuck-thought--cyan" id="dekeChuckThought" role="status" aria-live="polite" hidden>
        <button class="deke-chuck-thought__close" id="dekeChuckClose" type="button" aria-label="Close Chuck's message">×</button>
        <p class="deke-chuck-thought__text" id="dekeChuckText"></p>
        <a class="deke-chuck-thought__action" id="dekeChuckAction" href="#"></a>
        <div class="deke-chuck-thought__choices" id="dekeChuckChoices" hidden></div>
      </div>
      <button class="deke-chuck-trigger" id="dekeChuckTrigger" type="button" aria-expanded="false" aria-controls="dekeChuckThought" aria-label="Tickle Chuck for another thought">
        <span class="deke-chuck-search-light" aria-hidden="true"></span>
        <img src="${fallbackImageUrl}" width="118" height="118" alt="Chuck, the ShyneTyme Works robot-cat helper">
      </button>`;
    document.body.appendChild(widget);
    return widget;
  };

  const loadChuckSprite = () => new Promise((resolve) => {
    if (window.ShynetymeChuckSprite) {
      resolve(window.ShynetymeChuckSprite);
      return;
    }

    const existing = document.querySelector("script[data-shynetyme-chuck-sprite]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.ShynetymeChuckSprite || null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = chuckSpriteUrl;
    script.defer = true;
    script.dataset.shynetymeChuckSprite = "true";
    script.addEventListener("load", () => resolve(window.ShynetymeChuckSprite || null), { once: true });
    script.addEventListener("error", () => resolve(null), { once: true });
    document.head.appendChild(script);
  });

  loadStylesheet(chuckCssUrl, "data-shynetyme-site-chuck");
  loadStylesheet(cloudCssUrl, "data-shynetyme-site-chuck-cloud");

  const widget = ensureWidget();
  const trigger = widget.querySelector("#dekeChuckTrigger");
  const thought = widget.querySelector("#dekeChuckThought");
  const text = widget.querySelector("#dekeChuckText");
  const action = widget.querySelector("#dekeChuckAction");
  const choices = widget.querySelector("#dekeChuckChoices");
  const close = widget.querySelector("#dekeChuckClose");

  if (!trigger || !thought || !text || !action || !choices || !close) return;
  if (widget.dataset.chuckMounted === "true") return;
  widget.dataset.chuckMounted = "true";

  const welcomeMessage = {
    text: "Hi!\nYou must be looking\nfor About Deke.",
    label: "About Deke",
    href: aboutDekeUrl
  };

  const rotatingMessages = [
    {
      text: "What do you\nwant to light?",
      choices: [
        { label: "Bike", href: bikeBuilderUrl },
        { label: "Home", href: homeBuilderUrl },
        { label: "Auto", href: autoBuilderUrl }
      ]
    },
    {
      text: "Need help?\nTickle Chuck.\nI'll point\nthe way.",
      label: "Next",
      href: "#chuck-next"
    },
    {
      text: "Need Shyne?\nTry the LED\nBike Factory.",
      label: "LED\nBike Sim",
      href: bikeBuilderUrl
    }
  ];

  const CLOUD_THEMES = ["cyan", "pink", "amber"];
  const WELCOME_VISIBLE_MS = 7000;
  const MESSAGE_VISIBLE_MS = 12000;
  const AFTER_SCROLL_DELAY_MS = 15000;
  const SCROLL_STOP_MS = 650;

  let chuckAnimation = null;
  let messageIndex = -1;
  let previousTheme = "";
  let previousScrollY = window.scrollY;
  let pendingScrollMode = "";
  let scrollStopTimer = 0;
  let delayedThoughtTimer = 0;
  let hideTimer = 0;
  let welcomeTimer = 0;

  loadChuckSprite().then((spriteApi) => {
    chuckAnimation = spriteApi?.mount({
      button: trigger,
      image: trigger.querySelector("img"),
      scanUrl: scanAtlasUrl,
      laptopUrl: laptopAtlasUrl
    }) || null;

    if (widget.classList.contains("is-searching")) {
      chuckAnimation?.start(pendingScrollMode || "scan");
    } else {
      chuckAnimation?.stop();
    }
  });

  const nextCloudTheme = () => {
    const available = CLOUD_THEMES.filter((theme) => theme !== previousTheme);
    const theme = available[Math.floor(Math.random() * available.length)] || CLOUD_THEMES[0];
    previousTheme = theme;
    return theme;
  };

  const setTheme = (theme) => {
    thought.classList.remove(
      "deke-chuck-thought--yellow",
      "deke-chuck-thought--green",
      "deke-chuck-thought--blue",
      "deke-chuck-thought--cyan",
      "deke-chuck-thought--pink",
      "deke-chuck-thought--violet",
      "deke-chuck-thought--amber"
    );
    thought.classList.add(`deke-chuck-thought--${theme}`);
  };

  const hideThought = () => {
    window.clearTimeout(hideTimer);
    thought.classList.remove("is-visible", "is-materializing", "has-choices");
    trigger.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!thought.classList.contains("is-visible")) thought.hidden = true;
    }, 380);
  };

  const materializeThought = () => {
    thought.classList.remove("is-materializing");
    void thought.offsetWidth;
    thought.classList.add("is-materializing");
  };

  const renderChoices = (items = []) => {
    choices.innerHTML = items.map((item, index) => {
      const label = String(item?.label || `Choice ${index + 1}`);
      const href = item?.href ? String(item.href) : "#";
      const actionName = item?.action ? String(item.action) : "";
      const className = item?.primary ? " is-primary" : "";
      return `<a class="deke-chuck-thought__choice${className}" href="${href.replaceAll('"', '&quot;')}" data-chuck-choice="${actionName.replaceAll('"', '&quot;')}">${label.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a>`;
    }).join("");
    choices.hidden = !items.length;
    thought.classList.toggle("has-choices", Boolean(items.length));
  };

  const showMessage = (message, visibleMs = MESSAGE_VISIBLE_MS) => {
    if (!message) return;
    window.clearTimeout(welcomeTimer);
    window.clearTimeout(hideTimer);
    widget.classList.remove("is-searching");
    pendingScrollMode = "";
    chuckAnimation?.stop();
    setTheme(message.theme || nextCloudTheme());
    text.textContent = String(message.text || "");

    const messageChoices = Array.isArray(message.choices) ? message.choices.filter(Boolean) : [];
    renderChoices(messageChoices);

    if (messageChoices.length) {
      action.hidden = true;
      action.textContent = "";
      action.removeAttribute("href");
    } else if (message.label && message.href) {
      action.hidden = false;
      action.textContent = String(message.label);
      action.href = String(message.href);
    } else {
      action.hidden = true;
      action.textContent = "";
      action.removeAttribute("href");
    }

    thought.hidden = false;
    materializeThought();

    window.requestAnimationFrame(() => {
      thought.classList.add("is-visible");
      trigger.setAttribute("aria-expanded", "true");
    });

    if (visibleMs > 0) hideTimer = window.setTimeout(hideThought, visibleMs);
  };

  const showChoices = (textValue, choiceItems, visibleMs = 0) => {
    showMessage({ text: textValue, choices: choiceItems }, visibleMs);
  };

  const showNextMessage = () => {
    messageIndex = (messageIndex + 1) % rotatingMessages.length;
    showMessage(rotatingMessages[messageIndex]);
  };

  const cancelDelayedThought = () => {
    window.clearTimeout(delayedThoughtTimer);
    delayedThoughtTimer = 0;
  };

  const scheduleAfterScrollThought = () => {
    cancelDelayedThought();
    delayedThoughtTimer = window.setTimeout(showNextMessage, AFTER_SCROLL_DELAY_MS);
  };

  const handleScroll = () => {
    window.clearTimeout(welcomeTimer);
    cancelDelayedThought();
    hideThought();

    const currentScrollY = window.scrollY;
    const mode = currentScrollY < previousScrollY ? "scan" : "laptop";
    previousScrollY = currentScrollY;
    pendingScrollMode = mode;
    widget.classList.add("is-searching");
    chuckAnimation?.start(mode);

    window.clearTimeout(scrollStopTimer);
    scrollStopTimer = window.setTimeout(() => {
      widget.classList.remove("is-searching");
      pendingScrollMode = "";
      chuckAnimation?.stop();
      scheduleAfterScrollThought();
    }, SCROLL_STOP_MS);
  };

  trigger.addEventListener("click", () => {
    cancelDelayedThought();
    widget.classList.remove("is-searching");
    pendingScrollMode = "";
    chuckAnimation?.stop();
    showNextMessage();
  });

  action.addEventListener("click", (event) => {
    if (action.getAttribute("href") === "#chuck-next") {
      event.preventDefault();
      showNextMessage();
    }
  });

  choices.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-chuck-choice]");
    if (!choice) return;
    const actionName = choice.dataset.chuckChoice || "";
    if (actionName === "dismiss") {
      event.preventDefault();
      hideThought();
      return;
    }
    if (actionName === "next") {
      event.preventDefault();
      showNextMessage();
      return;
    }
    if (actionName) {
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("shynetyme:chuck-choice", {
        detail: { action: actionName, element: choice }
      }));
    }
  });

  close.addEventListener("click", hideThought);
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideThought();
  });

  const pageKey = (window.location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();
  const chainManagedPages = new Set([
    "index.html",
    "ledbikesim.html",
    "ledhomesim.html",
    "ledautosim.html",
    "project-recommendations.html",
    "contact.html"
  ]);

  window.ShynetymeChuck = {
    mounted: true,
    widget,
    showMessage,
    showChoices,
    showNextMessage,
    hideThought,
    showWelcome: () => showMessage(welcomeMessage, WELCOME_VISIBLE_MS),
    urls: {
      siteRoot: siteRoot.href,
      bike: bikeBuilderUrl,
      home: homeBuilderUrl,
      auto: autoBuilderUrl,
      about: aboutDekeUrl
    }
  };

  loadScript(designChainUrl, "data-shynetyme-design-chain").then((loaded) => {
    if (!loaded || !chainManagedPages.has(pageKey)) {
      welcomeTimer = window.setTimeout(() => showMessage(welcomeMessage, WELCOME_VISIBLE_MS), 650);
    }
  });

  window.addEventListener("pagehide", () => {
    chuckAnimation?.stop();
    window.clearTimeout(scrollStopTimer);
    window.clearTimeout(delayedThoughtTimer);
    window.clearTimeout(hideTimer);
    window.clearTimeout(welcomeTimer);
  }, { once: true });
})();
