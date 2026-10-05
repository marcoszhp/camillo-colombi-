# API REST — Cloudflare Edition

Base: `/api/v1`

Formato de sucesso:

```json
{"success":true,"data":{}}
```

Formato de erro:

```json
{"success":false,"error":{"code":"...","message":"..."}}
```

## Pública

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Saúde do Worker e D1 |
| GET | `/products` | Lista e filtra cafés |
| GET | `/products/filters` | Torras, origens, moagens e aromas |
| GET | `/products/:slug` | Produto e variantes |
| POST | `/auth/register` | Cadastro |
| POST | `/auth/login` | Login |
| POST | `/customer/stock-notifications` | Solicita aviso de reposição |

Filtros de `/products`: `search`, `sensory`, `roast`, `origin`, `type`, `intensity`, `brew`, `aroma`, `available`, `weight`, `grind`, `minPrice`, `maxPrice`, `sort`.

## Cliente autenticado

Enviar `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/auth/me` | Perfil atual |
| GET | `/auth/addresses` | Endereços |
| POST | `/auth/addresses` | Novo endereço |
| POST | `/orders` | Cria pedido e simula pagamento |
| GET | `/orders` | Histórico |
| GET | `/orders/:orderNumber` | Detalhes + timeline |
| GET | `/loyalty/summary` | Clube Camillo |
| POST | `/customer/favorites/:productId` | Alterna favorito |
| GET | `/customer/favorites` | Lista favoritos |

### Exemplo de pedido

```json
{
  "items": [{"variantId":1,"quantity":2}],
  "paymentMethod":"pix",
  "paymentScenario":"approved",
  "shippingAddress":{
    "name":"Cliente",
    "email":"cliente@example.com",
    "phone":"27999999999",
    "zipCode":"29260-000",
    "street":"Rua Exemplo",
    "number":"100",
    "district":"Centro",
    "city":"Domingos Martins",
    "state":"ES"
  }
}
```

Cenários de demonstração: `approved`, `pending`, `declined`, `canceled`.

## Admin

Requer usuário com `role=admin`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/admin/dashboard` | KPIs |
| GET | `/admin/orders` | Pedidos |
| PATCH | `/admin/orders/:id/status` | Altera status |
| PATCH | `/admin/orders/:id/payment` | Resolve pagamento pendente |
| GET | `/admin/customers` | Clientes |
| GET | `/admin/stock-notifications` | Avisos de estoque |
| POST | `/admin/products` | Cria produto |
| PATCH | `/admin/products/:id` | Edita produto |
| DELETE | `/admin/products/:id` | Desativa produto |
| POST | `/admin/variants` | Cria variante |
| PATCH | `/admin/variants/:id` | Edita preço/estoque/ativo |
| GET | `/admin/reference/:type` | Lista referência |
| POST | `/admin/reference/:type` | Cria referência |
| PATCH | `/admin/reference/:type/:id` | Edita referência |
| DELETE | `/admin/categories/:id` | Desativa categoria |

Tipos de referência permitidos: `categories`, `origins`, `roast-levels`, `grind-types`, `aromas`, `loyalty-levels`, `rewards`.

## Evolução do catálogo (04/10/2026)

`GET /products` aceita também `category` (slug). Produtos incluem `product_kind` (`packaged`, `beverage`, `dessert`), `category_slug` e `category_name`. `GET /products/filters` retorna categorias e tipos, além das referências anteriores.

`GET /admin/products`, restrito a administrador, lista produtos ativos/inativos e suas variantes completas. Os formulários de criação/edição usam `productKind` e `categoryId`.

Variantes retornam `unit_type`, `label`, `weight_g`, `volume_ml`, `grind_type_id`, `grind_type`, `sku`, `price`, `stock` e `active`. Peso/volume/moagem podem ser nulos quando não se aplicam. POST/PATCH administrativo usa `unitType`, `label`, `weightG`, `volumeMl`, `grindTypeId`, `sku`, `price`, `stock`, `active` e `productId`. Peso admite 250/500/1000 g; bebida por volume não recebe peso ou moagem. Unidade usa um rótulo como Normal ou Grande. Pedidos armazenam o rótulo da variante como histórico.
