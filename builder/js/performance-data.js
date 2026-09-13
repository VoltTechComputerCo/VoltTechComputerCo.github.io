/*
 * VoltTech PC Builder — prototype component intelligence layer v1.1
 *
 * These are normalized INTERNAL RELATIVE RATINGS for the current temporary
 * test catalogue. They are not advertised benchmark results and are not a
 * substitute for maintained benchmark/source data.
 *
 * 100 is roughly the top mainstream reference point in the current test set.
 * Some halo parts can exceed 100. The architecture is intentionally separate
 * from supplier price/stock data so this file can later be generated from a
 * researched benchmark pipeline without changing the recommendation engine.
 */

const CPU = {
  "vt-cpu-amd-5500":     {gaming:48, productivity:42, efficiency:78, platform:45},
  "vt-cpu-amd-5600":     {gaming:57, productivity:48, efficiency:82, platform:46},
  "vt-cpu-amd-5700x":    {gaming:62, productivity:60, efficiency:86, platform:47},
  "vt-cpu-amd-5700x3d":  {gaming:78, productivity:58, efficiency:82, platform:48},
  "vt-cpu-amd-7600":     {gaming:72, productivity:58, efficiency:91, platform:88},
  "vt-cpu-amd-7700":     {gaming:75, productivity:70, efficiency:93, platform:88},
  "vt-cpu-amd-7800x3d":  {gaming:92, productivity:67, efficiency:88, platform:90},
  "vt-cpu-amd-9600x":    {gaming:80, productivity:64, efficiency:92, platform:94},
  "vt-cpu-amd-9700x":    {gaming:84, productivity:78, efficiency:94, platform:94},
  "vt-cpu-amd-9800x3d":  {gaming:100,productivity:76, efficiency:90, platform:95},
  "vt-cpu-intel-14400f": {gaming:65, productivity:61, efficiency:72, platform:48},
  "vt-cpu-intel-14600k": {gaming:77, productivity:77, efficiency:63, platform:50},
  "vt-cpu-intel-14700k": {gaming:81, productivity:91, efficiency:48, platform:50},
  "vt-cpu-intel-245k":   {gaming:77, productivity:80, efficiency:78, platform:84},
  "vt-cpu-intel-265k":   {gaming:82, productivity:93, efficiency:71, platform:85},
  "vt-cpu-intel-285k":   {gaming:84, productivity:100,efficiency:67, platform:85}
};

const GPU = {
  "vt-gpu-asus-rx7600-dual":               {raster:39, creator:34, efficiency:72, rt:28},
  "vt-gpu-gigabyte-rx7700xt-gaming-oc":    {raster:57, creator:48, efficiency:68, rt:42},
  "vt-gpu-sapphire-rx7800xt-pulse":         {raster:65, creator:54, efficiency:70, rt:48},
  "vt-gpu-sapphire-rx9070-pulse":           {raster:79, creator:68, efficiency:84, rt:70},
  "vt-gpu-sapphire-rx9070xt-pulse":         {raster:88, creator:76, efficiency:76, rt:78},
  "vt-gpu-gigabyte-rtx4060-windforce":      {raster:36, creator:48, efficiency:96, rt:46},
  "vt-gpu-msi-rtx4060ti-ventus-2x":         {raster:46, creator:58, efficiency:88, rt:57},
  "vt-gpu-gigabyte-rtx5060-windforce":      {raster:45, creator:58, efficiency:92, rt:58},
  "vt-gpu-gigabyte-rtx5060ti-16":           {raster:60, creator:74, efficiency:90, rt:72},
  "vt-gpu-msi-rtx5070-ventus":              {raster:71, creator:86, efficiency:82, rt:84},
  "vt-gpu-asus-rtx5070-prime":              {raster:71, creator:86, efficiency:82, rt:84},
  "vt-gpu-gigabyte-rtx5070ti-gaming":       {raster:84, creator:99, efficiency:78, rt:96},
  "vt-gpu-msi-rtx5080-ventus":              {raster:100,creator:116,efficiency:72, rt:112},
  "vt-gpu-asus-rtx5080-tuf":                {raster:100,creator:116,efficiency:72, rt:112},
  "vt-gpu-gigabyte-rtx5090-gaming":         {raster:130,creator:150,efficiency:52, rt:145},
  "vt-gpu-asus-rtx5090-tuf":                {raster:130,creator:150,efficiency:52, rt:145},
  "vt-gpu-intel-arc-b580-limited":           {raster:48, creator:52, efficiency:75, rt:48},
  "vt-gpu-asrock-arc-b580-steel-legend":     {raster:48, creator:52, efficiency:72, rt:48}
};

const fallbackCpu = p => {
  const s=p?.specs||{}, cores=Number(s.cores||0), threads=Number(s.threads||0);
  const power=Math.max(45,Number(p?.powerWatts||s.tdpWatts||90));
  return {
    gaming: Math.min(82, 34+cores*3+threads*.7),
    productivity: Math.min(100, 25+cores*3.2+threads*1.5),
    efficiency: Math.max(35, Math.min(95, 108-power*.25)),
    platform: /AM5/i.test(s.socket||"")?88:/LGA1851/i.test(s.socket||"")?82:50
  };
};

const fallbackGpu = p => {
  const s=p?.specs||{}, vram=Number(s.vramGB||0), power=Math.max(75,Number(p?.powerWatts||s.boardPowerWatts||180));
  const raster=Math.min(105,30+vram*3.1);
  return {
    raster,
    creator:raster*.95,
    efficiency:Math.max(40,Math.min(95,105-power*.12)),
    rt:raster*.78
  };
};

export function cpuIntelligence(product){
  return CPU[product?.id] || fallbackCpu(product);
}

export function gpuIntelligence(product){
  return GPU[product?.id] || fallbackGpu(product);
}

export function cpuWorkloadScore(product,profile={}){
  const d=cpuIntelligence(product);
  const use=profile.useCase||"gaming";
  let score;
  if(use==="creator"||use==="workstation") score=d.productivity*.72+d.gaming*.08+d.platform*.12+d.efficiency*.08;
  else if(use==="streaming") score=d.gaming*.48+d.productivity*.34+d.platform*.10+d.efficiency*.08;
  else if(use==="office") score=d.productivity*.35+d.efficiency*.30+d.platform*.25+d.gaming*.10;
  else score=d.gaming*.72+d.productivity*.08+d.platform*.12+d.efficiency*.08;
  if(profile.priority==="quiet") score=score*.84+d.efficiency*.16;
  if(profile.priority==="performance") score*=1.04;
  return score;
}

export function gpuWorkloadScore(product,profile={}){
  const d=gpuIntelligence(product);
  const use=profile.useCase||"gaming";
  let score;
  if(use==="creator"||use==="workstation") score=d.creator*.65+d.raster*.18+d.rt*.12+d.efficiency*.05;
  else if(use==="streaming") score=d.raster*.48+d.creator*.30+d.rt*.15+d.efficiency*.07;
  else score=d.raster*.72+d.rt*.18+d.efficiency*.10;
  if(profile.priority==="quiet") score=score*.84+d.efficiency*.16;
  if(profile.priority==="performance") score*=1.04;
  return score;
}

export function valueIndex(product,profile={}){
  const price=Number(product?.bestOffer?.price || product?.price || 0);
  if(!price) return 0;
  const perf=product?.type==="cpu"?cpuWorkloadScore(product,profile):
             product?.type==="gpu"?gpuWorkloadScore(product,profile):0;
  return perf ? (perf/price)*1000 : 0;
}

export const INTELLIGENCE_META = Object.freeze({
  version:"1.1",
  mode:"prototype-normalized-relative-ratings",
  cpuRecords:Object.keys(CPU).length,
  gpuRecords:Object.keys(GPU).length
});
