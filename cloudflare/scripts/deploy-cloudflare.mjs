import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runWrangler } from './wrangler-runner.mjs';

// Publicação de instalação existente. Não altera secrets nem carrega seed.
const root = fileURLToPath(new URL('../', import.meta.url));
const branch = process.env.WORKERS_CI_BRANCH;
if (branch && branch !== 'main') {
  console.error('Deploy de produção permitido somente para main no Workers Builds.');
  process.exit(1);
}
try {
  for (const args of [['scripts/check-project.mjs'], ['--test', 'tests/*.test.mjs']]) {
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('A validação falhou; publicação interrompida.');
  }
  console.log('Aplicando migrations pendentes ao D1 existente...');
  runWrangler(['d1', 'migrations', 'apply', 'DB', '--remote']);
  console.log('Publicando Worker e assets; JWT_SECRET existente preservado.');
  runWrangler(['deploy']);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
