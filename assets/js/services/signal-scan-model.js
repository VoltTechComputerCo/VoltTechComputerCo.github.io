export const allowedSources = ['repair', 'performance', 'upgrades', 'security', 'windows'];
export const sourceInfo = {
  repair: { label: 'PC Repair', page: 'pc-repair-pretoria.html', question: "What's the PC doing?" },
  performance: { label: 'PC Performance', page: 'pc-performance-optimisation.html', question: 'Where does it feel slow?' },
  upgrades: { label: 'PC Upgrades', page: 'pc-upgrades-pretoria.html', question: 'What do you want to improve?' },
  security: { label: 'PC Security', page: 'virus-malware-removal-pretoria.html', question: 'What are you seeing?' },
  windows: { label: 'Windows Installation', page: 'windows-installation-pretoria.html', question: 'Why are you considering Windows setup or reinstall?' }
};
export const issueSets = {
  repair: [['boot', "Won't start / won't boot"], ['crash', 'Keeps crashing / blue screens'], ['heat', 'Running hot / loud fans'], ['slow', 'Slow or freezing'], ['windows', 'Windows problems'], ['other', 'Something else']],
  performance: [['startup', 'Slow startup'], ['fps', 'FPS drops'], ['stutter', 'Random stutters'], ['heat', 'Running hot'], ['disk', 'Disk always busy'], ['other', 'Just feels wrong']],
  upgrades: [['storage', 'Faster loading'], ['memory', 'More multitasking'], ['gaming', 'Better gaming'], ['cooling', 'Lower temperatures'], ['space', 'More storage'], ['unsure', 'Not sure what to upgrade']],
  security: [['popup', 'Pop-ups everywhere'], ['browser', 'Browser keeps changing'], ['slow', 'Suddenly very slow'], ['account', 'Account worries'], ['apps', 'Unknown apps'], ['other', 'Something feels off']],
  windows: [['corrupt', 'Windows is broken'], ['fresh', 'I want a clean start'], ['drive', 'New SSD or drive'], ['malware', 'After malware'], ['slow', 'PC feels slow'], ['other', 'Not sure yet']]
};
export const contextMap = {
  repair: { boot: 'noboot', crash: 'bsod', heat: 'heat', slow: 'slow', windows: 'windows', other: 'repair' },
  performance: { startup: 'slow', fps: 'slow', stutter: 'slow', heat: 'heat', disk: 'slow', other: 'slow' },
  upgrades: { storage: 'upgrade', memory: 'upgrade', gaming: 'upgrade', cooling: 'upgrade', space: 'upgrade', unsure: 'upgrade' },
  security: { popup: 'virus', browser: 'virus', slow: 'virus', account: 'virus', apps: 'virus', other: 'virus' },
  windows: { corrupt: 'windows', fresh: 'windows', drive: 'windows', malware: 'windows', slow: 'windows', other: 'windows' }
};
export const genericSymptoms = [['slow', 'Running slow / laggy'], ['noboot', "Won't turn on / won't boot"], ['heat', 'Overheating / loud fans'], ['bsod', 'Crashes / blue screens'], ['virus', 'Pop-ups / suspected virus'], ['upgrade', 'Want an upgrade / more performance'], ['windows', 'Windows install / fresh start']];
export const durations = [['today', 'Just started today'], ['days', 'A few days now'], ['weeks', 'A few weeks'], ['months', "Months — I've been living with it"]];
export const ages = [['new', 'Under 2 years old'], ['mid', '2 – 5 years old'], ['old', '5+ years old'], ['unknown', 'Not sure']];
export const uses = [['daily', 'Everyday use / work'], ['gaming', 'Gaming'], ['creation', '3D / content creation / engineering'], ['unsure', 'Not sure']];
export const backups = [['ready', 'My important files are backed up'], ['needhelp', 'I need help backing up first'], ['none', 'There is nothing important to keep'], ['unknown', 'Not sure']];

export const resultData = {
  repair: {
    default: ['PC diagnostics', 'The symptoms need fault isolation before parts or a reinstall are recommended.', 'R350–R650', 'PC Repair & Diagnostics'],
    boot: ['Boot / power fault', 'Power, RAM, storage, graphics and the boot path can produce similar no-start symptoms. Hands-on diagnosis is the sensible next step.', 'R350–R650', 'PC Repair & Diagnostics'],
    crash: ['System instability', 'Repeated crashes can come from memory, drivers, heat, storage, power or failing hardware. The error alone does not identify the cause.', 'R350–R650', 'PC Repair & Diagnostics'],
    heat: ['Thermal / cooling fault', 'Dust, airflow, a failing fan or degraded thermal interface can cause heat, noise and throttling.', 'R350–R550', 'PC Repair & Diagnostics'],
    slow: ['Performance / system fault', 'Storage, startup load, memory pressure, heat or Windows problems can make the whole PC feel slow.', 'R350–R550', 'PC Repair & Diagnostics'],
    windows: ['Windows / system fault', 'Windows corruption, failed updates, drivers or storage problems can overlap, so the cause should be checked before wiping the system.', 'R350–R650', 'PC Repair & Diagnostics'],
    other: ['PC diagnostics', 'The symptom does not point cleanly to one component, so a general diagnostic is the safest starting point.', 'R350–R650', 'PC Repair & Diagnostics']
  },
  performance: {
    default: ['Performance bottleneck', 'The system appears to need performance diagnosis rather than a blind upgrade.', 'R350–R550', 'PC Performance Optimisation'],
    startup: ['Startup / storage bottleneck', 'Startup apps, background services, storage health and Windows configuration can all drag out boot time.', 'R350–R550', 'PC Performance Optimisation'],
    fps: ['Gaming performance bottleneck', 'Thermals, drivers, background load and CPU/GPU limits can all produce inconsistent FPS.', 'R350–R550', 'PC Performance Optimisation'],
    stutter: ['System performance instability', 'Short freezes can come from storage, memory pressure, drivers, heat or background tasks.', 'R350–R550', 'PC Performance Optimisation'],
    heat: ['Thermal throttling / cooling', 'High temperatures can reduce boost behaviour and make the PC noisier or slower under load.', 'R350–R550', 'PC Performance Optimisation'],
    disk: ['Storage bottleneck', 'A struggling drive, low free space or heavy background activity can make the whole system wait on storage.', 'R350–R550', 'PC Performance Optimisation'],
    other: ['Performance assessment', 'A performance check can separate software load, thermals, storage and genuine hardware limits.', 'R350–R550', 'PC Performance Optimisation']
  },
  upgrades: {
    default: ['Upgrade assessment', 'We can identify the part most likely to improve the experience before you spend on hardware.', 'From R299', 'PC Hardware Upgrades'],
    storage: ['SSD / NVMe upgrade assessment', 'A faster system drive can transform responsiveness when storage is the real bottleneck. Compatibility and migration scope still need checking.', 'From R299', 'PC Hardware Upgrades'],
    memory: ['RAM upgrade assessment', 'More memory helps when the workload is actually running out of RAM. Capacity, type and platform support need checking first.', 'From R299', 'PC Hardware Upgrades'],
    gaming: ['Gaming upgrade assessment', 'GPU, CPU, power supply, cooling and the games you play all matter. The best-value upgrade is not automatically the most expensive part.', 'From R299', 'PC Hardware Upgrades'],
    cooling: ['Cooling upgrade assessment', 'Better cooling can reduce noise or throttling, but first it helps to confirm whether temperature is actually the limiter.', 'From R299', 'PC Hardware Upgrades'],
    space: ['Storage capacity upgrade', 'Extra SSD or HDD capacity may be straightforward, but available slots, interfaces and use case should be checked first.', 'From R299', 'PC Hardware Upgrades'],
    unsure: ['Upgrade consultation', 'Start with what feels limiting and work backwards to the component that would make a real difference.', 'From R299', 'PC Hardware Upgrades']
  },
  security: {
    default: ['Possible malware / unwanted software', 'The symptoms can be caused by malware, unwanted software or browser changes, but Signal Scan cannot confirm an infection remotely.', 'R350–R550', 'Virus & Malware Removal'],
    popup: ['Possible adware / unwanted software', 'Repeated pop-ups and fake warnings are consistent with unwanted software or abusive browser notifications, but the device still needs checking.', 'R350–R550', 'Virus & Malware Removal'],
    browser: ['Possible browser hijack', 'Unexpected redirects, search changes or unfamiliar extensions can indicate unwanted browser changes or malware.', 'R350–R550', 'Virus & Malware Removal'],
    slow: ['Security or system slowdown', 'A sudden slowdown can have many causes. Malware is one possibility, but storage, background load and Windows issues should not be ruled out.', 'R350–R550', 'Virus & Malware Removal'],
    account: ['Account-risk check', 'Account concerns do not prove the PC is infected. If sensitive credentials may be exposed, change them from a trusted device and review the PC separately.', 'R350–R550', 'Virus & Malware Removal'],
    apps: ['Unknown software check', 'Programs you did not intentionally install can be unwanted software, bundled utilities or malware. They should be identified before removal.', 'R350–R550', 'Virus & Malware Removal'],
    other: ['Security check', 'Something changed, but the symptom alone is not enough to confirm malware. A careful check is more useful than a scare-based conclusion.', 'R350–R550', 'Virus & Malware Removal']
  },
  windows: {
    default: ['Windows setup / reinstall assessment', 'A clean Windows setup may be appropriate, but backup needs, storage health, activation and driver work affect the final scope.', 'R350–R650', 'Windows Installation'],
    corrupt: ['Windows repair / reinstall assessment', 'Startup errors, corruption or failed updates can justify a reinstall, but storage and hardware faults should be ruled out first.', 'R350–R650', 'Windows Installation'],
    fresh: ['Clean Windows setup', 'A clean start is straightforward once backup needs, activation and the target drive are confirmed.', 'R350–R650', 'Windows Installation'],
    drive: ['Windows on a new drive', 'A new SSD or drive needs the correct installation target, drivers, updates and any required data migration planned first.', 'R350–R650', 'Windows Installation'],
    malware: ['Clean rebuild after malware', 'A clean reinstall can be the safer recovery path after some infections, especially when system integrity is uncertain.', 'R350–R650', 'Windows Installation'],
    slow: ['Reinstall suitability check', 'A reinstall is not automatically the right fix for a slow PC. Storage, thermals and hardware limits may be the real cause.', 'R350–R650', 'Windows Installation'],
    other: ['Windows setup assessment', 'We can first confirm whether a reinstall is actually the sensible next step and what needs to be preserved.', 'R350–R650', 'Windows Installation']
  }
};

export function createAnswers() { return { symptom: null, context: null, duration: null, age: null, usage: null, backup: null }; }
export function label(rows, value) { return rows.find(row => row[0] === value)?.[1] || ''; }
export function scanMode(answers, source = null) {
  if (source) return source;
  if (['noboot', 'bsod', 'repair'].includes(answers.symptom)) return 'repair';
  if (['slow', 'heat'].includes(answers.symptom)) return 'performance';
  if (answers.symptom === 'virus') return 'security';
  if (answers.symptom === 'upgrade') return 'upgrades';
  if (answers.symptom === 'windows') return 'windows';
  return 'repair';
}
export function applyContext(answers, source, value) {
  answers.context = value;
  if (source) answers.symptom = contextMap[source]?.[value] || null;
  return answers;
}
export function scanQuestions(answers, source = null) {
  const rows = [];
  if (source) rows.push({ key: 'context', title: sourceInfo[source].question, options: issueSets[source] });
  else rows.push({ key: 'symptom', title: 'What do you need help with?', options: genericSymptoms });
  if (!answers.symptom) return rows;
  const currentMode = scanMode(answers, source);
  if (currentMode === 'upgrades') {
    if (!source) rows.push({ key: 'context', title: 'What do you want to improve?', options: issueSets.upgrades });
    rows.push({ key: 'age', title: 'Roughly how old is the PC?', options: ages }, { key: 'usage', title: 'What do you mainly use it for?', options: uses });
  } else if (currentMode === 'windows') {
    if (!source) rows.push({ key: 'context', title: 'Why are you considering Windows setup or reinstall?', options: issueSets.windows });
    rows.push({ key: 'backup', title: 'What is the backup situation?', options: backups }, { key: 'age', title: 'Roughly how old is the PC?', options: ages });
  } else {
    rows.push({ key: 'duration', title: 'How long has this been happening?', options: durations }, { key: 'age', title: 'Roughly how old is the PC?', options: ages }, { key: 'usage', title: 'What do you mainly use it for?', options: uses });
  }
  return rows;
}
export function urgencyScore(answers, source = null) {
  const urgencyBase = { upgrade: .12, windows: .16, slow: .23, virus: .34, repair: .32, heat: .43, bsod: .56, noboot: .62 };
  const contextUrgency = {
    repair: { boot: .06, crash: .05, heat: .04, slow: 0, windows: .01, other: 0 },
    performance: { startup: 0, fps: .02, stutter: .03, heat: .04, disk: .01, other: 0 },
    upgrades: { storage: 0, memory: 0, gaming: .01, cooling: .01, space: 0, unsure: 0 },
    security: { popup: .02, browser: .02, slow: 0, account: .06, apps: .03, other: 0 },
    windows: { corrupt: .07, fresh: 0, drive: 0, malware: .06, slow: .01, other: 0 }
  };
  let score = urgencyBase[answers.symptom] ?? .08;
  if (answers.context) score += contextUrgency[scanMode(answers, source)]?.[answers.context] || 0;
  if (answers.duration === 'days') score += .02;
  if (answers.duration === 'weeks') score += .03;
  if (answers.duration === 'months') score += .02;
  if (answers.age === 'old') score += .04;
  if (answers.usage === 'creation') score += .01;
  return Math.max(.08, Math.min(.82, score));
}
export function resultConfig(answers, source = null) {
  const currentMode = scanMode(answers, source);
  const table = resultData[currentMode];
  return table[answers.context] || table.default;
}
export function contextLabel(answers, source = null) {
  const currentMode = scanMode(answers, source);
  if (answers.context) return label(issueSets[currentMode], answers.context);
  return label(genericSymptoms, answers.symptom) || sourceInfo[currentMode]?.label || 'PC support';
}
export function resultRows(answers) {
  const rows = [];
  if (answers.duration) rows.push(['Duration', label(durations, answers.duration)]);
  if (answers.age) rows.push(['PC age', label(ages, answers.age)]);
  if (answers.usage) rows.push(['Main use', label(uses, answers.usage)]);
  if (answers.backup) rows.push(['Backup', label(backups, answers.backup)]);
  return rows;
}
