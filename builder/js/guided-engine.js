import {
  createEmptyBuild, selectProduct, getProductsByCategory, getProductPrice,
  calculateBuildTotal, getBestOffer, getSelections
} from "./build-engine.js?v=0.7.7";
import {
  getCompatibility, validateBuild, estimatePower
} from "./compatibility-engine.js?v=0.7.8.1";
import {
  cpuIntelligence, gpuIntelligence, cpuWorkloadScore, gpuWorkloadScore,
  INTELLIGENCE_META
} from "./performance-data.js?v=1.1";

const LABELS={
  gaming:"Gaming",streaming:"Gaming + Streaming",creator:"Content Creation",
  workstation:"Workstation / Professional",office:"Office / Home",
  "1080p":"1080p","1440p":"1440p","4k":"4K",unsure:"Not sure yet",
  value:"Best value",balanced:"Balanced",performance:"Maximum performance",quiet:"Quiet / efficient"
};

export function profileLabel(v){return LABELS[v]||v||""}

export function buildGuidedRecommendation(profile,catalogue,currency="ZAR"){
  const budget=parseBudget(profile.budget), plan=getPlan(profile,budget);
  let build=createEmptyBuild();
  const reasons={}, optimizer={applied:[], evaluated:0, intelligenceVersion:INTELLIGENCE_META.version};

  const cpu=choose(catalogue,"cpu",build,plan.cpu,p=>cpuScore(p,profile));
  if(!cpu)return fail("No priced CPU was available for this profile.");
  build=selectProduct(build,cpu);
  reasons.cpu=cpuReason(cpu,profile);

  const board=choose(catalogue,"motherboard",build,plan.motherboard,p=>boardScore(p,profile,cpu));
  if(!board)return fail("No compatible motherboard was found.");
  build=selectProduct(build,board);
  reasons.motherboard=boardReason(board,cpu,profile);

  const memory=choose(catalogue,"memory",build,plan.memory,p=>memoryScore(p,profile));
  if(!memory)return fail("No compatible matched memory kit was found.");
  build=selectProduct(build,memory);
  reasons.memory=`${memory.specs?.capacityGB||"?"}GB matched retail kit. Guided builds never mix separate RAM kits.`;

  if(profile.useCase!=="office"){
    const gpu=choose(catalogue,"gpu",build,plan.gpu,p=>gpuScore(p,profile));
    if(!gpu)return fail("No compatible graphics card was found.");
    build=selectProduct(build,gpu);
    reasons.gpu=gpuReason(gpu,profile);
  }

  // v1.1 core optimizer: use remaining budget where it produces the largest
  // normalized workload-performance gain per rand without breaking compatibility.
  const optimized=optimizeCore(catalogue,build,profile,budget,plan,optimizer);
  build=optimized.build;
  Object.assign(reasons, optimized.reasons);

  const pcCase=choose(catalogue,"case",build,plan.case,p=>caseScore(p,profile));
  if(!pcCase)return fail("No compatible case was found.");
  build=selectProduct(build,pcCase);
  reasons.case="Chosen to physically fit the selected motherboard, graphics card and cooling setup.";

  const selectedCpu=getSelections(build,"cpu")[0];
  const cooler=choose(catalogue,"cooler",build,plan.cooler,p=>coolerScore(p,selectedCpu,profile));
  if(!cooler)return fail("No compatible CPU cooler was found.");
  build=selectProduct(build,cooler);
  reasons.cooler="Sized for the selected CPU while remaining compatible with the case.";

  const prePsu=estimatePower({...build,psu:null});
  const psu=choosePsu(catalogue,build,plan.psu,prePsu,profile);
  if(!psu)return fail("No compatible PSU met the calculated power target.");
  build=selectProduct(build,psu);
  reasons.psu=`Chosen after the main hardware: about ${prePsu.estimated} W estimated load and ${prePsu.preferred} W preferred headroom.`;

  const storage=chooseStorage(catalogue,build,plan.storage,profile);
  if(!storage)return fail("No compatible storage option was found.");
  build=selectProduct(build,storage);
  reasons.storage="A fast starting drive sized around your selected storage requirement. You can add more drives afterwards.";
  reasons.fans="Optional. The guided build does not force extra case fans unless you choose to add them.";

  // Conservative final rebalance: if temporary pricing pushed the build past
  // the selected ceiling, reclaim money from low-performance-impact categories.
  const rebalanced=rebalanceIfOverBudget(catalogue,build,profile,budget,optimizer);
  build=rebalanced.build;
  Object.assign(reasons,rebalanced.reasons);

  const report=validateBuild(build), power=estimatePower(build), total=calculateBuildTotal(build);
  const confidence=(report.issues||[]).length?"conflict":(report.unknowns||[]).length?"needs-data":(report.warnings||[]).length?"review":"confirmed";
  const budgetState=total>budget.max?"over":total<budget.min*.82?"under":"within";
  const notes=[];

  if(optimizer.applied.length){
    notes.push(`Build optimizer made ${optimizer.applied.length} value/performance adjustment${optimizer.applied.length===1?"":"s"} while keeping compatibility checks active.`);
  }else{
    notes.push("The optimizer found no clearly better compatible swap inside the current budget and test catalogue.");
  }
  if(budgetState==="over")notes.push("Temporary catalogue pricing could not fit this profile fully inside the selected budget.");
  if(budgetState==="under")notes.push("The preview came in well below budget, leaving room for later upgrades.");
  if((report.unknowns||[]).length)notes.push("Some compatibility details still depend on incomplete temporary product data.");
  if((report.warnings||[]).length)notes.push("Review the attention items before treating this as a final quotation.");

  const intelligence=buildIntelligenceSummary(build,profile,optimizer);

  return {
    ok:true,build,reasons,profile,budget,plan,report,power,total,currency,
    budgetState,confidence,notes,optimizer,intelligence
  };
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
  const mult=profile.priority==="value"?.88:profile.priority==="performance"?1.08:1;
  const target=Math.min(budget.max*.94,budget.target*mult), plan={};
  for(const[k,v]of Object.entries(shares))plan[k]=Math.round(target*v);

  if(profile.target==="4k"){plan.gpu=Math.round(plan.gpu*1.18);plan.cpu=Math.round(plan.cpu*.92)}
  if(profile.target==="1080p"){plan.gpu=Math.round(plan.gpu*.90);plan.cpu=Math.round(plan.cpu*1.05)}

  const fps=Number(profile.fpsTarget||120);
  if(fps>=240){plan.cpu=Math.round(plan.cpu*1.16);plan.gpu=Math.round(plan.gpu*1.08)}
  else if(fps>=144){plan.cpu=Math.round(plan.cpu*1.08);plan.gpu=Math.round(plan.gpu*1.04)}
  else if(fps<=60){plan.cpu=Math.round(plan.cpu*.94);plan.gpu=Math.round(plan.gpu*.96)}
  return plan;
}

function choose(catalogue,type,build,target,pref=()=>0){
  const list=getProductsByCategory(catalogue,type)
    .map(p=>({p,price:getProductPrice(p)}))
    .filter(x=>x.price>0&&candidateCompatible(x.p,withoutCategory(build,type)));

  if(!list.length)return null;

  return list.map(x=>({
      ...x,
      score:priceFit(x.price,target)+pref(x.p)+freshness(x.p)
    }))
    .sort((a,b)=>b.score-a.score)[0].p;
}

function candidateCompatible(product,build){
  const r=getCompatibility(product,build);
  const relevant=d=>d&&(d.category===product.type||d.alternateCategory===product.type);
  return !(r.issues||[]).some(relevant);
}

function withoutCategory(build,type){
  const next={...build};
  next[type]=Array.isArray(build?.[type])?[]:null;
  return next;
}

function priceFit(price,target){
  if(!price||!target)return 0;
  const r=price/target;
  return r<=1?120-Math.abs(1-r)*65:120-(r-1)*125;
}

function freshness(p){
  const o=getBestOffer(p);
  return o?({fresh:12,aging:6,unknown:0,stale:-18}[o.freshness]??0):-50;
}

function cpuScore(p,profile){
  const s=p.specs||{}, intelligence=cpuWorkloadScore(p,profile);
  let v=intelligence*1.35;
  if(profile.useCase==="office")v+=s.integratedGraphics?55:-180;
  if(Number(profile.fpsTarget||120)>=240&&profile.useCase==="gaming")v+=cpuIntelligence(p).gaming*.20;
  if(profile.priority==="value")v+=valueScore(intelligence,getProductPrice(p),900);
  return v;
}

function gpuScore(p,profile){
  const s=p.specs||{}, intelligence=gpuWorkloadScore(p,profile);
  const vram=Number(s.vramGB||0);
  let min=profile.target==="4k"?12:profile.target==="1440p"?10:8;
  if(["creator","workstation"].includes(profile.useCase))min=Math.max(min,12);

  let v=intelligence*1.55+(vram>=min?28:-(min-vram)*16);
  if(profile.priority==="value")v+=valueScore(intelligence,getProductPrice(p),1200);
  if(profile.priority==="quiet")v+=gpuIntelligence(p).efficiency*.18;
  return v;
}

function boardScore(p,profile,cpu){
  const s=p.specs||{}, socket=cpu?.specs?.socket||cpu?.compatibility?.socket||"";
  let v=0;
  if(Number(s.m2Slots||0)>=2)v+=10;
  if(Number(s.maxMemoryGB||0)>=64)v+=6;
  if(profile.priority==="value"&&/^B/i.test(s.chipset||""))v+=12;
  if(/AM5/i.test(socket))v+=profile.priority==="performance"?10:6;
  if(/LGA1851/i.test(socket))v+=4;
  return v;
}

function memoryScore(p,profile){
  const s=p.specs||{},cap=Number(s.capacityGB||0),mods=Number(s.modules||0);
  let target=["creator","workstation"].includes(profile.useCase)?32:16;
  if(profile.useCase==="streaming")target=32;
  if(profile.budget==="40000-60000"||profile.budget==="60000+")target=Math.max(target,32);
  if(profile.useCase==="workstation"&&profile.budget==="60000+")target=64;

  let v=80-Math.abs(cap-target)*2.5;
  if(cap===target)v+=30;
  if(mods===2)v+=20;
  if(mods===4&&target>=64)v+=8;
  if(mods===1)v-=20;
  return v;
}

function caseScore(p,profile){
  const s=p.specs||{};
  let v=((s.maxGpuLengthMm||0)>=340?7:0)+((s.maxCpuCoolerHeightMm||0)>=160?5:0)+((s.radiatorSupportMm||[]).includes(360)?5:0);
  if(profile.priority==="value")v-=getProductPrice(p)/5000;
  return v;
}

function coolerScore(p,cpu,profile){
  const s=p.specs||{},cpuP=Number(cpu?.powerWatts||0),cap=Number(s.recommendedCpuPowerWatts||p.compatibility?.recommendedCpuPowerWatts||0);
  let v=cap>=cpuP*1.35?20:0;
  if(profile.priority==="quiet"&&s.coolerType==="air")v+=7;
  if(cpuP>=140&&s.coolerType==="aio")v+=11;
  return v;
}

function valueScore(perf,price,scale=1000){
  if(!perf||!price)return 0;
  return Math.min(45,(perf/price)*scale);
}

function cpuReason(cpu,profile){
  const d=cpuIntelligence(cpu);
  if(["creator","workstation"].includes(profile.useCase))
    return `Selected for stronger multi-core workload performance (${Math.round(d.productivity)}/100 internal relative rating) without ignoring platform value.`;
  if(profile.useCase==="streaming")
    return `Balances gaming and threaded performance for a gaming + streaming workload.`;
  if(profile.useCase==="office")
    return `Efficient general-use CPU${cpu.specs?.integratedGraphics?" with integrated graphics, so a discrete GPU is not automatically required":""}.`;
  return `Gaming performance is weighted more heavily than raw core count for this profile.`;
}

function gpuReason(gpu,profile){
  const d=gpuIntelligence(gpu);
  const focus=["creator","workstation"].includes(profile.useCase)?"creator/workstation":"gaming";
  return `Chosen using ${focus} performance, VRAM, efficiency, ${profileLabel(profile.target)} target and ${profile.fpsTarget||"120"}+ FPS preference — not price alone.`;
}

function boardReason(board,cpu,profile){
  const socket=cpu?.specs?.socket||cpu?.compatibility?.socket||"CPU";
  const future=/AM5|LGA1851/i.test(socket)?" The platform also receives an upgrade-path preference in the prototype scoring.":"";
  return `Matched to the ${socket} platform with useful expansion rather than spending motherboard budget purely for prestige.${future}`;
}

function optimizeCore(catalogue,initial,profile,budget,plan,optimizer){
  let build=initial;
  const reasons={};
  if(profile.useCase==="office")return{build,reasons};

  // Keep a realistic reserve for case/cooling/PSU/storage before spending spare
  // budget on CPU/GPU upgrades.
  const reserve=(plan.case||0)+(plan.cooler||0)+(plan.psu||0)+(plan.storage||0);
  const ceiling=Math.max(0,budget.max*.96-reserve);
  const order=["creator","workstation"].includes(profile.useCase)?["cpu","gpu"]:["gpu","cpu"];

  for(let pass=0;pass<3;pass++){
    const currentCore=coreCost(build);
    const spare=Math.max(0,ceiling-currentCore);
    if(spare<250)break;

    let best=null;
    for(const type of order){
      const current=getSelections(build,type)[0];
      if(!current)continue;
      const currentPrice=getProductPrice(current)||0;
      const currentPerf=type==="cpu"?cpuWorkloadScore(current,profile):gpuWorkloadScore(current,profile);

      for(const candidate of getProductsByCategory(catalogue,type)){
        optimizer.evaluated++;
        if(candidate.id===current.id)continue;
        const price=getProductPrice(candidate)||0;
        const extra=price-currentPrice;
        if(extra<=0||extra>spare)continue;
        if(!candidateCompatible(candidate,withoutCategory(build,type)))continue;

        const perf=type==="cpu"?cpuWorkloadScore(candidate,profile):gpuWorkloadScore(candidate,profile);
        const gain=perf-currentPerf;
        if(gain<3)continue;

        const gainPerRand=gain/extra;
        const score=gainPerRand*10000 + gain*(profile.priority==="performance"?1.15:1);
        if(!best||score>best.score)best={type,candidate,old:current,extra,gain,score};
      }
    }

    if(!best)break;
    build=selectProduct(build,best.candidate);
    optimizer.applied.push({
      kind:"upgrade",category:best.type,from:best.old.name,to:best.candidate.name,
      costDelta:Math.round(best.extra),performanceGain:Number(best.gain.toFixed(1))
    });
    reasons[best.type]=best.type==="gpu"?gpuReason(best.candidate,profile):cpuReason(best.candidate,profile);
  }

  return{build,reasons};
}

function coreCost(build){
  return ["cpu","motherboard","memory","gpu"].reduce((sum,type)=>{
    return sum+getSelections(build,type).reduce((n,p)=>n+(getProductPrice(p)||0),0);
  },0);
}

function rebalanceIfOverBudget(catalogue,initial,profile,budget,optimizer){
  let build=initial;
  const reasons={};
  let total=calculateBuildTotal(build);
  if(total<=budget.max)return{build,reasons};

  // Save money first where the performance impact is usually smallest.
  const order=["motherboard","case","cooler","storage","memory"];
  for(const type of order){
    if(total<=budget.max)break;
    const current=getSelections(build,type)[0];
    if(!current)continue;
    const currentPrice=getProductPrice(current)||0;

    const cheaper=getProductsByCategory(catalogue,type)
      .map(p=>({p,price:getProductPrice(p)}))
      .filter(x=>x.price>0&&x.price<currentPrice&&candidateCompatible(x.p,withoutCategory(build,type)))
      .sort((a,b)=>b.price-a.price);

    // Prefer the smallest downgrade that is enough to close the gap.
    const gap=total-budget.max;
    let choice=cheaper.find(x=>currentPrice-x.price>=gap) || cheaper[0];
    if(!choice)continue;

    build=selectProduct(build,choice.p);
    const saving=currentPrice-choice.price;
    total-=saving;
    optimizer.applied.push({
      kind:"rebalance",category:type,from:current.name,to:choice.p.name,costDelta:-Math.round(saving)
    });

    if(type==="memory")reasons.memory=`Rebalanced to a lower-cost compatible matched kit to protect the overall budget. Separate RAM kits are still never mixed.`;
    else if(type==="storage")reasons.storage=`Rebalanced to a less expensive compatible starting drive so more of the budget remains with performance-critical hardware.`;
    else reasons[type]=`Rebalanced to a lower-cost compatible option because this change has less performance impact than cutting CPU or GPU performance.`;
  }

  return{build,reasons};
}

function choosePsu(catalogue,build,target,power,profile){
  const need=Number(power.preferred||power.minimum||0);
  const list=getProductsByCategory(catalogue,"psu")
    .map(p=>({p,price:getProductPrice(p),w:Number(p.specs?.wattage||0)}))
    .filter(x=>x.price>0&&x.w>=need&&candidateCompatible(x.p,withoutCategory(build,"psu")));
  if(!list.length)return null;

  return list.map(x=>{
    let s=priceFit(x.price,target)-Math.max(0,x.w-need)*.035;
    const e=String(x.p.specs?.efficiency||"");
    if(/gold/i.test(e))s+=8;
    if(/platinum|titanium/i.test(e))s+=12;
    if(profile.priority==="quiet"&&x.w>=need*1.12)s+=8;
    return{...x,s};
  }).sort((a,b)=>b.s-a.s)[0].p;
}

function chooseStorage(catalogue,build,target,profile){
  const desired=Number(profile.storageNeed||(["creator","workstation"].includes(profile.useCase)?2000:1000));
  const list=getProductsByCategory(catalogue,"storage")
    .map(p=>({p,price:getProductPrice(p)}))
    .filter(x=>x.price>0&&candidateCompatible(x.p,build));
  if(!list.length)return null;

  return list.map(x=>{
    const s=x.p.specs||{},cap=Number(s.capacityGB||0);
    let v=priceFit(x.price,target)-Math.abs(cap-desired)/70;
    if((s.interface||x.p.compatibility?.interface)==="NVMe")v+=18;
    if((s.pcieGeneration||0)>=4)v+=6;
    return{...x,v};
  }).sort((a,b)=>b.v-a.v)[0].p;
}

function buildIntelligenceSummary(build,profile,optimizer){
  const cpu=getSelections(build,"cpu")[0], gpu=getSelections(build,"gpu")[0];
  const cpuScore=cpu?cpuWorkloadScore(cpu,profile):null;
  const gpuScore=gpu?gpuWorkloadScore(gpu,profile):null;
  return {
    mode:INTELLIGENCE_META.mode,
    cpuRelative:cpuScore?Math.round(cpuScore):null,
    gpuRelative:gpuScore?Math.round(gpuScore):null,
    evaluated:optimizer.evaluated,
    adjustments:optimizer.applied.length,
    disclaimer:"Internal prototype-relative ratings, not published benchmark claims."
  };
}

function fmt(n){return Number(n||0).toLocaleString("en-ZA",{maximumFractionDigits:0})}
