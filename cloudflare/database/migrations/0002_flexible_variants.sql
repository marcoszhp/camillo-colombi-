-- D1 applies migrations inside a transaction. Defer references while replacing
-- the variant table; IDs, stock, timestamps and historical order links survive.
PRAGMA defer_foreign_keys = ON;
CREATE TABLE migration_sequence_backup AS SELECT name,seq FROM sqlite_sequence WHERE name IN ('product_variants','order_items');
ALTER TABLE products ADD COLUMN product_kind TEXT NOT NULL DEFAULT 'packaged' CHECK (product_kind IN ('packaged','beverage','dessert'));

CREATE TABLE product_variants_next (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  grind_type_id INTEGER,
  sku TEXT NOT NULL UNIQUE,
  weight_g INTEGER,
  price REAL NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unit_type TEXT NOT NULL DEFAULT 'weight' CHECK (unit_type IN ('weight','volume','unit')),
  label TEXT NOT NULL CHECK (length(trim(label)) > 0),
  volume_ml INTEGER,
  CHECK ((unit_type='weight' AND weight_g IN (250,500,1000) AND weight_g IS NOT NULL AND volume_ml IS NULL)
    OR (unit_type='volume' AND weight_g IS NULL AND volume_ml IS NOT NULL AND volume_ml > 0 AND grind_type_id IS NULL)
    OR (unit_type='unit' AND weight_g IS NULL AND volume_ml IS NULL AND grind_type_id IS NULL)),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (grind_type_id) REFERENCES grind_types(id),
  UNIQUE (product_id, grind_type_id, weight_g)
);
INSERT INTO product_variants_next (id,product_id,grind_type_id,sku,weight_g,price,stock,active,created_at,updated_at,unit_type,label)
SELECT v.id,v.product_id,v.grind_type_id,v.sku,v.weight_g,v.price,v.stock,v.active,v.created_at,v.updated_at,'weight',
  CAST(v.weight_g AS TEXT) || ' g · ' || g.name
FROM product_variants v JOIN grind_types g ON g.id=v.grind_type_id;
-- Remove the referencing table before replacing its parent. Simply dropping
-- and recreating the parent leaves SQLite deferred-FK counters unresolved.
CREATE TABLE migration_order_items_backup AS SELECT * FROM order_items;
DROP TABLE order_items;
DROP TABLE product_variants;
ALTER TABLE product_variants_next RENAME TO product_variants;
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_variant_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);
INSERT INTO order_items SELECT * FROM migration_order_items_backup;
DROP TABLE migration_order_items_backup;
UPDATE sqlite_sequence SET seq=MAX(seq,COALESCE((SELECT b.seq FROM migration_sequence_backup b WHERE b.name=sqlite_sequence.name),0)) WHERE name IN ('product_variants','order_items');
DROP TABLE migration_sequence_backup;
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_variant_stock ON product_variants(stock);
CREATE INDEX idx_variant_product ON product_variants(product_id,active);
-- A unique transition claims approval/cancellation in the same transaction as
-- stock and loyalty writes, including concurrent administrator requests.
CREATE TABLE order_mutation_guards (
  order_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('resolve_payment','cancel_order','advance_order')),
  valid_state INTEGER NOT NULL CONSTRAINT transition_state CHECK (valid_state=1),
  PRIMARY KEY (order_id,operation),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
-- No deletes of products, orders, customers, points or inventory.
