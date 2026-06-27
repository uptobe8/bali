(() => {
  if (typeof window === 'undefined' || window.__NUSA_AUDIO_HARD_OFF__) return;
  window.__NUSA_AUDIO_HARD_OFF__ = true;

  const KEY = 'nusa-sound-disabled';

  function allMedia() {
    return Array.from(document.querySelectorAll('audio, video'));
  }

  function setButton(off) {
    document.querySelectorAll('.nusa-sound-toggle').forEach((btn) => {
      btn.classList.toggle('on', !off);
      btn.textContent = off ? '🔇 Selva' : '🔊 Selva ON';
      btn.setAttribute('aria-pressed', String(!off));
    });
  }

  function off() {
    localStorage.setItem(KEY, '1');
    allMedia().forEach((m) => {
      if (m.tagName.toLowerCase() === 'audio') {
        m.pause();
        m.currentTime = 0;
      }
      m.muted = true;
      m.volume = 0;
    });
    setButton(true);
  }

  function on() {
    localStorage.removeItem(KEY);
    allMedia().forEach((m) => {
      if (m.tagName.toLowerCase() === 'audio') {
        m.muted = false;
        m.volume = 0.32;
        m.play().catch(() => {});
      }
    });
    setButton(false);
  }

  function enforce() {
    if (localStorage.getItem(KEY) === '1') off();
    else setButton(false);
  }

  document.addEventListener('click', (event) => {
    const btn = event.target && event.target.closest ? event.target.closest('.nusa-sound-toggle') : null;
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (localStorage.getItem(KEY) === '1') on();
    else off();
  }, true);

  document.addEventListener('DOMContentLoaded', enforce);
  new MutationObserver(enforce).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(enforce, 1000);
})();
