// Planning floors, not a certification of exact card/cable compatibility.
// Sources reviewed 2026-10-22:
// https://www.asus.com/support/faq/1055181/
// https://www.nvidia.com/en-gb/geforce/graphics-cards/compare/
const families=[
 [/RTX\s*5080\b/i,[850,850,850,1000]],
 [/RTX\s*5070\s*Ti\b/i,[750,750,850,850]],
 [/RTX\s*5070\b/i,[650,750,750,850]],
 [/RTX\s*5060\s*Ti\b/i,[600,600,650,750]],
 [/RTX\s*5060\b/i,[550,550,650,650]],
 [/RTX\s*5050\b/i,[550,550,550,650]],
 [/RTX\s*3070\s*Ti\b/i,[750,750,850,850]],
 [/RTX\s*3060\s*Ti\b/i,[600,650,750,750]],
 [/RTX\s*3050\b/i,[550,550,550,550]],
 [/RX\s*9070\s*XT\b/i,[750,750,850,850]],
 [/RX\s*9060\s*XT\b/i,[550,550,650,750]],
 [/RX\s*7600\b/i,[550,550,650,750]]
];
export function psuPlanningTarget(build){
 if(!build.gpu)return 0;
 const cpu=build.cpu?.name||'';
 const tier=/Ultra\s*9|Threadripper/i.test(cpu)?3:/Ultra\s*7|Core\s*i9|Ryzen\s*9/i.test(cpu)?2:/Ultra\s*5|Core\s*i7|Ryzen\s*7/i.test(cpu)?1:/Core\s*i[35]|Ryzen\s*[35]/i.test(cpu)?0:3;
 const row=families.find(([pattern])=>pattern.test(build.gpu.name));
 return Math.max(Number(build.gpu.specs?.recommendedPsuWatts||0),row?.[1][tier]||0);
}
