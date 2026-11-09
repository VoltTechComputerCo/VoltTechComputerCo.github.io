const siteRoot = new URL('../../../', document.currentScript.src);
const isHub = document.body.classList.contains('static-zine');

const timelines = {
  gaming: {
    title: 'Gaming',
    chapters: [
      { years: '1990s–2000s', label: 'CRTs & LAN parties', sticker: 'ONE MORE ROUND', collage: 'zine-gaming-collage.webp' },
      { years: '2010s', label: 'Headsets & lobbies', sticker: 'BLAME THE PING', collage: 'timeline-mid-gaming.webp' },
      { years: '2020s', label: 'Streaming & desk setups', sticker: 'TOUCH GRASS? LATER.', photos: [
        'vt-px-streaming-setup.webp',
        'vt-px-desk-rig-2.webp',
        'vt-px-pc-components.webp',
      ] },
    ],
  },
  tech: {
    title: 'Tech',
    chapters: [
      { years: '1990s–2000s', label: 'Beige boxes & discs', sticker: 'IT BOOTS. DON’T TOUCH IT.', collage: 'zine-tech-collage.webp' },
      { years: '2010s', label: 'Windowed cases & SSDs', sticker: 'RGB ADDS 10 FPS*', collage: 'timeline-mid-tech.webp' },
      { years: '2020s', label: 'Inside today’s PCs', sticker: 'IT WORKED YESTERDAY', photos: [
        'assets/photography/white-pc-completed.webp',
        'vt-px-gaming-rig-2.webp',
        'vt-px-gaming-desk.webp',
      ] },
    ],
  },
};

function createStrip(side, timeline) {
  const strip = document.createElement('div');
  strip.className = 'timeline-strip timeline-strip-' + side;
  strip.setAttribute('aria-hidden', 'true');

  timeline.chapters.forEach((chapter, index) => {
    const panel = document.createElement('div');
    panel.className = 'timeline-chapter timeline-chapter-' + index;

    const sources = chapter.photos ?? Array(3).fill('assets/images/static/' + chapter.collage);
    sources.forEach((source, shotIndex) => {
      const scrap = document.createElement('div');
      scrap.className = 'timeline-scrap' + (chapter.collage ? ' timeline-scrap-crop' : '');
      const image = document.createElement('img');
      image.src = new URL(source, siteRoot);
      image.alt = '';
      image.decoding = 'async';
      image.loading = index === 0 && shotIndex === 0 ? 'eager' : 'lazy';
      scrap.append(image);
      panel.append(scrap);
    });

    const caption = document.createElement('p');
    caption.className = 'timeline-era';
    const years = document.createElement('strong');
    years.textContent = chapter.years;
    caption.append(years, timeline.title + ' / ' + chapter.label);

    const sticker = document.createElement('span');
    sticker.className = 'timeline-sticker';
    sticker.textContent = chapter.sticker;
    panel.append(caption, sticker);
    strip.append(panel);
  });

  return strip;
}

if (isHub) {
  for (const [side, selector] of [['gaming', '.zine-rail-games'], ['tech', '.zine-rail-tech']]) {
    const rail = document.querySelector(selector);
    const figure = rail.querySelector('.zine-collage');
    const link = rail.querySelector('.zine-rail-link');
    const note = rail.querySelector('.zine-note');
    const sticker = rail.querySelector('.zine-micro-sticker');
    figure.replaceWith(createStrip(side, timelines[side]));
    note.remove();
    sticker.remove();
    rail.querySelector('.zine-rail-title').after(link);
  }
  document.body.classList.add('timeline-ready');
} else {
  const rails = document.createElement('div');
  rails.className = 'timeline-article-strips';
  rails.setAttribute('aria-hidden', 'true');
  for (const [side, timeline] of Object.entries(timelines)) rails.append(createStrip(side, timeline));
  document.body.append(rails);
}
