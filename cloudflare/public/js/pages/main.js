(async function () {
  const page = document.body.dataset.page;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  async function home() {
    try {
      const products = await CamilloAPI.get('/products');
      const packaged = products.filter((p) => p.product_kind === 'packaged').slice(0, 2);
      const drinks = products.filter((p) => p.product_kind !== 'packaged').slice(0, 2);
      $('#featured').innerHTML = [...packaged, ...drinks].map(productCard).join('');
    } catch (error) {
      $('#featured').innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`;
    }
  }

  async function catalog() {
    const form = $('#filters');
    let requestNumber = 0;

    // Carrega parâmetros da URL para permitir links diretos como /cafes?roast=media.
    const initial = new URLSearchParams(location.search);
    for (const [key, value] of initial.entries()) {
      if (form.elements[key]) form.elements[key].value = value;
    }

    async function load() {
      const currentRequest = ++requestNumber;
      $('#productGrid').innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
      const params = new URLSearchParams(new FormData(form));
      for (const [key, value] of [...params.entries()]) if (!value) params.delete(key);
      history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params}` : ''}`);

      try {
        const rows = await CamilloAPI.get(`/products?${params}`);
        if (currentRequest !== requestNumber) return;
        if (!rows.length) {
          $('#productGrid').innerHTML = '<div class="empty">Nenhum café encontrado com esses filtros.</div>';
        } else {
          const groups = [
            { title: 'Para levar para casa.', subtitle: 'Cafés em saco · grãos e moagens', rows: rows.filter((p) => p.product_kind === 'packaged') },
            { title: 'O prazer da próxima xícara.', subtitle: 'Bebidas e preparos · escolhas de cafeteria', rows: rows.filter((p) => p.product_kind !== 'packaged') }
          ];
          $('#productGrid').innerHTML = groups.filter((group) => group.rows.length).map((group) => `<section class="catalog-group"><div class="section-head"><div><span class="eyebrow">${group.subtitle}</span><h2>${group.title}</h2></div><span class="muted">${group.rows.length} opções</span></div><div class="grid grid-3">${group.rows.map(productCard).join('')}</div></section>`).join('');
        }
        $('#resultCount').textContent = `${rows.length} café(s)`;
      } catch (error) {
        if (currentRequest !== requestNumber) return;
        $('#productGrid').innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`;
      }
    }

    form.addEventListener('input', () => {
      clearTimeout(form._timer);
      form._timer = setTimeout(load, 250);
    });
    form.addEventListener('change', () => { clearTimeout(form._timer); load(); });
    form.addEventListener('submit', (event) => { event.preventDefault(); clearTimeout(form._timer); load(); });
    load();
  }

  async function product() {
    const slug = new URLSearchParams(location.search).get('slug') || 'caffe-arabica';
    try {
      const p = await CamilloAPI.get(`/products/${encodeURIComponent(slug)}`);
      const packaged = p.product_kind === 'packaged';
      $('#productRoot').innerHTML = `
        <div class="detail-art"><img src="${bag(p.image_key)}" alt="Ilustração de ${escapeHtml(p.name)}"></div>
        <div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <span class="badge">${escapeHtml(p.category_name || (packaged ? 'Café em saco' : 'Preparado'))}</span>
            ${packaged && p.roast_level ? `<span class="badge">${escapeHtml(p.roast_level)}</span>` : ''}
            ${packaged && p.origin ? `<span class="badge">${escapeHtml(p.origin)}</span>` : ''}
            ${p.aromas ? `<span class="badge badge-yellow">Aromatizado: ${escapeHtml(p.aromas)}</span>` : ''}
          </div>
          <h1 style="font-size:clamp(2.5rem,7vw,4.8rem);margin:.8rem 0">${escapeHtml(p.name)}</h1>
          <p class="muted">${escapeHtml(p.description)}</p>
          <div class="score-grid" style="margin:1.5rem 0">
            ${[['Intensidade', p.intensity], ['Corpo', p.body_score], ['Acidez', p.acidity_score]].filter(([,value]) => value != null).map(([name, value]) => `
              <div><div style="display:flex;justify-content:space-between"><strong>${name}</strong><span>${value}/5</span></div><div class="meter"><span style="width:${Number(value) * 20}%"></span></div></div>
            `).join('')}
          </div>
          <div class="notice">
            <strong>${packaged ? 'Notas sensoriais naturais' : 'Perfil do preparo'}</strong><br>${escapeHtml(p.sensory_notes || p.short_description || 'Não informado')}
            ${p.aromas ? `<hr style="border:0;border-top:1px solid var(--border)"><strong>Café aromatizado</strong><br>${escapeHtml(p.aromas)} — aromatização adicionada, separada das notas naturais.` : ''}
          </div>
          <div class="form-grid two" style="margin-top:1rem">
            <div class="field"><label for="variant">${packaged ? 'Peso e moagem' : 'Tamanho e apresentação'}</label><select class="select" id="variant">
              ${p.variants.map((v) => `<option value="${v.id}" data-price="${v.price}" data-stock="${v.stock}">${escapeHtml(variantLabel(v))} · ${money(v.price)} ${v.stock <= 0 ? '— esgotado' : ''}</option>`).join('')}
            </select></div>
            <div class="field"><label for="qty">Quantidade</label><input class="input" id="qty" type="number" min="1" value="1"></div>
          </div>
          <div id="buyArea" style="display:flex;gap:.8rem;align-items:center;margin-top:1rem"></div>
          <p class="muted" style="margin-top:1rem"><strong>Preparo:</strong> ${escapeHtml(p.brew_suggestion || 'Consulte a moagem adequada ao seu método.')}</p>
          ${packaged && p.conservation_info ? `<p class="muted"><strong>Conservação:</strong> ${escapeHtml(p.conservation_info)}</p>` : ''}
          ${packaged && p.roasting_info ? `<p class="muted"><strong>Torrefação:</strong> ${escapeHtml(p.roasting_info)}</p>` : ''}
          <p class="catalog-disclaimer">Preço de demonstração. Frete grátis no Sudeste ou em pedidos a partir de R$ 300. Pagamento simulado.</p>
        </div>`;

      const select = $('#variant');
      const buy = $('#buyArea');
      const firstAvailable = p.variants.find((v) => Number(v.stock) > 0);
      if (firstAvailable) select.value = String(firstAvailable.id);

      function paintBuyArea() {
        const option = select.selectedOptions[0];
        const variant = p.variants.find((v) => String(v.id) === option?.value);
        if (!option || Number(option.dataset.stock) <= 0) {
          buy.innerHTML = '<button class="btn btn-primary" disabled>Indisponível</button><button class="btn btn-outline" id="notify">Me avise quando voltar</button>';
          $('#notify')?.addEventListener('click', async () => {
            const email = prompt('Digite seu e-mail para o aviso de reposição:');
            if (!email) return;
            try {
              await CamilloAPI.post('/customer/stock-notifications', { email, productId: p.id });
              toast('Aviso de reposição registrado.');
            } catch (error) {
              toast(error.message);
            }
          });
          return;
        }

        buy.innerHTML = `<strong class="price">${money(option.dataset.price)}</strong><button class="btn btn-primary" id="addCart">Adicionar ao carrinho</button>`;
        $('#addCart').addEventListener('click', () => {
          const quantity = Number($('#qty').value);
          if (!Number.isInteger(quantity) || quantity < 1 || quantity > Number(variant.stock)) {
            toast(`Escolha uma quantidade entre 1 e ${variant.stock}.`);
            $('#qty').focus();
            return;
          }
          CamilloCart.add({
            variantId: Number(option.value),
            productSlug: p.slug,
            name: p.name,
            price: Number(option.dataset.price),
            weight: variant.weight_g,
            weight_g: variant.weight_g,
            volume_ml: variant.volume_ml,
            unit_type: variant.unit_type,
            label: variantLabel(variant),
            grind: variant.grind_type,
            imageKey: p.image_key,
            quantity
          });
          toast('Café adicionado ao carrinho.');
        });
      }

      select.addEventListener('change', paintBuyArea);
      paintBuyArea();
    } catch (error) {
      $('#productRoot').innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`;
    }
  }

  function cart() {
    const root = $('#cartRoot');
    function render() {
      const items = CamilloCart.get();
      if (!items.length) {
        root.innerHTML = '<div class="empty"><h2>Seu carrinho está vazio</h2><p>Escolha um café para começar.</p><a class="btn btn-primary" href="/cafes">Ver cafés</a></div>';
        return;
      }
      root.innerHTML = `
        <div>${items.map((i) => `<div class="cart-row"><div><strong>${escapeHtml(i.name)}</strong><div class="muted">${escapeHtml(variantLabel(i))}</div><button class="btn btn-ghost remove" data-id="${i.variantId}" aria-label="Remover ${escapeHtml(i.name)}">Remover</button></div><div style="text-align:right"><input class="input qty" aria-label="Quantidade de ${escapeHtml(i.name)}" style="width:88px" type="number" min="1" value="${i.quantity}" data-id="${i.variantId}"><strong style="display:block;margin-top:.5rem">${money(i.price * i.quantity)}</strong></div></div>`).join('')}</div>
        <aside class="card order-summary"><h3>Resumo</h3><p style="display:flex;justify-content:space-between"><span>Subtotal</span><strong>${money(CamilloCart.subtotal())}</strong></p><p class="muted">Frete calculado no checkout. Sudeste e pedidos a partir de R$ 300 têm frete grátis.</p><a class="btn btn-primary" style="width:100%" href="/checkout">Continuar</a></aside>`;
      $$('.remove').forEach((button) => button.addEventListener('click', () => { CamilloCart.remove(button.dataset.id); render(); }));
      $$('.qty').forEach((input) => input.addEventListener('change', () => { CamilloCart.update(input.dataset.id, input.value); render(); }));
    }
    render();
  }

  function authForm(mode) {
    const form = $('#authForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      try {
        const data = await CamilloAPI.post(mode === 'login' ? '/auth/login' : '/auth/register', body);
        CamilloAuth.setSession(data);
        const next = new URLSearchParams(location.search).get('next');
        location.href = next || (data.user.role === 'admin' ? '/admin' : '/minha-conta');
      } catch (error) {
        $('#authError').textContent = error.message;
      }
    });
  }

  async function account() {
    if (!CamilloAuth.requireLogin()) return;
    try {
      const [me, orders, loyalty] = await Promise.all([
        CamilloAPI.get('/auth/me'), CamilloAPI.get('/orders'), CamilloAPI.get('/loyalty/summary')
      ]);
      $('#accountRoot').innerHTML = `
        <div class="grid grid-3">
          <div class="card stat"><span class="muted">Olá</span><strong>${escapeHtml(me.name)}</strong><span>${escapeHtml(me.email)}</span></div>
          <div class="card stat"><span class="muted">Pontos</span><strong>${loyalty.points}</strong><span>Nível ${escapeHtml(loyalty.currentLevel?.name || 'Grão')}</span></div>
          <div class="card stat"><span class="muted">Pedidos</span><strong>${orders.length}</strong><a href="/pedidos">Ver histórico</a></div>
        </div><div style="margin-top:1.5rem"><button class="btn btn-outline" id="logout">Sair da conta</button></div>`;
      $('#logout').addEventListener('click', () => { CamilloAuth.clear(); location.href = '/'; });
    } catch (error) {
      $('#accountRoot').innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`;
    }
  }

  async function checkout() {
    if (!CamilloAuth.requireLogin()) return;
    const items = CamilloCart.get();
    if (!items.length) { location.href = '/carrinho'; return; }

    $('#checkoutItems').innerHTML = items.map((i) => `<p style="display:flex;justify-content:space-between"><span>${i.quantity}× ${escapeHtml(i.name)} <small class="muted">${escapeHtml(variantLabel(i))}</small></span><strong>${money(i.price * i.quantity)}</strong></p>`).join('')
      + `<hr><p style="display:flex;justify-content:space-between"><span>Subtotal</span><strong>${money(CamilloCart.subtotal())}</strong></p>`;

    const form = $('#checkoutForm');
    try {
      const [me, addresses] = await Promise.all([CamilloAPI.get('/auth/me'), CamilloAPI.get('/auth/addresses')]);
      form.elements.name.value = me.name || '';
      form.elements.email.value = me.email || '';
      form.elements.phone.value = me.phone || '';
      const address = addresses.find((item) => item.is_default) || addresses[0];
      if (address) {
        const map = { zipCode: 'zip_code', street: 'street', number: 'number', complement: 'complement', district: 'district', city: 'city', state: 'state' };
        for (const [field, source] of Object.entries(map)) form.elements[field].value = address[source] || '';
      }
    } catch {
      // Se o pré-preenchimento falhar, o formulário continua utilizável manualmente.
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const payload = {
        items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        paymentMethod: f.paymentMethod,
        paymentScenario: f.paymentScenario,
        cardBrand: f.paymentMethod === 'card' ? f.cardBrand : null,
        notes: f.notes,
        shippingAddress: {
          name: f.name, email: f.email, phone: f.phone,
          zipCode: f.zipCode, street: f.street, number: f.number,
          complement: f.complement, district: f.district, city: f.city, state: f.state
        }
      };

      $('#placeOrder').disabled = true;
      try {
        const result = await CamilloAPI.post('/orders', payload);
        CamilloCart.clear();
        location.href = `/pedido?numero=${encodeURIComponent(result.orderNumber)}`;
      } catch (error) {
        $('#checkoutError').textContent = error.message;
        $('#placeOrder').disabled = false;
      }
    });
  }

  async function orders() {
    if (!CamilloAuth.requireLogin()) return;
    try {
      const rows = await CamilloAPI.get('/orders');
      $('#ordersRoot').innerHTML = rows.length
        ? `<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Data</th><th>Status</th><th>Total</th><th></th></tr></thead><tbody>${rows.map((o) => `<tr><td>${o.order_number}</td><td>${new Date(o.created_at).toLocaleDateString('pt-BR')}</td><td><span class="badge">${o.status.replaceAll('_', ' ')}</span></td><td>${money(o.total)}</td><td><a href="/pedido?numero=${o.order_number}">Abrir</a></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty">Nenhum pedido ainda.</div>';
    } catch (error) {
      $('#ordersRoot').innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`;
    }
  }

  async function order() {
    if (!CamilloAuth.requireLogin()) return;
    const number = new URLSearchParams(location.search).get('numero');
    if (!number) { $('#orderRoot').innerHTML = '<p class="notice">Número de pedido ausente.</p>'; return; }
    try {
      const o = await CamilloAPI.get(`/orders/${encodeURIComponent(number)}`);
      $('#orderRoot').innerHTML = `
        <div class="section-head"><div><span class="eyebrow">Pedido</span><h1 style="font-size:2.6rem">${escapeHtml(o.order_number)}</h1></div><span class="badge">${o.status.replaceAll('_', ' ')}</span></div>
        <div class="grid grid-2">
          <div class="card" style="padding:1.2rem"><h3>Itens</h3>${o.items.map((item) => `<p style="display:flex;justify-content:space-between"><span>${item.quantity}× ${escapeHtml(item.product_name)} <small class="muted">${escapeHtml(item.variant_label)}</small></span><strong>${money(item.total_price)}</strong></p>`).join('')}<hr><p style="display:flex;justify-content:space-between"><span>Total</span><strong>${money(o.total)}</strong></p><p class="muted">${escapeHtml(o.shipping_street)}, ${escapeHtml(o.shipping_number)} · ${escapeHtml(o.shipping_city)}/${escapeHtml(o.shipping_state)}</p>${o.tracking_code ? `<p><strong>Rastreio:</strong> ${escapeHtml(o.tracking_code)}</p>` : ''}</div>
          <div class="card" style="padding:1.2rem"><h3>Acompanhamento</h3><div class="timeline">${o.history.map((h) => `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${escapeHtml(h.status.replaceAll('_', ' '))}</strong><div class="muted">${new Date(h.created_at).toLocaleString('pt-BR')} · ${escapeHtml(h.note || '')}</div></div></div>`).join('')}</div></div>
        </div>`;
    } catch (error) {
      $('#orderRoot').innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`;
    }
  }

  async function club() {
    if (!CamilloAuth.isLogged()) {
      $('#clubAccount').innerHTML = '<div class="notice">Entre na sua conta para ver pontos, benefícios desbloqueados e histórico. <a href="/login?next=%2Fclube-camillo"><strong>Entrar</strong></a></div>';
      if ($('#clubRewards')) $('#clubRewards').innerHTML = '<p class="muted">As recompensas personalizadas aparecem após o login.</p>';
      if ($('#clubHistory')) $('#clubHistory').innerHTML = '<p class="muted">O histórico de pontos é privado.</p>';
      return;
    }
    try {
      const data = await CamilloAPI.get('/loyalty/summary');
      $('#clubAccount').innerHTML = `<div class="club-hero"><span class="eyebrow" style="color:var(--yellow)">Seu progresso</span><h2>${escapeHtml(data.currentLevel?.name || 'Grão')}</h2><p>${data.points} pontos</p><p>${escapeHtml(data.currentLevel?.benefit_description || '')}</p>${data.nextLevel ? `<div class="progress"><span style="width:${Math.min(100, data.points / data.nextLevel.min_points * 100)}%"></span></div><p>Faltam ${Math.max(0, data.nextLevel.min_points - data.points)} pontos para ${escapeHtml(data.nextLevel.name)}.</p>` : '<p>Você chegou ao nível máximo atual.</p>'}</div>`;
      const rewardsRoot = $('#clubRewards');
      if (rewardsRoot) rewardsRoot.innerHTML = data.rewards.length ? data.rewards.map((reward) => `<article class="card level-card ${reward.unlocked ? 'current' : ''}"><span class="badge ${reward.unlocked ? 'badge-yellow' : ''}">${reward.points_cost} pts</span><h3>${escapeHtml(reward.name)}</h3><p class="muted">${escapeHtml(reward.description)}</p><strong>${reward.unlocked ? 'Benefício desbloqueado' : `Faltam ${Math.max(0, reward.points_cost - data.points)} pts`}</strong></article>`).join('') : '<p class="muted">Nenhuma recompensa ativa.</p>';
      const historyRoot = $('#clubHistory');
      if (historyRoot) historyRoot.innerHTML = data.transactions.length ? `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Pontos</th></tr></thead><tbody>${data.transactions.map((tx) => `<tr><td>${new Date(tx.created_at).toLocaleDateString('pt-BR')}</td><td>${escapeHtml(tx.description)}</td><td><strong>${Number(tx.points) > 0 ? '+' : ''}${tx.points}</strong></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nenhuma movimentação ainda.</p>';
    } catch {
      // A página pública continua exibindo a explicação dos níveis.
    }
  }

  function contact() {
    const form = $('#contactForm');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      toast('Mensagem registrada apenas nesta demonstração.');
      form.reset();
    });
  }

  async function adminDashboard() {
    if (!CamilloAuth.requireAdmin()) return;
    try {
      const d = await CamilloAPI.get('/admin/dashboard');
      $('#adminKpis').innerHTML = `
        <div class="card stat"><span class="muted">Faturamento aprovado</span><strong>${money(d.sales.revenue)}</strong></div>
        <div class="card stat"><span class="muted">Pedidos</span><strong>${d.sales.orders}</strong></div>
        <div class="card stat"><span class="muted">Ticket médio pago</span><strong>${money(d.sales.avgTicket)}</strong></div>
        <div class="card stat"><span class="muted">Clientes</span><strong>${d.customers}</strong></div>`;
      const max = Math.max(1, ...d.statuses.map((item) => Number(item.quantity)));
      $('#statusChart').innerHTML = d.statuses.map((status) => `<div class="chart-bar" style="height:${30 + 170 * Number(status.quantity) / max}px" title="${status.status}: ${status.quantity}"><span>${status.status.replaceAll('_', ' ').slice(0, 12)}</span></div>`).join('');
    } catch (error) {
      $('#adminKpis').innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`;
    }
  }

  async function adminOrders() {
    if (!CamilloAuth.requireAdmin()) return;

    async function load() {
      const rows = await CamilloAPI.get('/admin/orders');
      $('#adminOrders').innerHTML = `<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Pagamento</th><th>Status</th><th>Total</th><th>Ação</th></tr></thead><tbody>${rows.map((o) => `
        <tr><td>${o.order_number}</td><td>${escapeHtml(o.customer_name)}</td><td>${o.payment_status || '—'}</td><td>${o.status.replaceAll('_', ' ')}</td><td>${money(o.total)}</td><td>
          ${o.payment_status === 'pending' ? `<div style="display:flex;gap:.4rem"><button class="btn btn-secondary resolvePayment" data-id="${o.id}" data-status="approved">Aprovar pgto.</button><button class="btn btn-outline resolvePayment" data-id="${o.id}" data-status="declined">Recusar</button></div>` : `<select class="select statusSelect" data-id="${o.id}"><option value="">Alterar status</option>${['pedido_confirmado', 'separando_pedido', 'preparando_envio', 'enviado', 'em_transporte', 'entregue', 'cancelado'].map((status) => `<option value="${status}">${status.replaceAll('_', ' ')}</option>`).join('')}</select>`}
        </td></tr>`).join('')}</tbody></table></div>`;

      $$('.statusSelect').forEach((select) => select.addEventListener('change', async () => {
        if (!select.value) return;
        try {
          await CamilloAPI.patch(`/admin/orders/${select.dataset.id}/status`, { status: select.value });
          toast('Status atualizado.');
          load();
        } catch (error) { toast(error.message); }
      }));

      $$('.resolvePayment').forEach((button) => button.addEventListener('click', async () => {
        try {
          await CamilloAPI.patch(`/admin/orders/${button.dataset.id}/payment`, { status: button.dataset.status });
          toast('Pagamento pendente resolvido.');
          load();
        } catch (error) { toast(error.message); }
      }));
    }

    try { await load(); } catch (error) { $('#adminOrders').innerHTML = `<p class="notice">${escapeHtml(error.message)}</p>`; }
  }

  async function adminCustomers() {
    if (!CamilloAuth.requireAdmin()) return;
    try {
      const [users, notices] = await Promise.all([CamilloAPI.get('/admin/customers'), CamilloAPI.get('/admin/stock-notifications')]);
      $('#customers').innerHTML = `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Pontos</th><th>Cadastro</th></tr></thead><tbody>${users.map((u) => `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${u.loyalty_points}</td><td>${new Date(u.created_at).toLocaleDateString('pt-BR')}</td></tr>`).join('')}</tbody></table></div>`;
      $('#notifications').innerHTML = notices.length ? notices.map((n) => `<div class="card" style="padding:1rem;margin-bottom:.7rem"><strong>${escapeHtml(n.product_name)}</strong><div class="muted">${escapeHtml(n.email)} · ${n.status}</div></div>`).join('') : '<p class="muted">Nenhum aviso pendente.</p>';
    } catch (error) { toast(error.message); }
  }

  async function adminProducts() {
    if (!CamilloAuth.requireAdmin()) return;
    const select = $('#adminProductSelect');
    let products = [];
    let categories = [];
    let reference;
    const imageKeys = ['caffe-arabica','caffe-conilon','blend-arabica-conilon','caffe-arabica-cacau','caffe-arabica-chocolate','caffe-arabica-laranja','espresso','ristretto','lungo','macchiato','cappuccino','caffe-latte','affogato','marocchino','bicerin','caffe-corretto','shakerato','moka','caffe-freddo'];
    const options = (rows, selected, blank = '') => (blank ? '<option value="">' + escapeHtml(blank) + '</option>' : '') + rows.map((row) => '<option value="' + escapeHtml(row.id) + '" ' + (String(row.id) === String(selected) ? 'selected' : '') + '>' + escapeHtml(row.name) + (row.active === 0 ? ' (inativa)' : '') + '</option>').join('');
    const field = (prefix, name, label, value = '', type = 'text', extra = '') => '<div class="field"><label for="' + prefix + '-' + name + '">' + label + '</label><input class="input" id="' + prefix + '-' + name + '" name="' + name + '" type="' + type + '" value="' + escapeHtml(value) + '" ' + extra + '></div>';
    const choice = (prefix, name, label, content) => '<div class="field"><label for="' + prefix + '-' + name + '">' + label + '</label><select class="select" id="' + prefix + '-' + name + '" name="' + name + '">' + content + '</select></div>';
    const text = (prefix, name, label, value = '') => '<div class="field"><label for="' + prefix + '-' + name + '">' + label + '</label><textarea class="textarea" id="' + prefix + '-' + name + '" name="' + name + '">' + escapeHtml(value) + '</textarea></div>';
    const flags = [{ id: 1, name: 'Sim' }, { id: 0, name: 'Não' }];
    const kindRows = [{ id: 'packaged', name: 'Café em saco' }, { id: 'beverage', name: 'Bebida preparada' }, { id: 'dessert', name: 'Sobremesa com café' }];
    const grindRows = () => reference.grinds || [];
    function productFields(p = {}, prefix = 'new') {
      const keys = imageKeys.includes(p.image_key) || !p.image_key ? imageKeys : [p.image_key, ...imageKeys];
      return '<div class="form-grid two">'
        + field(prefix, 'name', 'Nome', p.name, 'text', 'required maxlength="140"')
        + field(prefix, 'slug', 'Identificador na URL', p.slug, 'text', 'pattern="[a-z0-9-]+" placeholder="gerado a partir do nome"')
        + choice(prefix, 'productKind', 'Formato de produto', options(kindRows, p.product_kind || 'packaged'))
        + choice(prefix, 'categoryId', 'Categoria', options(categories, p.category_id, 'Escolha uma categoria'))
        + choice(prefix, 'coffeeType', 'Tipo de café', options([{id:'arabica',name:'Arábica'},{id:'conilon',name:'Conilon'},{id:'blend',name:'Blend'}], p.coffee_type || 'arabica'))
        + choice(prefix, 'originId', 'Origem do café de base', options(reference.origins, p.origin_id || reference.origins[0]?.id))
        + choice(prefix, 'roastLevelId', 'Torra do café de base', options(reference.roasts, p.roast_level_id || reference.roasts[0]?.id))
        + choice(prefix, 'imageKey', 'Ilustração', options(keys.map((key) => ({id:key,name:key})), p.image_key || p.slug || 'caffe-arabica'))
        + field(prefix, 'intensity', 'Intensidade (1–5)', p.intensity ?? 3, 'number', 'min="1" max="5"')
        + field(prefix, 'bodyScore', 'Corpo (1–5)', p.body_score ?? 3, 'number', 'min="1" max="5"')
        + field(prefix, 'acidityScore', 'Acidez (1–5)', p.acidity_score ?? 3, 'number', 'min="1" max="5"')
        + field(prefix, 'shortDescription', 'Descrição curta', p.short_description || '')
        + field(prefix, 'sensoryNotes', 'Notas sensoriais', p.sensory_notes || '')
        + field(prefix, 'brewSuggestion', 'Sugestão de preparo', p.brew_suggestion || '')
        + choice(prefix, 'featured', 'Destaque', options(flags, p.featured ?? 0))
        + choice(prefix, 'active', 'Produto ativo', options(flags, p.active ?? 1))
        + '</div><div style="margin-top:1rem">' + text(prefix, 'description', 'Descrição completa', p.description) + '</div>';
    }
    function productBody(form) {
      const body = Object.fromEntries(new FormData(form));
      ['categoryId','originId','roastLevelId'].forEach((name) => { body[name] = body[name] ? Number(body[name]) : null; });
      ['intensity','bodyScore','acidityScore','featured','active'].forEach((name) => { body[name] = Number(body[name]); });
      if (!body.slug) delete body.slug;
      return body;
    }
    function variantFields(p, v = {}, prefix) {
      const unit = v.unit_type || (p.product_kind === 'packaged' ? 'weight' : p.product_kind === 'dessert' ? 'unit' : 'volume');
      return '<div class="admin-variant-fields">'
        + field(prefix, 'sku', 'SKU', v.sku || '', 'text', 'required')
        + field(prefix, 'label', 'Apresentação (rótulo)', v.label || '', 'text', 'placeholder="ex.: 60 ml · xícara"')
        + choice(prefix, 'unitType', 'Unidade de venda', options([{id:'weight',name:'Peso (g)'},{id:'volume',name:'Volume (ml)'},{id:'unit',name:'Unidade'}], unit))
        + field(prefix, 'weightG', 'Peso em gramas', v.weight_g ?? (unit === 'weight' ? 250 : ''), 'number', 'min="1" step="1"')
        + field(prefix, 'volumeMl', 'Volume em ml', v.volume_ml ?? '', 'number', 'min="1" step="1"')
        + choice(prefix, 'grindTypeId', 'Moagem', options(grindRows(), v.grind_type_id, 'Sem moagem / não se aplica'))
        + field(prefix, 'price', 'Preço demonstrativo (R$)', v.price ?? '', 'number', 'min="0" step="0.01" required')
        + field(prefix, 'stock', 'Estoque', v.stock ?? 0, 'number', 'min="0" step="1" required')
        + choice(prefix, 'active', 'Variante ativa', options(flags, v.active ?? 1))
        + '</div>';
    }
    function configureVariantForm(form) {
      function updateUnits() {
        const weight = form.elements.unitType.value === 'weight';
        const volume = form.elements.unitType.value === 'volume';
        form.elements.weightG.disabled = !weight;
        form.elements.weightG.required = weight;
        form.elements.volumeMl.disabled = !volume;
        form.elements.volumeMl.required = volume;
        form.elements.grindTypeId.disabled = !weight;
        form.elements.grindTypeId.required = weight;
      }
      form.elements.unitType.addEventListener('change', updateUnits);
      updateUnits();
    }
    function variantBody(form, productId) {
      const body = Object.fromEntries(new FormData(form));
      const weight = body.unitType === 'weight';
      const volume = body.unitType === 'volume';
      Object.assign(body, { productId, weightG: weight ? Number(body.weightG) : null, volumeMl: volume ? Number(body.volumeMl) : null, grindTypeId: weight ? Number(body.grindTypeId) : null, price: Number(body.price), stock: Number(body.stock), active: Number(body.active) });
      return body;
    }
    async function loadProducts(selectedId) {
      products = await CamilloAPI.get('/admin/products');
      select.innerHTML = '<option value="">Selecione um produto</option>' + products.map((p) => '<option value="' + p.id + '">' + escapeHtml(p.name) + (p.active ? '' : ' (inativo)') + '</option>').join('');
      if (selectedId) select.value = String(selectedId);
    }
    async function renderProduct() {
      const p = products.find((item) => String(item.id) === select.value);
      if (!p) { $('#variantEditor').innerHTML = ''; return; }
      $('#variantEditor').innerHTML = '<div class="section-head"><h2 style="font-size:2rem">' + escapeHtml(p.name) + '</h2><button class="btn btn-outline" id="deactivateProduct">Desativar produto</button></div>'
        + '<form id="editProductForm" class="card" style="padding:1rem;margin-bottom:1rem"><h3>Dados do produto</h3>' + productFields(p, 'edit') + '<button class="btn btn-primary" style="margin-top:1rem">Salvar produto</button></form>'
        + '<h3>Variantes, apresentação e estoque</h3><p class="muted">Cafés em saco: 250 g, 500 g ou 1 kg e sete moagens. Preparados: volume em ml ou porção unitária.</p>'
        + (p.variants || []).map((v) => '<form class="card editVariantForm" style="margin-bottom:1rem" data-id="' + v.id + '"><h4 style="padding:1rem;margin:0">' + escapeHtml(variantLabel(v)) + ' · ' + escapeHtml(v.sku) + '</h4>' + variantFields(p, v, 'variant-' + v.id) + '<button class="btn btn-outline" style="margin:0 1rem 1rem">Salvar variante</button></form>').join('')
        + '<form id="newVariantForm" class="card" style="margin-top:1.5rem"><h3 style="padding:1rem;margin:0">Adicionar variante</h3>' + variantFields(p, {}, 'add-variant') + '<button class="btn btn-secondary" style="margin:0 1rem 1rem">Criar variante</button></form>';
      $('#editProductForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        try { await CamilloAPI.patch('/admin/products/' + p.id, productBody(event.currentTarget)); await loadProducts(p.id); await renderProduct(); toast('Produto atualizado.'); } catch (error) { toast(error.message); }
      });
      $$('.editVariantForm').forEach((form) => {
        configureVariantForm(form);
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          try { await CamilloAPI.patch('/admin/variants/' + form.dataset.id, variantBody(form, p.id)); await loadProducts(p.id); await renderProduct(); toast('Variante salva.'); } catch (error) { toast(error.message); }
        });
      });
      const newVariant = $('#newVariantForm');
      configureVariantForm(newVariant);
      newVariant.addEventListener('submit', async (event) => {
        event.preventDefault();
        try { await CamilloAPI.post('/admin/variants', variantBody(newVariant, p.id)); await loadProducts(p.id); await renderProduct(); toast('Variante criada.'); } catch (error) { toast(error.message); }
      });
      $('#deactivateProduct').addEventListener('click', async () => {
        if (!confirm('Desativar este produto do catálogo?')) return;
        try { await CamilloAPI.request('/admin/products/' + p.id, {method:'DELETE'}); await loadProducts(p.id); await renderProduct(); toast('Produto desativado.'); } catch (error) { toast(error.message); }
      });
    }
    async function loadCategories() {
      categories = await CamilloAPI.get('/admin/reference/categories');
      $('#categoryList').innerHTML = categories.map((c) => '<div class="card" style="padding:1rem;margin-bottom:.6rem"><strong>' + escapeHtml(c.name) + '</strong><small class="muted"> · ' + (c.active ? 'ativa' : 'inativa') + '</small><div><button class="btn btn-ghost editCategory" data-id="' + c.id + '">Editar</button>' + (c.active ? '<button class="btn btn-ghost deleteCategory" data-id="' + c.id + '">Desativar</button>' : '') + '</div></div>').join('');
      $$('.editCategory').forEach((button) => button.addEventListener('click', async () => {
        const c = categories.find((row) => String(row.id) === button.dataset.id);
        const name = prompt('Nome da categoria:', c.name); if (!name) return;
        const slug = prompt('Identificador:', c.slug); if (!slug) return;
        const description = prompt('Descrição:', c.description || ''); if (description === null) return;
        try { await CamilloAPI.patch('/admin/reference/categories/' + c.id, {name,slug,description}); await loadCategories(); refreshCategoryFields(); toast('Categoria atualizada.'); } catch (error) { toast(error.message); }
      }));
      $$('.deleteCategory').forEach((button) => button.addEventListener('click', async () => {
        try { await CamilloAPI.request('/admin/categories/' + button.dataset.id, {method:'DELETE'}); await loadCategories(); refreshCategoryFields(); toast('Categoria desativada.'); } catch (error) { toast(error.message); }
      }));
    }
    function refreshCategoryFields() {
      $$('select[name="categoryId"]').forEach((el) => { const selected = el.value; el.innerHTML = options(categories, selected, 'Escolha uma categoria'); });
    }
    try {
      reference = await CamilloAPI.get('/products/filters');
      await Promise.all([loadCategories(), loadProducts()]);
      $('#newProductForm').innerHTML = '<h3>Cadastrar produto</h3>' + productFields() + '<button class="btn btn-primary" style="margin-top:1rem">Criar produto</button>';
    } catch (error) { toast(error.message); return; }
    select.addEventListener('change', renderProduct);
    $('#newProductForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const body = productBody(form);
      try {
        const result = await CamilloAPI.post('/admin/products', body);
        await loadProducts();
        const created = products.find((p) => p.id === result?.id) || products.find((p) => p.slug === result?.slug) || products.find((p) => p.name === body.name);
        if (created) { select.value = String(created.id); await renderProduct(); $('#variantEditor').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); }
        form.reset();
        toast('Produto criado. Cadastre a primeira variante abaixo.');
      } catch (error) { toast(error.message); }
    });
    $('#categoryForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      try { await CamilloAPI.post('/admin/reference/categories', {...Object.fromEntries(new FormData(form)), active:1}); form.reset(); await loadCategories(); refreshCategoryFields(); toast('Categoria criada.'); } catch (error) { toast(error.message); }
    });
  }

  async function adminLoyalty() {
    if (!CamilloAuth.requireAdmin()) return;
    try {
      const [levels, rewards] = await Promise.all([
        CamilloAPI.get('/admin/reference/loyalty-levels'),
        CamilloAPI.get('/admin/reference/rewards')
      ]);
      $('#levelsAdmin').innerHTML = levels.map((level) => `<div class="card level-card"><h3>${escapeHtml(level.name)}</h3><p>${level.min_points}+ pontos</p><p class="muted">${escapeHtml(level.benefit_description)}</p><button class="btn btn-outline editLevel" data-id="${level.id}" data-name="${escapeHtml(level.name)}" data-slug="${escapeHtml(level.slug)}" data-points="${level.min_points}" data-benefit="${escapeHtml(level.benefit_description)}">Editar</button></div>`).join('');
      $('#rewardsAdmin').innerHTML = rewards.map((reward) => `<div class="card" style="padding:1rem"><strong>${escapeHtml(reward.name)}</strong><div>${reward.points_cost} pts</div><p class="muted">${escapeHtml(reward.description)}</p><button class="btn btn-outline editReward" data-id="${reward.id}" data-name="${escapeHtml(reward.name)}" data-cost="${reward.points_cost}" data-description="${escapeHtml(reward.description)}">Editar</button></div>`).join('');
      $$('.editLevel').forEach((button) => button.addEventListener('click', async () => {
        const name = prompt('Nome:', button.dataset.name); if (!name) return;
        const min_points = Number(prompt('Pontos mínimos:', button.dataset.points));
        const benefit_description = prompt('Benefício:', button.dataset.benefit); if (benefit_description === null) return;
        try { await CamilloAPI.patch(`/admin/reference/loyalty-levels/${button.dataset.id}`, { name, min_points, benefit_description }); location.reload(); } catch (error) { toast(error.message); }
      }));
      $$('.editReward').forEach((button) => button.addEventListener('click', async () => {
        const name = prompt('Nome:', button.dataset.name); if (!name) return;
        const points_cost = Number(prompt('Custo em pontos:', button.dataset.cost));
        const description = prompt('Descrição:', button.dataset.description); if (description === null) return;
        try { await CamilloAPI.patch(`/admin/reference/rewards/${button.dataset.id}`, { name, points_cost, description }); location.reload(); } catch (error) { toast(error.message); }
      }));

      $('#levelForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const body = Object.fromEntries(new FormData(event.currentTarget));
        body.min_points = Number(body.min_points);
        await CamilloAPI.post('/admin/reference/loyalty-levels', body);
        location.reload();
      });
      $('#rewardForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const body = Object.fromEntries(new FormData(event.currentTarget));
        body.points_cost = Number(body.points_cost);
        body.active = 1;
        await CamilloAPI.post('/admin/reference/rewards', body);
        location.reload();
      });
    } catch (error) { toast(error.message); }
  }

  switch (page) {
    case 'home': home(); break;
    case 'catalog': catalog(); break;
    case 'product': product(); break;
    case 'cart': cart(); break;
    case 'login': authForm('login'); break;
    case 'register': authForm('register'); break;
    case 'account': account(); break;
    case 'checkout': checkout(); break;
    case 'orders': orders(); break;
    case 'order': order(); break;
    case 'club': club(); break;
    case 'contact': contact(); break;
    case 'admin-dashboard': adminDashboard(); break;
    case 'admin-orders': adminOrders(); break;
    case 'admin-customers': adminCustomers(); break;
    case 'admin-products': adminProducts(); break;
    case 'admin-loyalty': adminLoyalty(); break;
    case 'admin-static': CamilloAuth.requireAdmin(); break;
  }
})();
