
export const PRESETS=[
 {key:'gaming-laptop',id:'syntech-467a3fa3a5841361',title:'GAME ANYWHERE.',copy:'Portable performance. Serious gaming.'},
 {key:'work-laptop',id:'syntech-db2227828f830b6d',title:'GET MORE DONE.',copy:'Your next work and everyday laptop.'},
 {key:'graphics-card',id:'syntech-d7605d7d66bb36ef',title:'LEVEL UP YOUR GPU.',copy:'Make your next graphics upgrade count.'},
 {key:'gaming-monitor',id:'syntech-0bea3b77b2b0fee3',title:'SEE EVERY FRAME.',copy:'Give your games a better view.'},
 {key:'stream-audio',id:'syntech-1b93dd06f4a79d81',title:'MAKE YOURSELF HEARD.',copy:'Upgrade your gaming and streaming audio.'},
 {key:'custom-gaming-pc',id:'syntech-32629eb564885f9a',title:'YOUR NEXT BUILD.',copy:'Custom gaming PCs built around your budget.',service:true}
];
export const ready=p=>!!p&&p.status==='active'&&p.visibility==='public'&&p.sale_mode!=='hidden'&&!p.is_demo&&Number(p.stock_qty)>0&&Number(p.retail_price)>0;
export const money=p=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:2}).format(Number(p.retail_price));
export function caption(p,preset){return preset.title+'\n\n'+(preset.service?'Plan your custom gaming PC with VoltTech. Tell us your games, goals and budget. Case pictured for illustration; complete build specification and pricing are quoted individually.':p.name+'\n'+money(p)+' incl. VAT\n'+preset.copy)+'\n\n'+(preset.service?'https://volttechcomputerco.co.za/#contact':'https://volttechcomputerco.co.za/product.html?id='+encodeURIComponent(p.id))+'\n\n'+(preset.service?'':'Supplier stock and pricing checked against the catalogue on '+new Date().toLocaleDateString('en-ZA')+'. Confirmed before payment.\n')+'#VoltTech #GamingPC #PCGaming #SouthAfrica';}
async function photo(url){const img=new Image();img.crossOrigin='anonymous';img.src=url;await img.decode();return img;}
function fit(ctx,img,x,y,w,h){let s=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*s)/2,y+(h-img.height*s)/2,img.width*s,img.height*s);}
function lines(ctx,text,x,y,max,font,size,leading,maxLines=3){ctx.font=size+'px '+font;let words=String(text).split(/\s+/),line='',n=0;for(const word of words){let next=line?line+' '+word:word;if(ctx.measureText(next).width>max&&line){ctx.fillText(line,x,y+n*leading);n++;line=word;if(n>=maxLines-1)break;}else line=next;}if(n===maxLines-1){let remaining=words.slice(words.indexOf(line.split(' ')[0])).join(' ');line=remaining;while(ctx.measureText(line).width>max&&line.length>1)line=line.slice(0,-1);if(line!==remaining)line=line.slice(0,-1)+'…';}ctx.fillText(line,x,y+n*leading);}
export async function render(canvas,p,preset,{story=false,imageSource,logoSource='assets/brand/volttech-logo.webp',fontSource='assets/fonts/bender.otf'}={}){
 if(!ready(p))throw Error('Choose an in-stock product with confirmed catalogue pricing.');
 const font=new FontFace('Bender','url('+JSON.stringify(fontSource)+')',{weight:'700'});await font.load();document.fonts.add(font);
 const [img,logo]=await Promise.all([photo(imageSource||'https://qdqhfnvwqvgesfdmocir.supabase.co/functions/v1/supplier-ad-image?id='+encodeURIComponent(p.id)),photo(logoSource)]);
 canvas.width=1080;canvas.height=story?1920:1350;const h=canvas.height,c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,1080,h);g.addColorStop(0,'#081b24');g.addColorStop(.6,'#041016');g.addColorStop(1,'#073b3b');c.fillStyle=g;c.fillRect(0,0,1080,h);
 c.strokeStyle='#49f5d222';c.lineWidth=2;for(let x=-h;x<1080;x+=96){c.beginPath();c.moveTo(x,0);c.lineTo(x+h,h);c.stroke();}
 fit(c,logo,54,48,250,142);c.fillStyle='#62fbd9';c.font='22px Bender';c.fillText('EMPOWERING YOUR PC.',640,122);
 c.fillStyle='#f6ffff';lines(c,preset.title,66,story?285:252,950,'Bender',76,82,2);
 const top=story?420:350,boxH=story?750:515;c.fillStyle='#ffffff';c.beginPath();c.roundRect(54,top,972,boxH,30);c.fill();fit(c,img,98,top+42,884,boxH-84);
 c.fillStyle='#d1efed';lines(c,preset.service?'CUSTOM GAMING PC BUILDS':p.name,66,top+boxH+64,948,'Arial',29,38,3);
 c.fillStyle='#63ffcf';c.font=(preset.service?48:86)+'px Bender';c.fillText(preset.service?'YOUR BUDGET. YOUR BUILD.':money(p),66,h-215);
 c.fillStyle='#bdcece';c.font='22px Arial';c.fillText(preset.service?'Illustrative case · Full build priced on quotation':'INCL. VAT · SUPPLIER STOCK · CONFIRM BEFORE PAYMENT',66,h-167);
 c.fillStyle='#60f7d1';c.beginPath();c.roundRect(54,h-128,972,72,14);c.fill();c.fillStyle='#061c23';c.font='30px Bender';c.fillText(preset.service?'LET’S PLAN YOUR PC  →':'SHOP AT VOLTTECH  →',82,h-82);
 c.fillStyle='#eaffff';c.font='20px Arial';c.textAlign='right';c.fillText('volttechcomputerco.co.za',992,h-82);c.textAlign='left';
 return canvas;
}
