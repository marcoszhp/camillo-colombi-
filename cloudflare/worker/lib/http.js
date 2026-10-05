export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const securityHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...securityHeaders, ...extraHeaders }
  });
}

export function errorResponse(error) {
  const known = error instanceof AppError;
  const status = known ? error.status : 500;
  const code = known ? error.code : 'INTERNAL_ERROR';
  const message = known ? error.message : 'Erro interno do servidor.';
  if (!known) console.error('Erro não tratado:', error);
  return new Response(JSON.stringify({
    success: false,
    error: { code, message, ...(known && error.details ? { details: error.details } : {}) }
  }), { status, headers: securityHeaders });
}

export async function readJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new AppError('Envie o corpo como application/json.', 415, 'UNSUPPORTED_MEDIA_TYPE');
  try { return await request.json(); }
  catch { throw new AppError('JSON inválido.', 400, 'INVALID_JSON'); }
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase());
}

export function positiveInt(value, field = 'valor') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`${field} deve ser inteiro positivo.`, 400, 'VALIDATION_ERROR');
  return n;
}

export function text(value, max = 500) {
  return String(value ?? '').trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
}

export function slugify(value) {
  return text(value, 140).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function route(pattern, pathname) {
  const keys = [];
  const source = pattern.replace(/:[A-Za-z0-9_]+/g, (part) => { keys.push(part.slice(1)); return '([^/]+)'; });
  const match = pathname.match(new RegExp(`^${source}/?$`));
  if (!match) return null;
  return Object.fromEntries(keys.map((key, index) => [key, decodeURIComponent(match[index + 1])]));
}
