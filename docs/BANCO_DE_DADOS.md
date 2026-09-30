# Banco de dados

Entidades principais: users, addresses, origins, roasts, grindings, essences, categories, products, product_variants, inventory_movements, orders, order_items, order_status_history, stock_notifications, club_levels e club_memberships.

A relação central é: product → product_variants → order_items → orders. A baixa de estoque ocorre apenas no método de confirmação de pagamento, dentro de transação com bloqueio FOR UPDATE.

## ER resumido
```mermaid
erDiagram
 USERS ||--o{ ORDERS : faz
 USERS ||--o{ ADDRESSES : possui
 PRODUCTS ||--o{ PRODUCT_VARIANTS : possui
 ORIGINS ||--o{ PRODUCTS : origina
 ROASTS ||--o{ PRODUCTS : define
 ESSENCES ||--o{ PRODUCTS : aromatiza
 GRINDINGS ||--o{ PRODUCT_VARIANTS : usa
 ORDERS ||--|{ ORDER_ITEMS : contem
 PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : vendido_em
 ORDERS ||--o{ ORDER_STATUS_HISTORY : registra
 PRODUCT_VARIANTS ||--o{ INVENTORY_MOVEMENTS : movimenta
 USERS ||--|| CLUB_MEMBERSHIPS : participa
 CLUB_LEVELS ||--o{ CLUB_MEMBERSHIPS : define
```