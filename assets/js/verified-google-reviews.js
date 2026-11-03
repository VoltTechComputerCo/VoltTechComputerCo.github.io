/* VoltTech Google Business Profile reviews: verified 2026-11-03.
 * Source: VoltTech's connected Google Business Profile, location
 * locations/17237262594295756801. No API credentials or home address
 * are exposed on this website. This is a dated snapshot, not a live feed.
 * Update only after checking the source profile again.
 */
(() => {
  'use strict';
  const business = Object.freeze({
    maps: 'https://maps.google.com/maps?cid=17012393896667890847',
    review: 'https://search.google.com/local/writereview?placeid=ChIJJSQx_k8YayoRn8TpDR0qGOw',
    count: 5,
    rating: '5.0',
    verified: '3 November 2026'
  });
  // Only authentic, verbatim customer text; Adriaan's long review is excerpted.
  const reviews = Object.freeze([
    {
      name: 'Adriaan Kruger',
      date: '30 Oct 2026',
      quote: 'VoltTech was super helpful with cleaning my PC and helping to fix heating issues.',
      excerpt: true
    },
    {
      name: 'Dylan Vermaak',
      date: '13 Sep 2026',
      quote: 'They helped me quick with my issue.. Affordable & Exceptional !! Definitely recommended'
    },
    {
      name: 'Fredrik Venter',
      date: '11 Jun 2026',
      quote: 'Great service, very friendly , can help with anything and works very fast would 100% recommend for any problems'
    },
    {
      name: 'Marius De Clercq',
      date: '8 Mar 2026',
      quote: 'Super smart guy! would recommend him anytime when it comes to computers!'
    }
  ]);
  // The fifth reviewer left a five-star rating with no written comment.
  const ratingOnly = { name: 'Gabrielle Nelson', date: '26 Oct 2026' };
  const safe = str => String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const stars = '<span class="vt-review-stars" aria-label="5 out of 5 stars">★★★★★</span>';

  function reviewCard(review) {
    return `<article class="vt-review-card">
      <div class="vt-review-card-top">${stars}<span class="vt-review-origin">Google Maps</span></div>
      <blockquote class="vt-review-quote">${safe(review.quote)}${review.excerpt ? '…' : ''}</blockquote>
      <div class="vt-review-byline"><strong>${safe(review.name)}</strong><span>${safe(review.date)}</span></div>
    </article>`;
  }

  function render() {
    const page = location.pathname.split('/').pop().toLowerCase() || 'index.html';
    const homepage = page === 'index.html';
    const relevantServices = new Set([
      'pc-repair-pretoria.html', 'pc-performance-optimisation.html',
      'pc-upgrades-pretoria.html', 'windows-installation-pretoria.html',
      'virus-malware-removal-pretoria.html'
    ]);
    if (!homepage && !relevantServices.has(page)) return;
    const anchor = homepage
      ? document.querySelector('.home-explore')
      : document.querySelector('.service-page .service-section#contact');
    if (!anchor || document.querySelector('.vt-google-reviews')) return;
    const featured = homepage ? reviews : reviews.slice(0, 2);
    const section = document.createElement('section');
    section.id = 'google-reviews';
    section.className = 'vt-google-reviews' + (homepage ? ' vt-google-reviews-home' : ' vt-google-reviews-service');
    section.setAttribute('aria-labelledby', 'vt-google-reviews-title');
    section.innerHTML = `
      <div class="container vt-reviews-shell">
        <div class="vt-reviews-heading">
          <div class="vt-reviews-intro">
            <p class="eyebrow">REAL CUSTOMER FEEDBACK</p>
            <h2 id="vt-google-reviews-title">What our customers say.</h2>
            <p>Feedback from customers who chose VoltTech for PC hardware and technical support.</p>
          </div>
          <div class="vt-reviews-score" aria-label="${business.rating} out of 5 stars from ${business.count} Google reviews">
            <span class="vt-score-line"><strong>${business.rating}</strong>${stars}</span>
            <span class="vt-score-source"><img src="google-logo.svg" alt="" width="21" height="21" loading="lazy"> ${business.count} reviews on Google Maps</span>
          </div>
        </div>
        <div class="vt-review-grid">${featured.map(reviewCard).join('')}</div>
        ${homepage ? `<p class="vt-review-rating-only">${stars} <strong>${safe(ratingOnly.name)}</strong> also left a five-star rating on ${safe(ratingOnly.date)} (no written comment).</p>` : ''}
        <div class="vt-reviews-bottom">
          <div class="vt-reviews-attribution">
            <img src="google-logo.svg" alt="" width="18" height="18" loading="lazy">
            <span>Customer reviews from <strong>Google Maps</strong>. Verified ${business.verified}; ratings may change.</span>
          </div>
          <div class="vt-reviews-actions">
            <a class="button button-secondary" href="${business.maps}" target="_blank" rel="noopener noreferrer">Read all Google reviews ↗</a>
            <a class="vt-reviews-write" href="${business.review}" target="_blank" rel="noopener noreferrer">Leave a review ↗</a>
          </div>
        </div>
      </div>`;
    anchor.before(section);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})();
