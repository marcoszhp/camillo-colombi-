# Banco D1

O banco online usa Cloudflare D1, cuja linguagem e comportamento são baseados em SQLite.

## Entidades principais

- `users`, `addresses`;
- `categories`, `origins`, `roast_levels`, `grind_types`, `aromas`;
- `products`, `product_aromas`, `product_variants`;
- `orders`, `order_items`, `order_status_history`, `payments`;
- `loyalty_levels`, `loyalty_transactions`, `rewards`, `customer_rewards`;
- `stock_notifications`, `favorites`, `login_attempts`.

## Estoque

`product_variants.stock` possui `CHECK (stock >= 0)`.

Pedidos aprovados usam `DB.batch()` com as gravações relacionadas. Se uma atualização tentar deixar estoque negativo, a constraint falha e o batch é revertido. Antes do batch, a API também valida o estoque visível para fornecer erro amigável.

## Pontos

Pontos entram somente quando o pagamento é aprovado. Cancelamento de pedido já pago devolve estoque e cria transação `reversal`.

## Pagamentos pendentes

O admin pode aprovar um pagamento pendente. A aprovação tenta baixar estoque naquele momento; se não houver quantidade suficiente, o batch falha.

## Seed

O seed contém:

- 2 usuários;
- 9 cafés;
- 126 variantes;
- níveis/recompensas;
- pedido demonstrativo.

É idempotente por utilizar `INSERT OR IGNORE`.

## Migrations e preservação de histórico — 04/10/2026

`database/schema.sql` e `seed.sql` preservam a base legada para teste de upgrade e inicialização LOCAL. Não representam sozinhos o schema final. A estrutura atual resulta das migrations em ordem:

1. `0001_baseline.sql`: tabelas existentes com IF NOT EXISTS; sem seed de usuários.
2. `0002_flexible_variants.sql`: tipo de produto e variantes com rótulo/unidade/volume/peso opcional; reconstrução transacional preserva IDs, sequência, estoque e itens históricos. Guardas transacionais protegem mutações de pedidos concorrentes.
3. `0003_official_catalog.sql`: adiciona catálogo oficial; mantém produtos/variantes antigos e os retira da vitrine por desativação dos slugs legados. Não apaga clientes, pedidos, pagamentos ou pontos.

No Wrangler, o histórico `d1_migrations` impede reaplicação. Testes executam upgrade com histórico e conferem integridade e chaves estrangeiras. O seed demonstrativo nunca é executado pela publicação remota.
