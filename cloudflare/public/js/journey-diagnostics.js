// journey-diagnostics.js

export function mountJourneyDiagnostics() {
  if (new URLSearchParams(location.search).get('diagnostico') !== 'animacao') {
    return;
  }

  const panel = document.createElement('details');
  panel.open = true;
  panel.style.position = 'fixed';
  panel.style.bottom = '0';
  panel.style.left = '0';
  panel.style.maxWidth = '90vw';
  panel.style.maxHeight = '40vh';
  panel.style.overflow = 'auto';
  panel.style.padding = '12px';
  panel.style.background = 'white';
  panel.style.color = '#222';
  panel.style.zIndex = '10000';
  panel.style.font = '12px monospace';

  const summary = document.createElement('summary');
  summary.textContent = 'Diagnóstico da animação';
  panel.appendChild(summary);

  const pre = document.createElement('pre');
  pre.style.whiteSpace = 'pre-wrap';
  panel.appendChild(pre);

  const copyButton = document.createElement('button');
  copyButton.textContent = 'Copiar diagnóstico';
  copyButton.style.marginTop = '10px';
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.textContent);
      copyButton.textContent = 'Copiado! Cole na conversa.';
    } catch {
      copyButton.textContent = 'Selecione e copie o texto';
    }
  });
  panel.appendChild(copyButton);

  document.body.appendChild(panel);

  function updateReport() {
    const root = document.querySelector('[data-coffee-journey]');
    const stage = document.querySelector('[data-journey-stage]');
    const canvas = document.querySelector('[data-journey-canvas]');
    const rect = (node) => {
      const value = node?.getBoundingClientRect();
      return value ? { top: value.top, bottom: value.bottom, height: value.height } : null;
    };
    const report = {
      build: root?.dataset.motionBuild ?? null,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      documentHidden: document.hidden,
      scrollY: window.scrollY,
      enhancedClass: root?.classList.contains('journey-enhanced') || false,
      rootDatasetPhase: root?.dataset.phase ?? null,
      rootDatasetMotionState: root?.dataset.motionState ?? null,
      motionError: root?.dataset.motionError ?? null,
      motionActive: root?.dataset.motionActive ?? null,
      requestedFrame: canvas?.dataset.requestedFrame ?? null,
      drawnFrame: canvas?.dataset.drawnFrame ?? null,
      loading: canvas?.dataset.loading ?? null,
      cache: canvas?.dataset.cache ?? null,
      rootBoundingClientRect: rect(root),
      stageBoundingClientRect: rect(stage),
      gsapPresent: Boolean(window.gsap),
      scrollTriggerPresent: Boolean(window.ScrollTrigger),
      triggers: window.ScrollTrigger?.getAll().slice(0, 1).map(trigger => ({
        start: trigger.start,
        end: trigger.end,
        progress: trigger.progress,
        isActive: trigger.isActive
      })) || []
    };

    pre.textContent = JSON.stringify(report, null, 2);
  }

  updateReport();
  const timer = setInterval(updateReport, 1000);

  window.addEventListener('pagehide', () => {
    clearInterval(timer);
    panel.remove();
  }, { once: true });
}
