// Gera o protótipo web num único HTML: núcleo (src/core) + telas (web/prototipo).
// Uso: node scripts/prototipo.mjs [arquivo-de-saida]
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const raiz = resolve(import.meta.dirname, '..');
const ler = f => readFileSync(resolve(raiz, f), 'utf8');
const nucleo = await build({ entryPoints: [resolve(raiz, 'src/core/index.ts')], bundle: true, format: 'iife', globalName: 'Core', target: 'es2019', write: false, logLevel: 'warning' });
const js = [nucleo.outputFiles[0].text, ler('web/prototipo/ui-1.js'), ler('web/prototipo/ui-2.js'), ler('web/prototipo/ui-3.js')].join('\n');
const html = ler('web/prototipo/template.html')
  .replace('/*__CSS__*/', () => ler('web/prototipo/styles.css'))
  .replace('/*__JS__*/', () => js.replace(/<\/script/gi, '<\\/script'));
const saida = resolve(process.argv[2] || resolve(raiz, 'web/prototipo/dist/rendeu.html'));
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, html);
console.log(saida, (html.length / 1024).toFixed(1) + ' KB');
