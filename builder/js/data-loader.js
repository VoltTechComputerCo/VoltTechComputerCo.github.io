import {
    buildProductIdentityIndexes,
    normalizeCatalogueProducts,
    normalizeSupplierFeed,
    resolveOfferProductId
} from "../../commerce/js/catalogue-normalizer.js?v=0.6";

const CATALOGUE_PATH = "./data/catalogue.json";

export async function loadCatalogue() {
    const manifest = await getJson(CATALOGUE_PATH);
    const categoryFiles = await Promise.all((manifest.categoryFiles || []).map(getJson));
    const rawProducts = categoryFiles.flatMap(file => file.products || []);
    const products = normalizeCatalogueProducts(rawProducts);
    const indexes = buildProductIdentityIndexes(products);

    if (indexes.collisions.length) {
        console.warn("Product identifier collisions detected", indexes.collisions);
    }

    const supplierFiles = await Promise.all((manifest.supplierFiles || []).map(async path => {
        try {
            const raw = await getJson(path);
            return normalizeSupplierFeed(raw, { currency: manifest.currency || "ZAR" });
        } catch (error) {
            console.warn("Supplier feed unavailable", path, error);
            return null;
        }
    }));

    const offersByProduct = new Map();
    const unmatchedOffers = [];

    for (const feed of supplierFiles.filter(Boolean)) {
        for (const offer of feed.offers || []) {
            const productId = resolveOfferProductId(offer, products, indexes);

            if (!productId) {
                unmatchedOffers.push({
                    supplier: offer.supplier,
                    supplierSku: offer.supplierSku,
                    identifiers: offer.identifiers
                });
                continue;
            }

            const existing = offersByProduct.get(productId) || [];
            existing.push({ ...offer, productId });
            offersByProduct.set(productId, existing);
        }
    }

    const enrichedProducts = products.map(product => ({
        ...product,
        offers: sortOffers(offersByProduct.get(product.id) || [])
    }));

    const allOffers = enrichedProducts.flatMap(product => product.offers || []);

    return {
        schemaVersion: manifest.schemaVersion || "0.6.0",
        generatedAt: manifest.generatedAt || null,
        currency: manifest.currency || "ZAR",
        notice: manifest.notice || "",
        products: enrichedProducts,
        supplierCount: supplierFiles.filter(Boolean).length,
        categoryCount: categoryFiles.length,
        offerCount: allOffers.length,
        unmatchedOfferCount: unmatchedOffers.length,
        unmatchedOffers,
        freshness: summarizeFreshness(allOffers),
        identifierCollisionCount: indexes.collisions.length
    };
}

function sortOffers(offers) {
    const freshnessRank = { fresh: 0, aging: 1, unknown: 2, stale: 3 };

    return [...offers].sort((a, b) => {
        const rankDiff =
            (freshnessRank[a.freshness] ?? 9) -
            (freshnessRank[b.freshness] ?? 9);

        if (rankDiff) return rankDiff;

        return Number(a.price || Infinity) - Number(b.price || Infinity);
    });
}

function summarizeFreshness(offers) {
    return offers.reduce((summary, offer) => {
        const key = offer.freshness || "unknown";
        summary[key] = (summary[key] || 0) + 1;
        return summary;
    }, { fresh: 0, aging: 0, stale: 0, unknown: 0 });
}

async function getJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
}
