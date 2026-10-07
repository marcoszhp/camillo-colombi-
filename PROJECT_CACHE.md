# Memória — Caffè Camillo Colombi

## Estado atual — 06/10/2026

Home animada implementada na branch `codex/desktop-coffee-journey`, baseada em `origin/main` `b59386e`. Em revisão antes da publicação. Origem com grão realista gerado, torra com fundo/partículas/fumaça e transição para foto de Moka; catálogo e backend preservados. Desktop >=1024×640 usa GSAP/ScrollTrigger local; móvel e movimento reduzido usam fluxo estático. Controle explícito de movimento, tema escuro `#2a2621`, desmontagem e cabeçalho conferidos. `npm test` 33/33 e `npm run check` aprovados; revisão visual independente sem impedimentos. As três fotos da narrativa foram exportadas para WebP (387 KB no total). Detalhes/índice da entrega: `cloudflare/docs/ANIMACOES_DESKTOP.md`, `cloudflare/public/{index.html,css/journey.css,js/journey.js}`, `cloudflare/tests/journey.test.mjs` e `docs/PROGRESSO_SITE.md`.

Pendência real: vídeo de Moka/Cappuccino sendo servido. Candidato Pexels licenciado não baixado; falhas de download/revisão registradas na documentação. Sem líquido falso em CSS; não chamar essa fase de animação final de preparo. Próximo passo imediato: publicar PR/Cloudflare e verificar o site online. Nenhuma migration ou alteração D1 nesta rodada. Catálogo atual continua com 8 produtos ativos; entrega somente MG/ES/RJ/SP, MG grátis e outros estados do Sudeste R$40.

Correção do cabeçalho no commit `8a331f3`, revisão [PR #6](https://github.com/marcoszhp/camillo-colombi-/pull/6). Publicada na Cloudflare na versão `1d006708-366f-4a81-9819-2c25ef7c0570`, sem alteração no banco.

A correção anterior do listener de rolagem não resolveu o posicionamento. Reprodução online: em `scrollY=720`, o estado era `scrolling-up` e o transform estava zerado, mas o cabeçalho permanecia em `top=-720`. O sticky estava limitado ao wrapper da mesma altura. Agora `[data-header]` recebe sticky/top/z-index e `.site-header` é relative; a transição continua no elemento interno.

Validação real após publicação: desktop 1280×720, home — escondido ao descer, `top=0` ao subir em `scrollY=1873`; celular 390×844, `/nossa-historia` — escondido ao descer, `top=0` ao subir em `scrollY=356`, menu móvel visível ao abrir. Local também conferido na home e catálogo, incluindo navegação pelo menu e ausência de overflow no celular. `npm test` 28/28 e `npm run check` aprovados. Capturas em `cloudflare/reports/header-online-{desktop,mobile}.jpg` (ignoradas pelo Git). Detalhes em `docs/PROGRESSO_SITE.md`; cabeçalho sem pendências conhecidas após estes testes.

## Referência de animações desktop — 06/10/2026

Usuário pediu análise de viabilidade do Reels https://www.instagram.com/reel/DeDRa1-srk2/ e adaptação das animações para desktop. Vídeo público reproduzido no navegador, 9,59 s; análise visual por amostras em aproximadamente 0,17–9,30 s, intervalo de 1 s, sem análise de áudio. Evidências e timestamps em `cloudflare/reports/reel-analysis/evidence.json` e `observed-*.jpg` (ignorados pelo Git).

Observado: grão grande no início; mudança de fundo claro para marrom, grãos separados/partículas e aparência de fumaça; preparo com porta-filtro e café caindo na xícara; catálogo ao final. Instagram mostra o rótulo “Conteúdo de IA”; o vídeo não comprova um site funcional nem qual tecnologia o produziu. Viabilidade: implementar uma narrativa desktop por rolagem com transições de texto/cor/imagens; realismo de líquidos exige mídia própria renderizada/filmada ou sequência de quadros. GSAP/ScrollTrigger suporta pin e scrub; documentação oficial consultada. Aplicação atual usa JS comum, sem necessidade de migrar para React. Preservar versão leve móvel, redução de movimento, cabeçalho corrigido e a preferência anterior de não exibir rótulos numerados. Esta análise serviu de base para a implementação descrita no estado atual; a etapa de vídeo real continua pendente.

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

Cinco fotos realistas geradas com a ferramenta integrada foram salvas em `cloudflare/public/assets/photos/`: fachada, ritual com Moka, origem capixaba, embalagem e cappuccino. Home, catálogo, detalhe e página de cultura usam essas fotos; cultura foi reduzida aos preparos ainda oferecidos. Publicado em 05/10/2026 no commit `138e983`, versão Cloudflare `e1984876-d250-4e65-8966-bc64e7893119`; GitHub Actions run `37356069253` aprovado. Validação: 28/28 testes, `npm run check`, deploy dry-run, migration 0004 local/remota e inspeção visual sem erros de console. Produção confirmou 8 produtos ativos, login e `/auth/me` HTTP 200; 2 pedidos, 3 usuários, estoque legado 2530 e 343 pontos preservados; chaves estrangeiras sem violações.

Preservar margem preventiva de uso de 5%; consultar antes de etapas grandes. Nunca resetar produção nem incluir backup, segredos ou estado local no Git.

Em 05/10/2026, os cartões de produto da interface editorial receberam fundo branco, `padding: 20px` e cantos de 15px, conforme referência enviada. No modo escuro, o fundo do cartão passa a ser `#2a2621`. `npm run check` e 28/28 testes aprovados. PR #1 integrado à `main` no commit `c967c3d`; GitHub Actions run `37382491789` aprovado. O fluxo completo com migrations encontrou erro 7403 no D1, mas a publicação segura de Worker/assets, sem tocar no banco, foi concluída na versão Cloudflare `ca780028-aab7-4f21-a642-953c3779b98b`; CSS público conferido.

Em 06/10/2026, nova rodada de interface publicada: confirmação visual do carrinho, cabeçalho que reaparece ao subir, remoção de rótulos numerados e textos de demonstração, filtros laterais reduzidos, estoque visível nos cartões/detalhes, foco de moagem mais discreto, bordas arredondadas e documentação em `docs/PROGRESSO_SITE.md`. `npm run check`, `npm test` (28/28) e sintaxe dos scripts passaram. PR #3 integrado; Cloudflare versão `6b8db45b-9bcd-4104-abde-39ea6417e77a`; scripts e CSS públicos conferidos.

