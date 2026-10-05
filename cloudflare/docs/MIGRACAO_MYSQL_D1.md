# Migração da versão MySQL para D1

A versão original continua separada. Esta edição online mantém o contrato de API e o front-end, mas troca a infraestrutura.

| Original | Cloudflare |
|---|---|
| Node + Express | Worker ES Module |
| `mysql2/promise` | D1 binding `env.DB` |
| MySQL | D1 / SQLite |
| `AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `ON DUPLICATE KEY` | `ON CONFLICT` / `INSERT OR IGNORE` |
| `FOR UPDATE` | serialização de escrita + batch + constraints |
| transação de conexão | `DB.batch()` atômico |
| bcryptjs | PBKDF2 via Web Crypto |
| `express.static()` | Workers Static Assets |

## Por que o Worker não usa Express

A edição Cloudflare usa roteamento nativo do runtime para reduzir dependências, tamanho e CPU. O front-end continua chamando as mesmas rotas `/api/v1`, portanto a experiência do usuário permanece equivalente.

A versão Node/Express/MySQL não foi apagada nem substituída; ela continua sendo a referência quando a atividade exigir explicitamente essa stack.
