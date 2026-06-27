(() => {
  if (typeof window === 'undefined' || window.__NUSA_IMAGE_FALLBACKS__) return;
  window.__NUSA_IMAGE_FALLBACKS__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const elephant = [
    '/elefantes/01_mason_elephant_park.jpg',
    '/elefantes/02_bali_elephant_camp.jpg',
    '/elefantes/03_elephant_safari_lodge.jpg',
    '/elefantes/05_elephant_painting_ubud.jpg',
    '/elefantes/06_taro_conservation.jpg',
    '/elefantes/07_elephant_bathing_river.jpg',
    '/elefantes/08_night_safari_elephants.jpg',
    '/elefantes/09_elephant_art_studio.jpg'
  ].map((src) => base + src);

  function full(src) {
    if (!src || src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    if (src.startsWith(base + '/')) return src;
    if (src.startsWith('/')) return base + src;
    return base + '/' + src;
  }

  function fallbackFor(src, index) {
    if (!src) return elephant[index % elephant.length];
    if (src.includes('/foto-2.')) return src.replace('/foto-2.', '/foto-1.');
    if (src.includes('/foto-3.')) return src.replace('/foto-3.', '/foto-1.');
    if (src.includes('/foto-4.')) return src.replace('/foto-4.', '/foto-1.');
    if (src.includes('/elefantes/')) return elephant[index % elephant.length];
    return src;
  }

  function bindGalleryClicks() {
    document.querySelectorAll('[role="dialog"], [data-radix-dialog-content], .nusa-scroll').forEach((dialog) => {
      const imgs = Array.from(dialog.querySelectorAll('img'));
      if (imgs.length < 2) return;
      const main = imgs.find((img) => img.clientWidth > 180 || img.className.includes('h-48')) || imgs[0];
      imgs.forEach((img) => {
        if (img === main || img.dataset.nusaGalleryBound) return;
        img.dataset.nusaGalleryBound = '1';
        img.style.cursor = 'pointer';
        img.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const src = full(img.getAttribute('src') || '');
          if (src) main.setAttribute('src', src);
          imgs.forEach((x) => x.style.outline = '');
          img.style.outline = '2px solid #00d5ff';
          img.style.outlineOffset = '2px';
        });
      });
    });
  }

  function repair() {
    document.querySelectorAll('img').forEach((img, index) => {
      const current = img.getAttribute('src') || '';
      const normalized = full(current);
      if (normalized && normalized !== current) img.setAttribute('src', normalized);
      img.loading = img.loading || 'lazy';
      img.decoding = img.decoding || 'async';
      if (!img.dataset.nusaFallbackBound) {
        img.dataset.nusaFallbackBound = '1';
        img.addEventListener('error', () => {
          const now = img.getAttribute('src') || '';
          const next = fallbackFor(now, index);
          if (next && next !== now && !img.dataset.nusaFallbackUsed) {
            img.dataset.nusaFallbackUsed = '1';
            img.setAttribute('src', full(next));
          } else if (img.naturalWidth === 0) {
            img.style.visibility = 'hidden';
          }
        });
      }
    });

    document.querySelectorAll('[style]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      const next = style.replace(/url\(["']?([^"')]+)["']?\)/g, (match, src) => {
        return 'url(' + full(src) + ')';
      });
      if (next !== style) el.setAttribute('style', next);
    });

    bindGalleryClicks();
  }

  document.addEventListener('DOMContentLoaded', repair);
  new MutationObserver(repair).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'style', 'class'] });
  setInterval(repair, 1200);
})();
