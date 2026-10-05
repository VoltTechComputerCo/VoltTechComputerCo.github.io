// Read-only public contract. No authentication, customer records or DOM access.
export async function catalogueState(config, request = fetch) {
  if(!config?.url || !config?.publishableKey) return {kind:'unavailable'};
  const abort = new AbortController(), timer = setTimeout(()=>abort.abort(),8000);
  const headers={apikey:config.publishableKey,Accept:'application/json'};
  try {
    const base=`${config.url}/rest/v1/`;
    const settings=await request(base+'store_settings?id=eq.store&select=catalogue_enabled,builder_enabled',{headers,signal:abort.signal,cache:'no-store'});
    if(!settings.ok)throw Error('Settings unavailable');
    const rows=await settings.json();if(!Array.isArray(rows)||rows.length!==1)throw Error('Invalid settings');
    if(rows[0].catalogue_enabled!==true)return {kind:'closed',builderEnabled:rows[0].builder_enabled===true};
    const products=await request(base+'store_products?status=eq.active&visibility=eq.public&sale_mode=neq.hidden&is_demo=eq.false&select=id&limit=1',{headers,signal:abort.signal,cache:'no-store'});
    if(!products.ok)throw Error('Catalogue unavailable');const items=await products.json();if(!Array.isArray(items))throw Error('Invalid catalogue');
    return {kind:items.length?'available':'empty',builderEnabled:rows[0].builder_enabled===true};
  } catch {return {kind:'unavailable'};} finally {clearTimeout(timer);}
}
