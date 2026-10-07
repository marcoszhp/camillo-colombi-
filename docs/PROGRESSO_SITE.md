# Progresso do site

Atualizado em 07/10/2026. As seis fases estão publicadas na Cloudflare (versão `eceb1047-a978-4f47-93cd-5c7370b22161`, frontend `f6a4ccf`). O [PR #9](https://github.com/marcoszhp/camillo-colombi-/pull/9) foi integrado à main pelo merge `ff431d1560b6085dc685c23f6b6400a0945815ea`.

## Jornada de preparo — publicada

- ✅ A jornada publicada tem seis fases: origem, torra, moagem, água no filtro, extração e servir na xícara.
- ✅ Os quatro vídeos Mixkit e posters estão integrados à versão publicada; o PR #9 contém a correção de seek da mídia.
- ✅ Desktop: uma cena fixada, timeline ligada à rolagem com duração de 4,5 alturas da janela; elegibilidade a partir de 1024 px de largura, sem limite mínimo de altura.
- ✅ Mídia pausada e posicionada com `currentTime` conforme o progresso da cena. O carregamento ocorre sob demanda para o vídeo ativo e o seguinte próximo da troca.
- ✅ Celular: blocos estáticos e posters, sem download dos vídeos. Movimento reduzido inicia estático e sem download; no desktop, ativar explicitamente o controle de animação substitui a preferência para esta página.
- ✅ `npm test`: 43/43; `npm run check`: aprovado.
- ✅ Produção em 1366×600: avanço e reversão nas quatro mídias, vídeos pausados (`paused=true`), uma fixação e console sem erros. Tempos observados: moagem 3.903→2.397 s; água 6.375→3.958 s; extração 1.542→0.959 s; servir 6.917→4.250 s. `readyState=4`; `seekable` e `buffered` cobriram o fim dos clips. Evidências em `cloudflare/reports/preparation-online-temporal.json` e `preparation-online-{grinding,water,extraction,serving}.jpg`.
- ✅ Produção: fonte inicia em `preload="none"`; perto da fase, carregam apenas o vídeo ativo e o próximo. `loadeddata`, `canplay` e `progress` retomam o alvo mais recente. O seek aguarda `readyState >= 2` e cobertura do tempo alvo por `seekable`. Isso corrige o seek prematuro observado quando a resposta ao pedido HTTP Range era 200.
- ✅ Layout: modo normal com uma fixação e cabeçalho no topo; compacto em 1280×480 com uma fixação e ações no limite inferior; movimento reduzido sem fixações, mídia oculta e sem endereço carregado. Em 390 px, sem overflow horizontal, fixação, `src` de vídeo ou vendors. BFCache corrigido e conferido.
- ✅ Revisão visual independente: PASS nas seis fases, com captura de torra em `cloudflare/reports/preparation-roast.jpg`; texto e botões legíveis, imagens arredondadas e composição coerente até a xícara. Em mobile, DOM confirmou os seis blocos sem ocultação, overflow, `src` de vídeo ou vendors, e sem fixação. A captura disponível (`cloudflare/reports/preparation-mobile.jpg`) mostra somente a primeira vista, não todas as fases mobile.
- ✅ Mobile online em 390×844: seis blocos visíveis, sem overflow, fixação, `src` de vídeo ou vendors. Captura em `cloudflare/reports/preparation-online-mobile.jpg`.
- ✅ PR #9 integrado à main; os dois checks do head `f6a4ccf` passaram (2/2). A entrega está concluída, sem migrations ou alterações no D1.

A arquitetura, evidência e limites de representação estão em [Animações desktop](../cloudflare/docs/ANIMACOES_DESKTOP.md); origens, licença e dados dos exports estão em [Mídias de preparo](../cloudflare/docs/MIDIAS_PREPARO.md).

## Marcos recentes

- ✅ PR #8: correção de altura útil publicada na Cloudflare, versão `e492e33c-40a4-4e05-9835-bf3259615303`, merge `572fc05`. Desktop depende de largura ≥1024 px e não tem altura mínima.
- ✅ PR #7: a primeira versão de três cenas foi publicada na versão `6f0aa440-045f-4955-a8c8-7e57628c2ef2`. A pendência de vídeo dessa rodada foi substituída pela integração Mixkit local descrita acima.
- ✅ Cabeçalho corrigido e publicado no PR #6; histórico e validação em 1280×720 e 390×844 permanecem registrados abaixo.
- ✅ Rodada anterior de interface: confirmação de carrinho, filtros concisos, estoque nos cartões/detalhes e conteúdo editorial revisado.

## Correção do cabeçalho

- ✅ O wrapper externo mantém a posição sticky; o cabeçalho interno controla a transição.
- ✅ Online em desktop e celular: reaparece ao subir, incluindo quando a página ainda está bem abaixo do topo.
- ✅ Local: home, catálogo e navegação móvel conferidos, sem overflow horizontal a 390 px.
- ✅ Publicação Cloudflare: versão `1d006708-366f-4a81-9819-2c25ef7c0570`, PR #6. Essa evidência é do cabeçalho e não da nova revisão temporal da jornada.

## Referência criativa

A análise do Reels observou grão, mudança de cor, torra, partículas/fumaça e preparo, mas não prova uma implementação técnica específica. A jornada adota os processos do café filtrado com vídeo real licenciado para moagem, água, extração e serviço. A origem e a torra usam imagens e movimento 2D. A experiência não copia literalmente o Reels nem mostra o uso de uma Moka.
