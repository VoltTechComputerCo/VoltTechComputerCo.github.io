export const symptoms = [
  ['encoding','OBS says encoding overloaded'],
  ['rendering','Rendering lag / skipped frames'],
  ['network','Dropped frames / unstable stream'],
  ['blurry','Blurry or blocky stream'],
  ['fps','Game FPS drops when I go live'],
  ['audio','Mic / audio sounds bad'],
  ['setup','I need a complete first-time setup']
];

export const platforms = [['twitch','Twitch'],['youtube','YouTube'],['other','Other / not sure yet']];
export const resolutions = [['720p30','720p / 30 FPS'],['720p60','720p / 60 FPS'],['1080p30','1080p / 30 FPS'],['1080p60','1080p / 60 FPS'],['unknown','Not sure']];
export const gpus = [['nvidia','NVIDIA GeForce / RTX / GTX'],['amd','AMD Radeon'],['intel','Intel Arc / Intel graphics'],['other','Other / not sure']];
export const setupTypes = [['single','One PC runs the game and stream'],['dual','Two-PC streaming setup'],['capture','Console / capture-card setup'],['other','Other / not sure']];
export const connections = [['ethernet','Wired Ethernet'],['wifi','Wi-Fi'],['wireless','Fixed wireless / mobile data'],['other','Other / not sure']];
export const uploads = [['lt5','Under 5 Mbps'],['5to10','5 – 10 Mbps'],['10to20','10 – 20 Mbps'],['20plus','20+ Mbps'],['unknown','Not sure / never tested']];

const recommendations = {
  encoding:['Encoder / system headroom','The selected encoding workload or available system headroom may not match the current game and output target.','Stream Tune','R449'],
  rendering:['OBS rendering bottleneck','OBS may not be getting enough GPU rendering headroom, or scene/capture load may be too high while the game is running.','Stream Tune','R449'],
  network:['Network / bitrate instability','Dropped network frames usually point toward connection stability, bitrate, routing or the path between your PC and the streaming platform.','Stream Check → Tune if needed','R299–R449'],
  blurry:['Output quality mismatch','Resolution, frame rate, bitrate and high-motion content may be working against each other.','Stream Tune','R449'],
  fps:['Game + stream resource contention','The game and streaming workload may be competing for CPU/GPU resources while live.','Stream Tune','R449'],
  audio:['Audio chain needs tuning','Gain, noise control, compression, limiting, routing or source balance may need adjustment.','Stream Check / Tune','R299–R449'],
  setup:['Complete creator setup','A clean first-time setup avoids stacking random presets, conflicting sources and unsuitable output settings.','Stream Setup','R649']
};

export function createStreamAnswers(){
  return {symptom:null,platform:null,resolution:null,gpu:null,setupType:null,connection:null,upload:null};
}
export function label(rows,value){return rows.find(row=>row[0]===value)?.[1]||''}

export function streamQuestions(answers){
  const rows=[{key:'symptom',title:'What is the main streaming problem?',options:symptoms}];
  if(!answers.symptom)return rows;
  if(answers.symptom==='audio'){
    rows.push({key:'platform',title:'Where are you streaming?',options:platforms},{key:'setupType',title:'What kind of streaming setup are you using?',options:setupTypes});
  }else if(['encoding','rendering','fps'].includes(answers.symptom)){
    rows.push({key:'platform',title:'Where are you streaming?',options:platforms},{key:'resolution',title:'What output are you aiming for?',options:resolutions},{key:'gpu',title:'What graphics hardware are you using?',options:gpus},{key:'setupType',title:'What kind of streaming setup are you using?',options:setupTypes});
  }else if(['network','blurry'].includes(answers.symptom)){
    rows.push({key:'platform',title:'Where are you streaming?',options:platforms},{key:'resolution',title:'What output are you aiming for?',options:resolutions},{key:'connection',title:'How is the streaming PC connected to the internet?',options:connections},{key:'upload',title:'What is your upload speed?',options:uploads});
  }else{
    rows.push({key:'platform',title:'Where are you planning to stream?',options:platforms},{key:'resolution',title:'What output are you aiming for?',options:resolutions},{key:'gpu',title:'What graphics hardware are you using?',options:gpus},{key:'setupType',title:'What kind of setup are you building?',options:setupTypes},{key:'connection',title:'How will the streaming system connect to the internet?',options:connections},{key:'upload',title:'What is your upload speed?',options:uploads});
  }
  return rows;
}

export function urgencyScore(answers){
  const base={setup:.12,audio:.22,blurry:.30,fps:.42,network:.46,encoding:.50,rendering:.52};
  let score=base[answers.symptom]??.08;
  if(answers.resolution==='720p60')score+=.02;
  if(answers.resolution==='1080p30')score+=.03;
  if(answers.resolution==='1080p60')score+=.07;
  if(['encoding','rendering','fps'].includes(answers.symptom)&&answers.setupType==='single')score+=.05;
  if(['network','blurry'].includes(answers.symptom)&&answers.connection==='wifi')score+=.08;
  if(['network','blurry'].includes(answers.symptom)&&answers.connection==='wireless')score+=.12;
  if(answers.upload==='lt5')score+=.18;
  if(answers.upload==='5to10')score+=.09;
  if(answers.upload==='10to20')score+=.02;
  if(answers.upload==='20plus')score-=.02;
  return Math.max(.08,Math.min(.84,score));
}

export function recommendationFor(answers){
  const row=[...(recommendations[answers.symptom]||recommendations.setup)];
  if(answers.symptom==='setup'&&['dual','capture'].includes(answers.setupType)){
    row[2]='Creator System Tune';
    row[3]='Quoted after assessment';
  }
  return row;
}

export function contextNote(answers){
  const notes=[];
  if(answers.symptom==='network'&&['wifi','wireless'].includes(answers.connection))notes.push('Your connection path is wireless, which can add instability even when a speed test looks fast.');
  if(answers.symptom==='blurry'&&answers.resolution==='1080p60'&&answers.upload==='lt5')notes.push('1080p60 with under 5 Mbps upload leaves very little practical bitrate headroom, so a lower output target may be more stable and look cleaner.');
  if(answers.symptom==='blurry'&&answers.resolution==='1080p60'&&answers.upload==='5to10')notes.push('1080p60 on a 5–10 Mbps upload can be tight depending on platform limits, motion and connection consistency.');
  if(['encoding','rendering','fps'].includes(answers.symptom)&&answers.setupType==='single')notes.push('Because one PC is running both the game and broadcast, game load and OBS headroom need to be balanced together.');
  if(['encoding','rendering','fps'].includes(answers.symptom)&&answers.gpu&&answers.gpu!=='other')notes.push('Your graphics-hardware family helps narrow sensible encoder and rendering options, but the exact model still matters before final settings are chosen.');
  if(answers.symptom==='setup'&&['dual','capture'].includes(answers.setupType))notes.push('This is a more involved creator workflow, so the final scope may be better handled as a Creator System Tune rather than a standard setup.');
  if(answers.symptom==='audio')notes.push('Audio problems are usually diagnosed from the signal chain and routing, so Stream Scan skips unrelated bitrate and upload questions.');
  return notes.join(' ');
}

export function resultRows(answers){
  const rows=[];
  if(answers.platform)rows.push(['Platform',label(platforms,answers.platform)]);
  if(answers.resolution)rows.push(['Target output',label(resolutions,answers.resolution)]);
  if(answers.gpu)rows.push(['Graphics',label(gpus,answers.gpu)]);
  if(answers.setupType)rows.push(['Setup',label(setupTypes,answers.setupType)]);
  if(answers.connection)rows.push(['Connection',label(connections,answers.connection)]);
  if(answers.upload)rows.push(['Upload',label(uploads,answers.upload)]);
  return rows;
}
