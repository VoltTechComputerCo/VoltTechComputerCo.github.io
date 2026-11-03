/* VoltTech owned marketing imagery — visual enhancement only.
   Photos are optional: when an asset has not been uploaded, the site's
   existing image remains in place. No commerce/auth/catalogue code touched. */
(() => {
  "use strict";
  const root = "assets/photography/";
  const photos = {
    showcase: "volttech-pc-showcase.webp",
    ryzen: "amd-ryzen-cpu-showcase.webp",
    syringeHand: "thermal-grizzly-in-hand.webp",
    syringeProduct: "thermal-grizzly-syringe-product.webp",
    ryzenDetail: "amd-ryzen-closeup.webp",
    cooler: "deepcool-cooler-install.webp",
    completed: "white-pc-completed.webp",
    paste: "thermal-paste-application.webp",
    syringeWhite: "thermal-grizzly-syringe-corrected.webp",
    gloves: "thermal-service-gloves.webp"
  };
  const locations = {
    "index.html": {
      gallery: [
        ["showcase", "PC upgrades", "VoltTech-branded gaming PC hardware and upgrade work", "pc-upgrades-pretoria.html"],
        ["cooler", "Cooling & repair", "Installing a white DeepCool CPU air cooler in an open PC", "pc-repair-pretoria.html"],
        ["completed", "Performance & cooling", "Completed white gaming PC with upgraded CPU cooler", "pc-performance-optimisation.html"]
      ]
    },
    "pc-repair-pretoria.html": {
      hero: ["cooler", "VoltTech technician installing a white CPU air cooler in a PC"],
      gallery: [
        ["paste", "Thermal paste application", "Thermal paste being applied to an AMD Ryzen processor", null],
        ["gloves", "Cooling service preparation", "VoltTech workstation with cooling products and service tools", null]
      ]
    },
    "pc-upgrades-pretoria.html": {
      hero: ["ryzen", "AMD Ryzen 9 PRO processor held carefully over a PC workbench"],
      gallery: [
        ["ryzenDetail", "Processor upgrade", "Close view of an AMD Ryzen processor during PC maintenance", null],
        ["showcase", "Hardware and cooling", "VoltTech gaming PC upgrade workbench with cooling products", null]
      ]
    },
    "pc-performance-optimisation.html": {
      hero: ["completed", "White PC with large upgraded CPU cooler and GeForce RTX graphics"],
      gallery: [
        ["syringeHand", "Thermal maintenance", "Thermal Grizzly application product held at a VoltTech workbench", null],
        ["syringeProduct", "Thermal interface materials", "Thermal Grizzly syringe at a VoltTech workstation", null],
        ["syringeWhite", "Precision cooling work", "Thermal Grizzly thermal compound syringe on workbench", null]
      ]
    }
  };
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const config = locations[file];
  if (!config) return;

  const cache = new Map();
  function loadPhoto(key) {
    if (cache.has(key)) return cache.get(key);
    const url = root + photos[key];
    const p = new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve(url);
      probe.onerror = () => resolve(null);
      probe.src = url;
    });
    cache.set(key, p);
    return p;
  }
  function updateHero() {
    if (!config.hero) return;
    const target = document.querySelector(".service-hero-media img");
    if (!target) return;
    loadPhoto(config.hero[0]).then((url) => {
      if (!url) return;
      target.removeAttribute("srcset");
      target.removeAttribute("sizes");
      target.src = url;
      target.alt = config.hero[1];
      target.decoding = "async";
    });
  }
  async function createGallery() {
    const entries = await Promise.all(config.gallery.map(async (item) => ({ item, url: await loadPhoto(item[0]) })));
    const available = entries.filter((entry) => entry.url);
    if (available.length < 2) return;

    const home = file === "index.html";
    const region = document.createElement("section");
    region.className = "vt-photo-story";
    region.setAttribute("aria-label", "VoltTech workbench showcase");
    const inner = document.createElement("div");
    inner.className = "container vt-photo-story-inner";
    const head = document.createElement("div");
    head.className = "vt-photo-story-head";
    head.innerHTML = home
      ? '<p class="eyebrow">OUR WORKBENCH</p><h3>Inside VoltTech.</h3><p>Builds, upgrades and cooling work — presented with our own branded imagery.</p>'
      : '<p class="eyebrow">FROM THE VOLTTECH WORKBENCH</p><h2>See the detail.</h2><p>A closer look at the hardware and cooling work behind our services.</p>';
    const grid = document.createElement("div");
    grid.className = "vt-photo-story-grid";
    for (const { item, url } of available) {
      const [key, heading, alt, href] = item;
      const card = document.createElement(href ? "a" : "figure");
      card.className = "vt-photo-story-card";
      if (href) card.href = href;
      const pic = document.createElement("img");
      pic.src = url;
      pic.alt = alt;
      pic.loading = "lazy";
      pic.decoding = "async";
      pic.width = 960;
      pic.height = 720;
      const caption = document.createElement(href ? "span" : "figcaption");
      caption.className = "vt-photo-story-label";
      caption.textContent = heading;
      card.append(pic, caption);
      grid.append(card);
    }
    inner.append(head, grid);
    region.append(inner);
    if (home) {
      const anchor = document.querySelector(".home-services .service-grid");
      anchor?.insertAdjacentElement("afterend", region);
      if (anchor) region.classList.add("vt-photo-story-home");
    } else {
      const anchor = document.querySelector(".service-page .service-section");
      anchor?.insertAdjacentElement("afterend", region);
    }
  }
  function init() { updateHero(); createGallery().catch(() => {}); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
