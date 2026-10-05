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
