import { AppError } from './http.js';
import { verifyToken } from './crypto.js';

export async function currentUser(request, env, required = true) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) {
    if (required) throw new AppError('Autenticação necessária.', 401, 'AUTH_REQUIRED');
    return null;
  }
  const payload = await verifyToken(header.slice(7), env.JWT_SECRET);
  const user = await env.DB.prepare('SELECT id,name,email,phone,role,loyalty_points,created_at FROM users WHERE id=?').bind(Number(payload.sub)).first();
  if (!user) throw new AppError('Usuário não encontrado.', 401, 'INVALID_TOKEN');
  return user;
}

export async function requireAdmin(request, env) {
  const user = await currentUser(request, env, true);
  if (user.role !== 'admin') throw new AppError('Acesso administrativo necessário.', 403, 'ADMIN_REQUIRED');
  return user;
}
