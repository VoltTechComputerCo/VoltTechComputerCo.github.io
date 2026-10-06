// One frame per scroll batch; native page scrolling and real route links remain intact.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const scenes = [
 {word:'BUILD',title:'BUILD',subtitle:'YOUR NEXT.',description:'A fresh start, a clear purpose. Plan a PC around what you want to do.',href:'builder/',action:'Enter PC Builder ↗',image:'vt-own-internals.webp',alt:'Installed PC components',label:'01 / PICK YOUR PARTS'},
 {word:'BOOST',title:'MORE',subtitle:'FROM YOUR PC.',description:'Keep the parts you love. Find the upgrade that moves your setup forward.',href:'pc-upgrades-pretoria.html',action:'Explore upgrades ↗',image:'vt-own-gpu-installed.webp',alt:'Installed graphics card in a PC',label:'02 / LEVEL UP YOUR SETUP'},
 {word:'CREATE',title:'GO',subtitle:'LIVE.',description:'Audio. Capture. OBS. Get your setup working together so you can focus on creating.',href:'streaming-setup-south-africa.html',action:'Explore Stream Support ↗',image:'vt-own-desk.webp',alt:'PC and peripherals in a streaming desktop setup',label:'03 / MAKE SOMETHING GREAT'}
];
const track=document.querySelector('.experience-track'),stage=document.querySelector('.experience-stage');
const controls=[...document.querySelectorAll('[data-scene]')];let active=0,frame=0,manualUntil=0;
function setScene(index){
 if(index===active && stage.dataset.ready)return;active=index;stage.dataset.ready='true';const scene=scenes[index];
 const title=document.querySelector('[data-scene-title]');title.replaceChildren(document.createTextNode(scene.title),document.createElement('br'));const span=document.createElement('span');span.textContent=scene.subtitle;title.append(span);
 document.querySelector('[data-scene-description]').textContent=scene.description;
 const link=document.querySelector('[data-scene-link]');link.href=scene.href;link.textContent=scene.action;
 const image=document.querySelector('[data-scene-image]');image.src=scene.image;image.alt=scene.alt;
 document.querySelector('[data-scene-word]').textContent=scene.word;document.querySelector('[data-scene-label]').textContent=scene.label;
 document.querySelector('[data-scene-counter]').textContent=`0${index+1} / 03`;
 for(const c of controls){const selected=Number(c.dataset.scene)===index;c.classList.toggle('is-active',selected);c.setAttribute('aria-pressed',String(selected));}
 if(!reduced.matches){image.animate([{opacity:.25,transform:'scale(1.08)'},{opacity:1,transform:'scale(1)'}],{duration:450,easing:'ease-out'});title.animate([{opacity:.4,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'ease-out'});}
}
const pinning=()=>!reduced.matches && (innerWidth>=900 || innerHeight>=760);
function configureMotion(){document.documentElement.classList.toggle('motion-ready',pinning());requestFrame();}
function requestFrame(){if(!frame)frame=requestAnimationFrame(update);}
function update(){frame=0;if(!track)return;
 const rect=track.getBoundingClientRect(),range=Math.max(1,track.offsetHeight-innerHeight);const progress=Math.max(0,Math.min(1,-rect.top/range));
 if(pinning() && performance.now()>manualUntil)setScene(Math.min(2,Math.floor(progress*3)));
 stage.style.setProperty('--story-progress',String(pinning()?progress:(active+1)/3));
 if(!reduced.matches){const phase=progress*3-active;stage.style.setProperty('--scene-rotate',`${7-phase*10}deg`);stage.style.setProperty('--scene-scale',String(1+Math.max(0,Math.min(1,phase))*.06));const y=Math.min(60,scrollY*.12);document.querySelector('[data-hero-visual]').style.setProperty('--hero-y',`${y}px`);document.querySelector('[data-hero-visual]').style.setProperty('--hero-rotate',`${-8+Math.min(8,scrollY*.02)}deg`);const creator=document.querySelector('.creator-scene');const visible=(innerHeight-creator.getBoundingClientRect().top)/(innerHeight+creator.offsetHeight);creator.style.setProperty('--creator-scale',String(1.12-Math.max(0,Math.min(1,visible))*.12));}
 const chapters=[...document.querySelectorAll('.chapter-dock a')];let current=chapters[0];for(const c of chapters){const target=document.querySelector(c.getAttribute('href'));if(target?.getBoundingClientRect().top<innerHeight*.45)current=c;}for(const c of chapters){c.classList.toggle('is-current',c===current);if(c===current)c.setAttribute('aria-current','location');else c.removeAttribute('aria-current');}
}
for(const c of controls)c.addEventListener('click',()=>{const index=Number(c.dataset.scene);manualUntil=performance.now()+1000;setScene(index);if(pinning()){const top=scrollY+track.getBoundingClientRect().top;window.scrollTo({top:top+(track.offsetHeight-innerHeight)*(index+.3)/3,behavior:'instant'});}requestFrame();});
const parts=[
 ['GPU','Graphics cards','GRAPHICS / MAKE IT VISUAL','The pixels. The frames. The detail. Explore the visual engine of your PC.','gpu'],
 ['CPU','Processors','PROCESSING / MAKE IT HAPPEN','The engine behind your games, tools and everyday work. Find the right starting point.','cpu'],
 ['RAM','Memory','MEMORY / KEEP IT FLOWING','Room for your applications, your projects and the tabs you promised to close.','memory'],
 ['SSD','Storage','STORAGE / MAKE ROOM','Your games, files and creative work need a home. Explore faster storage options.','storage'],
 ['AIR','Cooling','COOLING / KEEP YOUR COOL','Airflow and cooling help your components do their job. Fit matters as much as looks.','cooler'],
 ['PSU','Power supplies','POWER / FEED THE MACHINE','A considered power supply choice starts with your components and their requirements.','psu']
];
const partTabs=[...document.querySelectorAll('[data-part]')],partStage=document.getElementById('part-stage');
function selectPart(tab){const [word,name,tag,description,type]=parts[Number(tab.dataset.part)];for(const t of partTabs){const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;}partStage.setAttribute('aria-labelledby',tab.id);document.querySelector('[data-part-word]').textContent=word;document.querySelector('[data-part-name]').textContent=name;document.querySelector('[data-part-tag]').textContent=tag;document.querySelector('[data-part-description]').textContent=description;const image=document.querySelector('[data-part-image]');image.src=`assets/categories/${type}.webp`;image.alt=`${name} category illustration`;const link=document.querySelector('[data-part-link]');link.href=`store.html?category=${type}`;link.textContent=`Explore ${name.toLowerCase()} ↗`;partStage.classList.remove('part-changing');if(!reduced.matches)requestAnimationFrame(()=>partStage.classList.add('part-changing'));}
for(const tab of partTabs){tab.addEventListener('click',()=>selectPart(tab));tab.addEventListener('keydown',e=>{let index=partTabs.indexOf(tab);if(['ArrowRight','ArrowDown'].includes(e.key))index=(index+1)%partTabs.length;else if(['ArrowLeft','ArrowUp'].includes(e.key))index=(index-1+partTabs.length)%partTabs.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=partTabs.length-1;else return;e.preventDefault();selectPart(partTabs[index]);partTabs[index].focus();});}
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}},{threshold:.12});for(const item of document.querySelectorAll('[data-reveal]'))observer.observe(item);
for(const scene of scenes){const img=new Image();img.src=scene.image;}
setScene(0);configureMotion();window.addEventListener('scroll',requestFrame,{passive:true});window.addEventListener('resize',configureMotion);reduced.addEventListener('change',configureMotion);
