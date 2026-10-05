# Caffè Camillo Colombi — aplicação online

A aplicação atual usa **Cloudflare Workers + D1 + Static Assets** e fica em [`cloudflare/`](cloudflare/README.md). O código Node/MySQL na raiz foi preservado como versão acadêmica anterior; ele não deve ser usado no build da aplicação online.

## Desenvolvimento

```powershell
cd cloudflare
npm ci
npm run db:init:local
npm run dev
```

Use Node 24 (mínimo 22.13). A inicialização cria dados demonstrativos somente em um banco local vazio; em execuções posteriores aplica apenas migrations. A configuração privada local é gerada se ausente e ignorada pelo Git.

## Verificação e publicação

Dentro de `cloudflare/`, execute `npm test`, `npm run check` e `npm run deploy:dry`. O diretório raiz do Workers Builds deve ser **cloudflare**, com branch de produção **main** e comando de deploy **npm run deploy**. Leia [o guia de publicação](cloudflare/docs/CLOUDFLARE.md) antes de conectar ou atualizar a instalação existente.

Alterações estruturais entram por pull request. A publicação aplica migrations pendentes antes do Worker e preserva o segredo de autenticação. Não existe reset automático de produção.

[Memória do projeto](PROJECT_CACHE.md) · [API](cloudflare/docs/API.md) · [Fontes editoriais](cloudflare/docs/CULTURA-DO-CAFE.md)

