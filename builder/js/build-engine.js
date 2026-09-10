export const CATEGORY_ORDER = [
    "cpu",
    "motherboard",
    "memory",
    "gpu",
    "storage",
    "psu",
    "case",
    "cooler"
];

export const CATEGORY_LABELS = {
    cpu: "CPU",
    motherboard: "Motherboard",
    memory: "Memory",
    gpu: "Graphics Card",
    storage: "Storage",
    psu: "Power Supply",
    case: "Case",
    cooler: "CPU Cooler"
};

export function createEmptyBuild() {
    return {
        cpu: null,
        motherboard: null,
        memory: null,
        gpu: null,
        storage: null,
        psu: null,
        case: null,
        cooler: null
    };
}

export function selectProduct(build, product) {
    return {
        ...build,
        [product.type]: product
    };
}

export function removeProduct(build, type) {
    return {
        ...build,
        [type]: null
    };
}

export function clearBuild() {
    return createEmptyBuild();
}

export function getProductsByCategory(products, category) {
    return products.filter(
        product => product.type === category
    );
}

export function searchProducts(products, query) {
    const normalized =
        String(query || "")
            .trim()
            .toLowerCase();

    if (!normalized) {
        return products;
    }

    return products.filter(product => {
        const searchable = [
            product.brand,
            product.name,
            product.model,
            product.mpn
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchable.includes(normalized);
    });
}

export function getBestOffer(product) {
    const offers =
        Array.isArray(product?.offers)
            ? product.offers
            : [];

    const availableOffers =
        offers.filter(offer => {
            const status =
                String(
                    offer.stockStatus || ""
                ).toLowerCase();

            return ![
                "out-of-stock",
                "discontinued"
            ].includes(status);
        });

    const candidates =
        availableOffers.length
            ? availableOffers
            : offers;

    if (!candidates.length) {
        return null;
    }

    return [...candidates].sort(
        (a, b) =>
            Number(a.price || Infinity) -
            Number(b.price || Infinity)
    )[0];
}

export function getProductPrice(product) {
    return Number(
        getBestOffer(product)?.price || 0
    );
}

export function calculateBuildTotal(build) {
    return Object.values(build)
        .filter(Boolean)
        .reduce(
            (total, product) =>
                total + getProductPrice(product),
            0
        );
}

export function formatMoney(
    value,
    currency = "ZAR"
) {
    return new Intl.NumberFormat(
        "en-ZA",
        {
            style: "currency",
            currency,
            maximumFractionDigits: 0
        }
    ).format(Number(value || 0));
}

export function getSelectedCount(build) {
    return Object.values(build)
        .filter(Boolean)
        .length;
}

export function getNextCategory(
    currentCategory,
    build
) {
    const currentIndex =
        CATEGORY_ORDER.indexOf(currentCategory);

    const afterCurrent =
        CATEGORY_ORDER.slice(
            Math.max(currentIndex + 1, 0)
        );

    const nextEmpty =
        afterCurrent.find(
            category => !build[category]
        );

    if (nextEmpty) {
        return nextEmpty;
    }

    return CATEGORY_ORDER.find(
        category => !build[category]
    ) || currentCategory;
}

export function getFirstIncompleteCategory(build) {
    return CATEGORY_ORDER.find(
        category => !build[category]
    ) || CATEGORY_ORDER[0];
}

export function getCategorySummary(product) {
    if (!product) {
        return "Not selected";
    }

    const specs = product.specs || {};

    switch (product.type) {
        case "cpu":
            return [
                specs.socket,
                specs.cores
                    ? `${specs.cores}C/${specs.threads}T`
                    : null
            ]
                .filter(Boolean)
                .join(" · ");

        case "motherboard":
            return [
                specs.chipset,
                specs.formFactor,
                specs.memoryType
            ]
                .filter(Boolean)
                .join(" · ");

        case "memory":
            return [
                specs.capacityGB
                    ? `${specs.capacityGB}GB`
                    : null,
                specs.memoryType,
                specs.speedMTs
                    ? `${specs.speedMTs} MT/s`
                    : null
            ]
                .filter(Boolean)
                .join(" · ");

        case "gpu":
            return [
                specs.vramGB
                    ? `${specs.vramGB}GB VRAM`
                    : null,
                specs.lengthMm
                    ? `${specs.lengthMm}mm`
                    : null
            ]
                .filter(Boolean)
                .join(" · ");

        case "storage":
            return [
                specs.capacityGB
                    ? formatCapacity(
                        specs.capacityGB
                    )
                    : null,
                specs.interface
            ]
                .filter(Boolean)
                .join(" · ");

        case "psu":
            return [
                specs.wattage
                    ? `${specs.wattage}W`
                    : null,
                specs.efficiency
            ]
                .filter(Boolean)
                .join(" · ");

        case "case":
            return [
                specs.supportedMotherboardSizes
                    ?.join("/"),
                specs.maxGpuLengthMm
                    ? `${specs.maxGpuLengthMm}mm GPU`
                    : null
            ]
                .filter(Boolean)
                .join(" · ");

        case "cooler":
            return specs.coolerType === "aio"
                ? `${specs.radiatorSizeMm}mm AIO`
                : specs.heightMm
                    ? `${specs.heightMm}mm air cooler`
                    : "CPU cooler";

        default:
            return "";
    }
}

export function getStockLabel(status) {
    switch (
        String(status || "").toLowerCase()
    ) {
        case "in-stock":
            return "In stock";

        case "supplier-stock":
            return "Available from supplier";

        case "low-stock":
            return "Low stock";

        case "available-to-order":
            return "Available to order";

        case "expected-soon":
            return "Expected soon";

        case "out-of-stock":
            return "Out of stock";

        default:
            return "Stock unconfirmed";
    }
}

function formatCapacity(capacityGB) {
    const gb = Number(capacityGB || 0);

    if (gb >= 1000) {
        const tb = gb / 1000;

        return Number.isInteger(tb)
            ? `${tb}TB`
            : `${tb.toFixed(1)}TB`;
    }

    return `${gb}GB`;
}
