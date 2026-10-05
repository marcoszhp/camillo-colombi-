import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateShipping, mockPayment, orderNumber } from '../worker/lib/services.js';

test('Minas Gerais tem frete grátis', () => {
  assert.equal(calculateShipping({ state: 'MG', subtotal: 80, totalWeightG: 500 }).price, 0);
  assert.equal(calculateShipping({ state: ' mg ' }).free, true);
});

test('ES, RJ e SP têm frete fixo de R$ 40 independentemente de compra e peso', () => {
  for (const state of ['ES', 'RJ', 'SP']) {
    for (const subtotal of [80, 300, 1000]) {
      const shipping = calculateShipping({ state, subtotal, totalWeightG: 50000 });
      assert.equal(shipping.price, 40);
      assert.equal(shipping.free, false);
    }
  }
});

test('entrega fora do Sudeste ou estado inválido é indisponível, inclusive acima de R$ 300', () => {
  for (const state of ['BA', 'PR', 'DF', 'AM', 'XX', '']) {
    assert.throws(() => calculateShipping({ state, subtotal: 1000, totalWeightG: 500 }), error => error.code === 'SHIPPING_UNAVAILABLE' && error.status === 422);
  }
});

test('gateway mock preserva cenário', () => {
  assert.equal(mockPayment({ method: 'pix', scenario: 'pending' }).status, 'pending');
});

test('número de pedido possui prefixo CAM', () => {
  assert.match(orderNumber(), /^CAM-\d{8}-[A-F0-9]{6}$/);
});
