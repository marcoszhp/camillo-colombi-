import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const required = [
  'wrangler.jsonc','package.json','worker/index.js','worker/routes/auth.js','worker/routes/products.js','worker/routes/orders.js',
  'worker/routes/customer.js','worker/routes/loyalty.js','worker/routes/admin.js','database/schema.sql','database/seed.sql',
  'public/index.html','public/cafes.html','public/produto.html','public/checkout.html','public/admin/index.html','docs/CLOUDFLARE.md'
];

let errors = 0;
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) { console.error(`Faltando: ${file}`); errors += 1; }
}

const seed = fs.readFileSync(path.join(root, 'database/seed.sql'), 'utf8');
for (const forbidden of ['ON DUPLICATE KEY','INSERT IGNORE','AUTO_INCREMENT','ENGINE=InnoDB']) {
  if (seed.includes(forbidden)) { console.error(`Sintaxe MySQL ainda presente no seed: ${forbidden}`); errors += 1; }
}

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.wrangler') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full); else files.push(full);
  }
}
walk(path.join(root, 'public'));
for (const dir of ['worker', 'scripts', 'tests']) walk(path.join(root, dir));
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (['.js', '.mjs'].includes(ext)) {
    const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (syntax.status !== 0) { console.error(syntax.stderr || `Sintaxe inválida: ${file}`); errors += 1; }
  }
  if (!file.startsWith(path.join(root, 'public') + path.sep)) continue;
  if (!['.html','.css','.js','.svg'].includes(ext)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (ext === '.html') {
    for (const [, target] of text.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
      if (!target.startsWith('/') || target.startsWith('//')) continue;
      const clean = target.split(/[?#]/)[0];
      if (clean.startsWith('/api/')) continue;
      const local = path.join(root, 'public', clean);
      const candidates = [local, local + '.html', path.join(local, 'index.html')];
      if (!candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())) {
        console.error(`Referência quebrada em ${path.relative(root, file)}: ${target}`); errors += 1;
      }
    }
  }
  const matches = [...text.matchAll(/https?:\/\/[^\s"')>]+/g)].map((m) => m[0]);
  const realExternal = matches.filter((url) => !url.startsWith('http://www.w3.org/2000/svg'));
  if (realExternal.length) {
    console.error(`URL externa em ${path.relative(root,file)}: ${realExternal.join(', ')}`);
    errors += 1;
  }
}

const config = JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
if (!config.d1_databases?.some((item) => item.binding === 'DB')) { console.error('Binding D1 DB ausente.'); errors += 1; }
if (!config.assets?.run_worker_first?.includes('/api/*')) { console.error('API não está configurada para passar primeiro pelo Worker.'); errors += 1; }
if (config.d1_databases?.[0]?.migrations_dir !== 'database/migrations') { console.error('Diretório de migrations não configurado.'); errors += 1; }
const migrationsDir = path.join(root, 'database/migrations');
if (!fs.existsSync(migrationsDir) || fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).length < 3) {
  console.error('Migrations do catálogo incompletas.'); errors += 1;
}

if (errors) {
  console.error(`\n${errors} problema(s) encontrado(s).`);
  process.exit(1);
}
console.log(`Projeto Cloudflare validado: ${required.length} arquivos críticos, assets locais e configuração D1 OK.`);
