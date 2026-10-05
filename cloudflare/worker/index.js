import { AppError, errorResponse, json } from './lib/http.js';
import { handleAuth } from './routes/auth.js';
import { handleProducts } from './routes/products.js';
import { handleOrders } from './routes/orders.js';
import { handleCustomer } from './routes/customer.js';
import { handleLoyalty } from './routes/loyalty.js';
import { handleAdmin } from './routes/admin.js';

const API_PREFIX = '/api/v1';

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: { Allow: 'GET,POST,PATCH,DELETE,OPTIONS' } });
      }

      if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
      if (!url.pathname.startsWith(API_PREFIX)) throw new AppError('Endpoint não encontrado.', 404, 'NOT_FOUND');
      if (!env.DB) throw new AppError('Binding D1 DB não configurado.', 500, 'D1_NOT_CONFIGURED');

      const path = url.pathname.slice(API_PREFIX.length) || '/';
      const method = request.method.toUpperCase();

      if (path === '/health' && method === 'GET') {
        const database = await env.DB.prepare('SELECT 1 ok').first();
        return json({ status: 'ok', service: 'caffe-camillo-colombi-cloudflare', database: database?.ok === 1 ? 'ok' : 'unknown', time: new Date().toISOString() });
      }

      const handlers = [handleAuth, handleProducts, handleOrders, handleCustomer, handleLoyalty, handleAdmin];
      for (const handler of handlers) {
        const response = await handler(request, env, path, method, url);
        if (response) return response;
      }
      throw new AppError('Endpoint não encontrado.', 404, 'NOT_FOUND');
    } catch (error) {
      return errorResponse(error);
    }
  }
};
