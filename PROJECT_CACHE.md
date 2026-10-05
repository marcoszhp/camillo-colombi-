# Memória — Caffè Camillo Colombi

## Estado em 05/10/2026

Trabalho em andamento na branch `codex/camillo-experiencia-cloudflare`, baseada no commit `da543a3` de `marcoszhp/camillo-colombi-`. O código Node/MySQL da raiz é a base histórica e permanece preservado. A aplicação Cloudflare fica em `cloudflare/` e foi copiada do checkout existente em Downloads; sem dados privados, `node_modules` ou estado D1. O diretório raiz de build/deploy Cloudflare é `cloudflare/`.

O Worker público conhecido é `https://caffe-camillo-colombi.marcos-hpg114.workers.dev`. A autenticação Cloudflare foi confirmada. Uma leitura da API remota confirmou 9 produtos legados; não houve alteração remota. Ainda não há commit, push ou PR. Não presumir que o vínculo GitHub → Cloudflare esteja configurado.

## Índice

- `cloudflare/worker/index.js`: entrada Worker e roteamento `/api/v1`.
- `cloudflare/worker/routes/products.js`, `admin.js`, `orders.js`: catálogo, variantes, administração e transações.
- `cloudflare/worker/lib/{auth,crypto,services,http}.js`: sessão, criptografia, frete/mock e respostas.
- `cloudflare/database/migrations/`: evolução versionada; nunca reset remoto.
- `cloudflare/public/js/pages/main.js`: páginas e formulários; `ui.js`, `products.js`, `cart.js`, `api.js`: utilitários globais.
- `cloudflare/public/css/` e `cloudflare/public/assets/`: identidade e ilustrações locais.
- `cloudflare/tests/`: testes Node/SQLite, incluindo integração Worker.
- `cloudflare/scripts/`: validação e publicação; `cloudflare/wrangler.jsonc`: binding D1 e assets.
- `cloudflare/docs/VALIDACAO.md`: evidências e pendências de validação desta edição.

## Contratos e decisões

Catálogo oficial: 6 cafés embalados e 13 bebidas, nomes reais. Variantes por peso, volume ou unidade; preservar variantes, estoque, pontos e pedidos antigos. Pagamento demonstrativo; estoque após aprovação; R$1 aprovado = 1 ponto; frete gratuito Sudeste ou compra >= R$300 conforme comportamento existente. Camillo com a verde, m branco com contraste, i vermelho. Sem imagens externas, sem dependências visuais pesadas; movimento reduzido respeitado.

Migrations versionadas: `0001_baseline`, `0002_flexible_variants` e `0003_official_catalog`. Preservar histórico e dados; nunca usar reset remoto. A migration 0002 inclui o guard `advance_order`, validado na fixture local final. Regressões cobrem concorrência de aprovação/cancelamento e mudança de status, filtros da mesma variante e proteção para reset apenas local.

## Validação e próximo passo

23/23 testes, npm run check e deploy --dry-run finais aprovados em 05/10. Fixture local refeita com todas as migrations; integridade SQLite ok e nenhuma violação de chave estrangeira. Links locais corrigidos. Interface conferida em 360, 768 e 1280 px sem overflow; 1600 px não comprovado por limitação da ferramenta. Checkout mock local concluído com Espresso 60 ml; administração e variantes conferidas.

Usuário autorizou publicar GitHub/Cloudflare e enviar o link por e-mail após confirmação. Backup privado pré-publicação salvo em cloudflare/reports (ignorado pelo Git). Base remota anterior: 9 produtos, 2 pedidos, 3 usuários, estoque legado 2530 e pontos 343. Próximo passo: commit, push, PR, merge, migrations/deploy e conferência dos dados preservados. Não presumir conexão automática GitHub Builds configurada.

Preservar margem preventiva de uso de 5%; consultar antes de etapas grandes. Nunca resetar produção nem incluir backup, segredos ou estado local no Git.
