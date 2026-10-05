import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { runWrangler } from './wrangler-runner.mjs';

// Seed e credenciais demonstrativas são exclusivos do banco local vazio.
try {
  const output = runWrangler(['d1', 'execute', 'DB', '--local', '--command',
    "SELECT COUNT(*) AS total FROM sqlite_master WHERE type='table' AND name='users'", '--json'], { capture: true });
  const result = JSON.parse(output);
  const count = result[0]?.results?.[0]?.total;
  if (!Number.isInteger(count)) throw new Error('Não foi possível confirmar o estado do banco local.');
  if (count === 0) {
    runWrangler(['d1', 'execute', 'DB', '--local', '--file=database/schema.sql', '--yes']);
    runWrangler(['d1', 'execute', 'DB', '--local', '--file=database/seed.sql', '--yes']);
  }
  runWrangler(['d1', 'migrations', 'apply', 'DB', '--local']);
  try {
    fs.writeFileSync(new URL('../.dev.vars', import.meta.url),
      `JWT_SECRET=${randomBytes(48).toString('hex')}\nAPP_ENV=development\n`, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  console.log('Ambiente local pronto. Dados anteriores e .dev.vars existente preservados.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
