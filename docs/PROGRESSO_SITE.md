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

## Animações desktop — rodada atual

- ✅ Home com três cenas: origem, torra e preparo, seguida do catálogo real.
- ✅ Grão realista com transparência; cor, texto, grãos menores e fumaça discreta acompanham a rolagem.
- ✅ Celular e movimento reduzido preservam todos os blocos em fluxo normal.
- ✅ Controle de movimento acessível pelo teclado e tema escuro com fundo `#2a2621`.
- ✅ Cabeçalho reaparece durante a narrativa; acesso ao produto e confirmação do carrinho conferidos.
- ✅ Três fotos da experiência otimizadas: aproximadamente 7,1 MB → 387 KB.
- ✅ Validação local: 33/33 testes, check aprovado e revisão visual independente sem impedimentos.
- ⏳ Vídeo real de café sendo servido: download não concluído; preparo usa a foto realista de Moka. Não é a versão final da animação de líquido.
- ✅ Publicação desta rodada: Cloudflare versão `6f0aa440-045f-4955-a8c8-7e57628c2ef2`, revisão [PR #7](https://github.com/marcoszhp/camillo-colombi-/pull/7); desktop e celular conferidos online, sem erros de console na inspeção.

Arquitetura, procedência das mídias, licenças e evidências em [Animações desktop](../cloudflare/docs/ANIMACOES_DESKTOP.md).

## Próximo passo

- ✅ Corrigida restrição que desativava também o botão em desktop com menos de 640 px de altura; versão compacta conferida em 1366×600 e 1280×480. Testes atuais: 34/34 e check aprovado.
- ⏳ Publicar a correção de altura útil.
- ⏳ Completar todos os processos de preparo solicitados: café moído/filtro, água, filtragem/extração e servir na xícara, com mídia realista. Usuário confirmou que a estrutura funciona e pediu ampliar as animações.
