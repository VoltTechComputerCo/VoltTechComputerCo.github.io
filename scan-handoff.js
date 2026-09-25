/* VoltTech V2 — Phase 7 / Diagnostic enquiry handoff
   Reads only the result already displayed on the page.
   No scan answers are transmitted until the user chooses WhatsApp or Email. */
(() => {
  if (window.__voltTechScanHandoff) return;
  window.__voltTechScanHandoff = true;

  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  const scanName = page === 'stream-scan.html' ? 'Stream Scan' : 'Signal Scan';
  const panel = document.getElementById('panel');
  if (!panel) return;

  function journeyContext() {
    try {
      const data = JSON.parse(sessionStorage.getItem('vt_journey_context') || 'null');
      if (!data || !data.label || Date.now() - Number(data.at || 0) > 2 * 60 * 60 * 1000) return '';
      return String(data.label);
    } catch {
      return '';
    }
  }

  function resultPayload() {
    const heading = panel.querySelector('h2')?.textContent?.trim() || '';
    const price = panel.querySelector('.price')?.textContent?.trim() || '';
    const rows = [...panel.querySelectorAll('.diag')].map(row => {
      const parts = [...row.querySelectorAll('span')].map(x => x.textContent.trim());
      return parts.length >= 2 ? [parts[0], parts[1]] : null;
    }).filter(Boolean);

    if (!heading || !panel.querySelector('.scan-actions')) return null;

    const startedFrom = journeyContext();
    const values = new Map(rows);
    const issue = values.get('Selected issue') || values.get('Issue') || '';
    const recommended = values.get('Recommended service') || values.get('Recommended') || '';
    const servicePath = values.get('Service path') || '';

    const lines = [
      'Hi VoltTech 👋',
      '',
      `I ran ${scanName} and would like help with the result.`,
      startedFrom ? `Started from: ${startedFrom}` : '',
      servicePath ? `Service path: ${servicePath}` : '',
      issue ? `Issue: ${issue}` : '',
      ...rows
        .filter(([label]) => !['Selected issue','Issue','Recommended service','Recommended','Service path'].includes(label))
        .map(([label, value]) => `${label}: ${value}`),
      `Likely result: ${heading}`,
      recommended ? `Recommended service: ${recommended}` : '',
      price ? `${scanName === 'Stream Scan' ? 'Estimated starting price' : 'Estimate'}: ${price}` : '',
      '',
      'Could you please review this and advise me on the next step?'
    ].filter(Boolean);

    return {
      text: lines.join('\n'),
      subject: `${scanName} result${startedFrom ? ' · ' + startedFrom : ''}`,
      heading,
      startedFrom
    };
  }

  function enhance() {
    const actions = panel.querySelector('.scan-actions');
    if (!actions || actions.dataset.vtHandoffReady === '1') return false;

    const payload = resultPayload();
    if (!payload) return false;

    const whatsapp = actions.querySelector('a[href*="wa.me/27618435775"]');
    const email = actions.querySelector('a[href^="mailto:volttechcomputerco@gmail.com"]');

    if (whatsapp) {
      whatsapp.href = `https://wa.me/27618435775?text=${encodeURIComponent(payload.text)}`;
      whatsapp.dataset.vtScanRoute = 'whatsapp';
    }

    if (email) {
      email.href = `mailto:volttechcomputerco@gmail.com?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.text)}`;
      email.dataset.vtScanRoute = 'email';
    }

    actions.dataset.vtHandoffReady = '1';

    try {
      sessionStorage.setItem('vt_last_scan_result', JSON.stringify({
        scan: scanName,
        result: payload.heading,
        startedFrom: payload.startedFrom || null,
        at: Date.now()
      }));
    } catch {}

    return true;
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-vt-scan-route]');
    if (!link) return;
    try {
      if (typeof gtag === 'function') {
        gtag('event', 'vt_diagnostic_handoff', {
          scan: scanName,
          route: link.dataset.vtScanRoute,
          source_context: journeyContext() || 'direct'
        });
      }
    } catch {}
  }, { capture: true });

  if (enhance()) return;

  const observer = new MutationObserver(() => {
    if (enhance()) observer.disconnect();
  });

  observer.observe(panel, { childList: true, subtree: true });
})();
