# Segurança

- bcrypt para senhas.
- JWT com expiração.
- Rate limit no login.
- Helmet.
- CORS configurável.
- Queries parametrizadas.
- Controle por papel: customer/operator/admin.
- Cartão não é armazenado.
- Confirmação de pagamento e baixa de estoque no servidor.
- Transações MySQL e FOR UPDATE para evitar baixa concorrente.
- Segredos somente em `.env`.

Para produção, o pagamento deve ser delegado a gateway compatível e a aplicação deve usar HTTPS.