import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('seed não contém sintaxe exclusiva do MySQL', () => {
  const seed = fs.readFileSync(new URL('../database/seed.sql', import.meta.url), 'utf8');
  assert.equal(/ON DUPLICATE KEY|INSERT IGNORE|ENGINE=InnoDB|AUTO_INCREMENT/.test(seed), false);
});

test('config usa assets + D1', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.assets.directory, './public');
  assert.equal(config.d1_databases[0].binding, 'DB');
});
