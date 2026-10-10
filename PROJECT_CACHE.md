# Memória — Caffè Camillo Colombi

## Correção do contexto das APIs do navegador — 10/10/2026

⏳ Retorno após correção trouxe JSON idêntico ao anterior, sem campo build. Isso não confirma execução da versão corrigida. Conferência HTTP dos4módulos (journey, sequence, diagnostics, browser) retornou200 e conteúdo exatamente igual ao disco. Orientado abrir URL nova `http://127.0.0.1:8787/?diagnostico=animacao&versao=20261010-receiver`; confirmar build20261010-receiver antes de nova análise. Não presumir que o Ctrl+F5 atualizou a aba nem alterar novamente o player sem diagnóstico da versão atual.

✅ Novo diagnóstico do usuário: ready, vendors presentes, requestedFrame300, nenhum drawnFrame/cache, etapa0. Fora da seção, motionActive=false era esperado; não alterar IntersectionObserver por hipótese. Investigação identificou funções nativas guardadas diretamente no player e chamadas como `this.raf`/`this.fetchImage`/`this.decode`/`this.cancel`, passando o player como receptor em vez do global do navegador. Exceção ao agendar desenho interrompia também o restante de request/reveal; testes anteriores injetavam funções sem verificação de receptor.

✅ Regressão independente com contrato de receptor global FALHOU antes em requestAnimationFrame e PASSOU depois. Qwen local gerou quatro wrappers em `cloudflare/public/js/journey-browser.js`; coordenador revisou/integrou como defaults em journey-sequence. Primeira tentativa Qwen foi recusada por não ler alvo antes de criar; segunda cumpriu a guarda e retornou SUCCESS. Prova funcional confirmou carregar/desenhar1→175→25, cancelar e preservar receiver nas4APIs. Suíte43/43 e check PASS. Evidências `reports/browser-receiver-{before,after,suite}.log`. Helpers gerados com Qwen100%GPU; modelo descarregado ao concluir.

✅ Correção registrada no commit `22b6802` da branch `codex/blender-coffee-journey`. Índice e import do player usam versão20261010-receiver; diagnóstico informa build. Mantidos render/GSAP/IO/mobile/reduced motion/backend. Sem publicação Cloudflare nem merge.

⏳ Pergunta pendente: recarregar prévia, ativar e verificar avanço/reversão. Teste do contrato nativo não substitui execução visual no navegador; não declarar aceite final até confirmação. Se necessário, novo diagnóstico deve mostrar build20261010-receiver. Resolver permissão para PR antes de integrar/publicar. Não repetir render ou verificações que já passaram sem mudança.

## Falha de carregamento identificada — 10/10/2026

❌ Retorno posterior ao reinício: usuário disse que continua parado. Servidor recebeu novas solicitações dos dois vendors e respondeu304, sem novo aviso de queda. Portanto, reiniciar o servidor NÃO confirmou resolução da falha. Solicitado texto completo do diagnóstico atualizado (pergunta livre, sem opção que omita o texto). Aguardar antes de atribuir causa a cache, políticas do navegador ou inicialização do player; não reiniciar repetidamente nem alterar biblioteca sem evidência.

✅ Usuário forneceu diagnóstico real: viewport2035×1244, reducedMotion=true, documentHidden=false, initialization-error com `Animação indisponível`, gsap/ScrollTrigger ausentes, sem player/frames/triggers. Isso localiza a falha no carregamento das bibliotecas, antes da criação do player. Não atribuir ao Blender ou à largura.

✅ Verificação HTTP dos vendors recusou conexão127.0.0.1:8787. Log anterior terminava com aviso de queda do runtime. Servidor local reiniciado (processo iniciador24132; logs `cloudflare/reports/preview-server-20261010*.log`). HEAD dos dois vendors e frame175 retornou200/MIME correto; GET dos vendors retornou200 e SHA256 idêntico aos arquivos locais. Evidência `cloudflare/reports/preview-vendor-health-20261010.json`. Nenhuma mudança no backend/dados/publicação. Essa conferência de entrega HTTP não é inspeção do navegador nem validação temporal.

⏳ Solicitado recarregar Ctrl+F5, ativar animação (o sistema prefere movimento reduzido) e testar rolagem; aguardar novo resultado. A indisponibilidade do servidor foi corrigida, mas ainda não declarar o travamento resolvido no navegador. Se o diagnóstico continuar initialization-error com servidor saudável, investigar bloqueio de carregamento no navegador com evidência do usuário. Não repetir render. Próximo passo após validação real: PR/permissão da integração e publicação Worker/assets.

## Travamento reportado no navegador — 09/10/2026

❌ Usuário confirmou: página inicialmente estática; botão Ativar animação mostra um grão, porém rolar depois de ativar não avança. Logs da sessão registraram módulos e vendors, sem pedidos de frames. Causa ainda NÃO confirmada; não declarar corrigido, não publicar e não substituir a timeline por hipótese. A ferramenta de navegador continua sem acesso autorizado à prévia.

✅ Diagnóstico opt-in em `http://127.0.0.1:8787/?diagnostico=animacao`. Após ativar/rolar, usuário pode clicar Copiar diagnóstico e colar na conversa. Não envia dados automaticamente, não coleta credenciais/URLs/conteúdo da página. `public/js/journey-diagnostics.js` lê somente estado da animação, geometria, preferências de movimento e progresso do ScrollTrigger. `journey.js` expõe estado/erro de inicialização em dataset; índice usa versão nova do módulo para evitar cache antigo. Nenhuma correção visual ou de rolagem alegada nesta etapa.

✅ Qwen local gerou o módulo, mas sua validação sintática não detectou seletores incorretos. Coordenador corrigiu seletores, cópia e limpeza na revisão/integração. Oracle funcional independente `cloudflare/reports/verify-journey-diagnostics.mjs` PASS; suíte42/42 e check PASS em `reports/journey-diagnostic-tests.log`. Modelo descarregado, `ollama ps` vazio. Alterações locais ainda não commitadas. Próximo passo: interpretar diagnóstico compartilhado pelo usuário, reproduzir a causa, corrigir com regressão e validar navegador antes de PR/publicação. Não repetir render Blender.

## Prévia local reaberta — 09/10/2026

✅ Usuário informou que a página não abria. Diagnóstico confirmou ausência de servidor na porta8787. Wrangler reiniciado em segundo plano, modo local: registro `cloudflare/reports/preview-server-20261009.log` confirmou `Ready on http://127.0.0.1:8787`; listener127.0.0.1:8787 confirmado, PID23324 nesta sessão. Processo iniciador29764. Nenhuma migration, seed ou publicação executada.

⏳ Abrir a prévia no computador e conferir avanço/reversão por rolagem. Servidor pronto não comprova validação visual ou temporal no navegador; recusa anterior da ferramenta continua respeitada. PR ainda bloqueado pelo403 registrado abaixo; produção inalterada. Limites nesta retomada:3% da janela curta e63% da semanal usados, uso ordinário permitido.

## Preparação corrigida e assets atualizados — 09/10/2026

✅ Versão5: chegada de filtro/caneca no frame118 antes do pó; moinho elevado; suporte de cobre; distância de0,58unidade permite ver a extração. O fluxo aparece por espessura mantendo origem na saída. Câmera corrigida para comportar grão/moinho. Helper `cloudflare/art/blender/preparation_layout.py` gerado por Qwen local; coordenador integrou a fonte maior e revisou. Nenhum subagente remoto acionado.

✅ Provas v5 aprovadas pelo coordenador e verificação geométrica funcional em150frames nos dois sentidos:170partículas, ordem de chegada, depósito dentro do filtro, conexão da extração e enquadramento. Fonte da verificação: `cloudflare/art/blender/verify_preparation.py`; resultado `cloudflare/reports/blender-preparation-check.json`. Render completo em `reports/blender-sequence-v5/`, mestre `reports/coffee-journey-final-v5.blend`. Nova prévia `reports/blender-preview-v5.mp4` (1.050.723bytes), gerada por utilitário Qwen revisado. Vídeos/provas anteriores são históricos.

✅ Assets locais substituídos após conferência:300WebPs,9.038.448bytes; SHA256/tamanhos conferidos. Backup da pasta anterior em `cloudflare/reports/blender-assets-before-v5/`. Exportador usa WebP quality82/method3 após benchmark: método3 levou0,112s e22.432bytes no frame25; método0 seria47.776bytes. Exportar em staging fora de `public` e só trocar após completar/validar. `reports/blender-final-audit-v5.json`. Checks e42/42testes passaram.

✅ Implementação enviada ao GitHub: branch `codex/blender-coffee-journey`, commit `d4b8fa6a8bde49b6c397050864499b5d0ddc0db5`. Sem merge ou deploy. A tentativa de criar PR em rascunho retornou403 `Resource not accessible by integration`; nenhum PR criado. Não repetir sem mudança de permissão da integração. O push Git funcionou; isso não confirma permissão do conector para PR.

⏳ Pergunta enviada ao usuário para confirmar avanço/reversão no navegador local após Ctrl+F5. A ferramenta de navegador havia recusado acesso; não contornar. Confirmação ainda pendente. Resolver acesso para PR e validação de navegador antes de integrar/publicar. Fonte, quadros e vídeo corrigidos já estão prontos; não repetir render. Backend/D1 preservados. Última etapa é publicação somente Worker/assets após resolver estes bloqueios.

## Revisão da prévia — 09/10/2026

✅ Conferência final dos assets: 300 WebPs, 7.811.482 bytes; tamanho e SHA256 de cada arquivo coincidem com o manifest. `npm test` equivalente via Node: 42/42; `npm run check` equivalente: PASS. Evidência `cloudflare/reports/blender-final-audit.json`. Não confundir isso com validação de navegador.

❌ Prévia EEVEE ainda não aprovada visualmente para produção. Comparação de 18 quadros sobre fundo #2a2621 em `cloudflare/reports/qwen-media-sheet.jpg`: no frame125 o pó sai do moinho antes do filtro chegar; durante extração o filtro quase encosta na caneca e esconde o café. Corrigir antes de publicar. Fonte identificada em `cloudflare/art/blender/coffee_journey.py`: moinho chega117, filtro somente136 (`arrive_leave` linha410), pó inicia antes; extração começa em z1.30 enquanto borda da caneca está aproximadamente1.27. Próximo passo: coordenar chegada do conjunto filtro/caneca antes dos grãos, manter pó no recipiente e criar distância de extração visível com suporte plausível, atualizando fluxo/partículas e provas locais. Rever trechos375–445 e475–490, sem alterar backend. Renderizar apenas provas relevantes antes de refazer300quadros.

✅ Qwen foi usado de verdade para utilitários de revisão; relatórios em `local-qwen-executor/tasks/blender-*-result.json`. Limitação real: tarefa maior e auditoria retornaram código truncado/BLOCKED. Utilitário de contato foi gerado localmente e precisou de correção de uma linha pelo coordenador na integração (Image.alpha_composite funcional, pois método retornaNone). Agora executado e imagem conferida. Os rascunhos `reports/qwen-review-media.py` e `reports/qwen-integrity.py` são INCOMPLETOS: não executar. `SUCCESS` com validação apenas sintática não comprova funcionamento; exigir oracle funcional nas próximas tarefas. Não acionar Sol/Luna automaticamente.

⏳ UI/scroll real ainda bloqueado pela recusa anterior da ferramenta de navegador; não contornar. Sem commit/PR/deploy nesta retomada. Prévia MP4 aberta no painel e disponível em `cloudflare/reports/blender-preview.mp4`. Limite consultado antes de nova etapa pesada:93% usado na janela curta; registrar e preservar margem antes de modelagem/render adicional. Automação de retomada segue ativa e lê este cache.

## Pré-requisito Qwen local — 09/10/2026

Preferência posterior à instalação: usuário pediu usar Qwen local "100% do tempo" para economizar. Aplicação: Qwen em toda execução delegável; coordenador mantém conversa, decisões, revisão e integração. Sem acionamento automático de Sol/Luna. Dividir escopos dentro dos limites reais; avisar quando um bloqueio exigir mudar de executor. Não prometer consumo remoto zero nem substituição automática do modelo principal.

✅ Ollama 0.40.2 instalado a partir do ZIP oficial, SHA256 verificado, em `C:\Users\marco\AppData\Local\Programs\Ollama`. Modelo `qwen2.5-coder:14b-instruct-q4_K_M` baixado e verificado pelo Ollama. Vulkan identificou Radeon RX 6700 XT com 12 GiB; inferência real confirmou **100% GPU**, **49/49 camadas**, contexto 4096 e `size_vram=9459613039` bytes (igual ao tamanho carregado).

✅ Executor delimitado em `C:\Users\marco\OneDrive\Desktop\NFC SENAC\local-qwen-executor\`, independente do site. `Invoke-Qwen.ps1` recebe o contrato criado pelo coordenador. Smoke real corrigiu uma função, executou oracle independente e devolveu diff/SUCCESS; revisão direta e repetição do oracle passaram. Outro teste real devolveu BLOCKED sem editar arquivos quando faltava decisão de negócio. Evidências: `evidence/installation-gpu.json`, `evidence/block-smoke.json`, `qwen-smoke-3uo55lhr/report.json` na pasta do executor. Consulte README/cache locais para limites e testes mecânicos.

✅ Executor validado pelo coordenador: 12 testes executados, 11 aprovados e 1 ignorado por privilégio Windows para symlink real. Modelo descarregado após teste; `ollama ps` vazio confirmou liberação da VRAM. A automação de retomada foi atualizada para Blender e Qwen, preservando estado e horário existentes.

⏳ Site/Blender: este pedido de instalação teve prioridade sobre a continuação visual; nenhuma publicação ou mudança no backend nesta etapa. Confirmados 300 arquivos `frame-*.webp`, manifest (42.945 bytes) e `reports/blender-preview.mp4` (1.415.314 bytes). O pipeline de exportação terminou; o texto abaixo de 08/10 sobre render em andamento é histórico. Retomar revisão temporal/visual da sequência e do player na branch `codex/blender-coffee-journey`; não repetir render sem necessidade comprovada. Liberar Qwen com `Release-Qwen.ps1` antes de trabalho GPU do Blender. Aprovação visual/UI, integração, PR e publicação da versão Blender continuam pendentes.

## Blender em implementação — retomada 08/10/2026

Atualização ao fim da sessão: player corrigido para liberar pin/restaurar seis fases quando o frame solicitado falha; todos os posters e textos agora usam o preparo direto na caneca. Executor confirmou42/42 testes antes dos assets. Arte foi corrigida pelo coordenador: NURBS elimina handles Bezier desatualizados; máscaras radiais dissipam vapor; água fina/transmissiva, materiais mais suaves. Provas Cycles HIP32 compostas sobre fundo aprovadas por revisão independente apenas para PRÉVIA (não produção): `reports/blender-proof-cycles/proof-composited.jpg`. PNGs alpha devem ser compostos antes da inspeção; visualizador isolado induziu falsa aparência de vapor opaco.

Cycles/HIP falhou no lote; repetição travou após11quadros e foi cancelada. Pipeline EEVEE48 em andamento (sessão99001, log `reports/blender-preview-render.log`), gera300PNGs em `reports/blender-sequence-eevee/`, mestre `reports/coffee-journey-preview.blend`, WebPs/posters/manifest em `public/assets/journey/blender/`, MP4 `reports/blender-preview.mp4`, testes em `reports/blender-tests.log`. Não duplicar render sem checar arquivos/logs. Confirmar conclusão na próxima atualização. CUA recusou `getTab` do endereço local por política de URL (apesar de http); não contornar por outrobrowser/CDP. UI real, scroll temporal e publicação continuam pendentes. Branch sem commit/PR/deploy desta alteração. Limite compartilhado chegou90% usado na última checagem; preservar margem5% antes de mais trabalho substancial.

Pedido ativo: reproduzir a experiência com autoria própria no Blender, explicitamente autorizado após a análise. Branch `codex/blender-coffee-journey`, mudanças ainda locais e não publicadas. Blender 4.5.9 LTS portátil oficial instalado em `cloudflare/reports/blender-tools/blender-4.5.9-windows-x64/blender.exe`, checksum SHA256 conferido contra download oficial. Hardware confirmado: Radeon RX 6700 XT, Ryzen 7 5800X (16 threads), 32 GB RAM.

Fonte determinística: `cloudflare/art/blender/coffee_journey.py` e README; seis processos em 300 frames, EEVEE RGBA 960×840. Mestre editável `cloudflare/reports/coffee-journey-master.blend`. Seis provas em `cloudflare/reports/blender-proof/` foram renderizadas sem erro, mas reprovadas visualmente: sulco do grão com rasgos triangulares, água desconectada do bico, pó oculto no filtro e cerâmica rugosa demais. Corrigir estas causas antes de renderizar sequência completa. Não confundir prova renderizada com aprovação da qualidade.

Player em `public/js/journey.js` + `journey-sequence.js`, CSS e HTML já alterados localmente: um canvas, pin GSAP, scrub .2, cache36/fetch4, sem autoplay, mobile/reduced estáticos. Bug de janela41/cache36 causando downloads infinitos foi corrigido para janela36 e coberto por teste de quiescência. Executor relatou `npm test` 37/37 na primeira versão; `npm run check` falha por poster ainda ausente. Retomada revisa fallback de mídia e posters/copy antes de QA real. Exportador `cloudflare/scripts/export-blender-frames.py` converte PNGs aprovados para300WebPs e6posters; ainda não executado. Contrato/evidências: `cloudflare/docs/BLENDER_JOURNEY.md`.

Próximos passos: corrigir/renderizar provasv2, revisão visual independente, render300/exportação, validar scroll avanço/pausa/reversão/saltos, acessibilidade/mobile/tema, checks, PR e publicação só Worker/assets. Backend e dados preservados. Turno anterior interrompido ao detectar98% de uso; retomada começou com5% usado, sem comprar créditos ou resgatar resets.

## Retorno visual do usuário — 07/10/2026

Após a publicação da jornada de seis fases, o usuário considerou os vídeos rígidos e distantes do Reels e perguntou sobre IA gratuita ou animação própria com rolagem natural. A validação funcional anterior continua válida, mas não representa aprovação da fidelidade visual: a direção artística precisa ser revista. A montagem Mixkit muda câmera, ambiente e equipamento entre fases, interrompendo a continuidade desejada.

Recomendação da análise, conferida por Sol em revisão independente: uma cena 3D coerente pré-renderizada, exportada como sequência de imagens e controlada pela rolagem, com avanço, pausa e reversão. Primeiro validar uma prévia isolada de 3–5 segundos (grão → partículas → equipamento) antes de produzir todos os processos. Preservar a identidade do café, iluminação, escala e trajetória de câmera; não prometer reprodução idêntica do Reels. Blender é uma opção gratuita para autoria por scripts. Sua instalação não foi localizada no PATH nem em Program Files/Blender Foundation; capacidade de GPU ainda não verificada (consulta CIM indisponível no sandbox).

Consulta oficial nesta data: Runway oferece 125 créditos iniciais e vídeos gratuitos com marca d'água; Pika apresenta plano Free sem créditos mensais e sem licença comercial. Não há ferramenta de geração de vídeo por IA disponível nesta sessão. É possível criar a cena por código e integrar sua sequência, mas a renderização requer preparar e validar o ambiente. Nenhuma nova animação foi implementada ou publicada nesta análise; próximo passo proposto é a prévia visual contínua, sem alterações no backend, D1 ou checkout.

## Estado atual — 07/10/2026

A jornada desktop de seis fases está publicada na Cloudflare na versão `eceb1047-a978-4f47-93cd-5c7370b22161`, com frontend no commit `f6a4ccf`. O PR #9 foi integrado à main pelo merge `ff431d1560b6085dc685c23f6b6400a0945815ea`: https://github.com/marcoszhp/camillo-colombi-/pull/9. Origem → torra → moagem → água no filtro → extração → servir. Os quatro vídeos Mixkit e posters estão integrados. A timeline usa uma fixação e dura 4,5 alturas da janela; a mídia fica pausada e seu `currentTime` acompanha a rolagem. Desktop a partir de 1024 px de largura, sem altura mínima. Celular usa fluxo estático e poster sem baixar vídeo; movimento reduzido inicia estático sem baixar mídia, com ativação explícita disponível no desktop.

Validação final: `npm test` 43/43 e `npm run check` aprovado. Em 1366×600, os quatro vídeos avançaram e retrocederam, ficaram pausados (`paused=true`), com uma fixação e console sem erros. Tempos observados: moagem 3.903→2.397 s, água 6.375→3.958 s, extração 1.542→0.959 s e servir 6.917→4.250 s. `readyState=4`; `seekable` e `buffered` cobriram o fim dos clips. Em 390×844 mobile online, os seis blocos estão visíveis, sem overflow, fixação, `src` de vídeo ou vendors. Evidências em `cloudflare/reports/preparation-online-temporal.json`, `preparation-online-{grinding,water,extraction,serving}.jpg` e `preparation-online-mobile.jpg`.

A correção de produção evita seeks antes da mídia estar pronta: fonte inicia com `preload="none"`; perto da fase, o vídeo ativo e o próximo podem carregar. `loadeddata`, `canplay` e `progress` retomam o alvo mais recente. O seek só ocorre quando `readyState >= 2` e um intervalo `seekable` contém o tempo alvo. A falha original vinha de seek prematuro com resposta HTTP 200 ao pedido de Range; o guard resolveu. Backend, D1 e configuração não mudaram.

Revisão visual independente: PASS nas seis fases, incluindo torra (`cloudflare/reports/preparation-roast.jpg`), com texto e botões legíveis, imagens arredondadas e narrativa adaptada ao preparo coado até a xícara. Em mobile local, o DOM confirmou seis blocos sem ocultação, overflow, `src` de vídeo ou vendors e sem fixação; a captura `cloudflare/reports/preparation-mobile.jpg` mostra somente a primeira vista. A validação mobile online em 390×844 confirmou os seis blocos visíveis, sem overflow, fixação, `src` ou vendors; captura em `cloudflare/reports/preparation-online-mobile.jpg`.

PR #9 integrado à main; checks do head `f6a4ccf` aprovados (2/2). A entrega não tem pendências técnicas conhecidas. Nenhuma migration foi aplicada nem houve acesso ao D1 nesta publicação. Backend, dados e banco permanecem fora do escopo.

PR #8 corrigiu altura útil e já está publicado na Cloudflare, versão `e492e33c-40a4-4e05-9835-bf3259615303`, merge `572fc05`; a elegibilidade não impõe altura mínima. A primeira jornada de três fases, publicada no PR #7 (versão `6f0aa440-045f-4955-a8c8-7e57628c2ef2`), é histórico. Sua antiga pendência de mídia de serviço foi substituída pela integração Mixkit publicada nas seis fases. Backend, dados e banco permanecem fora do escopo.

Detalhes atuais em `cloudflare/docs/ANIMACOES_DESKTOP.md`, procedência/licença em `cloudflare/docs/MIDIAS_PREPARO.md` e resumo em `docs/PROGRESSO_SITE.md`.

## Referência de animações desktop — 06/10/2026

Usuário pediu análise de viabilidade do Reels https://www.instagram.com/reel/DeDRa1-srk2/ e adaptação das animações para desktop. Vídeo público reproduzido no navegador, 9,59 s; análise visual por amostras em aproximadamente 0,17–9,30 s, intervalo de 1 s, sem análise de áudio. Evidências e timestamps em `cloudflare/reports/reel-analysis/evidence.json` e `observed-*.jpg` (ignorados pelo Git).

Observado: grão grande no início; mudança de fundo claro para marrom, grãos separados/partículas e aparência de fumaça; preparo com porta-filtro e café caindo na xícara; catálogo ao final. Instagram mostra o rótulo “Conteúdo de IA”; o vídeo não comprova um site funcional nem qual tecnologia o produziu. A referência orientou a narrativa por rolagem; a versão atual interpreta o preparo como café filtrado, sem replicar literalmente o equipamento 3D do Reels.

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
