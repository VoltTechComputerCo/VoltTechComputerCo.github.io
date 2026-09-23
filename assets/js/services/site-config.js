export const productionOrigins = new Set(['https://volttechcomputerco.github.io', 'https://volttechcomputerco.co.za', 'https://www.volttechcomputerco.co.za']);
export const isProduction = () => productionOrigins.has(location.origin);
export const sdkUrl = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js';

// Matches the currently deployed commerce Edge Functions. Domain migration must update both ends.
export const transactionOrigin = 'https://volttechcomputerco.github.io';
export const canTransactHere = () => location.origin === transactionOrigin;
