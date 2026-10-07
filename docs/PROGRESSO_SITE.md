# Progresso do site

Atualização: 06/10/2026

## Rodada atual

- ✅ Pop-up de confirmação ao adicionar produto ao carrinho — publicado.
- ✅ Cabeçalho reaparece ao rolar para cima — posicionamento corrigido e conferido no navegador online em computador e celular.
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
- ✅ Correção do cabeçalho publicada na Cloudflare: versão `1d006708-366f-4a81-9819-2c25ef7c0570`, revisão [PR #6](https://github.com/marcoszhp/camillo-colombi-/pull/6).

## Correção do cabeçalho

- ❌ A implementação anterior alterava corretamente a direção da rolagem, mas o cabeçalho sticky ficava limitado ao contêiner da própria altura. Ao subir com a página em 720 px, o cabeçalho ainda estava em `top=-720`.
- ✅ O contêiner externo agora mantém a posição sticky; o cabeçalho interno continua responsável pela transição. Movimento reduzido desativa a transição.
- ✅ Online em 1280×720, home: cabeçalho escondido ao descer e visível em `top=0` ao subir, com a página ainda em 1873 px.
- ✅ Online em 390×844, Nossa história: cabeçalho escondido ao descer e visível em `top=0` ao subir, com a página ainda em 356 px; menu móvel abriu corretamente.
- ✅ Local: home e catálogo conferidos, navegação pelo menu móvel funcionando e sem overflow horizontal em 390 px.
- ✅ Evidências locais: `cloudflare/reports/header-online-desktop.jpg` e `header-online-mobile.jpg` (arquivos ignorados pelo Git).

## Próximo passo

A próxima rodada de animações deve usar os ganchos de movimento existentes e manter a redução de movimento do sistema.
