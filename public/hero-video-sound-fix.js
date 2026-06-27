(() => {
  if (typeof window === 'undefined' || window.__NUSA_HERO_VIDEO_SOUND__) return;
  window.__NUSA_HERO_VIDEO_SOUND__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const heroVideo = `${base}/hero-indonesia.mp4`;
  const fallbackImage = `${base}/hero-bali.jpg`;
  const jungleSound = `${base}/sounds/jungle-ambient.mp3`;
  const SOUND_KEY = 'nusa-sound-enabled';

  const style = document.createElement('style');
  style.textContent = `
    .nusa-hero-video-card { width: 100%; max-width: 100%; border-radius: 28px; overflow: hidden; }
    .nusa-hero-video-wrap { position: relative; width: 100%; min-height: 460px; overflow: hidden; background: #03100b; }
    .nusa-hero-video-wrap video, .nusa-hero-video-wrap > img { position: absolute !important; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover !important; }
    .nusa-hero-video-wrap::before { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(90deg, rgba(2,16,11,.82), rgba(2,16,11,.42) 46%, rgba(2,16,11,.18)), linear-gradient(180deg, rgba(2,16,11,.25), rgba(2,16,11,.78)); pointer-events: none; }
    .nusa-hero-video-wrap > .absolute.inset-0.z-\[1\] { z-index: 2 !important; justify-content: flex-end !important; padding: 34px !important; max-width: 760px; }
    .nusa-hero-video-wrap h1 { font-size: clamp(34px, 6vw, 64px) !important; line-height: .98 !important; max-width: 680px !important; text-wrap: balance; text-shadow: 0 4px 24px rgba(0,0,0,.7); }
    .nusa-hero-video-wrap p { max-width: 620px !important; font-size: clamp(15px, 2vw, 19px) !important; line-height: 1.45 !important; text-shadow: 0 3px 18px rgba(0,0,0,.75); }
    .nusa-sound-toggle { position: absolute; top: 16px; right: 16px; z-index: 20; display: inline-flex; align-items: center; gap: 7px; border: 1px solid rgba(255,255,255,.22); background: rgba(0,0,0,.48); color: #fff; backdrop-filter: blur(12px); border-radius: 999px; padding: 10px 13px; font-weight: 900; font-size: 12px; box-shadow: 0 12px 28px rgba(0,0,0,.35); }
    .nusa-sound-toggle.on { background: linear-gradient(135deg, rgba(0,200,117,.82), rgba(0,213,255,.78)); color: #03100b; border-color: transparent; }
    @media (max-width: 767px) {
      .nusa-hero-video-card { width: calc(100vw - 24px) !important; max-width: calc(100vw - 24px) !important; margin-left: calc(50% - 50vw + 12px) !important; margin-right: calc(50% - 50vw + 12px) !important; border-radius: 24px !important; }
      .nusa-hero-video-wrap { min-height: 540px !important; }
      .nusa-hero-video-wrap::before { background: linear-gradient(180deg, rgba(2,16,11,.18), rgba(2,16,11,.32) 26%, rgba(2,16,11,.86)); }
      .nusa-hero-video-wrap > .absolute.inset-0.z-\[1\] { padding: 26px 22px 28px !important; justify-content: flex-end !important; }
      .nusa-hero-video-wrap h1 { font-size: 42px !important; line-height: .95 !important; max-width: 100% !important; }
      .nusa-hero-video-wrap p { font-size: 17px !important; line-height: 1.42 !important; max-width: 100% !important; }
      .nusa-hero-video-wrap .grid.grid-cols-2 { gap: 10px !important; margin-top: 18px !important; }
      .nusa-sound-toggle { top: 14px; right: 14px; padding: 9px 11px; font-size: 11px; }
    }
  `;
  document.head.appendChild(style);

  function userWantsSound() {
    return localStorage.getItem(SOUND_KEY) === 'true';
  }

  function setUserWantsSound(value) {
    localStorage.setItem(SOUND_KEY, value ? 'true' : 'false');
  }

  function ensureAudio() {
    let audio = document.querySelector('#nusa-jungle-audio');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'nusa-jungle-audio';
      audio.src = jungleSound;
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.32;
      document.body.appendChild(audio);
    }
    return audio;
  }

  function updateButton(button, on) {
    button.classList.toggle('on', !!on);
    button.textContent = on ? '🔊 Selva ON' : '🔇 Selva OFF';
  }

  function stopAllSound(button) {
    document.querySelectorAll('audio').forEach((audio) => {
      try {
        audio.pause();
        audio.muted = true;
        audio.volume = 0;
      } catch {}
    });
    updateButton(button, false);
  }

  function startSound(audio, button) {
    audio.muted = false;
    audio.volume = 0.32;
    const p = audio.play();
    if (p && p.then) {
      p.then(() => updateButton(button, true)).catch(() => updateButton(button, false));
    } else {
      updateButton(button, true);
    }
  }

  function patchHero() {
    const heroImg = Array.from(document.querySelectorAll('img')).find((img) => (img.getAttribute('src') || '').includes('hero-bali'));
    if (!heroImg || heroImg.dataset.nusaHeroPatched) return;
    const wrap = heroImg.parentElement;
    if (!wrap) return;
    heroImg.dataset.nusaHeroPatched = '1';
    wrap.classList.add('nusa-hero-video-wrap');
    wrap.closest('.nusa-panel')?.classList.add('nusa-hero-video-card');

    const video = document.createElement('video');
    video.src = heroVideo;
    video.poster = fallbackImage;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-label', 'Vídeo panorámico de Indonesia');
    video.className = heroImg.className;
    heroImg.replaceWith(video);
    video.play().catch(() => {});

    const oldButton = wrap.querySelector('button[aria-label*="sonido"], button[aria-label*="Sonido"], button[aria-label*="silenciar"], button[aria-label*="Activar"]');
    if (oldButton) oldButton.remove();

    const audio = ensureAudio();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nusa-sound-toggle';
    btn.setAttribute('aria-label', 'Activar o apagar sonido de selva');
    wrap.appendChild(btn);

    if (userWantsSound()) startSound(audio, btn);
    else stopAllSound(btn);

    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const next = !userWantsSound();
      setUserWantsSound(next);
      if (next) startSound(audio, btn);
      else stopAllSound(btn);
    });
  }

  document.addEventListener('DOMContentLoaded', patchHero);
  new MutationObserver(patchHero).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(patchHero, 300);
  setTimeout(patchHero, 1200);
})();
