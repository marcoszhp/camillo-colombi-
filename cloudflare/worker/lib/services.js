export function calculateShipping({ state, subtotal, totalWeightG }) {
  const uf = String(state || '').toUpperCase();
  const amount = Number(subtotal || 0);
  const southeast = new Set(['ES', 'MG', 'RJ', 'SP']);
  if (southeast.has(uf) || amount >= 300) return { price: 0, free: true, estimatedDays: uf === 'ES' ? 3 : 5, rule: southeast.has(uf) ? 'SUDESTE' : 'ACIMA_300' };
  const weightKg = Math.max(0.25, Number(totalWeightG || 0) / 1000);
  const regionBase = ['PR', 'SC', 'RS'].includes(uf) ? 24.9 : ['GO', 'DF', 'MT', 'MS'].includes(uf) ? 29.9 : 34.9;
  return { price: Number((regionBase + Math.max(0, weightKg - 0.5) * 4.5).toFixed(2)), free: false, estimatedDays: 8, rule: 'SIMULACAO_LOCAL' };
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
