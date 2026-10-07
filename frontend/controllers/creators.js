import './common.js';
import {page,q,esc,image,empty,status,action} from '../ui.js';
import {loadCreatorDirectory,creatorFeedAgeLabel} from '../adapters/creator-feed.js';
import {beginTwitchCreatorRegistration,completeTwitchCreatorRegistrationFromLocation} from '../adapters/creator-registration.js';
if(q('[data-register-form]')){
 const form=q('[data-register-form]');form.onsubmit=e=>{e.preventDefault();if(form.reportValidity())action(form.querySelector('button'),()=>beginTwitchCreatorRegistration({southAfricaConfirmed:form.elements.southAfrica.checked}),'[data-creator-status]');};
 completeTwitchCreatorRegistrationFromLocation().then(r=>{if(r.state==='error')status('[data-creator-status]',r.message);if(r.state==='success'){form.hidden=true;status('[data-creator-status]',`You're connected${r.volttechAccountLinked?' and linked to your VoltTech account':''}. Welcome to the directory.`);}}).catch(e=>status('[data-creator-status]',e.message));
}else{
 loadCreatorDirectory().then(feed=>{status('[data-creator-status]',feed.available?`${feed.trackedCount} creators · checked ${creatorFeedAgeLabel(feed)}${feed.fresh?'':' · Live status awaits a fresh update'}`:'The creator directory is temporarily unavailable. Please try again later.');
 const render=()=>{const term=q('#creator-search').value.toLowerCase(),live=q('[data-live-only]').checked;const rows=feed.streamers.filter(r=>(!live||r.live)&&`${r.displayName} ${r.gameName} ${r.title}`.toLowerCase().includes(term));q('[data-creators]').innerHTML=rows.length?rows.map(r=>`<article class="creator-card panel">${image(r.profileImageUrl,r.displayName)}<p class="eyebrow">${r.live?'LIVE NOW':feed.fresh?'CREATOR':'STATUS AWAITING UPDATE'}</p><h2>${esc(r.displayName)}</h2><p>${esc(r.live?r.title:r.description)}</p>${r.live?`<p>${esc(r.gameName)} · ${esc(r.viewerCount)} watching</p>`:''}<a class="button secondary" href="https://www.twitch.tv/${esc(r.login)}" target="_blank" rel="noopener noreferrer">Visit channel ↗</a></article>`).join(''):empty('No matching creators','Try another name, game or filter.','creator-register.html','Join the directory');};render();q('#creator-search').oninput=render;q('[data-live-only]').onchange=render;
 }).catch(e=>status('[data-creator-status]',e.message));
}
