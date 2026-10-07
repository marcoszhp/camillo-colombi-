# Progresso do site

Atualizado em 07/10/2026. Trabalho retomado; a jornada de seis fases segue em validação local e ainda não foi publicada.

## Jornada de preparo — validação local

- ✅ A jornada local tem seis fases: origem, torra, moagem, água no filtro, extração e servir na xícara.
- ✅ Os quatro vídeos Mixkit e posters estão integrados à branch `codex/coffee-preparation-processes`.
- ✅ Desktop: uma cena fixada, timeline ligada à rolagem com duração de 4,5 alturas da janela; elegibilidade a partir de 1024 px de largura, sem limite mínimo de altura.
- ✅ Mídia pausada e posicionada com `currentTime` conforme o progresso da cena. O carregamento ocorre sob demanda para o vídeo ativo e o seguinte próximo da troca.
- ✅ Celular: blocos estáticos e posters, sem download dos vídeos. Movimento reduzido inicia estático e sem download; no desktop, ativar explicitamente o controle de animação substitui a preferência para esta página.
- ✅ `npm test`: 42/42; `npm run check`: aprovado.
- ✅ Navegador real: avanço e reversão nas quatro mídias, com vídeos pausados. Tempos observados: moagem 4.087→2.628 s; água 6.387→3.959 s; extração 1.542→0.959 s; servir 6.866→4.292 s. Evidências em `cloudflare/reports/preparation-temporal.json` e `preparation-*.jpg`.
- ✅ Layout: modo normal com uma fixação e cabeçalho no topo; compacto em 1280×480 com uma fixação e ações no limite inferior; movimento reduzido sem fixações, mídia oculta e sem endereço carregado. Em 390 px, sem overflow horizontal, fixação, `src` de vídeo ou vendors. BFCache corrigido e conferido.
- ✅ Revisão visual independente: PASS nas seis fases, com captura de torra em `cloudflare/reports/preparation-roast.jpg`; texto e botões legíveis, imagens arredondadas e composição coerente até a xícara. Em mobile, DOM confirmou os seis blocos sem ocultação, overflow, `src` de vídeo ou vendors, e sem fixação. A captura disponível (`cloudflare/reports/preparation-mobile.jpg`) mostra somente a primeira vista, não todas as fases mobile.
- ⏳ Preparar PR e publicar as seis fases, depois conferir a versão online. Nenhuma das seis fases foi publicada; deploy Worker/assets sem migrations e sem D1.

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
