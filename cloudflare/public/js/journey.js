import { JourneySequence, frameAt, phaseAt } from './journey-sequence.js?v=20261010-receiver';

if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('diagnostico') === 'animacao') {
  import('./journey-diagnostics.js').then(({ mountJourneyDiagnostics }) => mountJourneyDiagnostics());
}

const root = document.querySelector('[data-coffee-journey]');
if (root) {
  root.dataset.motionBuild = '20261010-receiver';
  const stage = root.querySelector('[data-journey-stage]');
  const canvas = root.querySelector('[data-journey-canvas]');
  const poster = root.querySelector('[data-journey-poster]');
  const phases = ['origin', 'roast', 'grinding', 'water', 'extraction', 'serving'];
  root.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => { image.hidden = true; });
    if (image.complete && !image.naturalWidth) image.hidden = true;
  });
  const scenes = [...root.querySelectorAll('[data-journey-scene]')];
  const control = root.querySelector('[data-journey-motion]');
  const desktop = window.matchMedia('(min-width: 1024px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scripts = new Map();
  let override = null, generation = 0, context, timeline, player, observer, resizeTimer;
  let visible = false;
  const eligible = () => desktop.matches && (override ?? !reduce.matches);
  const updateControl = () => {
    control.textContent = eligible() ? 'Reduzir animação' : 'Ativar animação';
    control.setAttribute('aria-pressed', String(eligible()));
  };
  function loadScript(src) {
    if (scripts.has(src)) return scripts.get(src);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => finish(new Error('Tempo excedido')), 5000);
      const finish = (error) => {
        clearTimeout(timer); script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      };
      script.src = src; script.async = true;
      script.onload = () => finish(); script.onerror = () => finish(new Error('Animação indisponível'));
      document.head.appendChild(script);
    });
    scripts.set(src, promise); promise.catch(() => scripts.delete(src)); return promise;
  }
  function reveal(index) {
    scenes.forEach((scene, position) => {
      scene.inert = position !== index;
      if (scene.inert) scene.setAttribute('aria-hidden', 'true'); else scene.removeAttribute('aria-hidden');
    });
    root.dataset.phase = String(index);
    const src = `/assets/journey/blender/poster-${phases[index]}.webp`;
    if (poster.getAttribute('src') !== src) { poster.hidden = false; poster.setAttribute('src', src); }
  }
  const updateActivity = () => {
    root.dataset.motionActive = String(visible && !document.hidden);
    player?.setActive(visible && !document.hidden);
  };
  function teardown() {
    generation += 1; clearTimeout(resizeTimer);
    observer?.disconnect(); observer = null; visible = false;
    root.dataset.motionActive = 'false'; root.dataset.motionState = 'static';
    player?.destroy(); player = null;
    context?.revert(); context = timeline = null;
    root.classList.remove('journey-enhanced'); delete root.dataset.phase;
    stage.removeAttribute('style');
    scenes.forEach((scene) => { scene.inert = false; scene.removeAttribute('aria-hidden'); });
  }
  async function configure() {
    teardown(); updateControl();
    delete root.dataset.motionError;
    if (!eligible()) {
      root.dataset.motionState = !desktop.matches ? 'narrow-window' : reduce.matches && override === null ? 'reduced-motion' : 'paused';
      return;
    }
    const current = generation;
    try {
      root.dataset.motionState = 'loading-engine';
      if (!window.gsap) await loadScript('/js/vendor/gsap.min.js');
      if (current !== generation || !eligible()) return;
      if (!window.ScrollTrigger) await loadScript('/js/vendor/ScrollTrigger.min.js');
      if (current !== generation || !eligible()) return;
      const gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);
      root.dataset.motionState = 'creating-player';
      player = new JourneySequence(canvas, { onFailure: () => {
        if (current !== generation) return;
        override = false; teardown(); updateControl();
        root.dataset.motionState = 'media-unavailable';
      } });
      root.classList.add('journey-enhanced');
      context = gsap.context(() => {
        gsap.set(scenes.slice(1), { autoAlpha: 0, y: 16 });
        timeline = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate: () => {
            if (!player) return;
            const frame = frameAt(timeline.progress());
            player.request(frame);
            if (player) reveal(phaseAt(frame));
          },
          scrollTrigger: {
            trigger: root, pin: stage, start: 'top top+=88', end: () => `+=${Math.round(innerHeight * 4.5)}`,
            scrub: .2, invalidateOnRefresh: true, anticipatePin: 1
          }
        });
        timeline.to({}, { duration: 6 }, 0);
        scenes.forEach((scene, index) => {
          if (!index) return;
          const at = ((index * 50 - .5) / 299) * 6;
          timeline.to(scenes[index - 1], { autoAlpha: 0, y: -12, duration: .16 }, at - .08)
            .to(scene, { autoAlpha: 1, y: 0, duration: .16 }, at - .08);
        });
      }, root);
      reveal(0);
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; updateActivity(); }, { threshold: .01 });
        observer.observe(stage);
      } else { visible = true; updateActivity(); }
      window.ScrollTrigger.refresh();
      root.dataset.motionState = 'ready';
    } catch (error) {
      if (current === generation) {
        teardown();
        root.dataset.motionState = 'initialization-error';
        root.dataset.motionError = String(error?.message || error).slice(0, 160);
      }
    }
  }
  control.addEventListener('click', () => { override = !eligible(); configure(); });
  reduce.addEventListener('change', () => { override = null; configure(); });
  desktop.addEventListener('change', configure);
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => window.ScrollTrigger?.refresh(), 180);
  }, { passive: true });
  document.addEventListener('visibilitychange', updateActivity);
  window.addEventListener('pagehide', teardown);
  window.addEventListener('pageshow', (event) => { if (event.persisted) configure(); });
  configure();
}
