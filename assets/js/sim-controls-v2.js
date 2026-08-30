/**
 * ShyneTyme.Works simulator interactions V2.
 *
 * Scene URLs and Bike LED routes live in HTML. This file only changes state
 * on elements that already exist in the document.
 */

(() => {
  "use strict";

  const query = (selector, root = document) => root.querySelector(selector);
  const queryAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const app = query("#appGrid");
  const viewport = query("#viewport");
  const rail = query("#sideRail");
  const railToggle = query("#sidebarToggle");
  const drawer = query("#simControlDrawer");
  const drawerHandle = query("#simDrawerHandle");
  const drawerClose = query("#simDrawerClose");
  const activeTarget = query("#activeTarget");
  const devicePop = query("#devicePop");
  const simulatorType = document.body.dataset.simulator || "auto";
  let popTimer = 0;

  if (!app || !viewport || !rail || !railToggle || !drawer || !drawerHandle) {
    return;
  }

  /* Left drawer */

  const sidebarStates = ["closed", "one", "two"];

  function setSidebarState(state) {
    const nextState = sidebarStates.includes(state) ? state : "closed";
    app.dataset.sidebarState = nextState;
    railToggle.dataset.state = nextState;

    const labels = {
      closed: "Show one column of controls",
      one: "Show two columns of controls",
      two: "Close side controls"
    };

    railToggle.setAttribute("aria-label", labels[nextState]);
    railToggle.title = labels[nextState];
  }

  railToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const currentIndex = sidebarStates.indexOf(app.dataset.sidebarState || "closed");
    setSidebarState(sidebarStates[(currentIndex + 1) % sidebarStates.length]);
  });

  queryAll("[data-rail]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      queryAll("[data-rail]").forEach((item) => item.classList.toggle("active", item === button));

      const devices = query("#devicePane");
      const groups = query("#groupPane");
      if (devices) devices.hidden = button.dataset.rail !== "devices";
      if (groups) groups.hidden = button.dataset.rail !== "groups";
    });
  });

  function showDevicePop(message) {
    if (!devicePop) return;
    devicePop.textContent = message;
    devicePop.classList.add("show");
    window.clearTimeout(popTimer);
    popTimer = window.setTimeout(() => devicePop.classList.remove("show"), 950);
  }

  function selectDevice(button) {
    queryAll(".device-tile").forEach((item) => item.classList.toggle("active", item === button));
    const name = button.dataset.name || "Selected";
    if (activeTarget) activeTarget.textContent = name.toUpperCase();
    showDevicePop(button.dataset.count ? `${name} · ${button.dataset.count} DEVICES` : name);
  }

  function toggleDeviceButton(button) {
    const wasOn = button.dataset.on !== "false";
    const isOn = !wasOn;
    button.dataset.on = String(isOn);
    button.classList.toggle("off", !isOn);
    button.setAttribute("aria-pressed", String(isOn));
    showDevicePop(`${button.dataset.name || "Device"} · ${isOn ? "ON" : "OFF"}`);
  }

  queryAll(".device-tile").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectDevice(button);

      // Bike lighting is deliberately visual-only in V2.
      if (simulatorType !== "bike" && button.dataset.clickToggle === "true") {
        toggleDeviceButton(button);
      }
    });
  });

  query(".add-device")?.addEventListener("click", (event) => {
    event.stopPropagation();
    showDevicePop("ADD DEVICE");
  });

  /* Lower controls */

  function setDrawer(open) {
    drawer.classList.toggle("is-open", open);
    drawerHandle.setAttribute("aria-expanded", String(open));
    drawerHandle.setAttribute("aria-label", open ? "Close simulator controls" : "Open simulator controls");
    query("#simDrawerSurface")?.toggleAttribute("inert", !open);
  }

  drawerHandle.addEventListener("click", (event) => {
    event.stopPropagation();
    setDrawer(!drawer.classList.contains("is-open"));
  });

  drawerClose?.addEventListener("click", (event) => {
    event.stopPropagation();
    setDrawer(false);
  });

  queryAll("[data-output]").forEach((range) => {
    range.addEventListener("input", () => {
      const output = query(`#${range.dataset.output}`);
      if (output) output.textContent = `${range.value}%`;
    });
  });

  queryAll("[data-exclusive-group]").forEach((group) => {
    queryAll("button", group).forEach((button) => {
      button.addEventListener("click", () => {
        queryAll("button", group).forEach((item) => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });
      });
    });
  });

  queryAll(".sim-swatch").forEach((button) => {
    button.addEventListener("click", () => {
      queryAll(".sim-swatch").forEach((item) => item.classList.toggle("active", item === button));
    });
  });

  queryAll("[data-segment-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const output = query("#segmentCount");
      if (!output) return;
      const next = Math.min(12, Math.max(1, Number(output.value || output.textContent) + Number(button.dataset.segmentStep)));
      output.value = String(next);
      output.textContent = String(next);
    });
  });

  /* Existing scene elements and Bike viewBox */

  queryAll(".view-chip").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      queryAll(".view-chip").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      if (button.dataset.sceneId) {
        queryAll(".sim-scene").forEach((scene) => {
          scene.classList.toggle("is-active", scene.id === button.dataset.sceneId);
        });
      }

      const bikePreview = query("#bikePreview");
      if (bikePreview && button.dataset.viewbox) {
        bikePreview.setAttribute("viewBox", button.dataset.viewbox);
      }
    });
  });

  /* Fullscreen */

  query("#fullscreenTrigger")?.addEventListener("click", async (event) => {
    event.stopPropagation();
    const shell = query("#main-content") || document.documentElement;
    try {
      if (!document.fullscreenElement) await shell.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch (_) {
      // Fullscreen support is optional; the simulator stays usable without it.
    }
  });

  /* Existing mobile Bootstrap navbar reveal */

  const nav = query("body.v56-page > nav.navbar");
  const navReveal = query("#simNavReveal");

  function setMobileNavVisible(visible) {
    document.body.classList.toggle("sim-nav-visible", visible);
    navReveal?.setAttribute("aria-expanded", String(visible));
    navReveal?.setAttribute("aria-label", visible ? "Hide site navigation" : "Reveal site navigation");
  }

  navReveal?.addEventListener("click", (event) => {
    event.stopPropagation();
    setMobileNavVisible(!document.body.classList.contains("sim-nav-visible"));
  });

  nav?.addEventListener("click", (event) => event.stopPropagation());

  document.addEventListener("pointerdown", (event) => {
    if (!rail.contains(event.target) && !event.target.closest(".sidebar-toggle")) {
      setSidebarState("closed");
    }

    if (window.matchMedia("(max-width: 991.98px)").matches && !nav?.contains(event.target) && event.target !== navReveal) {
      setMobileNavVisible(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setDrawer(false);
    setSidebarState("closed");
    setMobileNavVisible(false);
  });

  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 991.98px)").matches) setMobileNavVisible(false);
  });

  const initialDevice = query(".device-tile.active");
  if (initialDevice) selectDevice(initialDevice);
  setSidebarState("closed");
  setDrawer(false);
})();
