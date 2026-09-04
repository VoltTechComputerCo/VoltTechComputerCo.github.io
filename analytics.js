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
    '/pc-repair-pretoria.html':
      "Hi VoltTech! I'd like help with a PC repair or diagnostic. The problem I'm having is: ",
    '/pc-performance-optimisation.html':
      "Hi VoltTech! I'd like help improving my PC's performance. The main issue I'm noticing is: ",
    '/pc-upgrades-pretoria.html':
      "Hi VoltTech! I'm interested in upgrading my PC. I'm considering: ",
    '/virus-malware-removal-pretoria.html':
      "Hi VoltTech! I think my PC may have a virus or malware. The symptoms I'm seeing are: ",
    '/windows-installation-pretoria.html':
      "Hi VoltTech! I'd like help with a Windows installation or Windows-related issue. What I need is: "
  };

  function enhanceWhatsAppLinks() {
    const message =
      pageMessages[window.location.pathname] || pageMessages['/'];

    document
      .querySelectorAll('a[href^="https://wa.me/27618435775"]')
      .forEach((link) => {
        if (!link.href.includes('text=')) {
          link.href =
            whatsappBase + '?text=' + encodeURIComponent(message);
        }

        link.addEventListener('click', () => {
          gtag('event', 'whatsapp_click', {
            page_path: window.location.pathname,
            link_text: (link.textContent || '').trim()
          });
        });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      enhanceWhatsAppLinks
    );
  } else {
    enhanceWhatsAppLinks();
  }
})();
