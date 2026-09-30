# Tutorial SENAC — ambiente restrito

1. Use uma pasta do usuário, sem precisar de administrador.
2. Se Node não estiver disponível, use uma versão portátil em `.zip` autorizada pelo laboratório; extraia e execute o `node.exe` diretamente.
3. Para MySQL/MariaDB, use uma versão portátil ou XAMPP Portable, se permitido. Caso o serviço já exista no laboratório, use os dados fornecidos pelo responsável.
4. Na pasta do projeto, rode `npm install`. Se o npm for bloqueado por proxy, configure somente se a rede do laboratório fornecer os dados: `npm config set proxy http://USUARIO:SENHA@PROXY:PORTA` e `npm config set https-proxy http://USUARIO:SENHA@PROXY:PORTA`. Alternativa: levar `node_modules` previamente preparado em ambiente autorizado e compatível.
5. Copie `.env.example` para `.env` e ajuste credenciais.
6. Rode `npm run db:init`.
7. Rode `node src/server.js`.
8. Abra `http://localhost:3000`.

## Problemas comuns
- Porta ocupada: altere `PORT=3001` no `.env`.
- MySQL não sobe: confirme host/porta e se o serviço já está usando 3306.
- Erro `caching_sha2_password`: use usuário configurado pelo responsável do laboratório ou crie um usuário compatível com o servidor disponível; não altere autenticação de uma máquina institucional sem autorização.
- Firewall: permita o Node apenas se o laboratório autorizar. Para acesso local, normalmente `localhost` é suficiente.
- `Unknown database`: rode `npm run db:init` depois de conferir `DB_NAME`.

## Plano B
Se o MySQL não puder rodar localmente, a API pode apontar para um MySQL/MariaDB acessível em outro computador da rede, desde que o responsável forneça host, porta, usuário e senha e a rede permita a conexão. O projeto não depende de phpMyAdmin; ele é apenas uma interface opcional para administração do banco.