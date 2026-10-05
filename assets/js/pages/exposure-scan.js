(function(){
"use strict";

const $=id=>document.getElementById(id);
const scanButton=$("scanButton");
const scanShell=$("scanShell");
const terminal=$("terminal");
const progressBar=$("progressBar");
const results=$("results");
const fpCode=$("fingerprintCode");
const report={};
let signalCount=0;
let permissionCount=0;

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function valueOr(v,fallback="Not exposed by this browser"){
  return (v===undefined||v===null||v==="")?fallback:String(v);
}
function yesNo(v){return v?"Yes":"No";}
function safeTest(fn){
  try{return fn();}catch(e){return undefined;}
}
function statusClass(status){
  if(status==="good") return "value-good";
  if(status==="warn") return "value-warn";
  if(status==="danger") return "value-danger";
  if(status==="teal") return "value-teal";
  return "";
}
function row(target,label,value,note="",status=""){
  const box=document.createElement("div");
  box.className="result-row";
  const s=document.createElement("small");s.textContent=label;
  const strong=document.createElement("strong");strong.textContent=valueOr(value);strong.className=statusClass(status);
  box.append(s,strong);
  if(note){const em=document.createElement("em");em.textContent=note;box.append(em);}
  target.appendChild(box);
  if(value!==undefined&&value!==null&&value!==""&&value!=="Not exposed by this browser")signalCount++;
}
function term(text,cls=""){
  const d=document.createElement("div");d.className="terminal-line "+cls;d.textContent=text;terminal.appendChild(d);terminal.scrollTop=terminal.scrollHeight;
}
function browserOS(){
  const ua=navigator.userAgent||"";
  let browser="Unknown / reduced user agent";
  if(/Edg\//.test(ua)) browser="Microsoft Edge";
  else if(/OPR\//.test(ua)) browser="Opera";
  else if(/SamsungBrowser\//.test(ua)) browser="Samsung Internet";
  else if(/Chrome\//.test(ua)&&!/Chromium/.test(ua)) browser="Chrome / Chromium-family";
  else if(/Firefox\//.test(ua)) browser="Firefox";
  else if(/Safari\//.test(ua)&&!/Chrome\//.test(ua)) browser="Safari";
  let os="Unknown / reduced user agent";
  if(/Windows NT/.test(ua)) os="Windows";
  else if(/Android/.test(ua)) os="Android";
  else if(/iPhone|iPad|iPod/.test(ua)) os="iOS / iPadOS";
  else if(/Mac OS X/.test(ua)) os="macOS";
  else if(/Linux/.test(ua)) os="Linux";
  return {browser,os};
}
function storageAvailable(type){
  try{
    const s=window[type],x="__vt_exposure_test__";
    s.setItem(x,x);s.removeItem(x);return true;
  }catch(e){return false;}
}
function getWebGL(){
  const canvas=document.createElement("canvas");
  const gl=canvas.getContext("webgl2")||canvas.getContext("webgl")||canvas.getContext("experimental-webgl");
  if(!gl)return {supported:false};
  let vendor=gl.getParameter(gl.VENDOR),renderer=gl.getParameter(gl.RENDERER);
  const ext=gl.getExtension("WEBGL_debug_renderer_info");
  if(ext){
    vendor=gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)||vendor;
    renderer=gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)||renderer;
  }
  return {
    supported:true,
    version:valueOr(gl.getParameter(gl.VERSION)),
    vendor:valueOr(vendor),
    renderer:valueOr(renderer),
    webgl2:!!canvas.getContext("webgl2")
  };
}
async function getCanvasToken(){
  const c=$("fpCanvas"),ctx=c.getContext("2d");
  if(!ctx)return "CANVAS_UNAVAILABLE";
  ctx.clearRect(0,0,c.width,c.height);
  const g=ctx.createLinearGradient(0,0,c.width,0);
  g.addColorStop(0,"#2fe6c8");g.addColorStop(1,"#c184ff");
  ctx.fillStyle="#05080a";ctx.fillRect(0,0,c.width,c.height);
  ctx.font="16px sans-serif";ctx.fillStyle=g;ctx.fillText("VoltTech Exposure Scan ⚡ AaZz 0123456789",8,28);
  ctx.font="11px monospace";ctx.fillStyle="#eaf5f2";ctx.fillText("browser-rendering-surface",8,52);
  return c.toDataURL();
}
function simpleHash(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  return ("00000000"+(h>>>0).toString(16)).slice(-8).toUpperCase();
}
async function digest(str){
  if(window.crypto&&crypto.subtle&&window.TextEncoder){
    const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
  }
  return simpleHash(str)+simpleHash(str.split("").reverse().join(""));
}
async function permissionState(name){
  if(!navigator.permissions||!navigator.permissions.query)return undefined;
  try{
    const p=await navigator.permissions.query({name});
    permissionCount++;
    return p.state;
  }catch(e){return undefined;}
}
function permissionStatus(v){
  if(v==="granted")return "warn";
  if(v==="denied")return "good";
  if(v==="prompt")return "teal";
  return "";
}
async function collect(){
  signalCount=0;permissionCount=0;
  ["deviceResults","hardwareResults","displayResults","contextResults","permissionResults"].forEach(id=>$(id).textContent="");
  const device=$("deviceResults"),hardware=$("hardwareResults"),display=$("displayResults"),context=$("contextResults"),permissions=$("permissionResults");
  const parsed=browserOS();

  let uaHigh={};
  if(navigator.userAgentData){
    report.uaBrands=(navigator.userAgentData.brands||[]).map(x=>x.brand+" "+x.version).join(", ");
    report.uaMobile=navigator.userAgentData.mobile;
    report.uaPlatform=navigator.userAgentData.platform;
    try{
      uaHigh=await navigator.userAgentData.getHighEntropyValues(["architecture","bitness","model","platformVersion","fullVersionList","wow64"]);
    }catch(e){}
  }
  report.browser=parsed.browser;
  report.os=uaHigh.platform||report.uaPlatform||parsed.os;
  report.ua=navigator.userAgent;
  report.languages=(navigator.languages||[navigator.language]).filter(Boolean).join(", ");
  report.platform=navigator.platform;
  report.mobile=(navigator.userAgentData&&typeof navigator.userAgentData.mobile==="boolean")?navigator.userAgentData.mobile:/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  report.model=uaHigh.model||undefined;
  report.architecture=uaHigh.architecture||undefined;
  report.bitness=uaHigh.bitness||undefined;
  report.platformVersion=uaHigh.platformVersion||undefined;

  row(device,"Browser family",report.browser,"Best-effort interpretation of browser-reported data.");
  row(device,"Operating system",report.os,"May be reduced or generalised by the browser.");
  row(device,"Mobile-class device",yesNo(report.mobile));
  row(device,"Device model hint",report.model,"Only exposed by some Chromium-family browsers.");
  row(device,"CPU architecture hint",report.architecture?report.architecture+(report.bitness?" · "+report.bitness+"-bit":""):undefined,"High-entropy client hint when available.");
  row(device,"Platform version hint",report.platformVersion,"May be deliberately reduced.");
  row(device,"Browser brands",report.uaBrands,"Client Hints brand list when available.");
  row(device,"User-Agent string",report.ua,"Browsers increasingly reduce this string to limit fingerprinting.");

  report.threads=navigator.hardwareConcurrency;
  report.memory=navigator.deviceMemory;
  const gl=getWebGL();
  report.gpu=gl.renderer;
  report.gpuVendor=gl.vendor;
  report.webglVersion=gl.version;
  report.webgl2=gl.webgl2;
  let audioRate;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(AC){const ac=new AC();audioRate=ac.sampleRate;await ac.close();}
  }catch(e){}
  report.audioRate=audioRate;

  row(hardware,"Logical processor threads",report.threads,"Browser-reported concurrency, not a guaranteed physical core count.");
  row(hardware,"Approximate device memory",report.memory?report.memory+" GB":undefined,"Intentionally coarse and privacy-limited where supported.");
  row(hardware,"Graphics renderer",report.gpu,"WebGL may expose a renderer or a privacy-reduced value.");
  row(hardware,"Graphics vendor",report.gpuVendor);
  row(hardware,"WebGL 2",gl.supported?yesNo(report.webgl2):"Unavailable");
  row(hardware,"WebGL version",gl.supported?report.webglVersion:"Unavailable");
  row(hardware,"Audio sample rate",audioRate?audioRate+" Hz":undefined,"Another small characteristic usable in fingerprinting.");
  row(hardware,"Touch points",navigator.maxTouchPoints,"Maximum simultaneous touch contacts reported by the browser.");

  const tz=Intl.DateTimeFormat().resolvedOptions();
  report.screen=screen.width+" × "+screen.height;
  report.viewport=innerWidth+" × "+innerHeight;
  report.pixelRatio=window.devicePixelRatio;
  report.colorDepth=screen.colorDepth;
  report.timezone=tz.timeZone;
  report.locale=tz.locale||navigator.language;
  report.calendar=tz.calendar;
  report.numberingSystem=tz.numberingSystem;
  report.orientation=safeTest(()=>screen.orientation.type);
  report.dark=matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches;
  report.reducedMotion=matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  report.gamut=matchMedia&&matchMedia("(color-gamut: p3)").matches?"P3":"sRGB / not reported as P3";

  row(display,"Physical screen",report.screen+" px");
  row(display,"Current viewport",report.viewport+" px");
  row(display,"Pixel ratio",report.pixelRatio);
  row(display,"Colour depth",report.colorDepth+" bit");
  row(display,"Timezone",report.timezone);
  row(display,"Language(s)",report.languages);
  row(display,"Locale / numbering",valueOr(report.locale)+(report.numberingSystem?" · "+report.numberingSystem:""));
  row(display,"Screen orientation",report.orientation);
  row(display,"Prefers dark colour scheme",yesNo(report.dark));
  row(display,"Reduced-motion preference",yesNo(report.reducedMotion));
  row(display,"Colour gamut",report.gamut);

  const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  report.online=navigator.onLine;
  report.connection=conn?conn.effectiveType:undefined;
  report.downlink=conn&&conn.downlink;
  report.rtt=conn&&conn.rtt;
  report.saveData=conn&&conn.saveData;
  report.cookies=navigator.cookieEnabled;
  report.localStorage=storageAvailable("localStorage");
  report.sessionStorage=storageAvailable("sessionStorage");
  report.indexedDB=!!window.indexedDB;
  report.secureContext=window.isSecureContext;
  report.serviceWorkers="serviceWorker" in navigator;
  report.dnt=navigator.doNotTrack;
  report.gpc=(typeof navigator.globalPrivacyControl==="boolean")?navigator.globalPrivacyControl:undefined;

  let battery;
  if(navigator.getBattery){
    try{battery=await navigator.getBattery();}catch(e){}
  }
  report.battery=battery?Math.round(battery.level*100)+"%":undefined;
  report.charging=battery?battery.charging:undefined;

  row(context,"Browser says online",yesNo(report.online),undefined,report.online?"teal":"warn");
  row(context,"Effective network type",report.connection,"Network Information API is not supported by every browser.");
  row(context,"Estimated downlink",report.downlink!==undefined?report.downlink+" Mbps":undefined,"An estimate, not a speed test.");
  row(context,"Estimated round-trip time",report.rtt!==undefined?report.rtt+" ms":undefined,"Browser-provided estimate.");
  row(context,"Data Saver",report.saveData!==undefined?yesNo(report.saveData):undefined);
  row(context,"Battery level",report.battery,"Only exposed by some browsers.");
  row(context,"Charging",report.charging!==undefined?yesNo(report.charging):undefined);
  row(context,"Cookies enabled",yesNo(report.cookies),"Browser-reported capability; not a full third-party-cookie test.");
  row(context,"Local storage available",yesNo(report.localStorage));
  row(context,"Session storage available",yesNo(report.sessionStorage));
  row(context,"IndexedDB available",yesNo(report.indexedDB));
  row(context,"Secure HTTPS context",yesNo(report.secureContext),report.secureContext?"This page is running in a secure context.":"Sensitive browser APIs may be blocked on insecure pages.",report.secureContext?"good":"danger");
  row(context,"Service Worker support",yesNo(report.serviceWorkers));
  row(context,"Do Not Track signal",report.dnt===null||report.dnt===undefined?"Not set / not exposed":report.dnt);
  row(context,"Global Privacy Control",report.gpc===undefined?"Not exposed by this browser":(report.gpc?"Enabled":"Disabled"),"Where supported, GPC communicates a privacy preference.",report.gpc===true?"good":"");

  const geo=await permissionState("geolocation");
  const camera=await permissionState("camera");
  const microphone=await permissionState("microphone");
  let notifications;
  if("Notification" in window){notifications=Notification.permission;permissionCount++;}
  report.permissions={geo,camera,microphone,notifications};

  row(permissions,"Location permission",geo,"'Prompt' means this site would need to ask before receiving coordinates.",permissionStatus(geo));
  row(permissions,"Camera permission",camera,"Checking state does not activate your camera.",permissionStatus(camera));
  row(permissions,"Microphone permission",microphone,"Checking state does not activate your microphone.",permissionStatus(microphone));
  row(permissions,"Notification permission",notifications,"Permission state only; this scan does not request notification access.",permissionStatus(notifications));

  const canvasToken=await getCanvasToken();
  const fpSource=[
    report.ua,report.languages,report.timezone,report.screen,report.pixelRatio,report.colorDepth,
    report.threads,report.memory,report.gpuVendor,report.gpu,report.audioRate,report.platform,
    report.orientation,report.gamut,canvasToken
  ].join("|");
  report.fingerprint=await digest(fpSource);
  fpCode.textContent="VT-"+report.fingerprint.slice(0,24);
  $("statSignals").textContent=signalCount;
  $("statPermissions").textContent=permissionCount;
}

async function runScan(){
  scanButton.disabled=true;scanShell.classList.add("scanning");
  terminal.textContent="";terminal.classList.add("show");
  $("scanHeading").textContent="Scanning browser exposure…";
  $("scanSub").textContent="Watching what the browser is willing to reveal.";
  results.classList.remove("show");
  const stages=[
    ["Reading browser and platform signals…",12],
    ["Checking CPU, memory and graphics interfaces…",27],
    ["Measuring display, locale and system preferences…",43],
    ["Checking storage and network capability…",59],
    ["Reading existing permission states — no prompts…",73],
    ["Building a local demonstration fingerprint…",88]
  ];
  for(const [text,pct] of stages){term(text);progressBar.style.width=pct+"%";await sleep(280);}
  await collect();
  term("Exposure profile assembled locally.","ok");progressBar.style.width="100%";await sleep(260);
  term("No scan result upload performed.","hot");
  $("scanHeading").textContent="Scan complete.";
  $("scanSub").textContent="Scroll down. The interesting part is what all these tiny signals add up to.";
  scanShell.classList.remove("scanning");scanButton.disabled=false;scanButton.textContent="Scan Again";
  results.classList.add("show");
  setTimeout(()=>results.scrollIntoView({behavior:"smooth",block:"start"}),180);
}

scanButton.addEventListener("click",runScan);
$("rescan").addEventListener("click",()=>{window.scrollTo({top:document.querySelector(".scan-shell").offsetTop-90,behavior:"smooth"});setTimeout(runScan,350);});

$("copyReport").addEventListener("click",async function(){
  const lines=[
    "VOLTTECH EXPOSURE SCAN — LOCAL REPORT",
    "Educational browser exposure demo; not a malware scan.",
    "",
    "Browser: "+valueOr(report.browser),
    "OS: "+valueOr(report.os),
    "UA: "+valueOr(report.ua),
    "Languages: "+valueOr(report.languages),
    "Timezone: "+valueOr(report.timezone),
    "Screen: "+valueOr(report.screen),
    "Viewport: "+valueOr(report.viewport),
    "Logical threads: "+valueOr(report.threads),
    "Approx memory: "+(report.memory?report.memory+" GB":"Not exposed"),
    "GPU: "+valueOr(report.gpu),
    "Network type: "+valueOr(report.connection),
    "HTTPS secure context: "+yesNo(report.secureContext),
    "Location permission: "+valueOr(report.permissions&&report.permissions.geo),
    "Camera permission: "+valueOr(report.permissions&&report.permissions.camera),
    "Microphone permission: "+valueOr(report.permissions&&report.permissions.microphone),
    "Demo fingerprint: VT-"+valueOr(report.fingerprint).slice(0,24),
    "",
    "Generated locally by https://volttechcomputerco.co.za/exposure-scan"
  ];
  try{
    await navigator.clipboard.writeText(lines.join("\n"));
    const old=this.textContent;this.textContent="Copied ✓";setTimeout(()=>this.textContent=old,1600);
  }catch(e){
    alert("Your browser blocked clipboard access. You can screenshot the report instead.");
  }
});

$("locationButton").addEventListener("click",function(){
  const box=$("locationResult");
  if(!navigator.geolocation){
    box.classList.add("show");box.innerHTML="<small>RESULT</small><strong>Geolocation is not available in this browser.</strong>";
    return;
  }
  this.disabled=true;this.textContent="Waiting for your browser…";
  box.classList.add("show");box.innerHTML="<small>PERMISSION REQUEST</small><strong>Your browser is deciding what to do.</strong><p>VoltTech cannot bypass the browser permission prompt.</p>";
  navigator.geolocation.getCurrentPosition(
    pos=>{
      const lat=pos.coords.latitude.toFixed(5),lon=pos.coords.longitude.toFixed(5),acc=Math.round(pos.coords.accuracy);
      box.textContent="";
      const s=document.createElement("small");s.textContent="LOCATION PROVIDED BY YOUR BROWSER";
      const strong=document.createElement("strong");strong.textContent=lat+", "+lon+" · accuracy ≈ "+acc+" m";
      const p=document.createElement("p");p.textContent="You just authorised this webpage to receive coordinates. They are shown here and are not uploaded by this tool. To revoke the permission itself, use your browser's site-permission controls.";
      const clear=document.createElement("button");clear.type="button";clear.className="action-button";clear.classList.add("location-clear");clear.textContent="Clear This Display";
      clear.onclick=()=>{box.classList.remove("show");box.textContent="";$("locationButton").disabled=false;$("locationButton").textContent="Show What Location Permission Can Reveal";};
      box.append(s,strong,p,clear);
      $("locationButton").textContent="Location Was Allowed";$("locationButton").disabled=true;
    },
    err=>{
      box.textContent="";
      const s=document.createElement("small");s.textContent="LOCATION NOT PROVIDED";
      const strong=document.createElement("strong");strong.textContent=err.code===1?"Permission denied / blocked.":"Location unavailable or timed out.";
      const p=document.createElement("p");p.textContent="Exactly as it should be: the page only gets coordinates when the browser and user allow it.";
      box.append(s,strong,p);
      $("locationButton").disabled=false;$("locationButton").textContent="Try Location Demo Again";
    },
    {enableHighAccuracy:false,timeout:10000,maximumAge:0}
  );
});
})();
