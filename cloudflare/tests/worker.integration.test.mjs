import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../worker/index.js';
import { signToken } from '../worker/lib/crypto.js';
import { resolvePendingPayment, updateOrderStatus } from '../worker/routes/orders.js';

class D1StatementMock {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new D1StatementMock(this.db, this.sql, args); }
  first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.db.prepare(this.sql).all(...this.args), success: true, meta: {} }; }
  run() {
    const result = this.db.prepare(this.sql).run(...this.args);
    return { success: true, meta: { last_row_id: Number(result.lastInsertRowid || 0), changes: Number(result.changes || 0) } };
  }
}

class D1Mock {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(fs.readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8'));
    this.db.exec(fs.readFileSync(new URL('../database/seed.sql', import.meta.url), 'utf8'));
    for (const file of ['0001_baseline.sql','0002_flexible_variants.sql','0003_official_catalog.sql','0004_simplified_catalog.sql']) {
      this.db.exec('BEGIN IMMEDIATE');
      this.db.exec(fs.readFileSync(new URL(`../database/migrations/${file}`, import.meta.url), 'utf8'));
      this.db.exec('COMMIT');
    }
  }
  prepare(sql) { return new D1StatementMock(this.db, sql); }
  batch(statements) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const results = statements.map((stmt) => /^\s*(SELECT|PRAGMA|WITH)\b/i.test(stmt.sql) ? stmt.all() : stmt.run());
      this.db.exec('COMMIT');
      return results;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

function makeEnv() {
  return {
    DB: new D1Mock(),
    JWT_SECRET: 'segredo-de-integracao-1234567890',
    LOW_STOCK_THRESHOLD: '5',
    APP_ENV: 'test',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) }
  };
}

async function api(env, path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const request = new Request(`https://example.test/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const response = await worker.fetch(request, env);
  const json = await response.json();
  return { response, json };
}

async function login(env, email, password) {
  const { response, json } = await api(env, '/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(response.status, 200, JSON.stringify(json));
  return json.data.token;
}

test('login renova sessão expirada e rejeita tokens inválidos sem erro interno', async () => {
  const env = makeEnv();
  const user = env.DB.db.prepare('SELECT id,email,role,name FROM users WHERE id=2').get();
  const expired = await signToken(user, env.JWT_SECRET, -1);
  for (const token of [expired, 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIn0.!']) {
    const result = await api(env, '/auth/me', { token });
    assert.equal(result.response.status, 401);
    assert.equal(result.json.error.code, 'INVALID_TOKEN');
  }
  const result = await api(env, '/auth/login', {
    method: 'POST', token: expired,
    body: { email: user.email, password: 'Cliente@123' }
  });
  assert.equal(result.response.status, 200);
  const me = await api(env, '/auth/me', { token: result.json.data.token });
  assert.equal(me.response.status, 200);
  assert.equal(me.json.data.id, user.id);
  const wrongPassword = await api(env, '/auth/login', { method: 'POST', body: { email: user.email, password: 'incorreta' } });
  assert.equal(wrongPassword.response.status, 401);
  assert.equal(wrongPassword.json.error.code, 'INVALID_CREDENTIALS');
});

test('checkout aplica frete fixo do Sudeste e bloqueia outras regiões sem efeitos', async () => {
  const env = makeEnv();
  const token = await login(env, 'cliente@caffecamillo.local', 'Cliente@123');
  const variant = env.DB.db.prepare("SELECT v.* FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.slug='caffe-arabica' ORDER BY v.id LIMIT 1").get();
  const address = { name:'Cliente',email:'cliente@caffecamillo.local',phone:'31999990000',zipCode:'30000-000',street:'Rua',number:'1',district:'Centro',city:'Cidade',state:'MG' };
  const quantity = Math.ceil(300 / variant.price);
  for (const state of ['MG', 'ES', 'RJ', 'SP']) {
    const result = await api(env, '/orders', { method:'POST',token,body:{items:[{variantId:variant.id,quantity}],paymentMethod:'pix',paymentScenario:'pending',shippingAddress:{...address,state},shippingAmount:0} });
    assert.equal(result.response.status, 201, JSON.stringify(result.json));
    const expected = state === 'MG' ? 0 : 40;
    assert.equal(result.json.data.shipping.price, expected);
    assert.equal(result.json.data.total, result.json.data.subtotal + expected);
    const stored = env.DB.db.prepare('SELECT shipping_amount,total FROM orders WHERE order_number=?').get(result.json.data.orderNumber);
    assert.equal(stored.shipping_amount, expected);
    assert.equal(stored.total, result.json.data.total);
  }
  const snapshot = () => ({
    orders: env.DB.db.prepare('SELECT COUNT(*) n FROM orders').get().n,
    payments: env.DB.db.prepare('SELECT COUNT(*) n FROM payments').get().n,
    stock: env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(variant.id).stock,
    points: env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get().loyalty_points
  });
  const before = snapshot();
  for (const state of ['BA', 'PR', 'DF', 'AM', 'XX']) {
    const result = await api(env, '/orders', { method:'POST',token,body:{items:[{variantId:variant.id,quantity}],paymentMethod:'pix',paymentScenario:'approved',shippingAddress:{...address,state}} });
    assert.equal(result.response.status, 422);
    assert.equal(result.json.error.code, 'SHIPPING_UNAVAILABLE');
    assert.deepEqual(snapshot(), before);
  }
});

test('bebidas retiradas não aparecem e carrinho antigo não cria pedido nem muda estoque', async () => {
  const env = makeEnv();
  const token = await login(env, 'cliente@caffecamillo.local', 'Cliente@123');
  const removed = ['affogato','bicerin','caffe-corretto','caffe-freddo','caffe-latte','espresso','lungo','macchiato','marocchino','ristretto','shakerato'];
  const beforeOrders = env.DB.db.prepare('SELECT COUNT(*) n FROM orders').get().n;
  for (const slug of removed) {
    const detail = await api(env, `/products/${slug}`);
    assert.equal(detail.response.status, 404, slug);
    const variant = env.DB.db.prepare('SELECT v.id,v.stock FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.slug=? ORDER BY v.id LIMIT 1').get(slug);
    const result = await api(env, '/orders', { method:'POST',token,body:{items:[{variantId:variant.id,quantity:1}],paymentMethod:'pix',paymentScenario:'approved',shippingAddress:{ name:'Cliente',email:'cliente@caffecamillo.local',phone:'31999990000',zipCode:'30000-000',street:'Rua',number:'1',district:'Centro',city:'Cidade',state:'MG' }} });
    assert.equal(result.response.status, 409, slug);
    assert.equal(result.json.error.code, 'VARIANT_UNAVAILABLE');
    assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(variant.id).stock, variant.stock);
  }
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM orders').get().n, beforeOrders);
});

test('Worker executa catálogo, login, compra, pontos, admin e cancelamento', async () => {
  const env = makeEnv();

  let result = await api(env, '/health');
  assert.equal(result.response.status, 200);
  assert.equal(result.json.data.database, 'ok');

  result = await api(env, '/products');
  assert.equal(result.response.status, 200);
  assert.equal(result.json.data.length, 8);

  const customerToken = await login(env, 'cliente@caffecamillo.local', 'Cliente@123');
  const adminToken = await login(env, 'admin@caffecamillo.local', 'Admin@123');

  const variantId = env.DB.db.prepare("SELECT v.id FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.slug='caffe-arabica' ORDER BY v.id LIMIT 1").get().id;

  const beforeVariant = env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(variantId);
  const beforeUser = env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get();

  result = await api(env, '/orders', {
    method: 'POST', token: customerToken,
    body: {
      items: [{ variantId, quantity: 2 }],
      paymentMethod: 'pix',
      paymentScenario: 'approved',
      shippingAddress: {
        name: 'Cliente Demonstração', email: 'cliente@caffecamillo.local', phone: '27999990000',
        zipCode: '29260-000', street: 'Rua Teste', number: '10', district: 'Centro', city: 'Domingos Martins', state: 'ES'
      }
    }
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.json));
  assert.equal(result.json.data.status, 'pedido_confirmado');
  const orderNumber = result.json.data.orderNumber;

  const afterVariant = env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(variantId);
  assert.equal(afterVariant.stock, beforeVariant.stock - 2);
  const afterUser = env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get();
  assert.ok(afterUser.loyalty_points > beforeUser.loyalty_points);

  result = await api(env, `/orders/${encodeURIComponent(orderNumber)}`, { token: customerToken });
  assert.equal(result.response.status, 200);
  assert.equal(result.json.data.items.length, 1);
  assert.ok(result.json.data.history.length >= 3);

  result = await api(env, '/admin/dashboard', { token: adminToken });
  assert.equal(result.response.status, 200);
  assert.ok(result.json.data.sales.orders >= 2);

  const createdOrder = env.DB.db.prepare('SELECT id FROM orders WHERE order_number=?').get(orderNumber);
  result = await api(env, `/admin/orders/${createdOrder.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'cancelado' } });
  assert.equal(result.response.status, 200, JSON.stringify(result.json));
  assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(variantId).stock, beforeVariant.stock);
  assert.equal(env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get().loyalty_points, beforeUser.loyalty_points);
});

test('pagamento pendente só baixa estoque quando admin aprova', async () => {
  const env = makeEnv();
  const customerToken = await login(env, 'cliente@caffecamillo.local', 'Cliente@123');
  const adminToken = await login(env, 'admin@caffecamillo.local', 'Admin@123');
  const variantId = env.DB.db.prepare("SELECT v.id FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.slug='cappuccino' ORDER BY v.id LIMIT 1").get().id;
  const before = env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(variantId).stock;

  let result = await api(env, '/orders', {
    method: 'POST', token: customerToken,
    body: {
      items: [{ variantId, quantity: 1 }], paymentMethod: 'card', cardBrand: 'visa', paymentScenario: 'pending',
      shippingAddress: { name: 'Cliente', email: 'cliente@caffecamillo.local', phone: '27999990000', zipCode: '29260-000', street: 'Rua', number: '1', district: 'Centro', city: 'Domingos Martins', state: 'ES' }
    }
  });
  assert.equal(result.response.status, 201);
  assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(variantId).stock, before);
  const row = env.DB.db.prepare('SELECT id FROM orders WHERE order_number=?').get(result.json.data.orderNumber);

  result = await api(env, `/admin/orders/${row.id}/payment`, { method: 'PATCH', token: adminToken, body: { status: 'approved' } });
  assert.equal(result.response.status, 200, JSON.stringify(result.json));
  assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(variantId).stock, before - 1);
});

test('Amex é rejeitado e rota inexistente retorna 404', async () => {
  const env = makeEnv();
  const customerToken = await login(env, 'cliente@caffecamillo.local', 'Cliente@123');
  let result = await api(env, '/orders', {
    method: 'POST', token: customerToken,
    body: {
      items: [{ variantId: 1, quantity: 1 }], paymentMethod: 'card', cardBrand: 'amex', paymentScenario: 'approved',
      shippingAddress: { name: 'Cliente', email: 'cliente@caffecamillo.local', phone: '27999990000', zipCode: '29260-000', street: 'Rua', number: '1', district: 'Centro', city: 'Domingos Martins', state: 'ES' }
    }
  });
  assert.equal(result.response.status, 400);
  assert.equal(result.json.error.code, 'CARD_BRAND_NOT_ACCEPTED');

  result = await api(env, '/nao-existe');
  assert.equal(result.response.status, 404);
  assert.equal(result.json.error.code, 'NOT_FOUND');
});

const shippingAddress = { name:'Cliente',email:'cliente@caffecamillo.local',phone:'27999990000',zipCode:'29260-000',street:'Rua',number:'1',district:'Centro',city:'Domingos Martins',state:'ES' };

test('filtros oficiais, origens, aromatização e detalhe de variantes flexíveis', async()=>{
  const env=makeEnv();
  let result=await api(env,'/products?category=bebidas');
  assert.equal(result.json.data.length,2);
  assert.ok(result.json.data.every(p=>p.product_kind==='beverage' && p.category_slug==='bebidas' && p.image_key===p.slug));
  result=await api(env,'/products?type=packaged&weight=1000&grind=extra-fina&origin=domingos-martins&roast=media&minPrice=100&maxPrice=300&available=true');
  assert.equal(result.response.status,200); assert.equal(result.json.data.length,5);
  result=await api(env,'/products?aroma=chocolate');
  assert.deepEqual(result.json.data.map(p=>p.slug),['caffe-arabica-chocolate']);
  result=await api(env,'/products/caffe-arabica');
  assert.equal(result.json.data.variants.length,21);
  assert.deepEqual([...new Set(result.json.data.variants.map(v=>v.weight_g))],[250,500,1000]);
  result=await api(env,'/products/cappuccino');
  assert.deepEqual(result.json.data.variants.map(v=>v.volume_ml),[180,250]);
  assert.ok(result.json.data.variants.every(v=>v.unit_type==='volume' && v.weight_g===null && v.grind_type_id===null && v.grind_type===null && v.label.endsWith('ml')));
  result=await api(env,'/products/affogato');
  assert.equal(result.response.status,404);
  assert.equal(result.json.error.code,'PRODUCT_NOT_FOUND');
  result=await api(env,'/products/filters');
  assert.equal(result.json.data.grinds.length,7); assert.equal(result.json.data.categories.length,2);
  assert.deepEqual(result.json.data.productKinds,['packaged','beverage','dessert']);
});

test('filtros combinados exigem uma mesma variante no intervalo, peso, moagem e disponibilidade',async()=>{
  const env=makeEnv();
  const productId=env.DB.db.prepare("SELECT id FROM products WHERE slug='caffe-arabica'").get().id;
  env.DB.db.prepare('UPDATE product_variants SET price=10,stock=5 WHERE product_id=?').run(productId);
  env.DB.db.prepare('UPDATE product_variants SET price=30,stock=0 WHERE product_id=? AND weight_g=1000').run(productId);
  let result=await api(env,'/products?search=Caffè%20Arábica&minPrice=15&maxPrice=25');
  assert.ok(!result.json.data.some(p=>p.id===productId),'10 e30 não significam uma variante entre15 e25');
  result=await api(env,'/products?weight=1000&maxPrice=15');
  assert.ok(!result.json.data.some(p=>p.id===productId),'1000g custa30, apesar de existir250g de10');
  result=await api(env,'/products?weight=1000&available=true');
  assert.ok(!result.json.data.some(p=>p.id===productId),'estoque de outros pesos não torna1000g disponível');
  env.DB.db.prepare('UPDATE product_variants SET price=20,stock=2 WHERE product_id=? AND weight_g=1000 AND grind_type_id=1').run(productId);
  result=await api(env,'/products?weight=1000&grind=fina-espresso&minPrice=15&maxPrice=25&available=true');
  assert.ok(!result.json.data.some(p=>p.id===productId),'grãos não satisfazem filtro de moagem espresso');
  result=await api(env,'/products?weight=1000&grind=graos-inteiros&minPrice=15&maxPrice=25&available=true');
  assert.ok(result.json.data.some(p=>p.id===productId));
});

test('admin cria e edita SKU, rótulo, estoque, peso1000g, volume e unidade sem remover histórico', async()=>{
  const env=makeEnv(); const token=await login(env,'admin@caffecamillo.local','Admin@123');
  const productId=env.DB.db.prepare("SELECT id FROM products WHERE slug='cappuccino'").get().id;
  let result=await api(env,'/admin/products',{token});
  assert.equal(result.json.data.length,28); assert.ok(result.json.data.some(p=>p.active===0));
  assert.ok(result.json.data.every(p=>Array.isArray(p.variants)));
  result=await api(env,'/admin/variants',{method:'POST',token,body:{productId,sku:'CUSTOM-ESP',label:'Copo especial',unitType:'volume',volumeMl:250,price:12.5,stock:7}});
  assert.equal(result.response.status,201,JSON.stringify(result.json)); const id=result.json.data.id;
  result=await api(env,`/admin/variants/${id}`,{method:'PATCH',token,body:{sku:'CUSTOM-ESP-2',label:'Grande da casa',price:15,stock:9,volumeMl:180}});
  assert.equal(result.response.status,200);
  let row=env.DB.db.prepare('SELECT * FROM product_variants WHERE id=?').get(id);
  assert.equal(row.sku,'CUSTOM-ESP-2'); assert.equal(row.label,'Grande da casa'); assert.equal(row.stock,9); assert.equal(row.volume_ml,180);
  result=await api(env,`/admin/variants/${id}`,{method:'PATCH',token,body:{unitType:'unit',volumeMl:null,label:'Normal'}});
  assert.equal(result.response.status,200);
  result=await api(env,`/admin/variants/${id}`,{method:'PATCH',token,body:{unitType:'weight',weightG:1000,grindTypeId:1,label:'1000 g · Grãos'}});
  assert.equal(result.response.status,200);
  for(const body of [{weightG:750},{price:-1},{stock:1.5},{sku:' '},{label:''},{unitType:'volume'},{grindTypeId:9999}]) {
    result=await api(env,`/admin/variants/${id}`,{method:'PATCH',token,body}); assert.equal(result.response.status,400,JSON.stringify(body));
  }
  result=await api(env,'/admin/variants',{method:'POST',token,body:{productId,sku:'CUSTOM-ESP-2',unitType:'unit',label:'Normal',price:10}});
  assert.equal(result.response.status,409);
  result=await api(env,`/admin/variants/${id}`,{method:'DELETE',token}); assert.equal(result.response.status,200);
  row=env.DB.db.prepare('SELECT * FROM product_variants WHERE id=?').get(id); assert.equal(row.active,0); assert.equal(row.weight_g,1000);
  result=await api(env,'/admin/products',{method:'POST',token,body:{name:'Sobremesa da casa',coffeeType:'arabica',productKind:'dessert',originId:2,roastLevelId:2,categoryId:1}});
  assert.equal(result.response.status,201); const createdId=result.json.data.id;
  result=await api(env,`/admin/products/${createdId}`,{method:'PATCH',token,body:{name:'Doce Camillo',productKind:'dessert',categoryId:2}});
  assert.equal(result.response.status,200);
  assert.equal(env.DB.db.prepare('SELECT product_kind FROM products WHERE id=?').get(createdId).product_kind,'dessert');
});

test('checkout bebidas guarda rótulos, aceita4 bandeiras e não baixa estoque recusado/cancelado',async()=>{
  const env=makeEnv(); const token=await login(env,'cliente@caffecamillo.local','Cliente@123');
  const v=env.DB.db.prepare("SELECT v.* FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.slug='cappuccino' ORDER BY v.id LIMIT 1").get();
  for(const scenario of ['declined','canceled']) {
    const result=await api(env,'/orders',{method:'POST',token,body:{items:[{variantId:v.id,quantity:1}],paymentMethod:'pix',paymentScenario:scenario,shippingAddress}});
    assert.equal(result.response.status,201); assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(v.id).stock,v.stock);
  }
  for(const [index,brand] of ['visa','mastercard','elo','hipercard'].entries()) {
    const result=await api(env,'/orders',{method:'POST',token,body:{items:[{variantId:v.id,quantity:1}],paymentMethod:'card',cardBrand:brand,paymentScenario:'approved',shippingAddress}});
    assert.equal(result.response.status,201,JSON.stringify(result.json));
    assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(v.id).stock,v.stock-index-1);
    const detail=await api(env,`/orders/${result.json.data.orderNumber}`,{token}); assert.equal(detail.json.data.items[0].variant_label,v.label);
  }
  const before=env.DB.db.prepare('SELECT COUNT(*) n FROM orders').get().n;
  const result=await api(env,'/orders',{method:'POST',token,body:{items:[{variantId:v.id,quantity:1}],paymentMethod:'card',cardBrand:'visa',card:{pan:'4111111111111111',cvv:'123'},shippingAddress}});
  assert.equal(result.response.status,400); assert.equal(result.json.error.code,'CARD_DATA_NOT_ALLOWED');
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM orders').get().n,before);
});

test('dupla aprovação e cancelamento concorrentes atualizam estoque e pontos exatamente uma vez', async()=>{
  const env=makeEnv(); const token=await login(env,'cliente@caffecamillo.local','Cliente@123');
  const v=env.DB.db.prepare("SELECT v.* FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.slug='cappuccino' ORDER BY v.id LIMIT 1").get();
  const beforePoints=env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get().loyalty_points;
  const result=await api(env,'/orders',{method:'POST',token,body:{items:[{variantId:v.id,quantity:2}],paymentMethod:'pix',paymentScenario:'pending',shippingAddress}});
  assert.equal(result.response.status,201);
  const order=env.DB.db.prepare('SELECT id,total FROM orders WHERE order_number=?').get(result.json.data.orderNumber);
  const approvals=await Promise.allSettled([resolvePendingPayment(env,order.id,'approved'),resolvePendingPayment(env,order.id,'approved')]);
  assert.equal(approvals.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(approvals.find(r=>r.status==='rejected').reason.code,'PAYMENT_STATE_CHANGED');
  assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(v.id).stock,v.stock-2);
  assert.equal(env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get().loyalty_points,beforePoints+Math.floor(order.total));
  const cancellations=await Promise.allSettled([updateOrderStatus(env,order.id,'cancelado'),updateOrderStatus(env,order.id,'cancelado')]);
  assert.equal(cancellations.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(cancellations.find(r=>r.status==='rejected').reason.code,'ORDER_STATE_CHANGED');
  assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(v.id).stock,v.stock);
  assert.equal(env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get().loyalty_points,beforePoints);
  assert.deepEqual(env.DB.db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('avanço administrativo com leitura antiga não reabre pedido cancelado durante a transação',async()=>{
  const env=makeEnv(); const token=await login(env,'cliente@caffecamillo.local','Cliente@123');
  const v=env.DB.db.prepare("SELECT v.* FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.slug='cappuccino' ORDER BY v.id LIMIT 1").get();
  const beforePoints=env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get().loyalty_points;
  const result=await api(env,'/orders',{method:'POST',token,body:{items:[{variantId:v.id,quantity:2}],paymentMethod:'pix',paymentScenario:'approved',shippingAddress}});
  assert.equal(result.response.status,201);
  const order=env.DB.db.prepare('SELECT id FROM orders WHERE order_number=?').get(result.json.data.orderNumber);
  // Ordinary status progression may repeat, without retaining a transient guard.
  await updateOrderStatus(env,order.id,'separando_pedido');
  await updateOrderStatus(env,order.id,'preparando_envio');
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) n FROM order_mutation_guards WHERE operation='advance_order'").get().n,0);

  // Force the exact race: the shipping operation has read the approved payment
  // and previous order state, then cancellation commits before its batch starts.
  const originalBatch=env.DB.batch.bind(env.DB);
  let interleaved=false;
  env.DB.batch=async statements=>{
    if (!interleaved && statements.some(stmt=>stmt.sql.includes("'advance_order'"))) {
      interleaved=true;
      await updateOrderStatus(env,order.id,'cancelado');
    }
    return originalBatch(statements);
  };
  await assert.rejects(updateOrderStatus(env,order.id,'enviado'),error=>error.status===409 && error.code==='ORDER_STATE_CHANGED');
  assert.equal(interleaved,true);
  const finalOrder=env.DB.db.prepare('SELECT status,tracking_code FROM orders WHERE id=?').get(order.id);
  assert.equal(finalOrder.status,'cancelado'); assert.equal(finalOrder.tracking_code,null);
  assert.equal(env.DB.db.prepare('SELECT status FROM payments WHERE order_id=?').get(order.id).status,'canceled');
  assert.equal(env.DB.db.prepare('SELECT stock FROM product_variants WHERE id=?').get(v.id).stock,v.stock);
  assert.equal(env.DB.db.prepare('SELECT loyalty_points FROM users WHERE id=2').get().loyalty_points,beforePoints);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) n FROM loyalty_transactions WHERE order_id=? AND type='reversal'").get(order.id).n,1);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) n FROM order_status_history WHERE order_id=? AND status='enviado'").get(order.id).n,0);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) n FROM order_mutation_guards WHERE operation='advance_order'").get().n,0);
  assert.deepEqual(env.DB.db.prepare('PRAGMA foreign_key_check').all(),[]);
});
