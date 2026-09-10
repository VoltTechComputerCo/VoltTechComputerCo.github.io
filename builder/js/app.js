import {
    CATEGORY_ORDER,
    CATEGORY_LABELS,
    createEmptyBuild,
    selectProduct,
    removeProduct,
    clearBuild,
    getProductsByCategory,
    searchProducts,
    getBestOffer,
    getProductPrice,
    calculateBuildTotal,
    formatMoney,
    getSelectedCount,
    getNextCategory,
    getCategorySummary,
    getStockLabel
} from "./build-engine.js";

import {
    getCompatibility,
    validateBuild,
    estimatePower
} from "./compatibility-engine.js";

const elements = {
    steps: document.getElementById("steps"),
    search: document.getElementById("search"),
    compatibleOnly: document.getElementById("compatible-only"),
    categoryTitle: document.getElementById("category-title"),
    productCount: document.getElementById("product-count"),
    products: document.getElementById("products"),
    buildList: document.getElementById("build-list"),
    total: document.getElementById("total"),
    power: document.getElementById("power"),
    report: document.getElementById("report"),
    clearBuild: document.getElementById("clear-build"),
    catalogueNote: document.getElementById("catalogue-note")
};

let catalogue = [];
let currency = "ZAR";
let activeCategory = CATEGORY_ORDER[0];
let build = createEmptyBuild();

init();

async function init() {
    bindEvents();

    try {
        const response = await fetch("./data/products.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Catalogue request failed: ${response.status}`);
        }

        const data = await response.json();
        catalogue = Array.isArray(data.products) ? data.products : [];
        currency = data.currency || "ZAR";

        elements.catalogueNote.textContent =
            `${catalogue.length} prototype products loaded · ` +
            `test pricing and stock only · not a customer quotation.`;

        render();
    } catch (error) {
        console.error(error);
        elements.catalogueNote.textContent =
            "Prototype catalogue could not be loaded.";

        elements.products.innerHTML = `
            <div class="empty">
                Could not load product data.<br>
                Check builder/data/products.json.
            </div>
        `;
    }
}

function bindEvents() {
    elements.search.addEventListener("input", renderProducts);
    elements.compatibleOnly.addEventListener("change", renderProducts);

    elements.clearBuild.addEventListener("click", () => {
        build = clearBuild();
        activeCategory = CATEGORY_ORDER[0];
        elements.search.value = "";
        render();
    });
}

function render() {
    renderSteps();
    renderProducts();
    renderBuild();
    renderPower();
    renderReport();
}

function renderSteps() {
    elements.steps.innerHTML = CATEGORY_ORDER.map((category, index) => {
        const selected = build[category];
        const isActive = category === activeCategory;
        const isComplete = Boolean(selected);

        const classes = [
            "step",
            isActive ? "active" : "",
            isComplete ? "complete" : ""
        ].filter(Boolean).join(" ");

        const summary = selected
            ? escapeHtml(getCategorySummary(selected))
            : "Not selected";

        return `
            <button
                class="${classes}"
                type="button"
                data-category="${category}"
            >
                <span class="step-index">
                    ${isComplete ? "✓" : index + 1}
                </span>

                <span class="step-label">
                    <b>${escapeHtml(CATEGORY_LABELS[category])}</b>
                    <small>${summary}</small>
                </span>
            </button>
        `;
    }).join("");

    elements.steps
        .querySelectorAll("[data-category]")
        .forEach(button => {
            button.addEventListener("click", () => {
                activeCategory = button.dataset.category;
                elements.search.value = "";
                renderSteps();
                renderProducts();

                if (window.innerWidth < 701) {
                    document
                        .querySelector(".catalogue")
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                }
            });
        });
}

function renderProducts() {
    if (!catalogue.length) {
        return;
    }

    elements.categoryTitle.textContent =
        CATEGORY_LABELS[activeCategory];

    let products = getProductsByCategory(catalogue, activeCategory);
    products = searchProducts(products, elements.search.value);

    const evaluated = products.map(product => ({
        product,
        result: getCompatibility(product, build)
    }));

    const visible = elements.compatibleOnly.checked
        ? evaluated.filter(
            item =>
                item.result.compatible ||
                build[activeCategory]?.id === item.product.id
        )
        : evaluated;

    elements.productCount.textContent =
        `${visible.length} of ${products.length}`;

    if (!visible.length) {
        elements.products.innerHTML = `
            <div class="empty">
                No matching compatible products.
                Try turning off “Hide incompatible”
                or changing another component.
            </div>
        `;
        return;
    }

    elements.products.innerHTML = visible.map(
        ({ product, result }) => productCard(product, result)
    ).join("");

    elements.products
        .querySelectorAll("[data-select-product]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.selectProduct;
                const product = catalogue.find(item => item.id === id);

                if (!product) return;

                const currentlySelected =
                    build[product.type]?.id === product.id;

                if (currentlySelected) {
                    build = removeProduct(build, product.type);
                } else {
                    const result = getCompatibility(product, build);

                    if (!result.compatible) {
                        return;
                    }

                    build = selectProduct(build, product);

                    const buildComplete =
                        getSelectedCount(build) === CATEGORY_ORDER.length;

                    if (!buildComplete) {
                        activeCategory = getNextCategory(
                            product.type,
                            build
                        );
                    }

                    elements.search.value = "";

                    if (buildComplete) {
                        setTimeout(() => {
                            document
                                .querySelector(".summary")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                });
                        }, 100);
                    }
                }

                render();
            });
        });
}

function productCard(product, result) {
    const offer = getBestOffer(product);
    const selected =
        build[product.type]?.id === product.id;

    const classes = [
        "product",
        selected ? "selected" : "",
        !result.compatible ? "incompatible" : ""
    ].filter(Boolean).join(" ");

    const meta = getProductMeta(product)
        .map(item => `<span class="meta">${escapeHtml(item)}</span>`)
        .join("");

    const issues = result.issues
        .map(issue =>
            `<div class="product-error">✕ ${escapeHtml(issue)}</div>`
        )
        .join("");

    const warnings = result.warnings
        .map(warning =>
            `<div class="product-warning">⚠ ${escapeHtml(warning)}</div>`
        )
        .join("");

    const price = offer
        ? formatMoney(offer.price, currency)
        : "Price unavailable";

    const supplier = offer
        ? `${formatSupplier(offer.source)} · ${getStockLabel(offer.stockStatus)}`
        : "No supplier offer";

    return `
        <article class="${classes}">
            <div class="product-main">
                <span class="product-brand">
                    ${escapeHtml(product.brand || "")}
                </span>

                <h3>${escapeHtml(product.name)}</h3>

                <div class="product-meta">
                    ${meta}
                </div>

                ${issues}
                ${warnings}
            </div>

            <div class="product-side">
                <div class="price">
                    ${escapeHtml(price)}
                </div>

                <div class="supplier">
                    ${escapeHtml(supplier)}
                </div>

                <button
                    type="button"
                    class="select-btn ${selected ? "remove" : ""}"
                    data-select-product="${escapeHtml(product.id)}"
                    ${!result.compatible && !selected ? "disabled" : ""}
                >
                    ${selected
                        ? "Remove"
                        : result.compatible
                            ? "Select"
                            : "Incompatible"}
                </button>
            </div>
        </article>
    `;
}

function renderBuild() {
    elements.buildList.innerHTML = CATEGORY_ORDER.map(category => {
        const product = build[category];

        if (!product) {
            return `
                <div class="build-item">
                    <span>
                        ${escapeHtml(CATEGORY_LABELS[category])}
                    </span>
                    <b>Not selected</b>
                </div>
            `;
        }

        return `
            <div class="build-item">
                <div>
                    <span>
                        ${escapeHtml(CATEGORY_LABELS[category])}
                    </span>

                    <div class="build-price">
                        ${escapeHtml(
                            formatMoney(
                                getProductPrice(product),
                                currency
                            )
                        )}
                    </div>
                </div>

                <b>${escapeHtml(product.name)}</b>
            </div>
        `;
    }).join("");

    elements.total.textContent =
        formatMoney(calculateBuildTotal(build), currency);
}

function renderPower() {
    const power = estimatePower(build);

    if (!power.estimated) {
        elements.power.innerHTML = `
            <div class="power-title">
                Power estimate
            </div>

            <div class="power-grid">
                <span>Estimated load</span>
                <strong>—</strong>

                <span>Recommended PSU</span>
                <strong>—</strong>
            </div>
        `;
        return;
    }

    elements.power.innerHTML = `
        <div class="power-title">
            Power estimate
        </div>

        <div class="power-grid">
            <span>Estimated load</span>
            <strong>${power.estimated} W</strong>

            <span>Minimum target</span>
            <strong>${power.minimum} W</strong>

            <span>Preferred headroom</span>
            <strong>${power.preferred} W</strong>
        </div>
    `;
}

function renderReport() {
    const report = validateBuild(build);
    const selectedCount = getSelectedCount(build);
    const entries = [];

    if (!selectedCount) {
        entries.push({
            type: "good",
            text:
                "Start by selecting a component. " +
                "Compatibility checks will update automatically."
        });
    } else if (report.compatible) {
        entries.push({
            type: "good",
            text:
                `No confirmed compatibility conflicts ` +
                `found across ${selectedCount} selected component` +
                `${selectedCount === 1 ? "" : "s"}.`
        });
    }

    report.issues.forEach(issue => {
        entries.push({
            type: "bad",
            text: issue
        });
    });

    report.warnings.forEach(warning => {
        entries.push({
            type: "warn",
            text: warning
        });
    });

    if (selectedCount === CATEGORY_ORDER.length) {
        if (report.compatible) {
            entries.unshift({
                type: "good",
                text:
                    "BUILD COMPLETE ✓ — All core components are selected " +
                    "and no confirmed compatibility conflicts were found. " +
                    `Current prototype parts total: ${
                        formatMoney(
                            calculateBuildTotal(build),
                            currency
                        )
                    }.`
            });
        } else {
            entries.unshift({
                type: "bad",
                text:
                    "BUILD COMPLETE — All component categories are filled, " +
                    "but compatibility issues still need to be resolved."
            });
        }
    }

    elements.report.innerHTML = entries.map(entry => `
        <div class="report-item ${entry.type}">
            ${
                entry.type === "good"
                    ? "✓"
                    : entry.type === "warn"
                        ? "⚠"
                        : "✕"
            }
            ${escapeHtml(entry.text)}
        </div>
    `).join("");
}

function getProductMeta(product) {
    const s = product.specs || {};

    switch (product.type) {
        case "cpu":
            return [
                s.socket,
                s.cores ? `${s.cores} cores` : null,
                s.threads ? `${s.threads} threads` : null,
                s.tdpWatts ? `${s.tdpWatts}W TDP` : null
            ].filter(Boolean);

        case "motherboard":
            return [
                s.socket,
                s.chipset,
                s.formFactor,
                s.memoryType,
                s.wifi ? "Wi-Fi" : null
            ].filter(Boolean);

        case "memory":
            return [
                s.capacityGB ? `${s.capacityGB}GB` : null,
                s.modules ? `${s.modules} modules` : null,
                s.memoryType,
                s.speedMTs ? `${s.speedMTs} MT/s` : null
            ].filter(Boolean);

        case "gpu":
            return [
                s.vramGB ? `${s.vramGB}GB VRAM` : null,
                s.lengthMm ? `${s.lengthMm}mm` : null,
                s.slots ? `${s.slots}-slot` : null,
                s.recommendedPsuWatts
                    ? `${s.recommendedPsuWatts}W PSU`
                    : null
            ].filter(Boolean);

        case "storage":
            return [
                s.capacityGB
                    ? formatStorage(s.capacityGB)
                    : null,
                s.interface,
                s.formFactor,
                s.pcieGeneration
                    ? `PCIe ${s.pcieGeneration}.0`
                    : null
            ].filter(Boolean);

        case "psu":
            return [
                s.wattage ? `${s.wattage}W` : null,
                s.efficiency,
                s.modular,
                s.atxVersion
            ].filter(Boolean);

        case "case":
            return [
                s.supportedMotherboardSizes?.join(" / "),
                s.maxGpuLengthMm
                    ? `${s.maxGpuLengthMm}mm GPU`
                    : null,
                s.maxCpuCoolerHeightMm
                    ? `${s.maxCpuCoolerHeightMm}mm cooler`
                    : null
            ].filter(Boolean);

        case "cooler":
            return [
                s.coolerType === "aio"
                    ? "Liquid AIO"
                    : "Air cooler",
                s.radiatorSizeMm
                    ? `${s.radiatorSizeMm}mm radiator`
                    : null,
                s.heightMm
                    ? `${s.heightMm}mm height`
                    : null
            ].filter(Boolean);

        default:
            return [];
    }
}

function formatSupplier(source) {
    const names = {
        "mock-wootware": "Mock Wootware",
        "mock-evetech": "Mock Evetech",
        "mock-dreamware": "Mock Dreamware",
        "mock-rebeltech": "Mock Rebel Tech",
        "mock-retailer": "Prototype supplier"
    };

    return names[source] || source || "Supplier";
}

function formatStorage(capacityGB) {
    const gb = Number(capacityGB || 0);

    if (gb >= 1000) {
        const tb = gb / 1000;

        return Number.isInteger(tb)
            ? `${tb}TB`
            : `${tb.toFixed(1)}TB`;
    }

    return `${gb}GB`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
