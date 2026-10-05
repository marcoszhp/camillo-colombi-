import { AppError, json, readJson, text, validEmail } from '../lib/http.js';
import { hashPassword, signToken, verifyPassword } from '../lib/crypto.js';
import { currentUser } from '../lib/auth.js';

async function checkLoginRate(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'local';
  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = 10 * 60;
  const row = await env.DB.prepare('SELECT ip,attempts,window_started_at FROM login_attempts WHERE ip=?').bind(ip).first();
  if (!row || now - Number(row.window_started_at) >= windowSeconds) {
    await env.DB.prepare(`INSERT INTO login_attempts (ip,attempts,window_started_at) VALUES (?,0,?)
      ON CONFLICT(ip) DO UPDATE SET attempts=0,window_started_at=excluded.window_started_at`).bind(ip, now).run();
    return { ip, attempts: 0 };
  }
  if (Number(row.attempts) >= 10) throw new AppError('Muitas tentativas de login. Tente novamente em alguns minutos.', 429, 'RATE_LIMITED');
  return { ip, attempts: Number(row.attempts) };
}

async function recordFailedLogin(env, ip) {
  await env.DB.prepare('UPDATE login_attempts SET attempts=attempts+1 WHERE ip=?').bind(ip).run();
}

async function clearLoginRate(env, ip) {
  await env.DB.prepare('DELETE FROM login_attempts WHERE ip=?').bind(ip).run();
}

export async function handleAuth(request, env, path, method) {
  if (path === '/auth/register' && method === 'POST') {
    const body = await readJson(request);
    const name = text(body.name, 120);
    const email = String(body.email || '').trim().toLowerCase();
    const phone = text(body.phone, 30);
    const password = String(body.password || '');
    if (name.length < 2 || !validEmail(email) || password.length < 8) throw new AppError('Nome, e-mail válido e senha com ao menos 8 caracteres são obrigatórios.', 400, 'VALIDATION_ERROR');
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
    if (existing) throw new AppError('E-mail já cadastrado.', 409, 'EMAIL_EXISTS');
    const passwordHash = await hashPassword(password);
    const result = await env.DB.prepare("INSERT INTO users (name,email,phone,password_hash,role) VALUES (?,?,?,?,'customer')")
      .bind(name, email, phone || null, passwordHash).run();
    const user = await env.DB.prepare('SELECT id,name,email,phone,role,loyalty_points,created_at FROM users WHERE id=?').bind(result.meta.last_row_id).first();
    return json({ user, token: await signToken(user, env.JWT_SECRET) }, 201);
  }

  if (path === '/auth/login' && method === 'POST') {
    const limiter = await checkLoginRate(request, env);
    const body = await readJson(request);
    const email = String(body.email || '').trim().toLowerCase();
    const user = await env.DB.prepare('SELECT id,name,email,phone,password_hash,role,loyalty_points,created_at FROM users WHERE email=?').bind(email).first();
    if (!user || !(await verifyPassword(String(body.password || ''), user.password_hash))) {
      await recordFailedLogin(env, limiter.ip);
      throw new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS');
    }
    await clearLoginRate(env, limiter.ip);
    const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, loyalty_points: user.loyalty_points, created_at: user.created_at };
    return json({ user: safeUser, token: await signToken(safeUser, env.JWT_SECRET) });
  }

  if (path === '/auth/me' && method === 'GET') {
    return json(await currentUser(request, env));
  }

  if (path === '/auth/addresses' && method === 'GET') {
    const user = await currentUser(request, env);
    const result = await env.DB.prepare('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,id DESC').bind(user.id).all();
    return json(result.results || []);
  }

  if (path === '/auth/addresses' && method === 'POST') {
    const user = await currentUser(request, env);
    const body = await readJson(request);
    for (const field of ['zipCode','street','number','district','city','state']) if (!text(body[field], 150)) throw new AppError(`Campo obrigatório: ${field}.`, 400, 'VALIDATION_ERROR');
    const state = text(body.state, 2).toUpperCase();
    if (state.length !== 2) throw new AppError('Estado deve usar sigla de 2 letras.', 400, 'VALIDATION_ERROR');
    if (body.isDefault) await env.DB.prepare('UPDATE addresses SET is_default=0 WHERE user_id=?').bind(user.id).run();
    const result = await env.DB.prepare(`INSERT INTO addresses (user_id,label,zip_code,street,number,complement,district,city,state,is_default)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(user.id, text(body.label,50)||'Principal', text(body.zipCode,12), text(body.street,150), text(body.number,20), text(body.complement,100)||null, text(body.district,100), text(body.city,100), state, body.isDefault ? 1 : 0).run();
    return json({ id: result.meta.last_row_id }, 201);
  }

  return null;
}
