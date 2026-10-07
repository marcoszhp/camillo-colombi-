# Animações desktop — jornada do grão à xícara

Atualizado em 07/10/2026. A jornada desktop de seis fases está publicada na Cloudflare, versão `eceb1047-a978-4f47-93cd-5c7370b22161`, com frontend no commit `f6a4ccf`. O [PR #9](https://github.com/marcoszhp/camillo-colombi-/pull/9) foi integrado à main pelo merge `ff431d1560b6085dc685c23f6b6400a0945815ea`.

## Estado e escopo

- ✅ A correção de altura útil da experiência desktop foi publicada na Cloudflare, versão `e492e33c-40a4-4e05-9835-bf3259615303`, após merge `572fc05` (PR #8). A animação depende de largura mínima de 1024 px e não exige altura mínima.
- ✅ A narrativa publicada tem seis fases: origem → torra → moagem → água no filtro → extração → servir na xícara.
- ✅ Os quatro vídeos e seus posters estão integrados à publicação. Preparação representa café filtrado; não é uma reprodução literal do modelo 3D do Reels nem uma demonstração de preparo em Moka.
- ✅ `npm test`: 43/43; `npm run check`: aprovado.
- ✅ Produção em 1366×600: avanço e reversão nas quatro mídias; vídeos pausados (`paused=true`), uma fixação e console sem erros. Tempos observados: moagem 3.903→2.397 s, água 6.375→3.958 s, extração 1.542→0.959 s e servir 6.917→4.250 s. `readyState=4`; `seekable` e `buffered` cobriram o fim dos clips. Em mobile online 390×844, seis blocos visíveis, sem overflow, fixação, `src` de vídeo ou vendors. Evidências em `reports/preparation-online-temporal.json`, `reports/preparation-online-{grinding,water,extraction,serving}.jpg` e `reports/preparation-online-mobile.jpg`.
- ✅ Correção de carregamento/seek em produção: o vídeo inicia com `preload="none"`; perto da fase, podem carregar o ativo e o próximo. `loadeddata`, `canplay` e `progress` retomam o alvo mais recente. O seek só é aplicado quando `readyState >= 2` e `seekable` cobre o tempo alvo. Isso evita seek prematuro quando o pedido HTTP Range recebe resposta 200.
- ✅ Layout normal: uma fixação e cabeçalho no topo. Compacto em 1280×480: uma fixação e ações no limite inferior. Movimento reduzido: sem fixações, vídeo oculto e sem endereço de mídia carregado. Em 390 px: sem overflow, fixação, `src` de vídeo ou vendors. BFCache corrigido e testado.
- ✅ Revisão visual independente: PASS nas seis fases; a captura de torra está em `reports/preparation-roast.jpg`. Texto e botões legíveis, imagens arredondadas e narrativa coerente até a xícara, adaptada ao preparo coado. Em mobile, o DOM confirmou seis blocos sem ocultação, overflow, endereço de vídeo ou vendors e sem fixação. A captura `reports/preparation-mobile.jpg` cobre apenas a primeira vista, não todas as fases mobile.
- ✅ Seis fases publicadas na Cloudflare; nenhuma migration foi aplicada e o D1 não foi acessado.
- ✅ PR #9 integrado à main; os dois checks do head `f6a4ccf` passaram (2/2). Não há pendências técnicas conhecidas para esta entrega.

## Arquitetura

Conteúdo e ações permanecem no HTML. O desktop usa uma única timeline GSAP/ScrollTrigger com uma cena fixada; o percurso tem 4,5 alturas da janela e um `scrub` acompanha a rolagem. O limite é somente largura ≥1024 px, sem corte por altura. A composição se ajusta a janelas baixas.

As seis cenas distribuem o progresso da timeline. Os quatro vídeos de moagem, água, extração e servir permanecem pausados. A posição de cada vídeo acompanha o progresso de sua própria cena por `currentTime`; não é reprodução contínua disparada ao entrar na tela. O vídeo ativo, ou o próximo quando a rolagem se aproxima da troca, pode carregar sob demanda. Ao sair da jornada, ocultar a aba ou desmontar o componente, os vídeos pausam; ao desmontar, o endereço de mídia é removido.

Em telas menores que 1024 px, a página mantém os seis blocos em fluxo normal, exibe imagens poster e não carrega os vídeos. Com `prefers-reduced-motion`, o estado inicial também é estático e não baixa vídeo. No desktop, a pessoa pode ativar explicitamente a animação pelo controle, o que substitui a preferência do sistema nesta página e passa a carregar mídia conforme a rolagem. Erros preservam o poster. O cabeçalho fica fora do palco fixado.

Origem e torra continuam com imagem e transformações 2D. A fumaça e as partículas da torra são discretas; o líquido e o café moído usam gravações reais. Não são usados WebGL nem modelos 3D na experiência.

## Mídias

Os arquivos finais e as licenças estão documentados em [Mídias de preparo](MIDIAS_PREPARO.md). Os vídeos e posters juntos ocupam 4.525.501 bytes. Os quatro processos têm posters para a versão estática. As fontes são Mixkit e indicam a Mixkit Stock Video Free License, com uso comercial e pessoal; atribuição não é obrigatória. Os clips são ilustrativos e não representam uma filmagem da operação da marca.

- Moagem: Mixkit 4989, grãos caindo no mecanismo e pó entrando no filtro.
- Água: Mixkit 100258, chaleira despejando água no coador de madeira.
- Extração: trecho de Mixkit 4989, café atravessando o filtro e sendo coletado.
- Servir: Mixkit 100253, café sendo vertido na xícara.

O Reels analisado em `reports/reel-analysis/` serviu como referência de narrativa e ritmo, não como especificação literal de equipamento ou técnica. A leitura visual não incluiu áudio; o rótulo do Instagram identifica o vídeo como “Conteúdo de IA”.

## Histórico da publicação anterior

A primeira versão desktop, de três cenas (origem, torra e foto de Moka), foi publicada na Cloudflare na versão `6f0aa440-045f-4955-a8c8-7e57628c2ef2`, PR #7. A mídia de café sendo servida que constava como pendência naquela etapa foi substituída pelos quatro clipes licenciados nesta branch. PR #7 e seu estado publicado são históricos, não o código de seis fases aqui documentado.

A correção de altura foi desenvolvida após a animação sumir em janelas baixas. O PR #8 já está publicado e limita a elegibilidade à largura, sem altura mínima. A branch de seis fases herda essa correção.

## Estado final

As seis fases foram publicadas e conferidas em desktop e mobile. A entrega não tem pendências técnicas conhecidas.
