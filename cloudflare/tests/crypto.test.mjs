import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, signToken, verifyPassword, verifyToken } from '../worker/lib/crypto.js';

test('hash de senha valida e rejeita senha incorreta', async () => {
  const hash = await hashPassword('Senha@123', 1000);
  assert.equal(await verifyPassword('Senha@123', hash), true);
  assert.equal(await verifyPassword('errada', hash), false);
});

test('JWT HMAC assinado pelo Worker é verificável', async () => {
  const user = { id: 7, email: 'teste@example.com', role: 'customer', name: 'Teste' };
  const token = await signToken(user, 'segredo-de-teste-muito-longo', 60);
  const payload = await verifyToken(token, 'segredo-de-teste-muito-longo');
  assert.equal(payload.sub, '7');
  assert.equal(payload.role, 'customer');
});

test('JWT expirado, adulterado e malformado retorna erro de autenticação', async () => {
  const secret = 'segredo-de-teste-muito-longo';
  const user = { id: 7, email: 'teste@example.com', role: 'customer', name: 'Teste' };
  const expired = await signToken(user, secret, -1);
  const valid = await signToken(user, secret);
  const parts = valid.split('.');
  const tampered = [parts[0], Buffer.from(JSON.stringify({ sub: '7', exp: 9999999999, role: 'admin' })).toString('base64url'), parts[2]].join('.');
  for (const token of [expired, tampered, 'nao-e-jwt', `${parts[0]}.${parts[1]}.!`, `${parts[0]}.${parts[1]}.a`]) {
    await assert.rejects(verifyToken(token, secret), error => error.status === 401 && error.code === 'INVALID_TOKEN');
  }
  await assert.rejects(verifyToken(valid, 'outro-segredo'), error => error.status === 401 && error.code === 'INVALID_TOKEN');
});

test('JWT só aceita HS256 e claims de usuário e validade corretos', async () => {
  const secret = 'segredo-de-teste-muito-longo';
  const signed = async (header, payload) => {
    const input = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
    return `${input}.${Buffer.from(signature).toString('base64url')}`;
  };
  const exp = Math.floor(Date.now() / 1000) + 60;
  for (const [header, payload] of [[{alg:'none'}, {sub:'7',exp}], [{alg:'HS256'}, {sub:'7',exp:String(exp)}], [{alg:'HS256'}, {sub:'0',exp}], [{alg:'HS256'}, {exp}]]) {
    await assert.rejects(verifyToken(await signed(header, payload), secret), error => error.status === 401 && error.code === 'INVALID_TOKEN');
  }
});
