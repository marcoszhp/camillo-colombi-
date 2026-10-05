import { AppError, json, positiveInt, readJson, slugify, text } from '../lib/http.js';
import { requireAdmin } from '../lib/auth.js';
import { resolvePendingPayment, updateOrderStatus } from './orders.js';

const referenceMap = {
  categories: { table: 'categories', columns: ['name','slug','description','active'] },
  origins: { table: 'origins', columns: ['name','slug','city','state','description'] },
  'roast-levels': { table: 'roast_levels', columns: ['name','slug','description','sort_order'] },
  'grind-types': { table: 'grind_types', columns: ['name','slug','description','sort_order'] },
  aromas: { table: 'aromas', columns: ['name','slug'] },
  'loyalty-levels': { table: 'loyalty_levels', columns: ['name','slug','min_points','benefit_description'] },
  rewards: { table: 'rewards', columns: ['name','description','points_cost','reward_type','active'] }
};

function referenceDef(type) {
  const def = referenceMap[type];
  if (!def) throw new AppError('Tipo de referência inválido.', 400, 'INVALID_REFERENCE');
  return def;
}

function numericOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function dashboard(env) {
  const threshold = Math.max(0, Number(env.LOW_STOCK_THRESHOLD || 5));
  const [sales, customers, stock, top, statuses] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) orders,
      COALESCE(SUM(CASE WHEN p.status='approved' THEN o.total ELSE 0 END),0) revenue,
      COALESCE(AVG(CASE WHEN p.status='approved' THEN o.total END),0) avg_ticket
      FROM orders o LEFT JOIN payments p ON p.order_id=o.id`).first(),
    env.DB.prepare("SELECT COUNT(*) customers FROM users WHERE role='customer'").first(),
    env.DB.prepare('SELECT SUM(CASE WHEN stock<=? THEN 1 ELSE 0 END) low_stock,SUM(CASE WHEN stock=0 THEN 1 ELSE 0 END) out_of_stock FROM product_variants').bind(threshold).first(),
    env.DB.prepare(`SELECT oi.product_name,SUM(oi.quantity) quantity FROM order_items oi
      JOIN orders o ON o.id=oi.order_id JOIN payments p ON p.order_id=o.id
      WHERE p.status='approved' AND o.status<>'cancelado'
      GROUP BY oi.product_name ORDER BY quantity DESC LIMIT 5`).all(),
    env.DB.prepare('SELECT status,COUNT(*) quantity FROM orders GROUP BY status ORDER BY quantity DESC').all()
  ]);
  return {
    sales: { orders: Number(sales?.orders || 0), revenue: Number(sales?.revenue || 0), avgTicket: Number(sales?.avg_ticket || 0) },
    customers: Number(customers?.customers || 0),
    stock: { low: Number(stock?.low_stock || 0), out: Number(stock?.out_of_stock || 0) },
    top: top.results || [],
    statuses: statuses.results || []
  };
}

async function createProduct(env, data) {
  if (data.productKind !== undefined && !['packaged','beverage','dessert'].includes(data.productKind)) throw new AppError('Categoria de produto inválida.', 400, 'VALIDATION_ERROR');
  if (!text(data.name, 140) || !['arabica','conilon','blend'].includes(data.coffeeType) || !Number(data.originId) || !Number(data.roastLevelId)) {
    throw new AppError('Dados obrigatórios do produto ausentes.', 400, 'VALIDATION_ERROR');
  }
  const name = text(data.name, 140);
  const productSlug = text(data.slug, 160) || slugify(name);
  const result = await env.DB.prepare(`INSERT INTO products
    (category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,product_kind,active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      Number(data.categoryId || 1), productSlug, name, text(data.shortDescription, 280), text(data.description, 3000), data.coffeeType,
      Number(data.originId), Number(data.roastLevelId), numericOr(data.intensity, 3), numericOr(data.bodyScore, 3), numericOr(data.acidityScore, 3),
      text(data.sensoryNotes, 500), text(data.brewSuggestion, 500), data.featured ? 1 : 0, text(data.imageKey, 60) || productSlug, data.productKind || 'packaged', data.active === undefined ? 1 : Number(Boolean(data.active))
    ).run();
  return result.meta.last_row_id;
}

async function updateProduct(env, id, data) {
  const mapping = {
    name: 'name', shortDescription: 'short_description', description: 'description', coffeeType: 'coffee_type', categoryId: 'category_id',
    originId: 'origin_id', roastLevelId: 'roast_level_id', intensity: 'intensity', bodyScore: 'body_score', acidityScore: 'acidity_score',
    sensoryNotes: 'sensory_notes', brewSuggestion: 'brew_suggestion', featured: 'featured', active: 'active', imageKey: 'image_key', productKind: 'product_kind', slug: 'slug'
  };
  const sets = []; const values = [];
  for (const [key, column] of Object.entries(mapping)) {
    if (data[key] === undefined) continue;
    sets.push(`${column}=?`);
    let value = data[key];
    if (['featured','active'].includes(key)) value = data[key] ? 1 : 0;
    if (['categoryId','originId','roastLevelId','intensity','bodyScore','acidityScore'].includes(key)) value = Number(data[key]);
    if (['name','shortDescription','description','sensoryNotes','brewSuggestion','imageKey'].includes(key)) value = text(value, key === 'description' ? 3000 : 500);
    if (key === 'coffeeType' && !['arabica','conilon','blend'].includes(value)) throw new AppError('Tipo de café inválido.', 400, 'VALIDATION_ERROR');
    if (key === 'productKind' && !['packaged','beverage','dessert'].includes(value)) throw new AppError('Categoria de produto inválida.', 400, 'VALIDATION_ERROR');
    if (key === 'slug') { value = text(value,160); if (!value || slugify(value) !== value) throw new AppError('Slug inválido.',400,'VALIDATION_ERROR'); }
    values.push(value);
  }
  if (!sets.length) return;
  values.push(id);
  await env.DB.prepare(`UPDATE products SET ${sets.join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...values).run();
}

const variantColumns = { productId:'product_id', grindTypeId:'grind_type_id', sku:'sku', weightG:'weight_g', volumeMl:'volume_ml', unitType:'unit_type', label:'label', price:'price', stock:'stock', active:'active' };

async function validateVariant(env, data) {
  const fail = (message) => { throw new AppError(message,400,'VALIDATION_ERROR'); };
  const nullableNumber = (value) => value === undefined || value === null || value === '' ? null : Number(value);
  const v = {
    productId:Number(data.productId), sku:text(data.sku,80), unitType:data.unitType || 'weight',
    weightG:nullableNumber(data.weightG), volumeMl:nullableNumber(data.volumeMl), grindTypeId:nullableNumber(data.grindTypeId),
    price:Number(data.price), stock:Number(data.stock ?? 0), active:data.active === undefined ? 1 : Number(Boolean(data.active)), label:text(data.label,160)
  };
  if (!v.sku || !Number.isInteger(v.productId) || v.productId < 1 || data.price === null || data.price === '' || !Number.isFinite(v.price) || v.price < 0 || !Number.isInteger(v.stock) || v.stock < 0) fail('SKU, produto, preço ou estoque inválido.');
  if (!['weight','volume','unit'].includes(v.unitType)) fail('Unidade inválida.');
  if (v.unitType === 'weight' && (![250,500,1000].includes(v.weightG) || v.volumeMl !== null)) fail('Informe peso de 250, 500 ou 1000 g, sem volume.');
  if (v.unitType === 'volume' && (!Number.isInteger(v.volumeMl) || v.volumeMl <= 0 || v.weightG !== null || v.grindTypeId !== null)) fail('Informe volume positivo, sem peso ou moagem.');
  if (v.unitType === 'unit' && (v.weightG !== null || v.volumeMl !== null || v.grindTypeId !== null)) fail('Unidade não admite peso, volume ou moagem.');
  const product = await env.DB.prepare('SELECT id FROM products WHERE id=?').bind(v.productId).first();
  if (!product) fail('Produto inexistente.');
  let grind = null;
  if (v.grindTypeId !== null) {
    if (!Number.isInteger(v.grindTypeId) || v.grindTypeId < 1) fail('Moagem inválida.');
    grind = await env.DB.prepare('SELECT name FROM grind_types WHERE id=?').bind(v.grindTypeId).first();
    if (!grind) fail('Moagem inexistente.');
  }
  if (!v.label) {
    if (data.label !== undefined) fail('Rótulo obrigatório.');
    v.label = v.unitType === 'weight' ? `${v.weightG} g${grind ? ` · ${grind.name}` : ''}` : v.unitType === 'volume' ? `${v.volumeMl} ml` : 'Unidade';
  }
  return v;
}

async function saveVariant(env, data, id) {
  const v = await validateVariant(env,data);
  const duplicate = await env.DB.prepare(`SELECT id FROM product_variants WHERE (sku=? OR (product_id=? AND grind_type_id=? AND weight_g=?)) AND id<>?`).bind(v.sku,v.productId,v.grindTypeId,v.weightG,id || 0).first();
  if (duplicate) throw new AppError('SKU ou combinação de variante já existe.',409,'VARIANT_EXISTS');
  const columns = Object.values(variantColumns);
  const values = Object.keys(variantColumns).map(key => v[key]);
  if (id) {
    await env.DB.prepare(`UPDATE product_variants SET ${columns.map(c=>`${c}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...values,id).run();
    return id;
  }
  const result = await env.DB.prepare(`INSERT INTO product_variants (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).bind(...values).run();
  return result.meta.last_row_id;
}

async function updateVariant(env,id,data) {
  const row = await env.DB.prepare('SELECT * FROM product_variants WHERE id=?').bind(id).first();
  if (!row) throw new AppError('Variante não encontrada.',404,'VARIANT_NOT_FOUND');
  const current = Object.fromEntries(Object.entries(variantColumns).map(([key,column])=>[key,row[column]]));
  await saveVariant(env,{...current,...data},id);
}

async function createVariant(env,data) { return saveVariant(env,data); }

async function listReference(env, type) {
  const def = referenceDef(type);
  const result = await env.DB.prepare(`SELECT * FROM ${def.table} ORDER BY id`).all();
  return result.results || [];
}

async function createReference(env, type, data) {
  const def = referenceDef(type);
  const columns = def.columns.filter((column) => data[column] !== undefined);
  if (!columns.length) throw new AppError('Nenhum campo válido informado.', 400, 'VALIDATION_ERROR');
  const values = columns.map((column) => {
    if (['active','sort_order','min_points','points_cost'].includes(column)) return Number(data[column]);
    return text(data[column], column === 'description' || column === 'benefit_description' ? 1000 : 180);
  });
  const placeholders = columns.map(() => '?').join(',');
  const result = await env.DB.prepare(`INSERT INTO ${def.table} (${columns.join(',')}) VALUES (${placeholders})`).bind(...values).run();
  return result.meta.last_row_id;
}

async function updateReference(env, type, id, data) {
  const def = referenceDef(type);
  const columns = def.columns.filter((column) => data[column] !== undefined);
  if (!columns.length) return;
  const values = columns.map((column) => {
    if (['active','sort_order','min_points','points_cost'].includes(column)) return Number(data[column]);
    return text(data[column], column === 'description' || column === 'benefit_description' ? 1000 : 180);
  });
  values.push(id);
  await env.DB.prepare(`UPDATE ${def.table} SET ${columns.map((column) => `${column}=?`).join(',')} WHERE id=?`).bind(...values).run();
}

export async function handleAdmin(request, env, path, method) {
  if (!path.startsWith('/admin')) return null;
  await requireAdmin(request, env);

  if (path === '/admin/dashboard' && method === 'GET') return json(await dashboard(env));

  if (path === '/admin/products' && method === 'GET') {
    const products = await env.DB.prepare(`SELECT p.*,c.name category_name,c.slug category_slug,o.name origin,r.name roast_level,r.slug roast_slug
      FROM products p JOIN categories c ON c.id=p.category_id JOIN origins o ON o.id=p.origin_id JOIN roast_levels r ON r.id=p.roast_level_id ORDER BY p.active DESC,p.name`).all();
    const variants = await env.DB.prepare(`SELECT v.*,g.name grind_type,g.slug grind_slug FROM product_variants v LEFT JOIN grind_types g ON g.id=v.grind_type_id ORDER BY v.id`).all();
    const grouped = new Map();
    for (const variant of variants.results || []) { if (!grouped.has(variant.product_id)) grouped.set(variant.product_id,[]); grouped.get(variant.product_id).push(variant); }
    return json((products.results || []).map(p=>({...p,variants:grouped.get(p.id)||[]})));
  }

  if (path === '/admin/orders' && method === 'GET') {
    const result = await env.DB.prepare(`SELECT o.id,o.order_number,o.status,o.total,o.created_at,u.name customer_name,u.email,p.status payment_status
      FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN payments p ON p.order_id=o.id
      ORDER BY o.created_at DESC,o.id DESC LIMIT 200`).all();
    return json(result.results || []);
  }

  let match = path.match(/^\/admin\/orders\/([^/]+)\/status$/);
  if (match && method === 'PATCH') {
    const body = await readJson(request);
    return json(await updateOrderStatus(env, decodeURIComponent(match[1]), body.status, body.note));
  }

  match = path.match(/^\/admin\/orders\/([^/]+)\/payment$/);
  if (match && method === 'PATCH') {
    const body = await readJson(request);
    return json(await resolvePendingPayment(env, decodeURIComponent(match[1]), body.status));
  }

  if (path === '/admin/stock-notifications' && method === 'GET') {
    const result = await env.DB.prepare(`SELECT sn.id,sn.email,sn.status,sn.created_at,p.name product_name
      FROM stock_notifications sn JOIN products p ON p.id=sn.product_id ORDER BY sn.id DESC`).all();
    return json(result.results || []);
  }

  if (path === '/admin/customers' && method === 'GET') {
    const result = await env.DB.prepare("SELECT id,name,email,phone,loyalty_points,created_at FROM users WHERE role='customer' ORDER BY id DESC LIMIT 200").all();
    return json(result.results || []);
  }

  if (path === '/admin/products' && method === 'POST') {
    const id = await createProduct(env, await readJson(request));
    return json({ id }, 201);
  }

  match = path.match(/^\/admin\/products\/(\d+)$/);
  if (match && method === 'PATCH') {
    await updateProduct(env, positiveInt(match[1], 'produto'), await readJson(request));
    return json({ updated: true });
  }
  if (match && method === 'DELETE') {
    await env.DB.prepare('UPDATE products SET active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(positiveInt(match[1], 'produto')).run();
    return json({ deactivated: true });
  }

  if (path === '/admin/variants' && method === 'POST') {
    const id = await createVariant(env, await readJson(request));
    return json({ id }, 201);
  }

  match = path.match(/^\/admin\/variants\/(\d+)$/);
  if (match && method === 'PATCH') {
    await updateVariant(env, positiveInt(match[1], 'variante'), await readJson(request));
    return json({ updated: true });
  }
  if (match && method === 'DELETE') {
    await updateVariant(env, positiveInt(match[1], 'variante'), { active:false });
    return json({ deactivated:true });
  }

  match = path.match(/^\/admin\/reference\/([a-z-]+)$/);
  if (match && method === 'GET') return json(await listReference(env, match[1]));
  if (match && method === 'POST') {
    const id = await createReference(env, match[1], await readJson(request));
    return json({ id }, 201);
  }

  match = path.match(/^\/admin\/reference\/([a-z-]+)\/(\d+)$/);
  if (match && method === 'PATCH') {
    await updateReference(env, match[1], positiveInt(match[2], 'registro'), await readJson(request));
    return json({ updated: true });
  }

  match = path.match(/^\/admin\/categories\/(\d+)$/);
  if (match && method === 'DELETE') {
    await env.DB.prepare('UPDATE categories SET active=0 WHERE id=?').bind(positiveInt(match[1], 'categoria')).run();
    return json({ deactivated: true });
  }

  return null;
}
