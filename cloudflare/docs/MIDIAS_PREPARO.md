# Mídias de preparo — 07/10/2026

Os vídeos desta edição mostram ações reais de preparo. São mídias ilustrativas licenciadas; não representam uma filmagem da operação do Caffè Camillo Colombi. Os exports locais foram recortados e otimizados para integrar a narrativa da home.

## Arquivos de entrega

| Processo | Arquivo em `public/assets/journey/` | Trecho do master | Duração | Bytes |
| --- | --- | --- | --- | --- |
| Grãos no moedor e pó entrando no filtro | `grinding.mp4` | Mixkit 4989, 0–7,8 s | 7,8 s | 1.301.957 |
| Água sobre o café moído | `water.mp4` | Mixkit 100258, 1–14 s | 13 s | 1.306.764 |
| Extração e café coletado no recipiente | `extraction.mp4` | Mixkit 4989, 8,3–11,5 s | 3,2 s | 398.291 |
| Café sendo servido na xícara | `serving.mp4` | Mixkit 100253, 0,5–14,5 s | 14 s | 1.415.169 |

Todos são MP4/H.264, 960×540, sem áudio, YUV420p e com índice no início do arquivo. Keyframes a cada 12 frames favorecem a busca de tempo ligada à rolagem. Os quatro arquivos somam 4.422.181 bytes. Imagens de fallback `*-poster.webp` somam 103.320 bytes e permanecem disponíveis sem vídeo.

Masters e evidências estão em `reports/process-media/`, ignorados pelo Git; nenhuma fonte mestre foi incluída no diretório público. O close vertical Mixkit 100345 foi pesquisado, mas não entrou na entrega. Os recortes não usam o plano final da embalagem da sequência 4989.

## Procedência e licença

- [Video sequence of the coffee preparation process — Mixkit 4989](https://mixkit.co/free-stock-video/video-sequence-of-the-coffee-preparation-process-4989/): master de 16,98 s, 1280×720, 5.503.308 bytes. Inspeção confirmou grãos no mecanismo do moedor, pó no papel de filtro e recipiente com café. SHA-256 `407C95F695DCA9C8B25FB586B3A2EAE8736747BF7A4B021F1C1B179101601A50`.
- [Pouring Water in Wooden Coffee Dripper — Mixkit 100258](https://mixkit.co/free-stock-video/pouring-water-in-wooden-coffee-dripper-100258/): master de 20,42 s, 1280×720, 7.338.895 bytes. Chaleira, fluxo de água, café no filtro e corpo da cafeteira de vidro visíveis.
- [Pouring Coffee into Cup with Cinnamon Sticks and Beans — Mixkit 100253](https://mixkit.co/free-stock-video/pouring-coffee-into-cup-with-cinnamon-sticks-and-beans-100253/): master de 18,46 s, 1280×720, 6.627.498 bytes. Fluxo de café da jarra para a xícara, sem rosto ou marca protagonista nas amostras usadas.

As três páginas indicam **Mixkit Stock Video Free License**, com uso comercial e pessoal. [Licença oficial](https://mixkit.co/license/#videoFree), [texto completo](https://mixkit.co/license/modal/videoFree/) e [termos do serviço](https://mixkit.co/terms/), consultados em 06/10/2026. A licença permite adaptação e integração em projetos; atribuição não é obrigatória. Os arquivos não podem ser revendidos como biblioteca ou stock independente. O colaborador público exibido é Mixkit; não há identificação individual do cinegrafista nessas páginas.

Os downloads vieram de endpoints públicos normais, sem contornar barreiras, alterar cookies ou remover proteções. Formato, bytes, hashes e decodificação foram verificados. HTML de procedência, licença e contatos de quadros foram preservados em `reports/process-media/research.md` e `reports/process-media/grinding/master.md`.

## Limites da representação

A narrativa adapta os processos ao café filtrado. Não é uma réplica 3D do porta-filtro do Reels nem uma nova animação específica de Moka/Cappuccino. Moagem, entrada de água, extração e servir usam vídeo real; o grão e a torra continuam representados por fotografia recortada, cor, partículas e fumaça discreta.

As cenas são controladas pela rolagem no desktop, com poster no celular, no modo reduzido e em falhas. A inspeção de quadros confirma os processos filmados; o scrub real no site foi validado separadamente em avanço e reversão para as quatro mídias. Os vídeos permaneceram pausados. Evidências temporais e capturas estão em `reports/preparation-temporal.json` e `reports/preparation-*.jpg`.

Na validação local de 07/10/2026, os tempos observados foram: moagem 4.087→2.628 s, água 6.387→3.959 s, extração 1.542→0.959 s e servir 6.866→4.292 s. A revisão visual independente passou nas seis fases; a captura da torra está em `reports/preparation-roast.jpg`. Em mobile, o DOM confirmou seis blocos sem ocultação, overflow, endereço de vídeo ou vendors e sem fixação; `reports/preparation-mobile.jpg` mostra somente a primeira vista.
