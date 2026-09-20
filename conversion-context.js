/* VoltTech V2 — Phase 7 / Conversion Context
   Keeps service context intact across Signal Scan, WhatsApp and Email.
   Progressive enhancement only: existing links remain usable without JS. */
(() => {
  if (window.__voltTechConversionContext) return;
  window.__voltTechConversionContext = true;

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const routes = {
    'pc-repair-pretoria.html': {
      key: 'repair',
      label: 'PC Repair',
      scan: 'signal-scan.html?source=repair',
      subject: 'PC Repair Enquiry',
      intro: "Hi VoltTech 👋\n\nI’m coming from your PC Repair page. Here’s what my PC is doing:"
    },
    'pc-performance-optimisation.html': {
      key: 'performance',
      label: 'PC Performance',
      scan: 'signal-scan.html?source=performance',
      subject: 'PC Performance Enquiry',
      intro: "Hi VoltTech 👋\n\nI’m coming from your PC Performance page. Here’s what I’m noticing:"
    },
    'pc-upgrades-pretoria.html': {
      key: 'upgrades',
      label: 'PC Upgrades',
      scan: 'signal-scan.html?source=upgrades',
      subject: 'PC Upgrade Enquiry',
      intro: "Hi VoltTech 👋\n\nI’m looking at upgrading my PC. Here’s what I want to improve:"
    },
    'virus-malware-removal-pretoria.html': {
      key: 'security',
      label: 'PC Security',
      scan: 'signal-scan.html?source=security',
      subject: 'PC Security Enquiry',
      intro: "Hi VoltTech 👋\n\nI’m coming from your PC Security page. Here’s what I’m seeing on my PC:"
    },
    'windows-installation-pretoria.html': {
      key: 'windows',
      label: 'Windows Installation',
      scan: 'signal-scan.html?source=windows',
      subject: 'Windows Help Enquiry',
      intro: "Hi VoltTech 👋\n\nI’m looking for help with Windows. Here’s what I need:"
    },
    'streaming-setup-south-africa.html': {
      key: 'streaming',
      label: 'Streaming Support',
      scan: 'stream-scan.html',
      subject: 'Streaming Support Enquiry',
      intro: "Hi VoltTech 👋\n\nI’m coming from your Streaming Support page. Here’s what I need help with:"
    },
    'index.html': {
      key: 'home',
      label: 'VoltTech Home',
      subject: 'VoltTech Enquiry',
      intro: "Hi VoltTech 👋\n\nI’m looking for some tech help. Here’s what I need help with:"
    }
  };

  const route = routes[page];
  if (!route) return;

  try {
    sessionStorage.setItem('vt_journey_context', JSON.stringify({
      key: route.key,
      label: route.label,
      page,
      at: Date.now()
    }));
  } catch {}

  const ensureScanContext = () => {
    if (!route.scan) return;
    document.querySelectorAll('a[href^="signal-scan.html"],a[href^="stream-scan.html"]').forEach(a => {
      const raw = a.getAttribute('href') || '';
      if (raw.startsWith('signal-scan.html')) {
        const u = new URL(raw, location.href);
        if (!u.searchParams.get('source') && route.key !== 'home' && route.key !== 'streaming') {
          u.searchParams.set('source', route.key);
          a.setAttribute('href', u.pathname.split('/').pop() + u.search);
        }
      }
    });
  };

  const humanMessage = existing => {
    const cleaned = String(existing || '').trim();
    if (!cleaned) return route.intro + '\n\n';
    if (/coming from|looking at upgrading|looking for help/i.test(cleaned)) return cleaned;
    return `${route.intro}\n\n${cleaned.replace(/^Hi VoltTech[,\s]*/i, '').trim()}`.trim();
  };

  const enhanceWhatsApp = () => {
    document.querySelectorAll('a[href*="wa.me/27618435775"]').forEach(a => {
      try {
        const u = new URL(a.href);
        const existing = u.searchParams.get('text') || '';
        u.searchParams.set('text', humanMessage(existing));
        a.href = u.href;
        a.dataset.vtConversion = 'whatsapp';
      } catch {}
    });
  };

  const enhanceEmail = () => {
    document.querySelectorAll('a[href^="mailto:volttechcomputerco@gmail.com"]').forEach(a => {
      try {
        const raw = a.getAttribute('href') || '';
        const [address, query = ''] = raw.replace(/^mailto:/, '').split('?');
        const p = new URLSearchParams(query);
        if (!p.get('subject')) p.set('subject', route.subject);
        if (!p.get('body')) p.set('body', route.intro + '\n\n');
        a.setAttribute('href', `mailto:${address}?${p.toString()}`);
        a.dataset.vtConversion = 'email';
      } catch {}
    });
  };

  const tagScanLinks = () => {
    document.querySelectorAll('a[href^="signal-scan.html"],a[href^="stream-scan.html"]').forEach(a => {
      a.dataset.vtConversion = 'diagnostic';
    });
  };

  const trackIntent = event => {
    const a = event.target.closest('a[data-vt-conversion]');
    if (!a) return;
    try {
      if (typeof gtag === 'function') {
        gtag('event', 'vt_conversion_intent', {
          route: a.dataset.vtConversion,
          service_context: route.key,
          service_label: route.label,
          page_path: location.pathname
        });
      }
    } catch {}
  };

  ensureScanContext();
  enhanceWhatsApp();
  enhanceEmail();
  tagScanLinks();
  document.addEventListener('click', trackIntent, { capture: true });
})();