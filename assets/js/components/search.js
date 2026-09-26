// A small, explicit index. Product search remains inside the Store.
const entries = [
  ['PC repair in Pretoria', 'Diagnostics and repairs', 'pc-repair-pretoria.html'],
  ['PC upgrades in Pretoria', 'Components, memory, graphics and storage', 'pc-upgrades-pretoria.html'],
  ['PC performance', 'Cooling, temperatures, FPS and stability', 'pc-performance-optimisation.html'],
  ['Windows support', 'Installation and software support', 'windows-installation-pretoria.html'],
  ['Malware and security', 'Virus removal and PC security', 'virus-malware-removal-pretoria.html'],
  ['Stream Support', 'OBS, Streamlabs, audio, capture, dropped frames and creator PCs', 'streaming-setup-south-africa.html'],
  ['Stream Scan', 'Guided OBS and Streamlabs diagnostic and estimate', 'stream-scan.html'],
  ['Signal Scan', 'Guided PC diagnostic and estimate', 'signal-scan.html'],
  ['PC Builder', 'Build planning — availability shown on arrival', 'builder/index.html'],
  ['Store', 'Components — availability shown on arrival', 'store.html'],
  ['Your account', 'Orders, quotes, documents and saved builds', 'account.html'],
  ['Creator Hub', 'South African creators and streams', 'creator-hub-south-africa.html'],
  ['STATIC', 'PC hardware articles and guides', 'static.html'],
  ['Building a PC in 2026', 'A practical guide to choosing components', 'static-building-a-pc-2026.html'],
  ['SSD vs HDD', 'Understanding storage upgrades', 'static-ssd-vs-hdd-2026.html'],
  ['PC throttling', 'Heat, clock speeds and performance', 'static-pc-throttling.html']
];
const base = new URL('../../../', import.meta.url);

export function enhanceSearch() {
  const input = document.querySelector('#site-search-input');
  const list = document.querySelector('#site-search-results');
  const status = document.querySelector('#site-search-status');
  if (!input || !list || !status) return;
  function render() {
    const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const results = entries.filter(row => words.every(word => row.slice(0, 2).join(' ').toLowerCase().includes(word)));
    list.replaceChildren();
    results.slice(0, 8).forEach(([title, detail, path]) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = new URL(path, base).href;
      link.textContent = title;
      const description = document.createElement('span');
      description.textContent = detail;
      link.append(description); li.append(link); list.append(li);
    });
    status.textContent = results.length ? `Showing ${Math.min(results.length, 8)} ${words.length ? 'matching' : 'popular'} pages.` : 'No matching pages. Try builds, repair, OBS or streaming.';
  }
  input.addEventListener('input', render);
  render();
}
