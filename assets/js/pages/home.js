import { STATIC_ENQUIRY_MODE } from '../services/storefront-mode.js?v=20261107-independent1';
import { connectCart, connectAccount, connectProductionServices } from '../services/home-integrations.js?v=20261021.3';
function start(){connectProductionServices();connectCart();if(!STATIC_ENQUIRY_MODE)connectAccount(window.VOLTTECH_SUPABASE);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
