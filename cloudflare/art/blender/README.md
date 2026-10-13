# Jornada contínua de café — Blender 4.5

Fonte determinística e editável para a jornada de seis etapas do Caffè Camillo Colombi. Uma bancada circular de cerâmica, um conjunto de luzes e uma câmera contínua acompanham origem, torra, moagem, água no filtro, filtragem e servir. Não há cortes, montagem de vídeos, texto ou interface no render.

Correção de 09/10: filtro e caneca chegam no frame118, antes da liberação das partículas. O filtro fica em um suporte de cobre criado pelo módulo `preparation_layout.py`, implementado com Qwen local e revisado pelo coordenador. Há 0,58 unidade entre a saída do filtro e a borda da caneca. O fluxo de café aparece por espessura, mantendo a origem conectada à saída, e desaparece antes da retirada do filtro. A câmera comporta o moinho elevado e o grão durante a transição.

`verify_preparation.py` verifica 150 frames em avanço e reversão: ordem de chegada, 170 partículas dentro do filtro ao final da moagem, folga de extração, fluxo conectado e enquadramento dos elementos principais. A partir de `cloudflare/`, execute no Blender carregando o mestre: `blender -b caminho.blend --python-exit-code 1 --python art/blender/verify_preparation.py`. O relatório fica em `reports/blender-preparation-check.json`. Essa verificação da cena não substitui testar rolagem e desempenho no navegador.

O grão usa uma malha fechada com polos únicos, normais externas e maior densidade de vértices ao longo do sulco curvo. A faixa escura acompanha o fundo contínuo do sulco; sua cor muda durante a torra. O moinho entrega partículas ao filtro cônico, com pó e bloom elevados dentro da boca para leitura pela câmera. O fluxo de água acompanha o ponto mundial real do bico da chaleira, incluindo sua rotação. A superfície do café sobe respeitando a parede interna da xícara. Cerâmica creme com esmalte suave, cobre, papel cru e café marrom mantêm a identidade. O vapor usa três volumes locais de baixa densidade com ruído animado, em lugar de fios sólidos. É uma interpretação editorial em 3D, não uma promessa de fotorealismo ou reprodução idêntica do Reels.

## Renderizar provas

Execute a partir da raiz do repositório no PowerShell, com o Blender portátil preparado em `cloudflare/reports/blender-tools/`:

```powershell
& 'cloudflare/reports/blender-tools/blender-4.5.9-windows-x64/blender.exe' -b -t 16 --python 'cloudflare/art/blender/coffee_journey.py' -- --output 'cloudflare/reports/blender-proof-v2' --frames '1,85,140,175,190,225,285' --resolution 1 --samples 32 --save-blend 'cloudflare/reports/coffee-journey-master-v2.blend'
```

## Renderizar sequência final

```powershell
& 'cloudflare/reports/blender-tools/blender-4.5.9-windows-x64/blender.exe' -b -t 16 --python 'cloudflare/art/blender/coffee_journey.py' -- --output 'cloudflare/reports/blender-sequence' --start 1 --end 300 --resolution 1 --samples 48
```

A saída é `frame-0001.png` a `frame-0300.png`, RGBA transparente, 960 × 840, 30 fps. O fundo será composto pela página. `--resolution` multiplica as duas dimensões; `--samples` controla EEVEE. `--frames` aceita frames independentes, em qualquer ordem. `--save-blend caminho` escolhe o arquivo mestre; por padrão ele fica no diretório pai da pasta de PNGs, como `coffee-journey-master.blend`. `--build-only` cria esse mestre sem renderizar. Salve PNGs e `.blend` em `reports/`, que já é ignorado pelo Git.

As fases têm marcadores nos frames 1, 51, 101, 151, 201 e 251: seis processos de 50 frames. Objetos e materiais possuem keyframes reais. A câmera se desloca suavemente. Objetos entram e saem gradualmente com deslocamento e escala mínima; partículas e vapor não dependem de simulação nem de frames anteriores. A água tem coordenadas gravadas por frame entre 151 e 224, após finalizar a interpolação da chaleira e do filtro. A construção confere automaticamente a coincidência do início da água com o bico nos frames 151–200. O fluxo aparece após a chegada da chaleira, entre 166 e 208.

Limites: as transformações são direção artística, não simulação física de torra/fluidos; a água e extração são curvas animadas, e o pó usa partículas geométricas. A luz e o alpha precisam ser conferidos no fundo quente final do site. O render final deve ser autorizado pelo coordenador após as provas.
