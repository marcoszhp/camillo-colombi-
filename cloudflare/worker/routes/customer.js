import { AppError, json, positiveInt, readJson, validEmail } from '../lib/http.js';
import { currentUser } from '../lib/auth.js';

export async function handleCustomer(request, env, path, method) {
  if (path === '/customer/stock-notifications' && method === 'POST') {
    const user = await currentUser(request, env, false);
    const body = await readJson(request);
    const email = String(body.email || user?.email || '').trim().toLowerCase();
    const productId = positiveInt(body.productId, 'produto');
    if (!validEmail(email)) throw new AppError('E-mail válido e produto são obrigatórios.', 400, 'VALIDATION_ERROR');
    const product = await env.DB.prepare('SELECT id FROM products WHERE id=? AND active=1').bind(productId).first();
    if (!product) throw new AppError('Produto não encontrado.', 404, 'PRODUCT_NOT_FOUND');
    await env.DB.prepare(`INSERT INTO stock_notifications (user_id,email,product_id,status)
      VALUES (?,?,?,'waiting')
      ON CONFLICT(email,product_id) DO UPDATE SET user_id=excluded.user_id,status='waiting',notified_at=NULL`)
      .bind(user?.id || null, email, productId).run();
    return json({ registered: true }, 201);
  }

  const favoriteMatch = path.match(/^\/customer\/favorites\/(\d+)$/);
  if (favoriteMatch && method === 'POST') {
    const user = await currentUser(request, env, true);
    const productId = positiveInt(favoriteMatch[1], 'produto');
    const product = await env.DB.prepare('SELECT id FROM products WHERE id=? AND active=1').bind(productId).first();
    if (!product) throw new AppError('Produto não encontrado.', 404, 'PRODUCT_NOT_FOUND');
    const existing = await env.DB.prepare('SELECT id FROM favorites WHERE user_id=? AND product_id=?').bind(user.id, productId).first();
    if (existing) {
      await env.DB.prepare('DELETE FROM favorites WHERE id=?').bind(existing.id).run();
      return json({ favorite: false });
    }
    await env.DB.prepare('INSERT INTO favorites (user_id,product_id) VALUES (?,?)').bind(user.id, productId).run();
    return json({ favorite: true });
  }

  if (path === '/customer/favorites' && method === 'GET') {
    const user = await currentUser(request, env, true);
    const result = await env.DB.prepare(`SELECT p.id,p.slug,p.name,p.short_description
      FROM favorites f JOIN products p ON p.id=f.product_id
      WHERE f.user_id=? AND p.active=1 ORDER BY f.id DESC`).bind(user.id).all();
    return json(result.results || []);
  }

  return null;
}
