# Caffè Camillo Colombi

Leia `PROJECT_CACHE.md` antes de trabalhar. A aplicação online ativa fica em `cloudflare/` (Workers, D1 e Static Assets); a versão acadêmica Node/MySQL da raiz é histórica e deve ser preservada. Não confundir este repositório com o FácilID da pasta superior.

Preserve `/api/v1`, autenticação, carrinho, pedidos, estoque transacional, pagamento demonstrativo e fidelidade. Mudanças de dados exigem migrations, testes de upgrade com dados anteriores e revisão direta do coordenador. Não executar reset, seed de usuários ou rotação automática de segredo em produção.

Preferência atual do usuário (09/10/2026): usar Qwen local em toda execução delegável para economizar tokens remotos. O coordenador define tarefas, opera as ferramentas necessárias, revisa e integra; não acionar Sol/Luna automaticamente. Dividir tarefas para caber no executor. Se houver bloqueio real que exija execução remota, informar a limitação antes de mudar de executor. Não replique contexto inteiro. Execute `npm test` e `npm run check` dentro de `cloudflare/`. Alterações estruturais seguem branch `codex/` e pull request antes de main, pois main pode publicar automaticamente.

Atualize o cache com estado, evidências, pendências e próximo passo; sem segredos. Consulte limites antes de etapas substanciais e preserve a margem preventiva de 5% pedida pelo usuário.

## Executor local Qwen — 09/10/2026

O usuário pediu configurar o Qwen local antes de retomar o site. Executor disponível em `C:\Users\marco\OneDrive\Desktop\NFC SENAC\local-qwen-executor\`; leia seu `PROJECT_CACHE.md` e `README.md` para o contrato. O coordenador prepara uma tarefa delimitada e chama `Invoke-Qwen.ps1 -TaskFile <caminho absoluto do contrato>`; revisa diff e evidências antes de integrar. Use Qwen para execução dentro dos limites da v1 (arquivos UTF-8 de até 4000 bytes e contexto pequeno). Divida tarefas quando possível; nunca truncar arquivos para contornar o limite nem alegar suporte a tarefas que o runner bloqueia. Segurança, autenticação, arquitetura e aceite final continuam com o coordenador. O pedido de usar Qwen sempre não troca o modelo principal do Codex nem elimina os tokens de coordenação.

Ollama local usa Vulkan/RX 6700 XT, Qwen2.5-Coder 14B Q4_K_M, contexto 4096 e uma execução por vez. Não há troca automática do modelo principal do Codex. Chame `Release-Qwen.ps1` antes de renderizar no Blender para liberar VRAM; `Invoke-Qwen.ps1` inicia o servidor novamente quando necessário. Validações do executor não são uma sandbox de sistema operacional: só autorize comandos e código inspecionados, sem segredos e sem processos persistentes.
