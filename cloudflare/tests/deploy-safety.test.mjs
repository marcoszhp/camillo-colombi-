import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

test('deploy recusa branch de preview antes de tocar no D1', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const result = spawnSync(process.execPath, ['scripts/deploy-cloudflare.mjs'], {
    cwd: root, env: { ...process.env, WORKERS_CI_BRANCH: 'codex/test-preview' }, encoding: 'utf8'
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /somente para main/);
  assert.equal(result.stdout, '');
});

test('publicação preserva autenticação e usa migrations, sem seed/reset remoto', () => {
  const source = readFileSync(new URL('../scripts/deploy-cloudflare.mjs', import.meta.url), 'utf8');
  assert.match(source, /'migrations', 'apply', 'DB', '--remote'/);
  assert.doesNotMatch(source, /secret.*put|seed\.sql|reset\.sql|randomBytes/);
  const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.d1_databases[0].migrations_dir, 'database/migrations');
});
