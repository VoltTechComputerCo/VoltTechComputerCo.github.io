export const canonicalOrigin = 'https://volttechcomputerco.co.za';
export const productionOrigins = new Set([canonicalOrigin, 'https://www.volttechcomputerco.co.za']);
export const isProduction = () => productionOrigins.has(location.origin);
export const sdkUrl = new URL('../../vendor/supabase-2.116.0.js?v=20261021.3',import.meta.url).href;

// The browser-side transaction origin now follows the canonical .co.za host.
// Payment Edge Functions remain launch-gated and must be aligned/certified separately before direct payments are enabled.
export const transactionOrigin = canonicalOrigin;
export const canTransactHere = () => location.origin === transactionOrigin;
