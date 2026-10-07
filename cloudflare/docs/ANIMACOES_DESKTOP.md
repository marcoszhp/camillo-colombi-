# Animações da home — 06/10/2026

## Entrega e limite conhecido

- ✅ Origem: grão macro realista, recortado com transparência, movimento ligado à rolagem e texto curto.
- ✅ Torra: fundo marrom, grãos menores e atmosfera de fumaça discreta. Nenhum líquido foi desenhado com CSS.
- ✅ Preparo: transição para uma foto realista de Moka; catálogo real aparece ao terminar a narrativa.
- ⏳ Vídeo real de café sendo servido: não incluído. Esta cena ainda não é a animação final de líquido pedida na referência.
- ✅ Cabeçalho preservado fora da cena fixada e visível ao rolar para cima.
- ✅ Celular e movimento reduzido recebem três blocos legíveis em fluxo normal, sem fixação ou bibliotecas de animação. Desktop com janela baixa recebe composição compacta animada.
- ✅ Controle “Ativar animação” / “Reduzir animação” no desktop. A configuração inicial respeita o sistema; a escolha explícita vale somente para esta página. Mudanças posteriores no sistema restauram a preferência do sistema.
- ✅ Modo escuro mantém o fundo `#2a2621`, contraste do texto e tom quente de destaque.
- ✅ Backend, autenticação, catálogo, pedidos, estoque, frete e banco não foram alterados.
- ✅ Publicação Cloudflare: versão `6f0aa440-045f-4955-a8c8-7e57628c2ef2`, sem migrations, com implementação `d040097` e revisão [PR #7](https://github.com/marcoszhp/camillo-colombi-/pull/7).

## Representação e arquitetura

Conteúdo e ações permanecem no HTML. Fotografias e um recorte do grão recebem transformações 2D com GSAP/ScrollTrigger 3.15.0, servido localmente. Essa representação atende à composição aprovada sem acrescentar WebGL, modelos 3D, React ou uma nova cadeia de build.

Há uma única timeline, com `scrub` e uma única cena fixada. A rolagem nativa continua livre para avançar, voltar ou saltar. A duração é de 2,25 alturas da janela. O botão “Ver cafés” alcança o catálogo sem exigir percorrer a animação inteira. Cenas inativas ficam fora da navegação assistiva; ao desligar o movimento, todos os estados e a fixação são removidos.

O movimento é elegível a partir de 1024 px de largura, sem altura mínima. Abaixo de 640 px de altura, texto, arte e espaçamento se adaptam. Os vendors carregam sob demanda e falhas de carregamento deixam o conteúdo estático. O cabeçalho mantém seu wrapper sticky anterior, sem entrar em um ancestral transformado pela animação.

O elemento de vídeo é opcional e não possui URL nesta entrega. Para a futura mídia local aprovada, adicionar `data-video-src` ao vídeo. O código usa `preload="none"`, só atribui a URL perto da fase de preparo, tenta reprodução silenciosa, pausa fora da cena/aba e remove o recurso ao desmontar. Falha de reprodução conserva a fotografia. É necessário validar o arquivo real antes de declarar essa etapa concluída.

## Mídias e licenças

| Arquivo de entrega | Origem | Exportação | Tamanho |
| --- | --- | --- | --- |
| `public/assets/journey/bean-roasted.webp` | Gerado com a ferramenta integrada `image_gen`, em 06/10/2026 | 840×840, RGBA, WebP qualidade 88 | 209.402 bytes |
| `public/assets/journey/origem.webp` | Foto gerada anteriormente, `public/assets/photos/origem-cafe-realista.png` | 1100×619, WebP qualidade 84 | 155.756 bytes |
| `public/assets/journey/torra.webp` | Foto gerada anteriormente, `public/assets/photos/cafe-embalado-realista.png` | 1100×1100, WebP qualidade 84 | 137.738 bytes |
| `public/assets/journey/moka-still.webp` | Foto gerada anteriormente, `public/assets/photos/ritual-moka-realista.png` | 1100×733, WebP qualidade 84 | 93.584 bytes |

O PNG original do novo grão, 1254×1254 com transparência, foi preservado em `C:/Users/marco/.codex/generated_images/01a1074b-612b-7491-8a03-b36083be6e9c/exec-e6aec7b9-eb2c-4711-9ca2-b288ddebe3e3.png`. Os PNGs anteriores continuam preservados no projeto. As três fotografias desta home somavam 7.149.617 bytes e agora somam 387.078 bytes nos exports. O grão e os vendors são adicionais apenas na experiência animada.

GSAP/ScrollTrigger vieram do [pacote oficial 3.15.0](https://registry.npmjs.org/gsap/-/gsap-3.15.0.tgz), sob a [GSAP Standard “No Charge” License](https://gsap.com/community/standard-license/), consultada em 06/10/2026. Avisos originais preservados e procedência em `public/js/vendor/NOTICE.txt`. O verificador de assets permite somente os URLs exatos de licença/namespaces desses dois arquivos; URLs externos de aplicação continuam proibidos.

Candidato ao vídeo: [Mizuno K, Pexels 13737097](https://www.pexels.com/video/person-pouring-black-coffee-in-clear-glass-13737097/), Moka servindo café em copo transparente, aproximadamente 12 segundos. A [licença oficial Pexels](https://www.pexels.com/license/) permite uso e adaptação em websites, sem sugerir endosso. O candidato **não foi baixado nem usado**. Downloads públicos de 720 px não concluíram; a revisão automática recusou a cópia em resolução UHD por ultrapassar a resolução prevista para a entrega. Uma tentativa permitida de verificar uma fonte mestre limitada a 25 MB retornou HTTP 403. Nenhuma barreira foi contornada. Pesquisa em `reports/motion-media/moka-research.md`, ignorada pelo Git.

### Prompt de geração do grão

> Use case: product-mockup. Asset type: transparent cutout for an animated editorial coffee website, not a website screenshot. Create one single exceptionally photorealistic medium roasted Arabica coffee bean, macro studio product photograph, isolated on a genuinely transparent alpha background. The bean is oval and angled diagonally about 25 degrees, its deeply grooved center facing the viewer in a three-quarter view. Rich chestnut/chocolate brown, naturally uneven wrinkled porous surface, restrained satin highlights, warm soft key light from the upper left, subtle darker underside. It must feel like a tangible real coffee bean photographed at macro scale, no stylization, no plastic look. Entire bean visible with clean natural edges, occupying about 70 percent of a square composition with transparent padding on every side. Keep the center groove and high-frequency texture crisp enough for a 500px large hero object. Nothing else in the image: no other beans, no ground plane or cast shadow outside the object, no steam, no text, no logo, no cup, no colored backdrop.

## Evidências

- ✅ `npm test`: 33/33. Regressões novas cobrem carregamento tardio, mudança de preferência, desmontagem, escolha explícita e o contrato de vídeo opcional; as regressões existentes de autenticação, estoque, pedidos e frete também passaram.
- ✅ `npm run check`: assets locais e configuração aprovados.
- ✅ Navegador local, 1280×720: origem, torra e preparo exibidos; avanço e retorno pela rolagem; uma única fixação; cabeçalho voltou a `top=0` com a página ainda em `scrollY=1246`.
- ✅ Tema escuro durante a narrativa: uma fixação após reconstrução, sem acúmulo; início escuro legível.
- ✅ “Ver cafés” saltou até os produtos; abrir produto e adicionar ao carrinho exibiu a confirmação esperada. Nenhuma compra real foi efetuada.
- ✅ Controle operado com Enter: a redução removeu a fixação e restaurou as três cenas visíveis.
- ✅ Navegador local, 390×844: zero fixações, zero cenas ocultas, zero scripts vendor, vídeo sem URL e largura do documento de 375 px, sem overflow horizontal.
- ✅ Redimensionar uma narrativa ativa para 390×844 removeu a fixação e restaurou todo o conteúdo.
- ✅ Revisão visual independente das cinco capturas: composição aprovada com uma sugestão opcional de aproximar texto e ações. A revisão de imagens estáticas não comprova movimento temporal.
- ⏳ Não foi feita medição instrumentada de FPS ou Core Web Vitals; não há alegação de uma taxa de quadros garantida.

Capturas locais em `reports/journey-{origin,roast,pour,dark}-desktop.jpg` e `reports/journey-mobile.jpg`, ignoradas pelo Git.

Após o deploy, o [site público](https://caffe-camillo-colombi.marcos-hpg114.workers.dev/) foi conferido em 1280×720 e 390×844. Desktop: três cenas, uma fixação, cabeçalho em `top=0` ao subir em `scrollY=648`, acesso direto aos quatro produtos em destaque e console sem erros/avisos. A preferência de movimento reduzido deste navegador deixa a versão estática inicial; o botão explícito ativa a narrativa. Celular: zero fixações, zero cenas ocultas, zero vendors, vídeo sem URL e nenhum overflow horizontal. Evidências em `reports/journey-online-desktop.jpg` e `reports/journey-online-mobile.jpg`.

## Próxima mídia

Obter um vídeo local licenciado de Moka/Cappuccino sendo servido, exportar em resolução adequada à área visível, sem áudio, conferir peso e enquadramento, conectar `data-video-src` e validar carregamento, reprodução, pausa, falha e versão móvel no navegador. Somente então trocar ⏳ por ✅ na etapa de líquido.

## Correção de visibilidade — 06/10/2026

- ❌ A versão inicial exigia 640 px de altura útil e escondia também o controle abaixo desse limite. Reprodução online em 1366×600: imagem estática, zero fixações, botão com `display:none`.
- ✅ Desktop agora depende somente da largura de 1024 px. Composição alta preservada; abaixo de 640 px a narrativa se ajusta à altura útil.
- ✅ “Ativar animação” está mais visível na versão estática, com alvo de 44 px, foco e contraste nos dois temas.
- ✅ `npm test` 34/34 e `npm run check` aprovados, incluindo desktop baixo, fronteira de largura e ativação explícita com movimento reduzido.
- ✅ Local em 1366×600 e 1280×480: uma fixação, conteúdo e ações dentro da janela. Em 1280×480, cena de torra com texto terminando em 338 px e controle terminando em 451 px.
- ⏳ Ampliação autorizada pelo usuário: completar preparo/filtragem até a xícara usando mídias reais, além das três fases iniciais. Pesquisa em andamento; ainda não confundir fonte baixada com mídia integrada/publicada.
