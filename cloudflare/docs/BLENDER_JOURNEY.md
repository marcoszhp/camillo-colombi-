# Jornada contínua criada no Blender

## Correções da preparação — 09/10/2026, versão5

✅ Filtro e caneca posicionados antes da primeira partícula. Moinho elevado, partículas direcionadas ao leito de café, suporte de cobre e espaço de0,58unidade para leitura da extração. Fluxo de café não entra mais por deslocamento lateral: a origem permanece conectada à saída. Enquadramento corrigido.

✅ Provas reais em `reports/blender-proof-v5/proof-sheet.jpg` revisadas pelo coordenador. Verificação geométrica independente da lógica de autoria aprovada:150frames em avanço e reversão,170partículas, saída do café conectada e limites de enquadramento. Relatório `reports/blender-preparation-check.json`. Fonte editável: `art/blender/coffee_journey.py`, helper `preparation_layout.py` e verificação `verify_preparation.py`.

✅ Render completo dos300quadros corrigidos em `reports/blender-sequence-v5/`; mestre `reports/coffee-journey-final-v5.blend`. A versão anterior abaixo é histórico e não descreve os problemas atuais.

✅ Assets locais atualizados após staging:300WebPs,9.038.448bytes, hashes e tamanhos conferidos. WebP quality82/method3; prévia atual em `reports/blender-preview-v5.mp4`. Checks e42/42testes passaram.

⏳ Revisão independente no navegador, rolagem real e publicação ainda pendentes; conferência solicitada ao usuário porque a ferramenta recusou acesso. Qwen local implementou o helper pequeno; coordenador integrou a fonte maior, revisou e operou o Blender. Nenhum subagente remoto foi acionado nesta etapa. Backend/D1 preservados.

## Revisão mais recente — 09/10/2026

✅ Sequência exportada:300WebPs,7.811.482bytes, hashes/tamanhos conferidos contra manifest. Checks e42/42testes passaram; evidência `reports/blender-final-audit.json`.

❌ Revisão visual de18quadros em `reports/qwen-media-sheet.jpg`: moagem libera pó antes da chegada do filtro (frame125); filtro muito próximo da caneca oculta a passagem do café na extração. Reprovação para produção até corrigir cronologia e espaço entre recipientes, renderizar provas e revisar novamente. Não repetir lote completo antes das provas.

⏳ Navegador/scroll real continuam sem validação por bloqueio de acesso da ferramenta. Não houve publicação. Qwen local foi usado na preparação; coordenador revisou e corrigiu uma chamada PIL antes de executar. Tarefas locais maiores retornaram incompletas: dividir e validar funcionamento, não apenas sintaxe.

## Direção e escopo — 07/10/2026

✅ O usuário escolheu explicitamente criar a animação no Blender após rejeitar a rigidez e a descontinuidade dos clipes Mixkit.

Método escolhido: fonte 3D editável e determinística no Blender → quadros WebP transparentes → canvas cuja posição acompanha a rolagem. A cena deve mostrar grão, torra, moagem, água, filtragem e xícara, preservando composição, luz e continuidade. A referência é inspiração visual; não comprova uma interface funcional, nem define reprodução idêntica.

Textos, navegação, botões e acessibilidade continuam no HTML. Backend, autenticação, carrinho, frete, estoque, D1 e configurações ficam fora da alteração.

## Prova antes da produção

- ⏳ Composição, grão com sulco e superfície orgânica, materiais e enquadramentos próximos.
- ⏳ Trecho contínuo inicial e transições sem mudanças de cenário ou saltos.
- ⏳ Seis processos legíveis e física visual plausível (pó dentro do filtro, água e café conectados ao recipiente).
- ⏳ Avanço, pausa e reversão por scroll nativo, inclusive saltos e mudança de direção.
- ⏳ Cache limitado, carregamento por prioridade e descarte de quadros; mobile/movimento reduzido estáticos.
- ⏳ Revisão independente de imagens reais e comportamento, testes e publicação.

Parâmetros iniciais de calibração: 300 quadros a 960×840, 30 fps na fonte; seis trechos de aproximadamente 50 quadros. Transparência permite integração ao fundo da página. Essas medidas são alvo de produção, não evidência de desempenho. O navegador não executa o Blender nem precisa de 3D em tempo real.

Autorias independentes: Sol/high cria a fonte Blender; Sol/medium implementa o player; coordenador prepara ferramenta oficial, renderiza, revisa e integra. Uma falha perceptual impede publicar, mesmo com testes aprovados.

## Reprodução e evidências

### Provas e diagnóstico — 08/10/2026

✅ Blender 4.5.9 portátil oficial instalado e checksum verificado. Fonte editável e seis fases construídas. As provas iniciais foram reprovadas: sulco irregular, água desconectada e materiais excessivamente rugosos. Correção de geometria/normais, NURBS com coordenadas animadas, pó visível e cerâmica esmaltada implementada.

✅ Provas Cycles HIP32 em `reports/blender-proof-cycles/` aprovadas por revisão independente **para render completo da prévia**, com ressalvas: grão regular/liso, partículas grossas, estilo próprio mais ilustrativo que o Reels. A avaliação deve compor PNG RGBA sobre o fundo: o visualizador isolado expôs RGB de pixels quase transparentes, levando à conclusão incorreta de vapor opaco. Provas JPG compostas corrigem essa medição.

❌ Cycles HIP apresentou erro de driver AMD no lote e travamento na repetição; a repetição foi cancelada pelo coordenador. Não instalar/alterar drivers automaticamente. Foi escolhida uma prévia EEVEE48 da mesma cena, em `reports/blender-sequence-eevee/`, com mestre `reports/coffee-journey-preview.blend`. Exportação planejada para `public/assets/journey/blender/` e vídeo `reports/blender-preview.mp4`. Confirmar logs/manifest antes de afirmar conclusão.

⏳ A ferramenta CUA bloqueou o acesso ao endereço local com erro de política de URL; não tentar contornar com outro navegador/superfície. UI real, scroll temporal e revisão de produção permanecem pendentes. Não publicar nem integrar à main até validar. Player teve42/42 testes aprovados antes dos assets; a verificação final será registrada no cache após o pipeline.

⏳ Em construção. Os scripts de autoria serão mantidos em `art/blender/`. Ferramenta portátil, `.blend` mestre, PNGs e provas ficam em `reports/` (fora do Git). WebPs aprovados serão publicados em `public/assets/journey/blender/`.
