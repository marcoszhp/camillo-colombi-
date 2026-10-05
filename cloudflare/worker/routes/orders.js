import { AppError, json, readJson, positiveInt, text, validEmail } from '../lib/http.js';
import { currentUser } from '../lib/auth.js';
import { calculateShipping, mockPayment, orderNumber } from '../lib/services.js';

const validMethods = new Set(['pix','card']);
const validBrands = new Set(['visa','mastercard','elo','hipercard']);
const paymentScenarios = new Set(['approved','pending','declined','canceled']);
const manualStatuses = new Set(['pedido_confirmado','separando_pedido','preparando_envio','enviado','em_transporte','entregue','cancelado']);

function containsCardCredentials(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key,child]) => /^(pan|cvv|cvc|cardnumber|cardcvv|securitycode)$/i.test(key.replace(/[_-]/g,'')) || containsCardCredentials(child));
}

function normalizeCart(items) {
  const grouped = new Map();
  for (const raw of items) {
    const variantId = positiveInt(raw.variantId, 'variantId');
    const qty = positiveInt(raw.quantity, 'quantidade');
    grouped.set(variantId, (grouped.get(variantId) || 0) + qty);
  }
  return [...grouped.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
}

async function loadCartVariants(env, items) {
  const statements = items.map((item) => env.DB.prepare(`SELECT v.id,v.product_id,v.grind_type_id,v.sku,v.weight_g,v.price,v.stock,v.active,v.unit_type,v.label,v.volume_ml,
    p.name product_name,p.active product_active,g.name grind_type
    FROM product_variants v JOIN products p ON p.id=v.product_id LEFT JOIN grind_types g ON g.id=v.grind_type_id WHERE v.id=?`).bind(item.variantId));
  const results = await env.DB.batch(statements);
  return items.map((item, index) => ({ ...item, variant: results[index]?.results?.[0] || null }));
}

function validateShippingAddress(input) {
  const a = input || {};
  for (const key of ['name','email','phone','zipCode','street','number','district','city','state']) {
    if (!String(a[key] || '').trim()) throw new AppError(`Endereço incompleto: ${key}.`, 400, 'VALIDATION_ERROR');
  }
  if (!validEmail(a.email)) throw new AppError('E-mail de contato inválido.', 400, 'VALIDATION_ERROR');
  if (String(a.state).trim().length !== 2) throw new AppError('Estado deve ser informado pela sigla de 2 letras.', 400, 'VALIDATION_ERROR');
  if (String(a.phone).replace(/\D/g, '').length < 8) throw new AppError('Telefone de contato inválido.', 400, 'VALIDATION_ERROR');
  return {
    name: text(a.name,120), email: String(a.email).trim().toLowerCase(), phone: text(a.phone,30), zipCode: text(a.zipCode,12),
    street: text(a.street,150), number: text(a.number,20), complement: text(a.complement,100) || null,
    district: text(a.district,100), city: text(a.city,100), state: text(a.state,2).toUpperCase()
  };
}

async function createOrder(request, env) {
  const user = await currentUser(request, env);
  const input = await readJson(request);
  if (containsCardCredentials(input)) throw new AppError('A demonstração aceita somente a bandeira; não envie número de cartão ou código de segurança.',400,'CARD_DATA_NOT_ALLOWED');
  if (!Array.isArray(input.items) || input.items.length === 0) throw new AppError('Carrinho vazio.', 400, 'EMPTY_CART');
  if (!validMethods.has(input.paymentMethod)) throw new AppError('Forma de pagamento inválida.', 400, 'INVALID_PAYMENT_METHOD');
  const scenario = input.paymentScenario || 'approved';
  if (!paymentScenarios.has(scenario)) throw new AppError('Cenário de pagamento inválido.', 400, 'INVALID_PAYMENT_SCENARIO');
  const brand = String(input.cardBrand || '').toLowerCase();
  if (input.paymentMethod === 'card' && !validBrands.has(brand)) throw new AppError('Bandeira de cartão não aceita. American Express não é aceito na V1.', 400, 'CARD_BRAND_NOT_ACCEPTED');
  const address = validateShippingAddress(input.shippingAddress);
  const cart = normalizeCart(input.items);
  const loaded = await loadCartVariants(env, cart);
  let subtotal = 0;
  let totalWeightG = 0;
  for (const item of loaded) {
    const v = item.variant;
    if (!v || !Number(v.active) || !Number(v.product_active)) throw new AppError('Uma variante do carrinho não está disponível.', 409, 'VARIANT_UNAVAILABLE');
    if (Number(v.stock) < item.quantity) throw new AppError(`Estoque insuficiente para ${v.product_name}.`, 409, 'INSUFFICIENT_STOCK');
    subtotal += Number(v.price) * item.quantity;
    totalWeightG += Number(v.weight_g || v.volume_ml || 0) * item.quantity;
  }
  subtotal = Number(subtotal.toFixed(2));
  const shipping = calculateShipping({ state: address.state, subtotal, totalWeightG });
  const total = Number((subtotal + shipping.price).toFixed(2));
  const payment = mockPayment({ method: input.paymentMethod, brand: input.paymentMethod === 'card' ? brand : null, scenario });
  const orderId = crypto.randomUUID();
  const number = orderNumber();
  const orderStatus = payment.status === 'approved' ? 'pedido_confirmado' : payment.status === 'pending' ? 'aguardando_pagamento' : 'cancelado';

  const statements = [];
  statements.push(env.DB.prepare(`INSERT INTO orders
    (id,user_id,order_number,status,subtotal,shipping_amount,total,shipping_name,contact_email,contact_phone,shipping_zip_code,shipping_street,shipping_number,shipping_complement,shipping_district,shipping_city,shipping_state,shipping_estimated_days,notes,paid_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      orderId,user.id,number,orderStatus,subtotal,shipping.price,total,address.name,address.email,address.phone,address.zipCode,address.street,address.number,address.complement,address.district,address.city,address.state,shipping.estimatedDays,text(input.notes,500)||null,payment.status==='approved' ? new Date().toISOString() : null
    ));
  statements.push(env.DB.prepare(`INSERT INTO order_status_history (order_id,status,note) VALUES (?,'aguardando_pagamento','Pedido criado. Aguardando confirmação do pagamento.')`).bind(orderId));
  for (const item of loaded) {
    const v = item.variant;
    statements.push(env.DB.prepare(`INSERT INTO order_items (order_id,product_variant_id,product_name,variant_label,quantity,unit_price,total_price) VALUES (?,?,?,?,?,?,?)`)
      .bind(orderId,v.id,v.product_name,v.label || `${v.weight_g} g · ${v.grind_type}`,item.quantity,Number(v.price),Number((Number(v.price)*item.quantity).toFixed(2))));
  }
  statements.push(env.DB.prepare(`INSERT INTO payments (order_id,method,card_brand,provider,status,transaction_id,amount) VALUES (?,?,?,?,?,?,?)`)
    .bind(orderId,payment.method,input.paymentMethod==='card'?brand:null,payment.provider,payment.status,payment.transactionId,total));

  if (payment.status === 'approved') {
    for (const item of loaded) statements.push(env.DB.prepare('UPDATE product_variants SET stock=stock-?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(item.quantity,item.variant.id));
    statements.push(env.DB.prepare(`INSERT INTO order_status_history (order_id,status,note) VALUES (?,'pagamento_aprovado','Pagamento aprovado pelo gateway de demonstração.')`).bind(orderId));
    statements.push(env.DB.prepare(`INSERT INTO order_status_history (order_id,status,note) VALUES (?,'pedido_confirmado','Pedido confirmado e estoque atualizado.')`).bind(orderId));
    const points = Math.floor(total);
    if (points > 0) {
      statements.push(env.DB.prepare(`INSERT INTO loyalty_transactions (user_id,order_id,type,points,description) VALUES (?,?,'earn',?,'Pontos por compra aprovada')`).bind(user.id,orderId,points));
      statements.push(env.DB.prepare('UPDATE users SET loyalty_points=loyalty_points+?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(points,user.id));
    }
  } else if (payment.status === 'declined' || payment.status === 'canceled') {
    statements.push(env.DB.prepare(`INSERT INTO order_status_history (order_id,status,note) VALUES (?,'cancelado',?)`).bind(orderId,payment.status==='declined'?'Pagamento recusado; estoque não alterado.':'Pagamento cancelado; estoque não alterado.'));
  }

  try { await env.DB.batch(statements); }
  catch (error) {
    if (/CHECK constraint failed|constraint failed/i.test(String(error?.message || error))) throw new AppError('O estoque mudou durante o pagamento. Atualize o carrinho e tente novamente.', 409, 'STOCK_RACE');
    throw error;
  }

  return json({ orderNumber: number, status: orderStatus, payment, subtotal, shipping, total }, 201);
}

async function listOrders(request, env) {
  const user = await currentUser(request, env);
  const result = await env.DB.prepare(`SELECT o.id,o.order_number,o.status,o.subtotal,o.shipping_amount,o.total,o.created_at,p.method payment_method,p.status payment_status
    FROM orders o LEFT JOIN payments p ON p.order_id=o.id WHERE o.user_id=? ORDER BY o.created_at DESC,o.id DESC`).bind(user.id).all();
  return json(result.results || []);
}

async function getOrder(request, env, orderNumberValue) {
  const user = await currentUser(request, env);
  const order = await env.DB.prepare(`SELECT o.*,p.method payment_method,p.status payment_status,p.transaction_id FROM orders o
    LEFT JOIN payments p ON p.order_id=o.id WHERE o.user_id=? AND o.order_number=? LIMIT 1`).bind(user.id,orderNumberValue).first();
  if (!order) throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
  const [items, history] = await Promise.all([
    env.DB.prepare('SELECT product_name,variant_label,quantity,unit_price,total_price FROM order_items WHERE order_id=? ORDER BY id').bind(order.id).all(),
    env.DB.prepare('SELECT status,note,created_at FROM order_status_history WHERE order_id=? ORDER BY id').bind(order.id).all()
  ]);
  order.items = items.results || [];
  order.history = history.results || [];
  return json(order);
}

export async function updateOrderStatus(env, orderId, newStatus, note) {
  if (!manualStatuses.has(newStatus)) throw new AppError('Status inválido para alteração manual.', 400, 'INVALID_STATUS');
  const order = await env.DB.prepare('SELECT id,user_id,status FROM orders WHERE id=?').bind(orderId).first();
  if (!order) throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
  if (order.status === 'cancelado') throw new AppError('Pedido já cancelado.', 409, 'ORDER_ALREADY_CANCELED');
  const payment = await env.DB.prepare('SELECT id,status FROM payments WHERE order_id=?').bind(orderId).first();
  if (newStatus !== 'cancelado' && payment?.status !== 'approved') throw new AppError('O pedido só pode avançar após pagamento aprovado.', 409, 'PAYMENT_NOT_APPROVED');
  const statements = [];
  if (newStatus !== 'cancelado') {
    statements.push(env.DB.prepare(`INSERT INTO order_mutation_guards (order_id,operation,valid_state)
      VALUES (?,'advance_order',CASE WHEN EXISTS (SELECT 1 FROM orders o JOIN payments p ON p.order_id=o.id
        WHERE o.id=? AND o.status=? AND p.status='approved') THEN 1 ELSE 0 END)`).bind(orderId,orderId,order.status));
  }
  if (newStatus === 'cancelado') {
    statements.push(env.DB.prepare(`INSERT INTO order_mutation_guards (order_id,operation,valid_state)
      VALUES (?,'cancel_order',CASE WHEN EXISTS (SELECT 1 FROM orders o LEFT JOIN payments p ON p.order_id=o.id
        WHERE o.id=? AND o.status=? AND COALESCE(p.status,'')=?) THEN 1 ELSE 0 END)`).bind(orderId,orderId,order.status,payment?.status || ''));
    if (payment?.status === 'approved') {
      const items = await env.DB.prepare('SELECT product_variant_id,quantity FROM order_items WHERE order_id=?').bind(orderId).all();
      for (const item of items.results || []) statements.push(env.DB.prepare('UPDATE product_variants SET stock=stock+?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(item.quantity,item.product_variant_id));
      const earned = await env.DB.prepare("SELECT id,points FROM loyalty_transactions WHERE order_id=? AND type='earn' ORDER BY id LIMIT 1").bind(orderId).first();
      if (earned) {
        statements.push(env.DB.prepare("INSERT INTO loyalty_transactions (user_id,order_id,type,points,description) VALUES (?,?,'reversal',?,'Estorno de pontos por cancelamento')").bind(order.user_id,orderId,-Number(earned.points)));
        statements.push(env.DB.prepare('UPDATE users SET loyalty_points=MAX(0,loyalty_points-?),updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(Number(earned.points),order.user_id));
      }
    }
    if (payment && payment.status !== 'canceled') statements.push(env.DB.prepare("UPDATE payments SET status='canceled',updated_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(orderId));
  }
  const trackingCode = newStatus === 'enviado' ? `CAMBR${String(Math.abs(hashCode(orderId))).padStart(10,'0').slice(-10)}` : null;
  if (trackingCode) statements.push(env.DB.prepare('UPDATE orders SET tracking_code=COALESCE(tracking_code,?),status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(trackingCode,newStatus,orderId));
  else statements.push(env.DB.prepare('UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(newStatus,orderId));
  statements.push(env.DB.prepare('INSERT INTO order_status_history (order_id,status,note) VALUES (?,?,?)').bind(orderId,newStatus,text(note,255)||'Status alterado pelo administrador.'));
  if (newStatus !== 'cancelado') statements.push(env.DB.prepare("DELETE FROM order_mutation_guards WHERE order_id=? AND operation='advance_order'").bind(orderId));
  try { await env.DB.batch(statements); }
  catch (error) {
    if (/order_mutation_guards|transition_state/i.test(String(error?.message || error))) throw new AppError('O estado do pedido mudou. Atualize antes de tentar novamente.',409,'ORDER_STATE_CHANGED');
    throw error;
  }
  return { id: orderId, status: newStatus };
}

function hashCode(value) {
  let hash = 0;
  for (const char of String(value)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return hash;
}

export async function resolvePendingPayment(env, orderId, targetStatus) {
  if (!['approved','declined','canceled'].includes(targetStatus)) throw new AppError('Status de pagamento inválido.', 400, 'INVALID_PAYMENT_STATUS');
  const order = await env.DB.prepare('SELECT id,user_id,status,total FROM orders WHERE id=?').bind(orderId).first();
  if (!order) throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
  const payment = await env.DB.prepare('SELECT id,status FROM payments WHERE order_id=?').bind(orderId).first();
  if (!payment) throw new AppError('Pagamento não encontrado.', 404, 'PAYMENT_NOT_FOUND');
  if (payment.status !== 'pending') throw new AppError('Somente pagamentos pendentes podem ser resolvidos por esta operação.', 409, 'PAYMENT_NOT_PENDING');
  const statements = [];
  statements.push(env.DB.prepare(`INSERT INTO order_mutation_guards (order_id,operation,valid_state)
    VALUES (?,'resolve_payment',CASE WHEN EXISTS (SELECT 1 FROM payments WHERE order_id=? AND status='pending') THEN 1 ELSE 0 END)`).bind(orderId,orderId));
  if (targetStatus === 'approved') {
    const items = await env.DB.prepare('SELECT product_variant_id,quantity FROM order_items WHERE order_id=?').bind(orderId).all();
    for (const item of items.results || []) statements.push(env.DB.prepare('UPDATE product_variants SET stock=stock-?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(item.quantity,item.product_variant_id));
    statements.push(env.DB.prepare("UPDATE payments SET status='approved',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(payment.id));
    statements.push(env.DB.prepare("UPDATE orders SET status='pedido_confirmado',paid_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(orderId));
    statements.push(env.DB.prepare("INSERT INTO order_status_history (order_id,status,note) VALUES (?,'pagamento_aprovado','Pagamento pendente foi aprovado pelo administrador.')").bind(orderId));
    statements.push(env.DB.prepare("INSERT INTO order_status_history (order_id,status,note) VALUES (?,'pedido_confirmado','Estoque atualizado após aprovação.')").bind(orderId));
    const points = Math.floor(Number(order.total));
    if (points > 0) {
      statements.push(env.DB.prepare("INSERT INTO loyalty_transactions (user_id,order_id,type,points,description) VALUES (?,?,'earn',?,'Pontos por pagamento pendente aprovado')").bind(order.user_id,orderId,points));
      statements.push(env.DB.prepare('UPDATE users SET loyalty_points=loyalty_points+?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(points,order.user_id));
    }
  } else {
    statements.push(env.DB.prepare('UPDATE payments SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(targetStatus,payment.id));
    statements.push(env.DB.prepare("UPDATE orders SET status='cancelado',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(orderId));
    statements.push(env.DB.prepare("INSERT INTO order_status_history (order_id,status,note) VALUES (?,'cancelado',?)").bind(orderId,targetStatus==='declined'?'Pagamento pendente recusado pelo administrador.':'Pagamento pendente cancelado pelo administrador.'));
  }
  try { await env.DB.batch(statements); }
  catch (error) {
    if (/order_mutation_guards|transition_state/i.test(String(error?.message || error))) throw new AppError('O estado do pagamento mudou. Atualize antes de tentar novamente.',409,'PAYMENT_STATE_CHANGED');
    if (/CHECK constraint failed|constraint failed/i.test(String(error?.message || error))) throw new AppError('Estoque insuficiente para aprovar o pagamento pendente.', 409, 'INSUFFICIENT_STOCK');
    throw error;
  }
  return { orderId, paymentStatus: targetStatus };
}

export async function handleOrders(request, env, path, method) {
  if (path === '/orders' && method === 'POST') return createOrder(request, env);
  if (path === '/orders' && method === 'GET') return listOrders(request, env);
  if (path.startsWith('/orders/') && method === 'GET') return getOrder(request, env, decodeURIComponent(path.slice('/orders/'.length)));
  return null;
}
