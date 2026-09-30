# API v1

- GET `/api/v1/health` — saúde.
- GET `/api/v1/products` — catálogo; filtros `search`, `roast`, `bean_type`, `origin`, `essence`, `sort`.
- GET `/api/v1/products/:id` — produto, história e variações.
- POST `/api/v1/products/:id/notify` — registra aviso de estoque.
- POST `/api/v1/auth/register` — cadastro.
- POST `/api/v1/auth/login` — login.
- GET `/api/v1/auth/me` — usuário autenticado.
- POST `/api/v1/orders` — cria pedido sem reduzir estoque.
- POST `/api/v1/orders/:id/confirm-payment` — confirma pagamento demo e reduz estoque em transação.
- GET `/api/v1/orders/mine` — histórico do cliente.
- GET `/api/v1/orders` — pedidos para admin/operator.
- PATCH `/api/v1/orders/:id/status` — altera status para admin/operator.
- GET `/api/v1/orders/dashboard` — dashboard admin.
- GET/POST/PUT/DELETE `/api/v1/admin/products...` — operações administrativas de produtos.
- PATCH `/api/v1/admin/variants/:id/stock` — ajuste de estoque.
