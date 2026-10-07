(function () {
  'use strict';
  const root = document.querySelector('[data-coffee-journey]');
  if (!root) return;
  const stage = root.querySelector('[data-journey-stage]');
  const scenes = [...root.querySelectorAll('[data-journey-scene]')];
  const control = root.querySelector('[data-journey-motion]');
  const media = scenes.flatMap((scene, index) => [...scene.querySelectorAll('video')].map((video) => ({ video, index, duration: 0, target: 0, ready: false, failed: false, handlers: null })));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1024px)');
  // null follows the system; a click overrides it for this page only.
  let motionOverride = null;
  let generation = 0;
  let context;
  let timeline;
  let resizeTimer;
  let stageVisible = false;
  let scenePosition = 0;
  let mediaObserver;
  const scripts = new Map();

  function eligible() { return desktop.matches && (motionOverride ?? !reduce.matches); }
  function updateControl() {
    if (!control) return;
    control.textContent = eligible() ? 'Reduzir animação' : 'Ativar animação';
    control.setAttribute('aria-pressed', String(eligible()));
  }
  const beanSources = [...root.querySelectorAll('picture source')];
  const beanImages = new Map(beanSources.map((source) => [source, source.parentElement.querySelector('img')]));
  const protectedMedia = beanSources.map((source) => source.media);
  function updateBean(source) {
    const img = beanImages.get(source);
    img.classList.toggle('journey-bean', root.classList.contains('journey-enhanced') && (img.currentSrc || '').endsWith('/assets/journey/bean-roasted.webp'));
  }
  function loadScript(src) {
    if (scripts.has(src)) return scripts.get(src);
    const pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let timer;
      const finish = (error) => {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      };
      script.src = src;
      script.async = true;
      script.onload = () => finish();
      script.onerror = () => finish(new Error('Animação indisponível'));
      timer = setTimeout(() => finish(new Error('Tempo de carregamento excedido')), 5000);
      document.head.appendChild(script);
    });
    scripts.set(src, pending);
    pending.catch(() => scripts.delete(src));
    return pending;
  }

  function resetMedia() {
    stageVisible = false;
    scenePosition = 0;
    mediaObserver?.disconnect();
    mediaObserver = null;
    media.forEach((state) => {
      const { video, handlers } = state;
      if (handlers) Object.entries(handlers).forEach(([event, handler]) => video.removeEventListener(event, handler));
      state.handlers = null;
      state.duration = 0;
      state.target = 0;
      state.ready = false;
      if (state.frameCallback != null) video.cancelVideoFrameCallback?.(state.frameCallback);
      state.frameCallback = null;
      ['scrubTarget', 'scrubFrame', 'scrubSeeking', 'scrubDuration', 'scrubReadyState', 'scrubNetworkState', 'scrubBufferedEnd', 'scrubSeekableEnd'].forEach((key) => delete video.dataset[key]);
      video.pause();
      video.preload = 'none';
      video.classList.remove('is-ready');
      if (video.hasAttribute('src')) { video.removeAttribute('src'); video.load(); }
    });
  }
  function reportMedia(state) {
    const { video } = state;
    video.dataset.scrubReadyState = String(video.readyState);
    video.dataset.scrubNetworkState = String(video.networkState);
    video.dataset.scrubBufferedEnd = (video.buffered?.length ? video.buffered.end(video.buffered.length - 1) : 0).toFixed(3);
    video.dataset.scrubSeekableEnd = (video.seekable?.length ? video.seekable.end(video.seekable.length - 1) : 0).toFixed(3);
  }
  function activeScene() { return Math.min(scenes.length - 1, Math.floor(scenePosition)); }
  function seekMedia(state) {
    const { video } = state;
    if (!state.duration || state.failed) return;
    // A tiny initial seek requests a decoded frame even when the phase starts at zero.
    const target = Math.max(.001, Math.min(state.duration - .04, state.target * state.duration));
    // Inspect real media state through DOM attributes when browser tools mirror native properties.
    video.dataset.scrubTarget = target.toFixed(3);
    video.dataset.scrubSeeking = String(video.seeking);
    // Metadata can arrive before a CDN response is seekable. An early seek can
    // otherwise wait indefinitely when the host does not serve byte ranges.
    if (video.readyState < 2 || !video.seekable.length || target > video.seekable.end(video.seekable.length - 1)) return;
    if (video.seeking) return;
    if (Math.abs(video.currentTime - target) > .035 || !state.ready) {
      try { video.currentTime = target; video.dataset.scrubSeeking = String(video.seeking); } catch (_) { state.failed = true; video.classList.remove('is-ready'); }
    }
  }
  function updateMedia() {
    const active = activeScene();
    const available = eligible() && root.classList.contains('journey-enhanced') && stageVisible && !document.hidden;
    media.forEach((state) => {
      const { video, index } = state;
      const local = Math.max(0, Math.min(1, scenePosition - index));
      state.target = local;
      video.pause();
      if (!available || state.failed) { video.classList.remove('is-ready'); return; }
      const near = index === active || (index === active + 1 && scenePosition - active > .8);
      if (near && !video.hasAttribute('src') && video.dataset.videoSrc) {
        video.preload = 'auto';
        video.src = video.dataset.videoSrc;
        video.load();
      }
      if (index === active) seekMedia(state);
      video.classList.toggle('is-ready', index === active && state.ready);
    });
  }
  function bindMedia(current) {
    media.forEach((state) => {
      const { video } = state;
      const valid = () => current === generation && eligible() && stageVisible && !document.hidden;
      const resume = () => {
        if (current !== generation || state.failed) return;
        reportMedia(state);
        if (valid()) updateMedia();
      };
      state.handlers = {
        loadedmetadata: () => {
          if (current !== generation || state.failed) return;
          if (Number.isFinite(video.duration) && video.duration > .04) {
            state.duration = video.duration;
            video.dataset.scrubDuration = state.duration.toFixed(3);
          }
          reportMedia(state);
          updateMedia();
        },
        loadeddata: resume,
        canplay: resume,
        progress: resume,
        seeked: () => {
          if (current !== generation || state.failed) return;
          reportMedia(state);
          state.ready = video.readyState >= 2;
          video.dataset.scrubSeeking = String(video.seeking);
          if (state.ready) {
            video.dataset.scrubFrame = video.currentTime.toFixed(3);
            if (video.requestVideoFrameCallback) {
              if (state.frameCallback != null) video.cancelVideoFrameCallback?.(state.frameCallback);
              state.frameCallback = video.requestVideoFrameCallback((_, frame) => {
                state.frameCallback = null;
                if (current === generation && !state.failed) video.dataset.scrubFrame = frame.mediaTime.toFixed(3);
              });
            }
          }
          if (valid()) updateMedia();
        },
        error: () => { state.failed = true; state.ready = false; video.pause(); video.classList.remove('is-ready'); }
      };
      Object.entries(state.handlers).forEach(([event, handler]) => video.addEventListener(event, handler));
    });
  }
  function revealScene(index) {
    scenes.forEach((scene, i) => {
      const hidden = i !== index;
      scene.inert = hidden;
      if (hidden) scene.setAttribute('aria-hidden', 'true'); else scene.removeAttribute('aria-hidden');
    });
  }
  function teardown() {
    generation += 1;
    context?.revert();
    context = timeline = null;
    root.classList.remove('journey-enhanced');
    beanSources.forEach((source, i) => { source.media = protectedMedia[i]; updateBean(source); });
    stage.removeAttribute('style');
    root.querySelector('[data-journey-particles]')?.replaceChildren();
    scenes.forEach((scene) => { scene.inert = false; scene.removeAttribute('aria-hidden'); });
    resetMedia();
  }
  async function configure() {
    teardown();
    updateControl();
    if (!eligible()) return;
    const current = generation;
    try {
      if (!window.gsap) await loadScript('/js/vendor/gsap.min.js');
      if (current !== generation || !eligible()) return;
      if (!window.ScrollTrigger) await loadScript('/js/vendor/ScrollTrigger.min.js');
      if (current !== generation || !eligible() || !window.gsap || !window.ScrollTrigger) return;
      const gsap = window.gsap;
      gsap.registerPlugin(window.ScrollTrigger);
      const particles = root.querySelector('[data-journey-particles]');
      for (let i = 0; i < 6; i += 1) {
        const bean = document.createElement('img');
        bean.src = '/assets/journey/bean-roasted.webp';
        bean.alt = '';
        bean.style.left = `${[8,76,14,83,38,67][i]}%`;
        bean.style.top = `${[13,18,69,65,82,4][i]}%`;
        bean.onerror = () => bean.remove();
        particles.appendChild(bean);
      }
      root.classList.add('journey-enhanced');
      beanSources.forEach((source) => {
        source.media = '(min-width: 1024px)';
        updateBean(source);
      });
      const colors = getComputedStyle(root);
      const paper = colors.getPropertyValue('--journey-paper').trim();
      const ink = colors.getPropertyValue('--journey-ink').trim();
      const roast = colors.getPropertyValue('--journey-roast').trim();
      bindMedia(current);
      context = gsap.context(() => {
        gsap.set(scenes.slice(1), { autoAlpha: 0, y: 24 });
        gsap.set(stage, { backgroundColor: paper, color: ink });
        timeline = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate: () => {
            scenePosition = Math.min(scenes.length - .0001, timeline.progress() * scenes.length);
            revealScene(activeScene());
            updateMedia();
          },
          scrollTrigger: {
            trigger: root, pin: stage, start: 'top top+=88', end: () => `+=${Math.round(innerHeight * 4.5)}`,
            scrub: 0.65, invalidateOnRefresh: true, anticipatePin: 1,
            onLeave: () => { stageVisible = false; updateMedia(); },
            onLeaveBack: () => { stageVisible = false; updateMedia(); },
            onEnter: () => { stageVisible = true; updateMedia(); },
            onEnterBack: () => { stageVisible = true; updateMedia(); }
          }
        });
        scenes.forEach((scene, index) => {
          timeline.to({}, { duration: 1 }, index);
          if (!index) return;
          timeline.to(scenes[index - 1], { autoAlpha: 0, y: -18, duration: .24 }, index - .12)
            .to(scene, { autoAlpha: 1, y: 0, duration: .24 }, index - .12)
            .to(stage, { backgroundColor: index === 1 ? roast : paper, color: index === 1 ? '#f7f2e6' : ink, duration: .24 }, index - .12);
        });
        timeline.to(scenes[0].querySelector('picture img'), { y: -24, rotation: 8, scale: 1.1, duration: 1 }, 0)
          .to(particles, { opacity: 1, duration: .2 }, 1)
          .fromTo(root.querySelector('[data-journey-smoke]'), { opacity: 0, y: 30, scaleX: .7 }, { opacity: .7, y: -30, scaleX: 1.2, duration: .8 }, 1)
          .fromTo(particles.children, { y: 26, rotation: -14, scale: .7 }, { y: -36, rotation: 20, scale: 1, stagger: .02, duration: .8 }, 1)
          .to(scenes[1].querySelector('picture img'), { y: -18, rotation: -10, scale: .94, duration: .8 }, 1);
      }, root);
      revealScene(0);
      if (media.length && 'IntersectionObserver' in window) {
        mediaObserver = new IntersectionObserver((entries) => { stageVisible = entries[0].isIntersecting; updateMedia(); }, { threshold: .15 });
        mediaObserver.observe(stage);
      }
      window.ScrollTrigger.refresh();
    } catch (_) { if (current === generation) teardown(); }
  }

  control?.addEventListener('click', () => {
    motionOverride = !eligible();
    configure();
  });
  beanSources.forEach((source) => {
    const img = beanImages.get(source);
    img.addEventListener('load', () => updateBean(source));
    img.addEventListener('error', () => { source.remove(); img.classList.remove('journey-bean'); img.src = img.dataset.fallback; }, { once: true });
  });
  reduce.addEventListener('change', () => { motionOverride = null; configure(); });
  desktop.addEventListener('change', configure);
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(configure, 180); }, { passive: true });
  document.addEventListener('visibilitychange', updateMedia);
  new MutationObserver(() => { if (eligible()) configure(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('pagehide', teardown);
  window.addEventListener('pageshow', (event) => { if (event.persisted) configure(); });
  configure();
})();
