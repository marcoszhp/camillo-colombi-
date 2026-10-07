# Progresso do site

Atualização: 06/10/2026

## Rodada atual

- ✅ Pop-up de confirmação ao adicionar produto ao carrinho — publicado.
- ✅ Cabeçalho reaparece ao rolar para cima — publicado com estado `scrolling-up`/`scrolling-down`.
- ✅ Textos numerados como “01 / O ritual” e “03 / A origem” — removidos da apresentação visual.
- ✅ Bordas e imagens — cartões, hero, detalhes e blocos principais receberam arredondamento consistente.
- ✅ Textos de demonstração — removidos do rodapé, faixa inicial, catálogo e detalhe do produto.
- ✅ Moagem e filtros — filtros reduzidos a Categoria, Tipo, Moagem, Nota sensorial, Peso e Ordenar; painel lateral preparado para desktop.
- ✅ Estoque — quantidade disponível agora aparece no cartão e na página do produto; o limite de compra continua validado pelo estoque real.
- ✅ Animações futuras — classes de movimento, `prefers-reduced-motion` e estrutura de cabeçalho já estão preservadas para receber novas transições com segurança.

## Validação

- ✅ `npm run check` após esta rodada.
- ✅ `npm test` após esta rodada: 28/28.
- ✅ Inspeção pública do catálogo e dos filtros concluída.
- ✅ Publicação no GitHub/Cloudflare concluída na versão `6b8db45b-9bcd-4104-abde-39ea6417e77a`.

## Próximo passo

A próxima rodada de animações deve usar os ganchos de movimento existentes e manter a redução de movimento do sistema.
