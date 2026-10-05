# Memória — Caffè Camillo Colombi

## Estado em 05/10/2026

Versão publicada em main no GitHub, commit de implementação `ae999fe`; desenvolvida na branch `codex/camillo-experiencia-cloudflare` a partir de `da543a3`. O código Node/MySQL da raiz é a base histórica e permanece preservado. A aplicação Cloudflare fica em `cloudflare/` e foi copiada do checkout existente em Downloads; sem dados privados, `node_modules` ou estado D1. O diretório raiz de build/deploy Cloudflare é `cloudflare/`.

Worker publicado e conferido em https://caffe-camillo-colombi.marcos-hpg114.workers.dev em 05/10/2026. Versão Cloudflare: 0a4c01cf-b659-43a3-a529-fa4505bed93f. GitHub Actions aprovado (run 37338874741). A integração recusou criação de PR com HTTP 403; publicação autorizada pelo usuário concluída por fast-forward de main via Git autenticado. Deploy manual concluído; vínculo automático GitHub Builds não confirmado.

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

**Ajuste solicitado em 05/10/2026 (ainda não publicado):** migration `0004_simplified_catalog.sql` desativa Affogato, Bicerin, Caffè Corretto, Caffè Freddo, Caffè Latte, Espresso, Lungo, Macchiato, Marocchino, Ristretto e Shakerato, preservando produtos/variantes para os pedidos históricos. Após aplicação, o catálogo ativo terá 8 produtos (6 cafés em saco e 2 bebidas). Interface mais concisa, frete informado como entrega apenas no Sudeste (MG grátis; ES/RJ/SP R$ 40) e expiração de token limpa a sessão e leva ao login com retorno interno. `npm run check` e `node --test tests/migrations.test.mjs` aprovados. Pendentes integração/revisão e aplicação autorizada pelo coordenador; sem deploy feito por esta alteração.

23/23 testes, npm run check e deploy --dry-run finais aprovados em 05/10. Fixture local refeita com todas as migrations; integridade SQLite ok e nenhuma violação de chave estrangeira. Links locais corrigidos. Interface conferida em 360, 768 e 1280 px sem overflow; 1600 px não comprovado por limitação da ferramenta. Checkout mock local concluído com Espresso 60 ml; administração e variantes conferidas.

Usuário autorizou publicar GitHub/Cloudflare e enviar o link por e-mail após confirmação. Backup privado pré-publicação salvo em cloudflare/reports (ignorado pelo Git). Base remota anterior: 9 produtos, 2 pedidos, 3 usuários, estoque legado 2530 e pontos 343. Migrations e deploy concluídos. Conferência remota: 19 produtos ativos, 2 pedidos, 3 usuários, estoque legado 2530 e pontos 343 preservados; foreign_key_check vazio. Health e catálogo HTTP 200. Site conferido no navegador; captura em reports/site-online.jpg. E-mail com link enviado ao destinatário solicitado (Gmail confirmou SENT). Sem pendências de publicação; pagamentos permanecem mock.

Atualização de 05/10/2026 em validação: catálogo simplificado para 8 produtos ativos (6 cafés embalados, Cappuccino e Moka), preservando os 11 produtos retirados e seus históricos como inativos. Frete passa a aceitar apenas MG/ES/RJ/SP: MG grátis e R$ 40 para ES, RJ e SP. Sessões vencidas são limpas pelo frontend; login e registro não reutilizam token antigo. JWT ganhou validação estrutural e de algoritmo.

Cinco fotos realistas geradas com a ferramenta integrada foram salvas em `cloudflare/public/assets/photos/`: fachada, ritual com Moka, origem capixaba, embalagem e cappuccino. Home, catálogo, detalhe e página de cultura usam essas fotos; cultura foi reduzida aos preparos ainda oferecidos. Validação local: 28/28 testes, `npm run check`, deploy dry-run, migration 0004 local e inspeção visual sem erros de console. Ainda não publicado remotamente nesta atualização.

Preservar margem preventiva de uso de 5%; consultar antes de etapas grandes. Nunca resetar produção nem incluir backup, segredos ou estado local no Git.

