
import {
  createEmptyBuild, selectProduct, getProductsByCategory, getProductPrice,
  calculateBuildTotal, getBestOffer, getSelections
} from "./build-engine.js?v=0.7.7";
import {
  getCompatibility, validateBuild, estimatePower
} from "./compatibility-engine.js?v=0.7.8.1";

const LABELS={
  gaming:"Gaming",streaming:"Gaming + Streaming",creator:"Content Creation",
  workstation:"Workstation / Professional",office:"Office / Home",
  "1080p":"1080p","1440p":"1440p","4k":"4K",unsure:"Not sure yet",
  value:"Best value",balanced:"Balanced",performance:"Maximum performance",quiet:"Quiet / efficient"
};

export function profileLabel(v){return LABELS[v]||v||""}

export function buildGuidedRecommendation(profile,catalogue,currency="ZAR"){
  const budget=parseBudget(profile.budget), plan=getPlan(profile,budget);
  let build=createEmptyBuild(); const reasons={};

  const pick=(type,target,pref)=>choose(catalogue,type,build,target,pref);

  const cpu=pick("cpu",plan.cpu,p=>cpuScore(p,profile));
  if(!cpu)return fail("No priced CPU was available for this profile."); build=selectProduct(build,cpu);
  reasons.cpu=profile.useCase==="creator"||profile.useCase==="workstation"
    ? `${cpu.specs?.cores||"Multi"}-core CPU weighted for heavier threaded workloads.`
    : `Balanced CPU spend so the build keeps enough budget for graphics performance.`;

  const board=pick("motherboard",plan.motherboard,p=>boardScore(p,profile));
  if(!board)return fail("No compatible motherboard was found."); build=selectProduct(build,board);
  reasons.motherboard=`Matched to the ${cpu.specs?.socket||"CPU"} platform with sensible expansion for this budget.`;

  const memory=pick("memory",plan.memory,p=>memoryScore(p,profile));
  if(!memory)return fail("No compatible matched memory kit was found."); build=selectProduct(build,memory);
  reasons.memory=`${memory.specs?.capacityGB||"?"}GB matched retail kit. Guided builds never mix separate RAM kits.`;

  let gpu=null;
  if(profile.useCase!=="office"){
    gpu=pick("gpu",plan.gpu,p=>gpuScore(p,profile));
    if(!gpu)return fail("No compatible graphics card was found."); build=selectProduct(build,gpu);
    reasons.gpu=`GPU budget is weighted for ${profileLabel(profile.target)} and the ${profile.fpsTarget||"120"}+ FPS target.`;
  }

  const pcCase=pick("case",plan.case,p=>caseScore(p,profile));
  if(!pcCase)return fail("No compatible case was found."); build=selectProduct(build,pcCase);
  reasons.case=`Selected after the core platform so motherboard, GPU and cooler fit can be checked together.`;

  const cooler=pick("cooler",plan.cooler,p=>coolerScore(p,cpu,profile));
  if(!cooler)return fail("No compatible CPU cooler was found."); build=selectProduct(build,cooler);
  reasons.cooler=`Compatible with the CPU socket and selected case.`;

  const prePsu=estimatePower({...build,psu:null});
  const psu=choosePsu(catalogue,build,plan.psu,prePsu,profile);
  if(!psu)return fail("No compatible PSU met the calculated power target."); build=selectProduct(build,psu);
  reasons.psu=`Chosen after the main hardware: about ${prePsu.estimated} W estimated load and ${prePsu.preferred} W preferred headroom.`;

  const storage=chooseStorage(catalogue,build,plan.storage,profile);
  if(!storage)return fail("No compatible storage option was found."); build=selectProduct(build,storage);
  reasons.storage=`Starting ${storage.specs?.interface||storage.compatibility?.interface||"storage"} drive sized around the profile. Extra drives can be added later.`;
  reasons.fans="Optional. The guided build does not force extra case fans unless you choose to add them.";

  const report=validateBuild(build), power=estimatePower(build), total=calculateBuildTotal(build);
  const confidence=(report.issues||[]).length?"conflict":(report.unknowns||[]).length?"needs-data":(report.warnings||[]).length?"review":"confirmed";
  const budgetState=total>budget.max?"over":total<budget.min*.82?"under":"within";
  const notes=[];
  if(budgetState==="over")notes.push("Temporary catalogue pricing could not fit this profile fully inside the selected budget.");
  if(budgetState==="under")notes.push("The prototype came in well below budget, leaving room for upgrades.");
  if((report.unknowns||[]).length)notes.push("Some compatibility details still depend on incomplete prototype product data.");
  if((report.warnings||[]).length)notes.push("Review the attention items before treating this as a final quotation.");
  if(!notes.length)notes.push("No confirmed compatibility conflict was found in the recommended build.");

  return {ok:true,build,reasons,profile,budget,plan,report,power,total,currency,budgetState,confidence,notes};
}

function fail(message){return{ok:false,message}}

function parseBudget(raw){
  if(raw==="60000+")return{min:60000,max:90000,target:70000,label:"R60 000+"};
  const [min,max]=String(raw||"25000-40000").split("-").map(Number);
  return{min,max,target:Math.round((min+max)*.52),label:`R${fmt(min)} – R${fmt(max)}`};
}

function getPlan(profile,budget){
  const map={
    gaming:{cpu:.17,motherboard:.10,memory:.08,gpu:.38,case:.07,cooler:.05,psu:.08,storage:.07},
    streaming:{cpu:.21,motherboard:.10,memory:.09,gpu:.32,case:.07,cooler:.06,psu:.08,storage:.07},
    creator:{cpu:.24,motherboard:.11,memory:.12,gpu:.26,case:.06,cooler:.07,psu:.07,storage:.07},
    workstation:{cpu:.27,motherboard:.12,memory:.14,gpu:.20,case:.06,cooler:.08,psu:.07,storage:.06},
    office:{cpu:.25,motherboard:.15,memory:.12,gpu:0,case:.12,cooler:.09,psu:.12,storage:.15}
  };
  const shares=map[profile.useCase]||map.gaming;
  let mult=profile.priority==="value"?.88:profile.priority==="performance"?1.08:1;
  const target=Math.min(budget.max*.94,budget.target*mult), plan={};
  for(const[k,v]of Object.entries(shares))plan[k]=Math.round(target*v);
  if(profile.target==="4k"){plan.gpu=Math.round(plan.gpu*1.18);plan.cpu=Math.round(plan.cpu*.92)}
  if(profile.target==="1080p"){plan.gpu=Math.round(plan.gpu*.90);plan.cpu=Math.round(plan.cpu*1.05)}
  return plan;
}

function choose(catalogue,type,build,target,pref=()=>0){
  const list=getProductsByCategory(catalogue,type).map(p=>({p,price:getProductPrice(p)}))
    .filter(x=>x.price>0&&candidateCompatible(x.p,build));
  if(!list.length)return null;
  return list.map(x=>({...x,score:priceFit(x.price,target)+pref(x.p)+freshness(x.p)}))
    .sort((a,b)=>b.score-a.score)[0].p;
}

function candidateCompatible(product,build){
  const r=getCompatibility(product,build), relevant=d=>d&&(d.category===product.type||d.alternateCategory===product.type);
  return !(r.issues||[]).some(relevant);
}
function priceFit(price,target){if(!price||!target)return 0;const r=price/target;return r<=1?120-Math.abs(1-r)*65:120-(r-1)*125}
function freshness(p){const o=getBestOffer(p);return o?({fresh:12,aging:6,unknown:0,stale:-18}[o.freshness]??0):-50}

function cpuScore(p,profile){const s=p.specs||{},c=Number(s.cores||0),t=Number(s.threads||0);let v=c*3+t;if(["creator","workstation","streaming"].includes(profile.useCase))v+=c*4;if(profile.priority==="quiet")v-=Number(p.powerWatts||0)*.03;return v}
function boardScore(p,profile){const s=p.specs||{};let v=0;if(s.m2Slots>=2)v+=8;if(s.maxMemoryGB>=64)v+=5;if(profile.priority==="value"&&/^B/i.test(s.chipset||""))v+=8;return v}
function memoryScore(p,profile){const s=p.specs||{},cap=Number(s.capacityGB||0),mods=Number(s.modules||0),target=["creator","workstation"].includes(profile.useCase)?32:16;let v=60-Math.abs(cap-target)*2;if(mods===2)v+=18;if(mods===1)v-=12;return v}
function gpuScore(p,profile){const s=p.specs||{},vram=Number(s.vramGB||0);let min=profile.target==="4k"?12:profile.target==="1440p"?10:8;let v=vram*5+(vram>=min?28:-(min-vram)*12);if(profile.priority==="performance")v+=getProductPrice(p)/1000;if(profile.priority==="quiet")v-=Number(p.powerWatts||0)*.025;return v}
function caseScore(p){const s=p.specs||{};return ((s.maxGpuLengthMm||0)>=340?6:0)+((s.maxCpuCoolerHeightMm||0)>=160?4:0)+((s.radiatorSupportMm||[]).includes(360)?4:0)}
function coolerScore(p,cpu,profile){const s=p.specs||{},cpuP=Number(cpu?.powerWatts||0),cap=Number(s.recommendedCpuPowerWatts||p.compatibility?.recommendedCpuPowerWatts||0);let v=cap>=cpuP*1.35?18:0;if(profile.priority==="quiet"&&s.coolerType==="air")v+=5;if(cpuP>=140&&s.coolerType==="aio")v+=10;return v}

function choosePsu(catalogue,build,target,power,profile){
  const need=Number(power.preferred||power.minimum||0);
  const list=getProductsByCategory(catalogue,"psu").map(p=>({p,price:getProductPrice(p),w:Number(p.specs?.wattage||0)}))
    .filter(x=>x.price>0&&x.w>=need&&candidateCompatible(x.p,build));
  if(!list.length)return null;
  return list.map(x=>{let s=priceFit(x.price,target)-Math.max(0,x.w-need)*.035;const e=String(x.p.specs?.efficiency||"");if(/gold/i.test(e))s+=8;if(/platinum|titanium/i.test(e))s+=12;if(profile.priority==="quiet"&&x.w>=need*1.12)s+=8;return{...x,s}}).sort((a,b)=>b.s-a.s)[0].p;
}

function chooseStorage(catalogue,build,target,profile){
  const desired=Number(profile.storageNeed||(["creator","workstation"].includes(profile.useCase)?2000:1000));
  const list=getProductsByCategory(catalogue,"storage").map(p=>({p,price:getProductPrice(p)})).filter(x=>x.price>0&&candidateCompatible(x.p,build));
  if(!list.length)return null;
  return list.map(x=>{const s=x.p.specs||{},cap=Number(s.capacityGB||0);let v=priceFit(x.price,target)-Math.abs(cap-desired)/70;if((s.interface||x.p.compatibility?.interface)==="NVMe")v+=18;if((s.pcieGeneration||0)>=4)v+=5;return{...x,v}}).sort((a,b)=>b.v-a.v)[0].p;
}
function fmt(n){return Number(n||0).toLocaleString("en-ZA",{maximumFractionDigits:0})}
