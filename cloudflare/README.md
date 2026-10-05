# Caffè Camillo Colombi — Workers e D1

Evolução da aplicação Cloudflare existente: catálogo oficial com seis cafés embalados e treze bebidas, variantes por peso, volume ou unidade, administração, carrinho, pedidos, pagamento demonstrativo e Clube Camillo. Interface amarela e vermelha, ilustrações SVG próprias, cultura do café e movimento reduzido respeitado.

## Ambiente local

Node 24 recomendado (mínimo 22.13, necessário aos testes SQLite). Na pasta `cloudflare`:

```powershell
npm ci
npm run db:init:local
npm run dev
```

Acesse a URL exibida pelo Wrangler. O inicializador consulta somente o D1 **local**: se vazio, carrega o schema/seed original e aplica as migrations; se já existente, aplica apenas as migrations. `.dev.vars` é criado somente se ausente e nunca vai para Git. Não copiar estado de produção para testes.

Contas exclusivamente demonstrativas da base local: `admin@caffecamillo.local` / `Admin@123` e `cliente@caffecamillo.local` / `Cliente@123`. A publicação não cria nem restaura essas contas.

## Comandos

| Comando | Ação |
| --- | --- |
| `npm test` | Regressões Worker, catálogo, transações e migrations em SQLite isolado |
| `npm run check` | Arquivos, sintaxe JS, referências HTML, assets locais e configuração |
| `npm run deploy:dry` | Compila Worker sem publicação |
| `npm run db:init:local` | Prepara desenvolvimento sem substituir dados existentes |
| `npm run db:migrate:local` | Aplica migrations ao banco local |
| `npm run db:migrate:remote` | Aplica migrations pendentes à instalação remota configurada |
| `npm run deploy` | Valida, aplica migrations remotas e publica |
| `npm run cf:login` | Autoriza a conta Cloudflare no navegador |

`cloudflare:setup` é mantido como alias da publicação segura da instalação existente. Não gera segredo novo. `db:init:remote` é alias de migrations e não executa seed. `db:reset:local` é um comando destrutivo explícito reservado ao desenvolvimento; não faz parte de deploy ou testes.

## Regras preservadas

- API relativa `/api/v1`; nenhuma dependência de um servidor Node em produção.
- Estoque só reduz após aprovação; produtos esgotados permanecem visíveis.
- PIX e cartões Visa, Mastercard, Elo e Hipercard são simulados. Não se coleta PAN/CVV.
- Frete gratuito para Sudeste ou subtotal a partir de R$ 300, conforme regra já implementada.
- R$ 1 aprovado equivale a 1 ponto; níveis Grão, Crema, Barista e Maestro, sem ranking público.
- Aromatização adicionada é diferente de nota sensorial natural. Origens informadas são referências do catálogo demonstrativo, sem alegar certificação de lote.

## Documentação

- [Publicação e Workers Builds](docs/CLOUDFLARE.md)
- [API](docs/API.md)
- [Banco e migração](docs/BANCO_D1.md)
- [Segurança e limites](docs/SEGURANCA.md)
- [Cultura do café e fontes](docs/CULTURA-DO-CAFE.md)
- [Validação desta entrega](docs/VALIDACAO.md)

