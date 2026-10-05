import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateShipping, mockPayment, orderNumber } from '../worker/lib/services.js';

test('Sudeste tem frete grátis', () => {
  assert.equal(calculateShipping({ state: 'MG', subtotal: 80, totalWeightG: 500 }).price, 0);
});

test('compras de R$ 300 têm frete grátis em qualquer estado', () => {
  assert.equal(calculateShipping({ state: 'BA', subtotal: 300, totalWeightG: 500 }).price, 0);
});

test('frete fora do Sudeste abaixo de R$ 300 é positivo', () => {
  assert.ok(calculateShipping({ state: 'BA', subtotal: 100, totalWeightG: 500 }).price > 0);
});

test('gateway mock preserva cenário', () => {
  assert.equal(mockPayment({ method: 'pix', scenario: 'pending' }).status, 'pending');
});

test('número de pedido possui prefixo CAM', () => {
  assert.match(orderNumber(), /^CAM-\d{8}-[A-F0-9]{6}$/);
});
