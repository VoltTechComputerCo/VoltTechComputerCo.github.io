// VoltTech public storefront resilience policy.
// While the Supabase public API is restricted (HTTP 402), browse exclusively
// from the GitHub/Cloudflare-hosted public catalogue snapshot. No live prices,
// order submission, stock claims or auth are attempted on these pages.
// This is intentionally a reversible Phase-0 setting, NOT a backend migration.
// Developer localhost keeps the live-path smoke tests available; production
// and preview domains always use the independent, zero-API public browse mode.
export const STATIC_ENQUIRY_MODE=!new Set(['localhost','127.0.0.1']).has(globalThis.location?.hostname||'');
