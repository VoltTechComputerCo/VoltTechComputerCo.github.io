import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UA = "Mozilla/5.0 (compatible; VoltTechProductImage/2.0; +https://volttechcomputerco.co.za)";
const CACHE = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": status === 200 ? "public, max-age=300" : "no-store"
  }
});

const decodeEntities = (s: string) => s
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");

function firstImage(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    for (const x of v) {
      const found = firstImage(x);
      if (found) return found;
    }
    return null;
  }
  if (typeof v === "object") return firstImage(v.url || v.contentUrl || v.image || v.thumbnailUrl);
  return null;
}

function walkProducts(v: any, out: string[]) {
  if (!v) return;
  if (Array.isArray(v)) {
    for (const x of v) walkProducts(x, out);
    return;
  }
  if (typeof v !== "object") return;
  const t = v["@type"];
  const types = Array.isArray(t) ? t : [t];
  if (types.some((x) => String(x || "").toLowerCase() === "product")) {
    const img = firstImage(v.image);
    if (img) out.push(img);
  }
  for (const x of Object.values(v)) walkProducts(x, out);
}

function attr(tag: string, key: string): string {
  const m = tag.match(new RegExp("\\\\b" + key + "\\\\s*=\\\\s*[\"']([^\"']+)[\"']", "i"));
  return m ? decodeEntities(m[1]) : "";
}

function absolutize(raw: string, base: string): string | null {
  if (!raw || raw.startsWith("data:")) return null;
  try {
    const u = new URL(decodeEntities(raw.replaceAll("\\/", "/")), base);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    return u.href;
  } catch {
    return null;
  }
}

function tokens(productName: string, model: string | null) {
  const stop = new Set([
    "amd","intel","asus","msi","gigabyte","corsair","kingston","gskill","teamgroup",
    "samsung","western","digital","wd","deepcool","cooler","master","fractal","design",
    "nzxt","arctic","noctua","seasonic","sapphire","asrock","be","quiet","montech","lian","li"
  ]);
  return (productName + " " + (model || ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((x) => x.length >= 3 && !stop.has(x));
}

function scoreUrl(url: string, label = "", nameTokens: string[] = []) {
  const s = (url + " " + label).toLowerCase();
  let score = 0;
  if (/product|products|gallery|media|image|images|upload|cdn|key-features|etail|photo|photos|pim|visual|render/.test(s)) score += 18;
  if (/front|angle|three|main|primary|overview|pack|box/.test(s)) score += 8;
  if (/logo|logos|icon|icons|avatar|favicon|sprite|banner|hero|lifestyle|campaign|header|footer|nav|gnb|badge|badges/.test(s)) score -= 120;
  if (/article|articles|blog|blogs|news|editorial|support|driver/.test(s)) score -= 120;
  if (/buds|headset|keyboard|mouse|phone|laptop/.test(s)) score -= 80;
  if (/\.svg(?:\?|$)/.test(url)) score -= 40;
  for (const t of nameTokens) if (s.includes(t)) score += 14;
  return score;
}

function chooseImage(html: string, pageUrl: string, productName: string, model: string | null) {
  const candidates: {url:string, score:number, source:string}[] = [];
  const cleanHtml = html.replaceAll("\\/", "/");
  const nameTokens = tokens(productName, model);

  for (const m of cleanHtml.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(decodeEntities(m[1]).trim());
      const urls: string[] = [];
      walkProducts(data, urls);
      for (const raw of urls) {
        const url = absolutize(raw, pageUrl);
        if (!url) continue;
        const s = scoreUrl(url, "", nameTokens);
        if (s > -60) candidates.push({url, score: 130 + s, source: "jsonld-product"});
      }
    } catch {}
  }

  const metaPatterns = [
    /<meta[^>]*(?:property|name)=["']og:image(?::secure_url)?["'][^>]*>/gi,
    /<meta[^>]*(?:property|name)=["']twitter:image(?::src)?["'][^>]*>/gi,
    /<meta[^>]*itemprop=["']image["'][^>]*>/gi
  ];
  for (const re of metaPatterns) {
    for (const m of cleanHtml.matchAll(re)) {
      const tag = m[0];
      const raw = attr(tag, "content") || attr(tag, "href");
      const url = absolutize(raw, pageUrl);
      if (!url) continue;
      const s = scoreUrl(url, "", nameTokens);
      if (s > -60) candidates.push({url, score: 65 + s, source: "meta-image"});
    }
  }

  for (const m of cleanHtml.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const label = (attr(tag, "alt") + " " + attr(tag, "title")).toLowerCase();
    const raw = attr(tag, "data-src") || attr(tag, "data-lazy-src") || attr(tag, "src");
    const srcset = attr(tag, "srcset") || attr(tag, "data-srcset");
    const srcsetBest = srcset
      ? (srcset.split(",").map((x) => x.trim().split(/\s+/)[0]).filter(Boolean).pop() || "")
      : "";
    const url = absolutize(srcsetBest || raw, pageUrl);
    if (!url) continue;
    const hits = nameTokens.filter((x) => label.includes(x)).length;
    const s = scoreUrl(url, label, nameTokens);
    if (s > -60 && (hits > 0 || s >= 18)) candidates.push({url, score: 50 + hits * 18 + s, source: "html-img"});
  }

  // Extract raw CDN/gallery image URLs from embedded JS/JSON.
  const absoluteRe = new RegExp("https?:[^\\\"'<>\\\\s)]+?\\\\.(?:png|jpe?g|webp|avif)(?:\\\\?[^\\\"'<>\\\\s)]*)?", "gi");
  for (const m of cleanHtml.matchAll(absoluteRe)) {
    const url = absolutize(m[0], pageUrl);
    if (!url) continue;
    const s = scoreUrl(url, "", nameTokens);
    if (s > -60) candidates.push({url, score: 75 + s, source: "embedded-absolute"});
  }

  const quotedRe = new RegExp("[\\\"']([^\\\"'<>]+?\\\\.(?:png|jpe?g|webp|avif)(?:\\\\?[^\\\"'<>]*)?)[\\\"']", "gi");
  for (const m of cleanHtml.matchAll(quotedRe)) {
    const url = absolutize(m[1], pageUrl);
    if (!url) continue;
    const s = scoreUrl(url, "", nameTokens);
    if (s > -60) candidates.push({url, score: 70 + s, source: "embedded-relative"});
  }

  const seen = new Set<string>();
  return candidates
    .filter((c) => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    })
    .sort((a,b) => b.score - a.score);
}

async function productRow(id: string) {
  const u = new URL(SUPABASE_URL + "/rest/v1/store_products");
  u.searchParams.set("id", "eq." + id);
  u.searchParams.set("status", "eq.active");
  u.searchParams.set("visibility", "eq.public");
  u.searchParams.set("select", "id,name,model,media");
  u.searchParams.set("limit", "1");
  const r = await fetch(u, {headers:{apikey:SERVICE_KEY,authorization:"Bearer " + SERVICE_KEY}});
  if (!r.ok) throw new Error("product lookup failed");
  const rows = await r.json();
  return rows[0] || null;
}

async function candidatePages(sourcePage: string) {
  const pages = [sourcePage];
  try {
    const sp = new URL(sourcePage);
    const base = sourcePage.replace(/\/$/,"");
    if (/msi\.com$/i.test(sp.hostname)) pages.push(base + "/Gallery");
    if (/gigabyte\.com$/i.test(sp.hostname)) pages.push(base + "/Gallery");
    if (/asrock\.com$/i.test(sp.hostname)) pages.push(base.replace(/\/index\.asp$/i,"/index.asp"));
  } catch {}
  return [...new Set(pages)];
}

Deno.serve(async (req: Request) => {
  if (!["GET","HEAD"].includes(req.method)) return new Response("Method not allowed", {status:405});
  const u = new URL(req.url);
  const id = (u.searchParams.get("id") || "").trim();
  const meta = u.searchParams.get("meta") === "1";
  if (!/^[a-z0-9][a-z0-9._-]{2,120}$/i.test(id)) return json({error:"Invalid product id"},400);

  try {
    const p = await productRow(id);
    if (!p) return json({error:"Product not found"},404);
    const media = p.media || {};
    const sourcePage = media.sourcePage || media.officialUrl || null;
    const direct = media.directImage || (
      typeof media.primaryImage === "string" &&
      /^https?:\/\//i.test(media.primaryImage) &&
      !media.primaryImage.includes("/functions/v1/resolve-product-image")
        ? media.primaryImage : null
    );

    let candidates: {url:string, score:number, source:string}[] = [];
    if (direct && !direct.includes("api.microlink.io")) {
      candidates.push({url:direct,score:1000,source:"verified-direct"});
    }
    if (sourcePage) {
      for (const pageUrl of await candidatePages(sourcePage)) {
        try {
          const page = await fetch(pageUrl, {
            redirect:"follow",
            headers:{"user-agent":UA,"accept":"text/html,application/xhtml+xml"}
          });
          if (!page.ok) continue;
          const type = page.headers.get("content-type") || "";
          if (type.startsWith("image/")) {
            candidates.push({url:page.url,score:240,source:"source-is-image"});
          } else {
            const html = await page.text();
            candidates.push(...chooseImage(html, page.url, p.name || "", p.model || null));
          }
        } catch {}
      }
      candidates.sort((a,b)=>b.score-a.score);
    }

    if (!candidates.length && direct) {
      candidates = [{
        url: direct,
        score: 40,
        source: direct.includes("api.microlink.io") ? "microlink-fallback" : "direct-fallback"
      }];
    }
    if (!candidates.length) return json({error:"No product image found",id,sourcePage},404);

    let lastError = "";
    for (const c of candidates.slice(0,12)) {
      try {
        const image = await fetch(c.url, {
          redirect:"follow",
          headers:{
            "user-agent":UA,
            "accept":"image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            ...(sourcePage ? {"referer":sourcePage} : {})
          }
        });
        const ct = image.headers.get("content-type") || "";
        if (!image.ok || !ct.startsWith("image/")) {
          lastError = String(image.status) + " " + ct;
          continue;
        }
        if (meta) return json({
          id,
          name:p.name,
          model:p.model,
          sourcePage,
          resolved:c.url,
          resolvedFinal:image.url,
          contentType:ct,
          method:c.source,
          score:c.score
        },200);

        const headers = new Headers();
        headers.set("content-type", ct);
        headers.set("cache-control", CACHE);
        headers.set("x-volttech-image-source", c.source);
        const len = image.headers.get("content-length");
        if (len) headers.set("content-length", len);
        return new Response(req.method === "HEAD" ? null : image.body, {status:200,headers});
      } catch (e) {
        lastError = String(e);
      }
    }

    return json({error:"Image candidates failed",id,lastError},502);
  } catch (e) {
    return json({error:"Resolver failed",detail:String(e)},500);
  }
});