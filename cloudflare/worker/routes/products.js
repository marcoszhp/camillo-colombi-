import { AppError, json } from '../lib/http.js';

function buildProductFilters(url) {
  const q = url.searchParams;
  const where = ['p.active=1'];
  const params = [];
  const like = (value) => `%${value}%`;
  if (q.get('search')) { where.push('(p.name LIKE ? OR p.description LIKE ? OR p.sensory_notes LIKE ?)'); params.push(like(q.get('search')), like(q.get('search')), like(q.get('search'))); }
  if (q.get('sensory')) { where.push('p.sensory_notes LIKE ?'); params.push(like(q.get('sensory'))); }
  if (q.get('roast')) { where.push('r.slug=?'); params.push(q.get('roast')); }
  if (q.get('origin')) { where.push('o.slug=?'); params.push(q.get('origin')); }
  if (q.get('type')) { where.push(['packaged','beverage','dessert'].includes(q.get('type')) ? 'p.product_kind=?' : 'p.coffee_type=?'); params.push(q.get('type')); }
  if (q.get('category')) { where.push('c.slug=?'); params.push(q.get('category')); }
  if (q.get('intensity') && /^[1-5]$/.test(q.get('intensity'))) { where.push('p.intensity=?'); params.push(Number(q.get('intensity'))); }
  if (q.get('brew')) { where.push('p.brew_suggestion LIKE ?'); params.push(like(q.get('brew'))); }
  if (q.get('aroma')) { where.push('EXISTS (SELECT 1 FROM product_aromas pax JOIN aromas ax ON ax.id=pax.aroma_id WHERE pax.product_id=p.id AND ax.slug=?)'); params.push(q.get('aroma')); }
  if (q.get('available') === 'false') where.push('NOT EXISTS (SELECT 1 FROM product_variants vx WHERE vx.product_id=p.id AND vx.active=1 AND vx.stock>0)');
  // All requested variant properties must match the same purchasable option.
  const variantWhere = ['vx.product_id=p.id','vx.active=1'];
  if (q.get('available') === 'true') variantWhere.push('vx.stock>0');
  if (q.get('weight')) { variantWhere.push('vx.weight_g=?'); params.push(Number(q.get('weight'))); }
  if (q.get('grind')) { variantWhere.push('EXISTS (SELECT 1 FROM grind_types gx WHERE gx.id=vx.grind_type_id AND gx.slug=?)'); params.push(q.get('grind')); }
  const min = Number(q.get('minPrice')); const max = Number(q.get('maxPrice'));
  if (q.get('minPrice') !== null && Number.isFinite(min) && min >= 0) { variantWhere.push('vx.price>=?'); params.push(min); }
  if (q.get('maxPrice') !== null && Number.isFinite(max) && max >= 0) { variantWhere.push('vx.price<=?'); params.push(max); }
  if (variantWhere.length > 2) where.push(`EXISTS (SELECT 1 FROM product_variants vx WHERE ${variantWhere.join(' AND ')})`);
  return { where: where.join(' AND '), params };
}

export async function handleProducts(request, env, path, method, url) {
  if (path === '/products' && method === 'GET') {
    const { where, params } = buildProductFilters(url);
    const orderMap = { price_asc: 'min_price ASC', price_desc: 'min_price DESC', name: 'p.name ASC', newest: 'p.created_at DESC', sold: 'sold_count DESC' };
    const order = orderMap[url.searchParams.get('sort')] || 'p.featured DESC,p.name ASC';
    const sql = `SELECT p.id,p.slug,p.name,p.short_description,p.description,p.coffee_type,p.product_kind,p.featured,p.image_key,p.created_at,
      c.name category_name,c.slug category_slug,
      o.name origin,r.name roast_level,r.slug roast_slug,
      (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id=p.id AND v.active=1) min_price,
      (SELECT MAX(v.price) FROM product_variants v WHERE v.product_id=p.id AND v.active=1) max_price,
      (SELECT COALESCE(SUM(v.stock),0) FROM product_variants v WHERE v.product_id=p.id AND v.active=1) total_stock,
      (SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi JOIN product_variants vv ON vv.id=oi.product_variant_id JOIN orders oo ON oo.id=oi.order_id JOIN payments pp ON pp.order_id=oo.id WHERE vv.product_id=p.id AND pp.status='approved' AND oo.status<>'cancelado') sold_count,
      group_concat(DISTINCT a.name) aromas
      FROM products p JOIN categories c ON c.id=p.category_id JOIN origins o ON o.id=p.origin_id JOIN roast_levels r ON r.id=p.roast_level_id
      LEFT JOIN product_aromas pa ON pa.product_id=p.id LEFT JOIN aromas a ON a.id=pa.aroma_id
      WHERE ${where} GROUP BY p.id,o.name,r.name,r.slug ORDER BY ${order}`;
    const result = await env.DB.prepare(sql).bind(...params).all();
    return json(result.results || []);
  }

  if (path === '/products/filters' && method === 'GET') {
    const [roasts, origins, grinds, aromas, categories] = await Promise.all([
      env.DB.prepare('SELECT id,name,slug,description FROM roast_levels ORDER BY sort_order').all(),
      env.DB.prepare('SELECT id,name,slug,city,state FROM origins ORDER BY name').all(),
      env.DB.prepare('SELECT id,name,slug,description FROM grind_types ORDER BY sort_order').all(),
      env.DB.prepare('SELECT id,name,slug FROM aromas ORDER BY name').all(),
      env.DB.prepare('SELECT id,name,slug,description FROM categories WHERE active=1 ORDER BY id').all()
    ]);
    return json({ roasts: roasts.results, origins: origins.results, grinds: grinds.results, aromas: aromas.results, categories: categories.results, productKinds: ['packaged','beverage','dessert'] });
  }

  if (path.startsWith('/products/') && method === 'GET') {
    const slug = decodeURIComponent(path.slice('/products/'.length));
    const product = await env.DB.prepare(`SELECT p.*,c.name category_name,c.slug category_slug,o.name origin,o.city origin_city,o.state origin_state,r.name roast_level,r.slug roast_slug,
      group_concat(DISTINCT a.name) aromas FROM products p JOIN categories c ON c.id=p.category_id JOIN origins o ON o.id=p.origin_id JOIN roast_levels r ON r.id=p.roast_level_id
      LEFT JOIN product_aromas pa ON pa.product_id=p.id LEFT JOIN aromas a ON a.id=pa.aroma_id
      WHERE p.slug=? AND p.active=1 GROUP BY p.id,o.name,o.city,o.state,r.name,r.slug LIMIT 1`).bind(slug).first();
    if (!product) throw new AppError('Produto não encontrado.', 404, 'PRODUCT_NOT_FOUND');
    const variants = await env.DB.prepare(`SELECT v.id,v.sku,v.weight_g,v.price,v.stock,v.active,v.unit_type,v.label,v.volume_ml,v.grind_type_id,g.name grind_type,g.slug grind_slug
      FROM product_variants v LEFT JOIN grind_types g ON g.id=v.grind_type_id WHERE v.product_id=? AND v.active=1 ORDER BY v.weight_g,v.volume_ml,v.id,g.sort_order`).bind(product.id).all();
    product.variants = variants.results || [];
    return json(product);
  }

  return null;
}
