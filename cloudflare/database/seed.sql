PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO categories (id,name,slug,description,active) VALUES
(1,'Cafés em saco','cafes-em-saco','Linha principal de cafés embalados.',1);

INSERT OR IGNORE INTO origins (id,name,slug,city,state,description) VALUES
(1,'São Gabriel da Palha','sao-gabriel-da-palha','São Gabriel da Palha','ES','Origem capixaba ligada à tradição do Conilon.'),
(2,'Domingos Martins','domingos-martins','Domingos Martins','ES','Região serrana capixaba associada a cafés Arábica.');

INSERT OR IGNORE INTO roast_levels (id,name,slug,description,sort_order) VALUES
(1,'Torra Clara','clara','Mais brilho e percepção de acidez.',1),
(2,'Torra Média','media','Equilíbrio entre doçura, corpo e aroma.',2),
(3,'Torra Escura','escura','Maior intensidade e notas de torra.',3);

INSERT OR IGNORE INTO grind_types (id,name,slug,description,sort_order) VALUES
(1,'Grãos inteiros','graos-inteiros','Para moer imediatamente antes do preparo.',1),
(2,'Extra fina','extra-fina','Indicada para preparos que pedem moagem muito fina.',2),
(3,'Fina / Espresso','fina-espresso','Para espresso doméstico compatível.',3),
(4,'Moka italiana','moka-italiana','Ajustada para cafeteira Moka.',4),
(5,'Média','media','Indicada para coadores e métodos filtrados.',5),
(6,'Média-grossa','media-grossa','Boa para Clever e alguns métodos de infusão.',6),
(7,'Grossa / Prensa francesa','grossa-prensa','Para prensa francesa.',7);

INSERT OR IGNORE INTO aromas (id,name,slug) VALUES
(1,'Cacau','cacau'),(2,'Chocolate','chocolate'),(3,'Laranja','laranja');

INSERT OR IGNORE INTO users (id,name,email,phone,password_hash,role,loyalty_points) VALUES
(1,'Administrador Camillo','admin@caffecamillo.local','(00) 0000-0000','pbkdf2$30000$Y2FtaWxsby1hZG1pbi1zYWx0LTIwMjY$WRqvgFQBvaMbH1dJ3Vgpd9ID_qHK8rycwcX3QaEXIDo','admin',0),
(2,'Cliente Demonstração','cliente@caffecamillo.local','(27) 99999-0000','pbkdf2$30000$Y2FtaWxsby1jbGllbnRlLXNhbHQtMjAyNg$mD7WzVyPA44rN_71v3CG6-ocnVcX9I_cYj4aJw4TsoE','customer',235);

INSERT OR IGNORE INTO addresses (id,user_id,label,zip_code,street,number,complement,district,city,state,is_default)
VALUES (1,2,'Casa','29260-000','Rua de Demonstração','100',NULL,'Centro','Domingos Martins','ES',1);

INSERT OR IGNORE INTO loyalty_levels (id,name,slug,min_points,benefit_description) VALUES
(1,'Grão','grao',0,'Entrada no Clube Camillo e acesso ao histórico.'),
(2,'Crema','crema',250,'Benefícios sazonais e amostras selecionadas.'),
(3,'Barista','barista',750,'Acesso antecipado a lotes e brindes selecionados.'),
(4,'Maestro','maestro',1500,'Nível máximo, com recompensas especiais e campanhas exclusivas.');

INSERT OR IGNORE INTO rewards (id,name,description,points_cost,reward_type,active) VALUES
(1,'Frete grátis extra','Cupom de frete grátis fora das regras normais.',300,'shipping',1),
(2,'Amostra Camillo','Amostra promocional de café selecionado.',450,'sample',1),
(3,'Cafeteira futura','Recompensa conceitual para uma fase posterior do programa.',3500,'coffee_machine_future',0);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (1,1,'camillo-origine','Camillo Origine','Um Arábica claro e vivo, pensado para métodos filtrados.','Café de perfil delicado, acidez agradável e final limpo, inspirado nas montanhas de Domingos Martins.','arabica',2,1,2,2,4,'cítricos, mel e castanha','V60, Chemex e prensa francesa',1,'bag-yellow',1);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (2,1,'camillo-montagna','Camillo Montagna','Arábica de torra média com doçura e corpo equilibrados.','Um café versátil para o dia a dia, com corpo macio e doçura natural.','arabica',2,2,3,3,3,'caramelo, amêndoas e frutas amarelas','coado, Aeropress e Moka',1,'bag-blue',1);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (3,1,'camillo-famiglia','Camillo Famiglia','Blend familiar, redondo e confortável.','Mistura equilibrada de Arábica e Conilon com perfil achocolatado e baixa acidez.','blend',1,2,3,4,2,'chocolate ao leite, castanhas e caramelo','Moka, coado e espresso',1,'bag-red',1);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (4,1,'camillo-intenso','Camillo Intenso','Conilon encorpado de torra escura.','Para quem procura corpo, persistência e intensidade sem adição de aromas.','conilon',1,3,5,5,1,'cacau, nozes torradas e melaço','espresso e Moka',1,'bag-dark',1);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (5,1,'camillo-dolce','Camillo Dolce','Blend médio, macio e naturalmente doce.','Um café equilibrado para leite ou preparo puro, com perfil acolhedor.','blend',2,2,3,3,2,'caramelo, biscoito e amêndoas','coado, cappuccino caseiro e Moka',0,'bag-yellow',1);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (6,1,'camillo-reserva','Camillo Reserva','Arábica selecionado de torra média.','Lote de demonstração com perfil mais complexo e acabamento longo.','arabica',2,2,4,3,4,'frutas secas, chocolate e mel','V60, Clever e espresso',1,'bag-blue',1);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (7,1,'camillo-cacao','Camillo Cacao','Blend artesanal aromatizado com cacau.','Café aromatizado; a presença de cacau é adicionada e não deve ser confundida com nota sensorial natural.','blend',1,2,4,4,2,'base achocolatada','Moka e coado',0,'bag-red',1);
INSERT OR IGNORE INTO product_aromas (product_id,aroma_id) VALUES (7,1);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (8,1,'camillo-arancia','Camillo Arancia','Arábica aromatizado com laranja.','Edição aromatizada de perfil cítrico. A laranja é aromatização adicionada, claramente identificada.','arabica',2,1,3,2,4,'base cítrica e floral','V60 e coado',0,'bag-yellow',1);
INSERT OR IGNORE INTO products (id,category_id,slug,name,short_description,description,coffee_type,origin_id,roast_level_id,intensity,body_score,acidity_score,sensory_notes,brew_suggestion,featured,image_key,active) VALUES (9,1,'camillo-cioccolato','Camillo Cioccolato','Blend aromatizado com chocolate.','Edição de demonstração com aromatização de chocolate adicionada ao café.','blend',1,3,5,5,1,'base intensa e achocolatada','Moka e espresso',0,'bag-dark',1);
INSERT OR IGNORE INTO product_aromas (product_id,aroma_id) VALUES (7,1);
INSERT OR IGNORE INTO product_aromas (product_id,aroma_id) VALUES (8,3);
INSERT OR IGNORE INTO product_aromas (product_id,aroma_id) VALUES (9,2);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,1,'CAM-01-250-01',250,52.00,14,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,1,'CAM-01-500-01',500,92.56,14,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,3,'CAM-01-250-03',250,55.00,16,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,3,'CAM-01-500-03',500,97.90,16,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,4,'CAM-01-250-04',250,57.00,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,4,'CAM-01-500-04',500,101.46,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,5,'CAM-01-250-05',250,52.00,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,5,'CAM-01-500-05',500,92.56,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,7,'CAM-01-250-07',250,52.00,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,7,'CAM-01-500-07',500,92.56,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,1,'CAM-02-250-01',250,56.00,15,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,1,'CAM-02-500-01',500,99.68,15,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,3,'CAM-02-250-03',250,59.00,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,3,'CAM-02-500-03',500,105.02,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,4,'CAM-02-250-04',250,61.00,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,4,'CAM-02-500-04',500,108.58,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,5,'CAM-02-250-05',250,56.00,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,5,'CAM-02-500-05',500,99.68,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,7,'CAM-02-250-07',250,56.00,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,7,'CAM-02-500-07',500,99.68,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,1,'CAM-03-250-01',250,49.00,16,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,1,'CAM-03-500-01',500,87.22,16,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,3,'CAM-03-250-03',250,52.00,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,3,'CAM-03-500-03',500,92.56,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,4,'CAM-03-250-04',250,54.00,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,4,'CAM-03-500-04',500,96.12,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,5,'CAM-03-250-05',250,49.00,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,5,'CAM-03-500-05',500,87.22,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,7,'CAM-03-250-07',250,49.00,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,7,'CAM-03-500-07',500,87.22,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,1,'CAM-04-250-01',250,44.00,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,1,'CAM-04-500-01',500,78.32,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,3,'CAM-04-250-03',250,47.00,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,3,'CAM-04-500-03',500,83.66,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,4,'CAM-04-250-04',250,49.00,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,4,'CAM-04-500-04',500,87.22,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,5,'CAM-04-250-05',250,44.00,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,5,'CAM-04-500-05',500,78.32,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,7,'CAM-04-250-07',250,44.00,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,7,'CAM-04-500-07',500,78.32,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,1,'CAM-05-250-01',250,51.00,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,1,'CAM-05-500-01',500,90.78,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,3,'CAM-05-250-03',250,54.00,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,3,'CAM-05-500-03',500,96.12,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,4,'CAM-05-250-04',250,56.00,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,4,'CAM-05-500-04',500,99.68,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,5,'CAM-05-250-05',250,51.00,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,5,'CAM-05-500-05',500,90.78,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,7,'CAM-05-250-07',250,51.00,24,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,7,'CAM-05-500-07',500,90.78,24,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,1,'CAM-06-250-01',250,64.00,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,1,'CAM-06-500-01',500,113.92,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,3,'CAM-06-250-03',250,67.00,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,3,'CAM-06-500-03',500,119.26,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,4,'CAM-06-250-04',250,69.00,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,4,'CAM-06-500-04',500,122.82,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,5,'CAM-06-250-05',250,64.00,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,5,'CAM-06-500-05',500,113.92,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,7,'CAM-06-250-07',250,64.00,25,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,7,'CAM-06-500-07',500,113.92,25,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,1,'CAM-07-250-01',250,59.00,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,1,'CAM-07-500-01',500,105.02,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,3,'CAM-07-250-03',250,62.00,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,3,'CAM-07-500-03',500,110.36,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,4,'CAM-07-250-04',250,64.00,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,4,'CAM-07-500-04',500,113.92,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,5,'CAM-07-250-05',250,59.00,24,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,5,'CAM-07-500-05',500,105.02,24,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,7,'CAM-07-250-07',250,59.00,26,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,7,'CAM-07-500-07',500,105.02,26,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,1,'CAM-08-250-01',250,62.00,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,1,'CAM-08-500-01',500,110.36,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,3,'CAM-08-250-03',250,65.00,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,3,'CAM-08-500-03',500,115.70,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,4,'CAM-08-250-04',250,67.00,24,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,4,'CAM-08-500-04',500,119.26,0,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,5,'CAM-08-250-05',250,62.00,25,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,5,'CAM-08-500-05',500,110.36,25,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,7,'CAM-08-250-07',250,62.00,27,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,7,'CAM-08-500-07',500,110.36,27,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,1,'CAM-09-250-01',250,57.00,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,1,'CAM-09-500-01',500,101.46,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,3,'CAM-09-250-03',250,60.00,24,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,3,'CAM-09-500-03',500,106.80,24,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,4,'CAM-09-250-04',250,62.00,25,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,4,'CAM-09-500-04',500,110.36,25,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,5,'CAM-09-250-05',250,57.00,26,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,5,'CAM-09-500-05',500,101.46,26,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,7,'CAM-09-250-07',250,57.00,28,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,7,'CAM-09-500-07',500,101.46,28,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,2,'CAM-01-250-02',250,56.00,15,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,2,'CAM-01-500-02',500,99.68,13,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,6,'CAM-01-250-06',250,54.00,16,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (1,6,'CAM-01-500-06',500,96.12,14,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,2,'CAM-02-250-02',250,60.00,16,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,2,'CAM-02-500-02',500,106.80,14,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,6,'CAM-02-250-06',250,58.00,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (2,6,'CAM-02-500-06',500,103.24,15,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,2,'CAM-03-250-02',250,53.00,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,2,'CAM-03-500-02',500,94.34,15,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,6,'CAM-03-250-06',250,51.00,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (3,6,'CAM-03-500-06',500,90.78,16,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,2,'CAM-04-250-02',250,48.00,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,2,'CAM-04-500-02',500,85.44,16,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,6,'CAM-04-250-06',250,46.00,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (4,6,'CAM-04-500-06',500,81.88,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,2,'CAM-05-250-02',250,55.00,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,2,'CAM-05-500-02',500,97.90,17,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,6,'CAM-05-250-06',250,53.00,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (5,6,'CAM-05-500-06',500,94.34,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,2,'CAM-06-250-02',250,68.00,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,2,'CAM-06-500-02',500,121.04,18,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,6,'CAM-06-250-06',250,66.00,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (6,6,'CAM-06-500-06',500,117.48,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,2,'CAM-07-250-02',250,63.00,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,2,'CAM-07-500-02',500,112.14,19,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,6,'CAM-07-250-06',250,61.00,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (7,6,'CAM-07-500-06',500,108.58,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,2,'CAM-08-250-02',250,66.00,22,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,2,'CAM-08-500-02',500,117.48,20,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,6,'CAM-08-250-06',250,64.00,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (8,6,'CAM-08-500-06',500,113.92,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,2,'CAM-09-250-02',250,55.00,23,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,2,'CAM-09-500-02',500,97.90,21,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,6,'CAM-09-250-06',250,53.00,24,1);
INSERT OR IGNORE INTO product_variants (product_id,grind_type_id,sku,weight_g,price,stock,active) VALUES (9,6,'CAM-09-500-06',500,94.34,22,1);

INSERT OR IGNORE INTO loyalty_transactions (id,user_id,order_id,type,points,description)
VALUES (1,2,NULL,'bonus',235,'Saldo inicial de demonstração do Clube Camillo');

INSERT OR IGNORE INTO favorites (user_id,product_id) VALUES (2,2);

INSERT OR IGNORE INTO orders (
  id,user_id,order_number,status,subtotal,shipping_amount,total,shipping_name,contact_email,contact_phone,
  shipping_zip_code,shipping_street,shipping_number,shipping_complement,shipping_district,shipping_city,
  shipping_state,shipping_estimated_days,tracking_code,paid_at
) VALUES (
  'demo-order-001',2,'CAM-DEMO-001','entregue',98.00,0.00,98.00,'Cliente Demonstração',
  'cliente@caffecamillo.local','(27) 99999-0000','29260-000','Rua de Demonstração','100',NULL,
  'Centro','Domingos Martins','ES',3,'CAMBR0000000001',CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO order_items (order_id,product_variant_id,product_name,variant_label,quantity,unit_price,total_price)
SELECT 'demo-order-001',id,'Camillo Famiglia','250 g · Grãos inteiros',2,49.00,98.00
FROM product_variants WHERE sku='CAM-03-250-01';

INSERT OR IGNORE INTO payments (order_id,method,card_brand,provider,status,transaction_id,amount)
VALUES ('demo-order-001','pix',NULL,'mock','approved','MOCK-DEMO-001',98.00);

INSERT OR IGNORE INTO order_status_history (order_id,status,note,created_at) VALUES
('demo-order-001','pedido_confirmado','Pedido demonstrativo criado pelo seed.',datetime('now','-3 day')),
('demo-order-001','enviado','Código de rastreio fictício para demonstração.',datetime('now','-2 day')),
('demo-order-001','entregue','Pedido demonstrativo entregue.',datetime('now','-1 day'));
