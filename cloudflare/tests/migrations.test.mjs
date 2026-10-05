import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const sql = name => fs.readFileSync(new URL(`../database/${name}`,import.meta.url),'utf8');
const migrate = (db,name) => { db.exec('BEGIN IMMEDIATE'); try { db.exec(sql(`migrations/${name}`)); db.exec('COMMIT'); } catch(e) { db.exec('ROLLBACK'); throw e; } };

test('upgrade real preserva IDs, pedidos, pagamentos, pontos, estoque customizado e FKs',()=>{
  const db = new DatabaseSync(':memory:');
  db.exec(sql('schema.sql')); db.exec(sql('seed.sql'));
  db.exec("UPDATE product_variants SET stock=3,price=123.45 WHERE id=1; UPDATE users SET loyalty_points=987 WHERE id=2");
  db.exec("INSERT INTO grind_types (id,name,slug) VALUES (99,'Teste sequência','teste-sequencia'); INSERT INTO product_variants (id,product_id,grind_type_id,sku,weight_g,price,stock) VALUES (9000,1,99,'DELETED-SEQUENCE',500,12,3); DELETE FROM product_variants WHERE id=9000; DELETE FROM grind_types WHERE id=99");
  const snapshots = Object.fromEntries(['users','orders','order_items','payments','order_status_history','loyalty_transactions','favorites','addresses','customer_rewards','stock_notifications'].map(table=>[table,db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
  const variants = db.prepare('SELECT * FROM product_variants ORDER BY id').all();
  for(const name of ['0001_baseline.sql','0002_flexible_variants.sql','0003_official_catalog.sql']) migrate(db,name);
  for(const [table,rows] of Object.entries(snapshots)) assert.deepEqual(db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),rows,table);
  for(const row of variants) {
    const upgraded=db.prepare('SELECT * FROM product_variants WHERE id=?').get(row.id);
    for(const [key,value] of Object.entries(row)) assert.equal(upgraded[key],value,`${row.id}.${key}`);
    assert.equal(upgraded.unit_type,'weight'); assert.match(upgraded.label,/g ·/);
  }
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM products WHERE active=1').get().n,19);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM products WHERE id<=9 AND active=0').get().n,9);
  assert.ok(db.prepare('SELECT MIN(id) n FROM product_variants WHERE id>126').get().n>9000);
  assert.throws(()=>db.prepare("INSERT INTO order_items (order_id,product_variant_id,product_name,variant_label,quantity,unit_price,total_price) VALUES ('demo-order-001',-1,'bad','bad',1,1,1)").run(),/FOREIGN KEY/);
  assert.throws(()=>db.prepare('UPDATE product_variants SET stock=-1 WHERE id=1').run(),/CHECK/);
  assert.throws(()=>db.prepare("UPDATE product_variants SET unit_type='volume',weight_g=NULL,volume_ml=0,grind_type_id=NULL WHERE id=1").run(),/CHECK/);
  db.close();
});

test('catálogo completo tem21 variantes embaladas e bebidas sem peso ou moagem; reexecução preserva personalizações',()=>{
  const db=new DatabaseSync(':memory:');
  for(const name of ['0001_baseline.sql','0002_flexible_variants.sql','0003_official_catalog.sql']) migrate(db,name);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n,0,'migrations nunca inserem usuários');
  assert.equal(db.prepare("SELECT COUNT(*) n FROM products WHERE product_kind='packaged' AND active=1").get().n,6);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM products WHERE product_kind='beverage' AND active=1").get().n,13);
  const packaged=db.prepare("SELECT p.slug,COUNT(v.id) n,COUNT(DISTINCT v.weight_g) weights,COUNT(DISTINCT v.grind_type_id) grinds FROM products p JOIN product_variants v ON v.product_id=p.id WHERE p.product_kind='packaged' GROUP BY p.id").all();
  for(const row of packaged) { assert.equal(row.n,21); assert.equal(row.weights,3); assert.equal(row.grinds,7); }
  assert.equal(db.prepare("SELECT COUNT(*) n FROM products p JOIN product_variants v ON v.product_id=p.id WHERE p.product_kind='beverage' AND (v.weight_g IS NOT NULL OR v.grind_type_id IS NOT NULL)").get().n,0);
  const id=db.prepare("SELECT id FROM products WHERE slug='espresso'").get().id;
  db.prepare("UPDATE products SET name='Espresso da Casa',active=0 WHERE id=?").run(id);
  db.prepare('UPDATE product_variants SET price=99,stock=2 WHERE product_id=?').run(id);
  migrate(db,'0003_official_catalog.sql');
  assert.equal(db.prepare('SELECT name FROM products WHERE id=?').get(id).name,'Espresso da Casa');
  assert.equal(db.prepare('SELECT active FROM products WHERE id=?').get(id).active,0);
  assert.equal(db.prepare('SELECT price,stock FROM product_variants WHERE product_id=? LIMIT 1').get(id).price,99);
  assert.equal(db.prepare('SELECT price,stock FROM product_variants WHERE product_id=? LIMIT 1').get(id).stock,2);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  db.close();
});

test('reset exclusivo local remove guardas e histórico de migração permitindo inicialização completa novamente',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(sql('schema.sql')); db.exec(sql('seed.sql'));
  const files=['0001_baseline.sql','0002_flexible_variants.sql','0003_official_catalog.sql'];
  for(const name of files) migrate(db,name);
  db.exec("CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY,name TEXT NOT NULL); INSERT INTO d1_migrations VALUES (1,'0001_baseline.sql')");
  db.exec("INSERT INTO order_mutation_guards (order_id,operation,valid_state) VALUES ('demo-order-001','resolve_payment',1)");
  db.exec('BEGIN IMMEDIATE'); db.exec(sql('reset.sql')); db.exec('COMMIT');
  assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name IN ('users','products','orders','order_mutation_guards','d1_migrations')").get().n,0);
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys,1);
  db.exec(sql('schema.sql')); db.exec(sql('seed.sql'));
  for(const name of files) migrate(db,name);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM products WHERE active=1').get().n,19);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM order_items').get().n,1);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  db.close();
});
