(() => {
  if (typeof window === 'undefined' || window.__NUSA_HERO_VIDEO_SOUND__) return;
  window.__NUSA_HERO_VIDEO_SOUND__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const videoSrc = `${base}/hero-indonesia.mp4`;
  const soundSrc = `${base}/sounds/jungle-ambient.mp3`;
  let soundOn = true;
  let audio = null;
  let button = null;

  function icon() {
    return soundOn
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';
  }

  function setButton() {
    if (!button) return;
    button.innerHTML = icon();
    button.setAttribute('aria-label', soundOn ? 'Apagar sonido' : 'Activar sonido');
  }

  async function playAudio() {
    if (!audio || !soundOn) return;
    audio.volume = 0.32;
    try { await audio.play(); } catch {}
  }

  function bindInteractionAutoplay() {
    const once = () => {
      playAudio();
      window.removeEventListener('touchstart', once);
      window.removeEventListener('click', once);
      window.removeEventListener('scroll', once);
    };
    window.addEventListener('touchstart', once, { once: true, passive: true });
    window.addEventListener('click', once, { once: true });
    window.addEventListener('scroll', once, { once: true, passive: true });
  }

  function replaceHero() {
    const oldImg = Array.from(document.querySelectorAll('img')).find((img) => (img.getAttribute('src') || '').includes('hero-bali'));
    if (!oldImg || oldImg.dataset.nusaVideoReplaced === '1') return;

    const parent = oldImg.parentElement;
    if (!parent) return;
    oldImg.dataset.nusaVideoReplaced = '1';

    const video = document.createElement('video');
    video.src = videoSrc;
    video.poster = `${base}/hero-bali.jpg`;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.className = oldImg.className || 'w-full h-[280px] sm:h-[400px] lg:h-[480px] object-cover';
    video.style.width = '100%';
    video.style.height = oldImg.clientHeight ? `${oldImg.clientHeight}px` : '';
    video.style.objectFit = 'cover';
    oldImg.replaceWith(video);
    video.play().catch(() => {});

    audio = parent.querySelector('audio') || document.createElement('audio');
    audio.src = soundSrc;
    audio.loop = true;
    audio.preload = 'auto';
    if (!audio.parentElement) parent.appendChild(audio);

    const oldSoundBtn = Array.from(parent.querySelectorAll('button')).find((b) => (b.getAttribute('aria-label') || '').toLowerCase().includes('sonido'));
    button = oldSoundBtn || document.createElement('button');
    button.type = 'button';
    button.className = oldSoundBtn?.className || 'absolute top-4 right-4 z-10 w-10 h-10 rounded-full backdrop-blur-sm transition grid place-items-center bg-black/45 text-white hover:bg-black/65';
    button.style.position = 'absolute';
    button.style.top = '16px';
    button.style.right = '16px';
    button.style.zIndex = '20';
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      soundOn = !soundOn;
      if (soundOn) playAudio(); else audio.pause();
      setButton();
    };
    if (!oldSoundBtn) parent.appendChild(button);
    setButton();
    playAudio();
    bindInteractionAutoplay();
  }

  document.addEventListener('DOMContentLoaded', replaceHero);
  new MutationObserver(replaceHero).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(replaceHero, 300);
  setTimeout(replaceHero, 1200);
})();
