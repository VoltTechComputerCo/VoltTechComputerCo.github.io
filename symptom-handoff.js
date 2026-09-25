/* VoltTech V2 — Phase 7 / Symptom continuity
   Carries the customer's selected service-page symptom into Signal Scan
   and into direct WhatsApp/email enquiry context. */
(() => {
  if (window.__voltTechSymptomHandoff) return;
  window.__voltTechSymptomHandoff = true;

  const page = (location.pathname.split('/').pop() || '').toLowerCase();

  const pageConfig = {
    'pc-repair-pretoria.html': { source: 'repair', label: 'PC Repair' },
    'pc-performance-optimisation.html': { source: 'performance', label: 'PC Performance' },
    'pc-upgrades-pretoria.html': { source: 'upgrades', label: 'PC Upgrades' },
    'virus-malware-removal-pretoria.html': { source: 'security', label: 'PC Security' },
    'windows-installation-pretoria.html': { source: 'windows', label: 'Windows Installation' }
  };

  const config = pageConfig[page];
  if (!config) return;

  let currentIssue = '';
  let currentLabel = '';

  function selectedButton() {
    return document.querySelector('#symptomRail .symptom.active[data-key]') ||
           document.querySelector('#symptomRail .symptom[data-key]');
  }

  function buttonLabel(button) {
    if (!button) return '';
    return button.querySelector('b')?.textContent?.trim() ||
           button.textContent?.trim() ||
           '';
  }

  function updateDiagnosticLinks() {
    document.querySelectorAll('a[href^="signal-scan.html"]').forEach(a => {
      try {
        const raw = a.getAttribute('href') || 'signal-scan.html';
        const u = new URL(raw, location.href);
        u.searchParams.set('source', config.source);
        if (currentIssue) u.searchParams.set('issue', currentIssue);
        else u.searchParams.delete('issue');
        a.setAttribute('href', u.pathname.split('/').pop() + u.search);
      } catch {}
    });
  }

  function updateJourneyContext() {
    try {
      sessionStorage.setItem('vt_journey_context', JSON.stringify({
        key: config.source,
        label: config.label,
        issue: currentIssue || null,
        issueLabel: currentLabel || null,
        page,
        at: Date.now()
      }));
    } catch {}
  }

  function updateDirectContact() {
    document.querySelectorAll('a[href*="wa.me/27618435775"]').forEach(a => {
      try {
        const u = new URL(a.href);
        const existing = u.searchParams.get('text') || '';
        const issueLine = currentLabel ? `\nSelected issue: ${currentLabel}` : '';
        const marker = `Selected issue:`;
        let text = existing || `Hi VoltTech 👋\n\nI’m coming from your ${config.label} page.`;

        if (text.includes(marker)) {
          text = text.replace(/Selected issue:[^\n]*/i, currentLabel ? `Selected issue: ${currentLabel}` : '');
        } else if (currentLabel) {
          text = `${text.trim()}${issueLine}\n`;
        }

        u.searchParams.set('text', text.trim() + '\n\n');
        a.href = u.href;
      } catch {}
    });

    document.querySelectorAll('a[href^="mailto:volttechcomputerco@gmail.com"]').forEach(a => {
      try {
        const raw = a.getAttribute('href') || '';
        const [address, query = ''] = raw.replace(/^mailto:/, '').split('?');
        const p = new URLSearchParams(query);
        const baseSubject = p.get('subject') || `${config.label} Enquiry`;
        p.set('subject', currentLabel ? `${baseSubject} · ${currentLabel}` : baseSubject);

        let body = p.get('body') || `Hi VoltTech,\n\nI’m coming from your ${config.label} page.`;
        if (currentLabel) {
          if (/Selected issue:/i.test(body)) {
            body = body.replace(/Selected issue:[^\n]*/i, `Selected issue: ${currentLabel}`);
          } else {
            body = `${body.trim()}\nSelected issue: ${currentLabel}\n`;
          }
        }
        p.set('body', body.trim() + '\n\n');
        a.setAttribute('href', `mailto:${address}?${p.toString()}`);
      } catch {}
    });
  }

  function setIssue(button) {
    if (!button?.dataset?.key) return;
    currentIssue = button.dataset.key;
    currentLabel = buttonLabel(button);
    updateDiagnosticLinks();
    updateJourneyContext();
    updateDirectContact();

    try {
      if (typeof gtag === 'function') {
        gtag('event', 'vt_service_symptom_select', {
          service_context: config.source,
          issue: currentIssue,
          issue_label: currentLabel
        });
      }
    } catch {}
  }

  const initial = selectedButton();
  if (initial) setIssue(initial);
  else {
    updateDiagnosticLinks();
    updateJourneyContext();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('#symptomRail .symptom[data-key]');
    if (!button) return;

    /* Run after the page's own symptom UI click handler updates active state/detail. */
    queueMicrotask(() => setIssue(button));
  });
})();
