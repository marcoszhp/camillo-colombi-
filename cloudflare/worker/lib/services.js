import { AppError } from './http.js';

export function calculateShipping({ state }) {
  const uf = String(state || '').trim().toUpperCase();
  const southeast = new Set(['ES', 'MG', 'RJ', 'SP']);
  if (!southeast.has(uf)) throw new AppError('Entregamos apenas em Minas Gerais, Espírito Santo, Rio de Janeiro e São Paulo.', 422, 'SHIPPING_UNAVAILABLE');
  return { price: uf === 'MG' ? 0 : 40, free: uf === 'MG', estimatedDays: uf === 'ES' ? 3 : 5, rule: uf === 'MG' ? 'MG_GRATIS' : 'SUDESTE_FIXO' };
}

export function mockPayment({ method, brand = null, scenario = 'approved' }) {
  const allowed = new Set(['approved', 'pending', 'declined', 'canceled']);
  const status = allowed.has(scenario) ? scenario : 'pending';
  return { provider: 'mock', method, brand, status, transactionId: `MOCK-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
}

export function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `CAM-${date}-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}
