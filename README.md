# Caffè Camillo Colombi — V2

E-commerce de café artesanal remodelado a partir do novo levantamento de requisitos.

## O que mudou
- O MVP agora é centrado em café em pacote.
- Organização principal por torra.
- Variações por tipo, moagem e peso.
- Origem e história em cada produto.
- Essências: tradicional, cacau, chocolate e laranja.
- Produto esgotado continua visível com "Me avise".
- Estoque só é baixado após confirmação de pagamento.
- Checkout com Pix/cartão demo.
- Timeline de pedido.
- Camillo Club.
- Perfis admin/operator.
- Identidade amarelo + vermelho + pedra azul.
- Arial Bold, sem Helvetica.
- Imagens online da Wikimedia com fallback local e artes SVG originais para funcionamento offline.

## Tecnologias
Node.js, Express, MySQL, mysql2, bcryptjs, JWT, Helmet, CORS, rate limit, HTML, CSS e JavaScript vanilla.

## Rodar
1. `npm install`
2. copie `.env.example` para `.env`
3. configure MySQL
4. `npm run db:init`
5. `node src/server.js`
6. abra `http://localhost:3000`

## Logins demo

O checkout exige login para que o pedido possa ser associado à conta e confirmado com segurança.
Admin: `admin@caffecamillo.local` / `Admin@123`
Operador: `operador@caffecamillo.local` / `Admin@123`
Cliente: `cliente@caffecamillo.local` / `Admin@123`

> As senhas acima são apenas para o ambiente demonstrativo. Troque-as antes de qualquer uso real.

## Observação de conteúdo
As respostas fornecidas não trazem a história factual específica das fazendas, produtores e lotes. Por isso, os textos de origem no seed são explicitamente demonstrativos. Antes de uma publicação real, substitua-os pelos conteúdos aprovados pela marca.

## Documentação
Veja `docs/TUTORIAL_SENAC.md`, `docs/API.md`, `docs/BANCO_DE_DADOS.md`, `docs/DESIGN_SYSTEM.md`, `docs/SEGURANCA.md`, `docs/REQUISITOS.md` e `docs/GUIA_DE_IMAGENS.md`.
