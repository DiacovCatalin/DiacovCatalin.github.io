/* ============================================================
   WARM AMBER CV — main.js
   Custom elements WITHOUT Shadow DOM. Pure vanilla JS.
   ============================================================ */

const ACCENT_BG = '#171310'; // placeholder image background color

/* ============================================================
   <carousel-item> — a single card/slide
   Attributes: title, image (optional), desc, tags (comma-separated)
   ============================================================ */
class CarouselItem extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || '';
    const image = this.getAttribute('image') || '';
    const desc = this.getAttribute('desc') || '';
    const tagsAttr = this.getAttribute('tags') || '';

    // Split tags on commas, trim whitespace, drop empty entries.
    const tags = tagsAttr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Build the image area: real <img> if provided, else placeholder div.
    let imageHtml;
    if (image) {
      imageHtml = `<img src="${image}" alt="${title}">`;
    } else {
      imageHtml =
        `<div class="card-image-placeholder">IMAGE PLACEHOLDER</div>`;
    }

    const tagsHtml = tags.map((t) => `<span class="tag">${t}</span>`).join('');

    this.innerHTML = `
      <article class="card">
        <div class="card-image">${imageHtml}</div>
        <div class="card-body">
          <h3 class="card-title">${title}</h3>
          <p class="card-desc">${desc}</p>
          <div class="card-tags">${tagsHtml}</div>
        </div>
      </article>
    `;
  }
}

/* ============================================================
   <content-carousel> — wrapper that turns <carousel-item>
   children into a navigable, single-visible carousel.
   Prev/next buttons + clickable dots + circular navigation.
   ============================================================ */
class ContentCarousel extends HTMLElement {
  connectedCallback() {
    // Snapshot the original <carousel-item> children before rebuilding.
    const items = Array.from(this.querySelectorAll('carousel-item'));
    this.innerHTML = '';

    // Build the carousel scaffold.
    this.innerHTML = `
      <div class="carousel">
        <div class="carousel-track"></div>
        <div class="carousel-nav">
          <button class="carousel-btn" data-dir="prev" aria-label="Previous">←</button>
          <div class="carousel-dots"></div>
          <button class="carousel-btn" data-dir="next" aria-label="Next">→</button>
        </div>
      </div>
    `;

    const track = this.querySelector('.carousel-track');
    const dotsWrap = this.querySelector('.carousel-dots');

    // Move all <carousel-item> children into the track.
    items.forEach((item) => {
      track.appendChild(item); // "item" keeps its rendered card markup
    });

    // All slides default to hidden. Custom elements that haven't been
    // connected yet render lazily, so force a re-render isn't needed —
    // but guard if the child connectedCallback already ran.
    items.forEach((item, i) => {
      item.style.display = 'none';
      // If the child was rendered before we moved it (e.g. it was already
      // in the page), connectedCallback has already run and innerHTML is set.
      // If it hasn't rendered yet, appending to the live DOM triggers
      // connectedCallback now, which builds the card markup.
    });

    // Build dot indicators (one per item).
    items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      dotsWrap.appendChild(dot);
    });

    this._items = items;
    this._index = 0;
    this._dots = Array.from(dotsWrap.children);

    // Wire up prev/next.
    const prevBtn = this.querySelector('[data-dir="prev"]');
    const nextBtn = this.querySelector('[data-dir="next"]');
    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());

    // Show the first slide and mark its dot active.
    this.goTo(0);
  }

  /* Show the slide at the given index (with circular wrap). */
  goTo(index) {
    const n = this._items.length;
    if (n === 0) return;

    // Ensure index stays within [0, n-1] circularly.
    index = ((index % n) + n) % n;
    this._index = index;

    this._items.forEach((item, i) => {
      item.style.display = i === index ? '' : 'none';
    });

    this._dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  /* Next slide (wraps to first on last). */
  next() {
    this.goTo(this._index + 1);
  }

  /* Previous slide (wraps to last on first). */
  prev() {
    this.goTo(this._index - 1);
  }
}

/* ============================================================
   Register custom elements
   ============================================================ */
customElements.define('carousel-item', CarouselItem);
customElements.define('content-carousel', ContentCarousel);

/* ============================================================
   Smooth scroll for in-page anchor links (nav + buttons)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ============================================================
   Footer: auto-fill the current year
   ============================================================ */
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/* ============================================================
   CERTIFICATE LIGHTBOX
   ============================================================ */
(function () {
  var lightbox = document.getElementById('cert-lightbox');
  if (!lightbox) { console.warn('[LB] No lightbox element found'); return; }

  var lbImg = lightbox.querySelector('img');
  var lbClose = lightbox.querySelector('.lightbox-close');

  function openLB(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('[LB] Opened:', src);
  }

  function closeLB() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(function() { lbImg.src = ''; }, 250);
    console.log('[LB] Closed');
  }

  document.addEventListener('click', function (e) {
    var certSection = document.getElementById('certificates');
    if (!certSection) return;
    var card = e.target.closest('#certificates .card');
    if (!card || !certSection.contains(card)) return;
    var img = card.querySelector('.card-image img');
    if (img && img.src) {
      e.preventDefault();
      e.stopPropagation();
      openLB(img.src, img.alt);
    }
  }, true);

  lbClose.addEventListener('click', closeLB);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLB();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLB();
  });

  console.log('[LB] Initialized successfully');
})();