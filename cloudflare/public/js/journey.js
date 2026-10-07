(function () {
  'use strict';
  const root = document.querySelector('[data-coffee-journey]');
  if (!root) return;
  const stage = root.querySelector('[data-journey-stage]');
  const scenes = [...root.querySelectorAll('[data-journey-scene]')];
  const control = root.querySelector('[data-journey-motion]');
  const video = root.querySelector('video');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1024px)');
  // null follows the system; a click overrides it for this page only.
  let motionOverride = null;
  let generation = 0;
  let context;
  let timeline;
  let resizeTimer;
  let videoVisible = false;
  let videoWanted = false;
  let mediaPending = false;
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
    videoWanted = videoVisible = mediaPending = false;
    mediaObserver?.disconnect();
    mediaObserver = null;
    if (!video) return;
    video.pause();
    video.classList.remove('is-playing');
    if (video.hasAttribute('src')) { video.removeAttribute('src'); video.load(); }
  }
  function updateMedia() {
    if (!video || !eligible() || !videoWanted || !videoVisible || document.hidden) {
      video?.pause();
      return;
    }
    if (!video.dataset.videoSrc) return;
    if (mediaPending || !video.paused) return;
    if (!video.hasAttribute('src')) { video.src = video.dataset.videoSrc; video.load(); }
    mediaPending = true;
    const playing = video.play();
    playing?.then(() => {
      if (eligible() && videoWanted && videoVisible && !document.hidden) video.classList.add('is-playing');
      else { video.pause(); video.classList.remove('is-playing'); }
    }).catch(() => video.classList.remove('is-playing')).finally(() => { mediaPending = false; });
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
      context = gsap.context(() => {
        gsap.set(scenes.slice(1), { autoAlpha: 0, y: 24 });
        gsap.set(stage, { backgroundColor: paper, color: ink });
        timeline = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate: () => {
            const progress = timeline.progress();
            revealScene(progress < .3 ? 0 : progress < .7 ? 1 : 2);
            videoWanted = progress > .58 && progress < .999;
            updateMedia();
          },
          scrollTrigger: {
            trigger: root, pin: stage, start: 'top top+=88', end: () => `+=${Math.round(innerHeight * 2.25)}`,
            scrub: 0.65, invalidateOnRefresh: true, anticipatePin: 1,
            onLeave: () => { videoWanted = false; updateMedia(); },
            onLeaveBack: () => { videoWanted = false; updateMedia(); }
          }
        });
        timeline.to(scenes[0].querySelector('picture img'), { y: -24, rotation: 8, scale: 1.1, duration: .95 }, 0)
          .to(scenes[0], { autoAlpha: 0, y: -20, duration: .24 }, .75)
          .to(stage, { backgroundColor: roast, color: '#f7f2e6', duration: .32 }, .75)
          .to(scenes[1], { autoAlpha: 1, y: 0, duration: .28 }, .85)
          .to(particles, { opacity: 1, duration: .3 }, .95)
          .fromTo(root.querySelector('[data-journey-smoke]'), { opacity: 0, y: 30, scaleX: .7 }, { opacity: .7, y: -30, scaleX: 1.2, duration: 1.1 }, .95)
          .fromTo(particles.children, { y: 26, rotation: -14, scale: .7 }, { y: -36, rotation: 20, scale: 1, stagger: .035, duration: 1.1 }, .95)
          .to(scenes[1].querySelector('picture img'), { y: -18, rotation: -10, scale: .94, duration: 1 }, 1.1)
          .to(scenes[1], { autoAlpha: 0, y: -18, duration: .26 }, 1.95)
          .to(stage, { backgroundColor: paper, color: ink, duration: .32 }, 1.95)
          .to(scenes[2], { autoAlpha: 1, y: 0, duration: .3 }, 2.05)
          .fromTo(scenes[2].querySelector('.journey-art'), { scale: .94 }, { scale: 1, duration: .7 }, 2.05)
          .to({}, { duration: .25 }, 2.75);
      }, root);
      revealScene(0);
      if (video && 'IntersectionObserver' in window) {
        mediaObserver = new IntersectionObserver((entries) => { videoVisible = entries[0].isIntersecting; updateMedia(); }, { threshold: .15 });
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
  video?.addEventListener('error', () => { video.pause(); video.classList.remove('is-playing'); });
  window.addEventListener('pagehide', teardown);
  configure();
})();
