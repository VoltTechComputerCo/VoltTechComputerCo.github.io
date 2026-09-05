// VoltTech shared analytics + conversion helpers
window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

gtag('js', new Date());
gtag('config', 'G-QQ3CC70MBE');

(function () {
  const whatsappBase = 'https://wa.me/27618435775';

  const pageMessages = {
    '/': "Hi VoltTech! I'd like some help with my PC. My issue is: ",
    '/index.html': "Hi VoltTech! I'd like some help with my PC. My issue is: ",
    '/pc-repair-pretoria.html': "Hi VoltTech! I'd like help with a PC repair or diagnostic. The problem I'm having is: ",
    '/pc-performance-optimisation.html': "Hi VoltTech! I'd like help improving my PC's performance. The main issue I'm noticing is: ",
    '/pc-upgrades-pretoria.html': "Hi VoltTech! I'm interested in upgrading my PC. I'm considering: ",
    '/virus-malware-removal-pretoria.html': "Hi VoltTech! I think my PC may have a virus or malware. The symptoms I'm seeing are: ",
    '/windows-installation-pretoria.html': "Hi VoltTech! I'd like help with a Windows installation or Windows-related issue. What I need is: "
  };

  function installVisualSystem() {
    const path = window.location.pathname;
    // STATIC deliberately keeps its own editorial identity.
    if (/\/static(?:-|\.html|\/)/.test(path)) return;
    if (!document.querySelector('link[data-vt-visual-system]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'visual-system.css';
      link.dataset.vtVisualSystem = '1';
      document.head.appendChild(link);
    }
    const classes = {
      '/': 'vt-page-home', '/index.html': 'vt-page-home',
      '/pc-repair-pretoria.html': 'vt-page-repair',
      '/pc-performance-optimisation.html': 'vt-page-performance',
      '/pc-upgrades-pretoria.html': 'vt-page-upgrades',
      '/virus-malware-removal-pretoria.html': 'vt-page-malware',
      '/windows-installation-pretoria.html': 'vt-page-windows',
      '/signal-scan.html': 'vt-page-signal',
      '/streaming-setup-south-africa.html': 'vt-page-streaming',
      '/stream-scan.html': 'vt-page-streamscan'
    };
    if (classes[path]) document.body.classList.add(classes[path]);
  }

  function enhanceWhatsAppLinks() {
    const message = pageMessages[window.location.pathname] || pageMessages['/'];
    document.querySelectorAll('a[href^="https://wa.me/27618435775"]').forEach((link) => {
      if (!link.href.includes('text=')) link.href = whatsappBase + '?text=' + encodeURIComponent(message);
      link.addEventListener('click', () => {
        gtag('event', 'whatsapp_click', {page_path: window.location.pathname,link_text: (link.textContent || '').trim()});
      });
    });
  }

  function init(){ installVisualSystem(); enhanceWhatsAppLinks(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
