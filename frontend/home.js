import './experience.js';
import { startAnalytics } from './adapters/analytics.js';
startAnalytics();
import { catalogueState } from './adapters/public-catalogue.js';
const state=await catalogueState(window.VOLTTECH_SUPABASE);
const messages={empty:'The public catalogue is being prepared. Ask VoltTech to confirm component pricing and availability.',closed:'The catalogue is not open yet. Talk to VoltTech about your component or upgrade enquiry.',available:'Explore currently listed components in the Store. Product pages show pricing and availability where confirmed.',unavailable:'We could not confirm catalogue availability right now. Contact VoltTech for current pricing and availability.'};
document.querySelector('[data-catalogue-state]').textContent=messages[state.kind];
