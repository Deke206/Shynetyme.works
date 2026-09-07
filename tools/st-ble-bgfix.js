"use strict";
(() => {
  const q = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function log(msg) {
    const x = q("#debugLog");
    if (!x) return;
    const ts = new Date().toLocaleTimeString();
    x.textContent = `${ts}  ${msg}\n${x.textContent}`.slice(0, 5000);
  }

  function snap() {
    return window.STWBLE?.snapshot?.() || { devices: [], target: null };
  }

  function targetStatus() {
    const s = snap();
    if (s.target?.type === "device")
      return s.devices.find((d) => d.id === s.target.id)?.lastStatus || {};
    if (s.target?.type === "group") {
      const g = s.groups?.find((x) => x.id === s.target.id);
      return s.devices.find((d) => g?.members?.includes(d.id))?.lastStatus || {};
    }
    return {};
  }

  function backgroundHex() {
    return (q("#bg")?.value || "#000000").replace("#", "").toUpperCase();
  }

  function updateSliderUi(x) {
    if (!x) return;
    const min = +x.min || 0;
    const max = +x.max || 255;
    const pct = clamp(((+x.value - min) / (max - min)) * 100, 0, 100);
    const rail = x.closest(".sim-slider");
    const fill = rail?.querySelector(".fill");
    const thumb = rail?.querySelector(".thumb");
    if (fill) fill.style.width = pct + "%";
    if (thumb) thumb.style.left = pct + "%";
    const out = q("#intV");
    if (out) out.textContent = Math.round(pct) + "%";

    // Preview only: show the selected BG hue at its effective brightness.
    const swatch = q("#bgSwatch");
    if (swatch) {
      swatch.style.background = `#${backgroundHex()}`;
      swatch.style.filter = `brightness(${Math.max(0.02, +x.value / 255)})`;
    }
  }

  async function sendBackground(x, reliable = false) {
    if (!window.STWBLE?.send) return false;
    const value = clamp(+x.value || 0, 0, 255);
    const cmd = `BG=${backgroundHex()};BGB=${value}`;
    const ok = await window.STWBLE.send(cmd, { fast: !reliable });
    if (reliable) {
      log(`TX background: BG=#${backgroundHex()} BGB=${value}`);
      const ids = window.STWBLE.targetMemberIds?.() || [];
      setTimeout(() => ids.forEach((id) => window.STWBLE.readStatus?.(id)), 120);
    }
    return ok;
  }

  function install() {
    const old = q("#int");
    if (!old || old.dataset.bgBound === "1") return;

    // Replace the range so no older INT/BGB handlers can compete with this binding.
    const x = old.cloneNode(true);
    old.replaceWith(x);
    x.dataset.bgBound = "1";
    x.min = "0";
    x.max = "255";

    const row = x.closest(".slider-row");
    const label = row?.querySelector("label");
    if (label) label.textContent = "BACKGROUND BRIGHTNESS";

    const st = targetStatus();
    if (st.BGB != null) x.value = st.BGB;
    updateSliderUi(x);

    let timer = 0;
    x.addEventListener("input", () => {
      updateSliderUi(x);
      clearTimeout(timer);
      timer = setTimeout(() => sendBackground(x, false), 45);
    });

    const commit = () => {
      clearTimeout(timer);
      updateSliderUi(x);
      sendBackground(x, true).catch((e) => log(`Background brightness: ${e.message}`));
    };
    x.addEventListener("change", commit);
    x.addEventListener("pointerup", commit);
    x.addEventListener("pointercancel", commit);

    document.addEventListener("stw:ble", (e) => {
      if (e.detail?.type !== "status" && e.detail?.type !== "target") return;
      const state = targetStatus();
      if (state.BGB != null) {
        x.value = state.BGB;
        updateSliderUi(x);
      }
    });

    // When the BG hue changes, immediately re-apply the existing BGB level.
    const bg = q("#bg");
    if (bg) {
      const reapply = () => {
        updateSliderUi(x);
        sendBackground(x, true).catch((e) => log(`Background color: ${e.message}`));
      };
      bg.addEventListener("change", reapply);
    }

    log("Background brightness bound directly: BG color + BGB level.");
  }

  install();
})();
