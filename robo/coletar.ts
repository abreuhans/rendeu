// Robô de preços no GitHub Actions (.github/workflows/precos.yml): coleta e grava o arquivo;
// quem publica no branch "precos" é o próprio workflow.
// Uso: node coletar.mjs <saida.json> [anterior.json] [--itens=a,b] [--lojas=x,y]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { LEIA_ME, coletar } from './coleta';

async function lerJson(caminho?: string): Promise<unknown> {
  if (!caminho) return null;
  try { return JSON.parse(await readFile(caminho, 'utf8')); } catch { return null; }
}

async function main() {
  const args = process.argv.slice(2);
  const opcao = (nome: string) => args.find(a => a.startsWith(`--${nome}=`))?.split('=')[1]?.split(',');
  const [saida = 'saida/precos.json', anterior] = args.filter(a => !a.startsWith('--'));
  const arquivo = await coletar({ itens: opcao('itens'), lojas: opcao('lojas'), anterior: await lerJson(anterior) });
  await mkdir(dirname(saida), { recursive: true });
  await writeFile(saida, JSON.stringify(arquivo));
  await writeFile(join(dirname(saida), 'README.md'), LEIA_ME);
  console.log(`Gravado ${saida} (${(JSON.stringify(arquivo).length / 1024).toFixed(0)} KB).`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
