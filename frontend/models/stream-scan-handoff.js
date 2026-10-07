const JOURNEY_KEY='vt_journey_context';
const RESULT_KEY='vt_last_scan_result';
const JOURNEY_TTL_MS=2*60*60*1000;

export function readStreamJourney(now=Date.now()){
  try{
    const stored=JSON.parse(sessionStorage.getItem(JOURNEY_KEY)||'null');
    if(!stored?.label||now-Number(stored.at||0)>JOURNEY_TTL_MS)return '';
    return String(stored.label);
  }catch{return ''}
}
export function saveStreamResult(result){
  try{sessionStorage.setItem(RESULT_KEY,JSON.stringify(result))}catch{}
}
export function trackStreamEvent(name,payload={}){
  try{window.gtag?.('event',name,payload)}catch{}
}
