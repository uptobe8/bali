(() => {
  if (typeof window === 'undefined' || window.__NUSA_FINAL_FIX__) return;
  window.__NUSA_FINAL_FIX__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const originalFetch = window.fetch.bind(window);
  const extraElephant = [
    '/elefantes/06_taro_conservation.jpg',
    '/elefantes/08_night_safari_elephants.jpg',
    '/elefantes/09_elephant_art_studio.jpg',
    '/elefantes/10_elephant_wellness_yoga.jpg',
    '/elefantes/17_elephant_hospital.jpg',
    '/elefantes/15_elephant_patrol_riau.jpg',
    '/elefantes/16_seblat_conservation.jpg',
    '/elefantes/22_ujung_kulon_safari.jpg',
    '/elefantes/23_borneo_kinabatangan.jpg',
    '/elefantes/24_danum_valley_tracking.jpg'
  ];
  const elephantByManifestId = {
    1: '/elefantes/01_mason_elephant_park.jpg',
    2: '/elefantes/03_elephant_safari_lodge.jpg',
    3: '/elefantes/05_elephant_painting_ubud.jpg',
    4: '/elefantes/12_taman_safari_elephants.jpg',
    9: '/elefantes/20_surabaya_zoo_elephants.jpg',
    14: '/elefantes/11_sumatra_conservation_aceh.jpg',
    15: '/elefantes/07_elephant_bathing_river.jpg',
    16: '/elefantes/18_flying_camp_riau.jpg',
    19: '/elefantes/13_way_kambas_safari.jpg',
    20: '/elefantes/14_wild_elephants_clearing.jpg'
  };

  function full(src) {
    if (!src || typeof src !== 'string') return src;
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    if (src.startsWith(base + '/')) return src;
    if (src.startsWith('/')) return base + src;
    return base + '/' + src;
  }

  function inferPhoto(src, n) {
    if (!src || typeof src !== 'string') return src;
    if (src.includes('/foto-1.')) return src.replace('/foto-1.', `/foto-${n}.`);
    if (src.includes('-01.')) return src.replace('-01.', `-0${n}.`);
    return src;
  }

  function uniquePhotos(item, index) {
    const slugId = Number(item.manifestId || item.idManifest || item.originalId || item.order || index + 1);
    const primary = elephantByManifestId[slugId] || item.foto1 || item.image || item.imageUrl || extraElephant[index % extraElephant.length];
    const p1 = full(primary);
    const p2 = full(item.foto2 && item.foto2 !== primary ? item.foto2 : extraElephant[index % extraElephant.length]);
    const p3 = full(item.foto3 && item.foto3 !== primary && item.foto3 !== item.foto2 ? item.foto3 : extraElephant[(index + 3) % extraElephant.length]);
    return { ...item, foto1: p1, foto2: p2 === p1 ? full(extraElephant[(index + 1) % extraElephant.length]) : p2, foto3: p3 === p1 || p3 === p2 ? full(extraElephant[(index + 4) % extraElephant.length]) : p3 };
  }

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    try {
      const raw = typeof input === 'string' ? input : input?.url || '';
      const url = new URL(raw, location.origin);
      const path = url.pathname.replace(base, '');
      if (!path.startsWith('/api/')) return response;
      const data = await response.clone().json();
      if (path === '/api/elefantes' && Array.isArray(data.elephants)) {
        data.elephants = data.elephants.map(uniquePhotos);
        return new Response(JSON.stringify(data), { status: response.status, headers: { 'content-type': 'application/json' } });
      }
      if (path === '/api/playas' && Array.isArray(data.playas)) {
        data.playas = data.playas.map((p) => {
          const f1 = full(p.foto1 || p.image || p.imageUrl);
          const f2 = full(p.foto2 || inferPhoto(f1, 2));
          const f3 = full(p.foto3 || inferPhoto(f1, 3));
          return { ...p, foto1: f1, foto2: f2, foto3: f3 };
        });
        return new Response(JSON.stringify(data), { status: response.status, headers: { 'content-type': 'application/json' } });
      }
    } catch {}
    return response;
  };

  function makeGalleriesClickable() {
    document.querySelectorAll('[role="dialog"], [data-radix-dialog-content], .nusa-card-paper, body').forEach((scope) => {
      const imgs = Array.from(scope.querySelectorAll('img')).filter((img) => img.offsetParent !== null);
      if (imgs.length < 2) return;
      const main = imgs.find((img) => img.clientWidth > 160 && img.clientHeight > 120) || imgs[0];
      imgs.forEach((img) => {
        if (img === main || img.dataset.nusaClickableGallery) return;
        img.dataset.nusaClickableGallery = '1';
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const current = main.getAttribute('src') || '';
          const next = img.getAttribute('src') || '';
          if (next) {
            main.setAttribute('src', next);
            img.setAttribute('src', current || next);
          }
        });
      });
    });
  }

  function hideInicioSummary() {
    document.querySelectorAll('.nusa-panel').forEach((panel) => {
      const text = panel.textContent || '';
      if (text.includes('Ver itinerario') && text.includes('Regenerar con estos datos')) panel.remove();
    });
  }

  function fixMobileNav() {
    const headerInner = document.querySelector('header.nusa-no-print > div');
    const nav = document.querySelector('header.nusa-no-print nav');
    if (headerInner) headerInner.classList.add('nusa-mobile-header');
    if (nav) nav.classList.add('nusa-mobile-nav');
  }

  function run() {
    hideInicioSummary();
    fixMobileNav();
    makeGalleriesClickable();
  }

  document.addEventListener('DOMContentLoaded', run);
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(run, 1200);
})();
