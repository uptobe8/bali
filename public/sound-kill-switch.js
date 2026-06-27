(() => {
  if (typeof window === 'undefined' || window.__NUSA_SOUND_KILL_SWITCH__) return;
  window.__NUSA_SOUND_KILL_SWITCH__ = true;

  const KEY = 'nusa-sound-enabled';
  const wantsSound = () => ['1', 'true', 'on'].includes(String(localStorage.getItem(KEY)).toLowerCase());
  const setWanted = (value) => localStorage.setItem(KEY, value ? 'true' : 'false');

  function allMedia() {
    return Array.from(document.querySelectorAll('audio, video'));
  }

  function applySound(on) {
    setWanted(on);
    allMedia().forEach((media) => {
      try {
        if (on) {
          media.muted = false;
          media.volume = media.tagName === 'AUDIO' ? 0.32 : 0.72;
          media.play && media.play().catch(() => {});
        } else {
          media.muted = true;
          media.volume = 0;
          if (media.tagName === 'AUDIO') {
            media.pause();
            media.currentTime = 0;
          }
        }
      } catch {}
    });

    document.querySelectorAll('.nusa-sound-toggle, .nusa-hero-sound-toggle, button[aria-label*="sonido"], button[aria-label*="Sonido"], button[aria-label*="selva"], button[aria-label*="Selva"]').forEach((btn) => {
      btn.classList.toggle('on', on);
      if (btn.classList.contains('nusa-sound-toggle')) btn.textContent = on ? '🔊 Selva ON' : '🔇 Selva OFF';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function bindButtons() {
    document.querySelectorAll('.nusa-sound-toggle, .nusa-hero-sound-toggle, button[aria-label*="sonido"], button[aria-label*="Sonido"], button[aria-label*="selva"], button[aria-label*="Selva"]').forEach((btn) => {
      if (btn.dataset.nusaSoundFixed) return;
      btn.dataset.nusaSoundFixed = '1';
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        applySound(!wantsSound());
      }, true);
    });
  }

  function boot() {
    bindButtons();
    applySound(wantsSound());
  }

  document.addEventListener('DOMContentLoaded', boot);
  new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(() => {
    if (!wantsSound()) applySound(false);
    bindButtons();
  }, 700);
})();
