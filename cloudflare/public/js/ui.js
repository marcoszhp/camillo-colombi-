(function () {
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.camilloWord = () => '<span class="camillo-word" role="text" aria-label="Camillo"><span aria-hidden="true">C<span class="letter-a">a</span><span class="letter-m">m</span><span class="letter-i">i</span>llo</span></span>';
  window.variantLabel = (item) => {
    let label = item.label || '';
    const grind = item.grind_type || item.grind || '';
    if (item.unit_type === 'volume' || item.volume_ml) {
      const volume = item.volume_ml ? `${item.volume_ml} ml` : '';
      return [label, volume && !label.includes(volume) ? volume : ''].filter(Boolean).join(' · ') || 'Porção';
    }
    if (item.weight_g || item.weight) {
      label ||= `${item.weight_g || item.weight} g`;
      return [label, grind && !label.toLowerCase().includes(grind.toLowerCase()) ? grind : ''].filter(Boolean).join(' · ');
    }
    return label || 'Unidade';
  };
  const icon = (name) => ({
    cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 3h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/></svg>',
    moon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>',
    user: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
    menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  }[name] || '');

  function header() {
    const user = CamilloAuth.user();
    const accountPath = user?.role === 'admin' ? '/admin' : user ? '/minha-conta' : '/login';
    return `
      <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header class="site-header"><div class="container nav">
        <a class="brand" href="/" aria-label="Caffè Camillo Colombi, início"><span class="brand-lockup"><small>Caffè</small>${camilloWord()}<small>Colombi</small></span></a>
        <nav class="nav-links" aria-label="Principal"><a href="/cafes">Nossos cafés</a><a href="/cultura-do-cafe">Cultura do café</a><a href="/clube-camillo">Clube ${camilloWord()}</a><a href="/nossa-historia">Nossa história</a></nav>
        <div class="nav-actions">
          <button class="icon-btn" id="themeBtn" aria-label="Alternar tema">${icon('moon')}</button>
          <a class="icon-btn" href="${accountPath}" aria-label="Conta">${icon('user')}</a>
          <button class="icon-btn" id="cartButton" aria-label="Abrir carrinho">${icon('cart')}<span class="sr-only">itens: </span><b id="cartCount" style="font-size:.7rem">0</b></button>
          <button class="icon-btn mobile-toggle" id="mobileBtn" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobileMenu">${icon('menu')}</button>
        </div>
      </div><nav class="menu" id="mobileMenu" aria-label="Menu móvel"><a href="/cafes">Nossos cafés</a><a href="/cultura-do-cafe">Cultura do café</a><a href="/clube-camillo">Clube ${camilloWord()}</a><a href="/nossa-historia">Nossa história</a><a href="/contato">Contato</a></nav></header>`;
  }

  function footer() {
    return `<footer class="footer"><div class="container footer-grid"><div><a class="brand" href="/">Caffè ${camilloWord()} Colombi</a><p class="muted">Um café. Uma pausa. Uma boa conversa.</p></div><div class="footer-links"><strong>À mesa</strong><a href="/cafes">Nossos cafés</a><a href="/cultura-do-cafe">Cultura do café</a><a href="/historia-do-cappuccino">História do cappuccino</a><a href="/clube-camillo">Clube ${camilloWord()}</a></div><div class="footer-links"><strong>Conte com a gente</strong><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a><a href="/contato">Contato</a></div></div><div class="container footer-sign">Ci vediamo al caffè.</div></footer>`;
  }

  function cartDrawer() {
    return `<div class="drawer-backdrop" id="drawerBackdrop" hidden></div><aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Carrinho" inert hidden><div class="drawer-head"><div><span class="eyebrow">Sua seleção</span><h2 style="font-size:1.8rem;margin:.2rem 0">Carrinho</h2></div><button class="icon-btn" id="closeDrawer" aria-label="Fechar carrinho">${icon('close')}</button></div><div id="drawerItems" class="drawer-body"></div><div class="drawer-foot"><div style="display:flex;justify-content:space-between"><span>Subtotal</span><strong id="drawerSubtotal"></strong></div><a class="btn btn-primary" href="/carrinho">Ver carrinho completo</a></div></aside>`;
  }

  document.querySelectorAll('[data-header]').forEach((el) => { el.innerHTML = header(); });
  document.querySelectorAll('[data-footer]').forEach((el) => { el.innerHTML = footer(); });
  document.body.insertAdjacentHTML('beforeend', `${cartDrawer()}<div class="cart-feedback" id="cartFeedback" role="status" aria-live="polite" hidden></div>`);
  document.querySelectorAll('[data-camillo]').forEach((el) => { el.innerHTML = camilloWord(); });
  document.querySelectorAll('.admin-sidebar strong').forEach((el) => { el.innerHTML = `Painel ${camilloWord()}`; });
  document.querySelectorAll('.eyebrow').forEach((el) => {
    if (/^\s*\d+\s*\/|O ritual|A origem/i.test(el.textContent || '')) el.remove();
  });
  document.querySelectorAll('.catalog-disclaimer').forEach((el) => el.remove());
  document.querySelectorAll('.ribbon span').forEach((el) => {
    if (/preços de demonstração|pagamento simulado/i.test(el.textContent || '')) el.remove();
  });

  const saved = localStorage.getItem('camillo_theme');
  if (saved) document.documentElement.dataset.theme = saved;
  document.getElementById('themeBtn')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('camillo_theme', next);
  });
  document.getElementById('mobileBtn')?.addEventListener('click', (event) => {
    const open = document.getElementById('mobileMenu')?.classList.toggle('open');
    event.currentTarget.setAttribute('aria-expanded', String(!!open));
  });

  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  let returnFocus;
  let inertSiblings = [];

  function renderDrawer() {
    const items = CamilloCart.get();
    const root = document.getElementById('drawerItems');
    document.getElementById('drawerSubtotal').textContent = money(CamilloCart.subtotal());
    root.innerHTML = items.length ? items.map((item) => `<div class="drawer-item"><img src="${bag(item.imageKey)}" alt=""><div><strong>${safe(item.name)}</strong><div class="muted">${item.quantity}× ${safe(variantLabel(item))}</div><span>${money(item.price * item.quantity)}</span></div></div>`).join('') : '<div class="empty">Seu carrinho está vazio.</div>';
  }

  function openDrawer() {
    returnFocus = document.activeElement;
    renderDrawer();
    drawer.hidden = false;
    drawer.inert = false;
    inertSiblings = [...document.body.children].filter((el) => el !== drawer && el !== backdrop && !el.inert && el.tagName !== 'SCRIPT');
    inertSiblings.forEach((el) => { el.inert = true; });
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('open'));
    document.getElementById('closeDrawer').focus();
  }

  function closeDrawer() {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    inertSiblings.forEach((el) => { el.inert = false; });
    inertSiblings = [];
    backdrop.classList.remove('open');
    if (returnFocus?.isConnected) returnFocus.focus();
    else document.getElementById('cartButton')?.focus();
    setTimeout(() => { if (!drawer.classList.contains('open')) { backdrop.hidden = true; drawer.hidden = true; } }, 180);
  }

  document.getElementById('cartButton')?.addEventListener('click', openDrawer);
  window.addEventListener('cartadded', (event) => {
    const feedback = document.getElementById('cartFeedback');
    if (!feedback) return;
    feedback.innerHTML = `<strong>Produto adicionado</strong><span>${safe(event.detail?.name || 'Sua escolha')} está no carrinho.</span><a href="/carrinho" class="btn btn-small btn-primary">Ver carrinho</a><button type="button" class="icon-btn" aria-label="Fechar aviso">${icon('close')}</button>`;
    feedback.hidden = false;
    feedback.classList.add('show');
    feedback.querySelector('button')?.addEventListener('click', () => { feedback.classList.remove('show'); setTimeout(() => { feedback.hidden = true; }, 180); });
    clearTimeout(window.__cartFeedbackTimer);
    window.__cartFeedbackTimer = setTimeout(() => { feedback.classList.remove('show'); setTimeout(() => { feedback.hidden = true; }, 180); }, 4200);
  });
  document.getElementById('closeDrawer')?.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (event) => {
    if (!drawer.classList.contains('open')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); }
    if (event.key !== 'Tab') return;
    const nodes = [...drawer.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')];
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });

  function updateCount() {
    const el = document.getElementById('cartCount');
    if (el) el.textContent = CamilloCart.count();
    if (drawer.classList.contains('open')) renderDrawer();
  }
  updateCount();
  window.addEventListener('cartchange', updateCount);

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  let frame = 0;
  const art = document.querySelector('[data-parallax]');
  function onScroll() {
    const current = scrollY;
    const previous = Number(document.body.dataset.previousScroll || 0);
    document.body.classList.toggle('scrolling-down', current > previous && current > 90);
    document.body.classList.toggle('scrolling-up', current < previous || current <= 90);
    document.body.dataset.previousScroll = String(current);
    if (frame || motion.matches || !art || innerWidth < 768) return;
    frame = requestAnimationFrame(() => {
      art.style.setProperty('--shift', `${Math.min(32, Math.max(-32, scrollY * .045))}px`);
      frame = 0;
    });
  }
  function configureMotion() {
    observer?.disconnect();
    document.documentElement.classList.remove('motion-ready');
    window.removeEventListener('scroll', onScroll);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    art?.style.removeProperty('--shift');
    if (motion.matches) return;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      }), { threshold: .08 });
      document.documentElement.classList.add('motion-ready');
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }
    if (document.querySelector('.site-header')) window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  configureMotion();
  motion.addEventListener?.('change', configureMotion);
  window.addEventListener('resize', configureMotion, { passive: true });

  window.toast = (message) => {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  window.money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  window.bag = (key) => {
    if (key === 'cappuccino') return '/assets/photos/cappuccino-realista.png';
    if (key === 'moka') return '/assets/photos/ritual-moka-realista.png';
    return '/assets/photos/cafe-embalado-realista.png';
  };
  const photoStyles = document.createElement('style');
  photoStyles.textContent = '.hero-art img{width:100%;height:100%;min-height:360px;object-fit:cover;filter:none;transform:none}.ritual-art,.family-illustration img{border-radius:18px;object-fit:cover}.product-visual{padding:.75rem}.product-visual img{width:100%;height:230px;object-fit:cover;border-radius:12px;filter:none}.detail-art img{width:100%;max-height:520px;object-fit:cover;border-radius:16px}';
  document.head.appendChild(photoStyles);
})();
