# Progresso do site

Atualização: 06/10/2026

## Rodada atual

- ⏳ Pop-up de confirmação ao adicionar produto ao carrinho — implementado no frontend; falta publicar.
- ⏳ Cabeçalho reaparece ao rolar para cima — comportamento implementado com estado `scrolling-up`/`scrolling-down`; falta publicar.
- ✅ Textos numerados como “01 / O ritual” e “03 / A origem” — removidos da apresentação visual.
- ✅ Bordas e imagens — cartões, hero, detalhes e blocos principais receberam arredondamento consistente.
- ✅ Textos de demonstração — removidos do rodapé, faixa inicial, catálogo e detalhe do produto.
- ✅ Moagem e filtros — filtros reduzidos a Categoria, Tipo, Moagem, Nota sensorial, Peso e Ordenar; painel lateral preparado para desktop.
- ✅ Estoque — quantidade disponível agora aparece no cartão e na página do produto; o limite de compra continua validado pelo estoque real.
- ✅ Animações futuras — classes de movimento, `prefers-reduced-motion` e estrutura de cabeçalho já estão preservadas para receber novas transições com segurança.

## Validação

- ⏳ `npm run check` após esta rodada.
- ⏳ `npm test` após esta rodada.
- ⏳ Inspeção visual em desktop e celular após publicação.
- ⏳ Publicação no GitHub/Cloudflare.

## Próximo passo

Executar a validação completa, revisar o diff, abrir uma branch `codex/`, publicar e conferir o endereço online. A próxima rodada de animações deve usar os ganchos de movimento existentes e manter a redução de movimento do sistema.
