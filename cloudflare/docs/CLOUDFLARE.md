# Cloudflare — atualização da instalação existente

## Repositório e raiz de build

O repositório é `marcoszhp/camillo-colombi-`. A aplicação Workers/D1 fica em `cloudflare/`; a raiz contém a versão acadêmica Node/MySQL anterior, preservada. Configure Workers Builds para usar:

- Worker existente: `caffe-camillo-colombi`.
- Branch de produção: `main`.
- Diretório raiz: `cloudflare`.
- Versão Node: 24.
- Build: `npm run check && npm test`.
- Deploy: `npm run deploy`.

O pipeline GitHub Actions verifica pull requests e não publica. Um merge em main pode iniciar publicação automática **somente depois que o vínculo Workers Builds estiver configurado**. Não afirmar que o vínculo existe apenas porque os arquivos estão no GitHub.

## Ordem da atualização

`npm run deploy` executa validação, aplica migrations pendentes no D1 configurado e publica Worker+assets. Falha em qualquer etapa interrompe a sequência. Não executa reset/seed remoto nem altera JWT_SECRET. Em Workers Builds, o script recusa branches diferentes de main antes de acessar o banco.

O binding `DB` aponta para o banco existente e `database/migrations` contém arquivos numerados. O Wrangler registra o histórico em `d1_migrations`. Migrations são aplicadas uma vez; não reedite uma migration já publicada, crie a próxima. A migração do catálogo conserva pedidos e dados antigos; produtos legados são preservados, embora os nomes comerciais anteriores deixem o catálogo público.

As migrations precedem o deploy; há uma breve janela em que a versão anterior pode não exibir todas as variantes recém-adicionadas. Faça a primeira atualização em período de baixa atividade, depois da revisão do pull request. Em caso de falha de publicação, corrija o build e repita: as migrations já aplicadas não serão executadas novamente. Reverter apenas o Worker não reverte o catálogo; prefira uma correção progressiva.

## Autenticação e dados

Use a conta Cloudflare autorizada e o token do Workers Builds com acesso ao Worker e ao D1. Nunca coloque token ou JWT_SECRET no Git. O segredo de runtime existente é preservado e é diferente das variáveis do ambiente de build. Os usuários existentes permanecem no D1; contas demonstrativas são geradas somente na inicialização de um banco local vazio.

Antes da primeira publicação desta evolução, confira a identidade do Worker/D1, o histórico de migrations e o backup/Time Travel da instalação. Não execute `database/reset.sql`, seed de usuários ou alteração manual do schema remoto. Não use `cloudflare:setup` antigo de outro ZIP: ele rotacionava o segredo.

Para publicar manualmente uma revisão aprovada: `npm run cf:login`, `npm run deploy`. Para apenas verificar: `npm run deploy:dry`. O endpoint de saúde é `/api/v1/health`.

## Fontes oficiais consultadas em 04/10/2026

- [Migrations D1](https://developers.cloudflare.com/d1/reference/migrations/): pasta configurável, aplicação ordenada e histórico.
- [Chaves estrangeiras D1](https://developers.cloudflare.com/d1/sql-api/foreign-keys/): validação ativa e uso de defer_foreign_keys em migrações.
- [Configuração Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/): raiz, branch, comandos, variáveis e credencial de build.

