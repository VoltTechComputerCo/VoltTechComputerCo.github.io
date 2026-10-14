import { connectCart, connectAccount, connectProductionServices } from '../services/home-integrations.js';
function start(){connectProductionServices();connectCart();connectAccount(window.VOLTTECH_SUPABASE);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
