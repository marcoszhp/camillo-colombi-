(function(){
  const safe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.productCard=function(p){
    const out=Number(p.total_stock)<=0;
    return `<article class="card product-card ${out?'out':''}"><a class="product-visual" href="/produto?slug=${encodeURIComponent(p.slug)}"><img src="${bag(p.image_key)}" loading="lazy" alt="Ilustração de ${safe(p.name)}">${out?'<span class="badge badge-red" style="position:absolute;top:1rem;right:1rem">ESGOTADO</span>':''}</a><div class="product-content"><div><span class="badge">${safe(p.product_kind==='packaged'?p.roast_level:p.product_kind==='dessert'?'Café & sobremesa':'Preparado')}</span> ${p.aromas?'<span class="badge badge-yellow">Aromatização adicionada</span>':''}</div><div><h3><a href="/produto?slug=${encodeURIComponent(p.slug)}">${safe(p.name)}</a></h3><p class="muted">${safe(p.short_description)}</p></div><div style="margin-top:auto;display:flex;align-items:end;justify-content:space-between;gap:.8rem"><div><small class="muted">a partir de</small><div class="price">${money(p.min_price)}</div><small class="stock-summary">${out?'Sem estoque':`${Number(p.total_stock)} unidade(s) disponíveis`}</small></div><a class="btn btn-outline" href="/produto?slug=${encodeURIComponent(p.slug)}">${out?'Ver opções':'Escolher'}</a></div>${out?`<button class="stock-notify" data-notify-product="${p.id}" aria-label="Me avise quando ${safe(p.name)} voltar">Me avise</button>`:''}</div></article>`;
  };
  document.addEventListener('click', async(event)=>{
    const button=event.target.closest('[data-notify-product]');
    if(!button)return;
    const email=prompt('Digite seu e-mail para o aviso de reposição:');
    if(!email)return;
    try{await CamilloAPI.post('/customer/stock-notifications',{email,productId:Number(button.dataset.notifyProduct)});toast('Aviso de reposição registrado.');}catch(error){toast(error.message);}
  });
})();
