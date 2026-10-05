import { AppError } from './http.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToB64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function b64urlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function stringToB64url(value) { return bytesToB64url(encoder.encode(value)); }
function b64urlToString(value) { return decoder.decode(b64urlToBytes(value)); }

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signToken(user, secret, ttlSeconds = 8 * 60 * 60) {
  if (!secret) throw new AppError('JWT_SECRET não configurado no Worker.', 500, 'SERVER_CONFIG_ERROR');
  const now = Math.floor(Date.now() / 1000);
  const header = stringToB64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = stringToB64url(JSON.stringify({ sub: String(user.id), email: user.email, role: user.role, name: user.name, iat: now, exp: now + ttlSeconds }));
  const input = `${header}.${payload}`;
  const key = await hmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(input)));
  return `${input}.${bytesToB64url(signature)}`;
}

export async function verifyToken(token, secret) {
  if (!secret) throw new AppError('JWT_SECRET não configurado no Worker.', 500, 'SERVER_CONFIG_ERROR');
  if (!token) throw new AppError('Autenticação necessária.', 401, 'AUTH_REQUIRED');
  const parts = String(token).split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) throw new AppError('Token inválido.', 401, 'INVALID_TOKEN');
  let header, payload, signature;
  try {
    header = JSON.parse(b64urlToString(parts[0]));
    payload = JSON.parse(b64urlToString(parts[1]));
    signature = b64urlToBytes(parts[2]);
  } catch { throw new AppError('Token inválido.', 401, 'INVALID_TOKEN'); }
  if (header?.alg !== 'HS256' || !payload || !/^\d+$/.test(String(payload.sub || '')) || Number(payload.sub) <= 0 || !Number.isInteger(payload.exp) || signature.length !== 32) {
    throw new AppError('Token inválido.', 401, 'INVALID_TOKEN');
  }
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(`${parts[0]}.${parts[1]}`));
  if (!valid || payload.exp <= Math.floor(Date.now() / 1000)) throw new AppError('Token inválido ou expirado.', 401, 'INVALID_TOKEN');
  return payload;
}

export async function hashPassword(password, iterations = 30000) {
  const salt = crypto.getRandomValues(new Uint8Array(18));
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, baseKey, 256);
  return `pbkdf2$${iterations}$${bytesToB64url(salt)}$${bytesToB64url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, encoded) {
  const [kind, iterRaw, saltRaw, hashRaw] = String(encoded || '').split('$');
  if (kind !== 'pbkdf2' || !iterRaw || !saltRaw || !hashRaw) return false;
  const iterations = Number(iterRaw);
  const salt = b64urlToBytes(saltRaw);
  const expected = b64urlToBytes(hashRaw);
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, baseKey, expected.length * 8));
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i += 1) diff |= bits[i] ^ expected[i];
  return diff === 0;
}
