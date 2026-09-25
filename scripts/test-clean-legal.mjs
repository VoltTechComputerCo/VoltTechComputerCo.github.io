import fs from 'node:fs';
const pages=['legal.html','quote-terms.html','terms.html','privacy.html','paia.html','returns-warranty.html','delivery-collection.html','repair-authorisation.html'];
const fail=(m)=>{throw new Error(m)};
for(const p of pages){
  const s=fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
  if((s.match(/<h1\b/g)||[]).length!==1)fail(`${p}: expected one H1`);
  if((s.match(/<main\b/g)||[]).length!==1)fail(`${p}: expected one main`);
  if((s.match(/class="site-header"/g)||[]).length!==1)fail(`${p}: clean site header missing`);
  if((s.match(/class="site-footer"/g)||[]).length!==1)fail(`${p}: clean site footer missing`);
  if(!s.includes('assets/css/pages/legal.css'))fail(`${p}: clean legal CSS missing`);
  if(!s.includes('assets/js/pages/legal.js'))fail(`${p}: clean legal JS missing`);
  if(s.includes('fonts.googleapis.com'))fail(`${p}: Google Fonts remain`);
  if(s.includes('href="legal.css"'))fail(`${p}: legacy legal.css remains`);
  if(!s.includes('name="robots" content="noindex, follow"'))fail(`${p}: robots contract changed`);
}
const legal=fs.readFileSync(new URL('../legal.html',import.meta.url),'utf8');
if(!legal.includes('Production ecommerce remains launch-gated'))fail('legal: launch boundary missing');
const paia=fs.readFileSync(new URL('../paia.html',import.meta.url),'utf8');
if(!paia.includes('this webpage is not VoltTech&#x27;s completed PAIA manual') && !paia.includes("this webpage is not VoltTech's completed PAIA manual"))fail('paia: manual disclaimer missing');
if(!paia.includes('Information Officer'))fail('paia: Information Officer blocker missing');
const ret=fs.readFileSync(new URL('../returns-warranty.html',import.meta.url),'utf8');
if(!ret.includes('within six months'))fail('returns: six-month wording missing');
if(!ret.includes('at least three months'))fail('returns: repair protection wording missing');
const privacy=fs.readFileSync(new URL('../privacy.html',import.meta.url),'utf8');
if(!privacy.includes('privacy-center.html'))fail('privacy: self-service link missing');
console.log('PASS: clean legal/support family contracts');
