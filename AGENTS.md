# Caffè Camillo Colombi

Leia `PROJECT_CACHE.md` antes de trabalhar. A aplicação online ativa fica em `cloudflare/` (Workers, D1 e Static Assets); a versão acadêmica Node/MySQL da raiz é histórica e deve ser preservada. Não confundir este repositório com o FácilID da pasta superior.

Preserve `/api/v1`, autenticação, carrinho, pedidos, estoque transacional, pagamento demonstrativo e fidelidade. Mudanças de dados exigem migrations, testes de upgrade com dados anteriores e revisão direta do coordenador. Não executar reset, seed de usuários ou rotação automática de segredo em produção.

Use delegação por nível: coordenador decide e revisa; Sol implementa tarefas delimitadas; Luna faz verificações/documentação simples. Não replique contexto inteiro. Execute `npm test` e `npm run check` dentro de `cloudflare/`. Alterações estruturais seguem branch `codex/` e pull request antes de main, pois main pode publicar automaticamente.

Atualize o cache com estado, evidências, pendências e próximo passo; sem segredos. Consulte limites antes de etapas substanciais e preserve a margem preventiva de 5% pedida pelo usuário.
