# Segurança — Cloudflare Edition

## Implementado

- queries D1 parametrizadas;
- papéis `customer` e `admin`;
- JWT HMAC-SHA256;
- segredo JWT guardado como Cloudflare Worker Secret em produção;
- senhas nunca armazenadas em texto puro;
- PBKDF2 via Web Crypto;
- rate limiting simples do login registrado no D1;
- validação server-side;
- API no mesmo domínio dos assets;
- estoque e pontos protegidos por batch/constraints;
- cartão: apenas bandeira/cenário de demonstração; não armazena PAN completo nem CVV;
- Amex rejeitado conforme o escopo;
- erros JSON padronizados sem stack trace para o cliente.

## PBKDF2 e Workers Free

Workers Free possui limite de CPU muito restrito por requisição. Por isso esta edição de **demonstração acadêmica** usa PBKDF2-SHA256 com 30.000 iterações via Web Crypto. O valor é deliberadamente um compromisso com o limite gratuito e não deve ser tratado como recomendação de segurança para uma loja real.

Antes de produção comercial, adote uma destas opções:

1. provedor de identidade/autenticação dedicado;
2. plano com CPU suficiente e KDF configurado segundo orientação de segurança vigente;
3. arquitetura de autenticação que permita aumentar o custo do hash sem exceder os limites.

Nunca reduza repetidamente as iterações apenas para esconder erros de limite de CPU.

## Antes de uso comercial

Ainda seria necessário:

- gateway de pagamento real e requisitos PCI aplicáveis;
- política de sessão/token com refresh/revogação;
- e-mail transacional real;
- política de backups/restore;
- observabilidade e alertas;
- revisão LGPD e termos por profissional competente;
- antifraude;
- testes de carga e segurança;
- domínio e e-mail empresariais;
- política de exclusão/exportação de dados.
