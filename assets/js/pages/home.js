import { connectCart, connectAccount, connectProductionServices } from '../services/home-integrations.js?v=20261021';
function start(){connectProductionServices();connectCart();connectAccount(window.VOLTTECH_SUPABASE);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
