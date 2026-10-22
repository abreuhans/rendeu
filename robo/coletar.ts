// Robô de preços do Rendeu. Roda no GitHub Actions duas vezes por dia (ver .github/workflows/precos.yml):
// busca cada item do catálogo nos sites das lojas, escolhe as embalagens e grava um precos.json
// que o app baixa em segundo plano. Uso: node coletar.mjs <saida.json> [anterior.json] [--itens=a,b] [--lojas=x,y]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ITEM, lerPrecosSite, type LojaSite, type OfertaSite, type PrecosSite } from '../src/core';
import { escolherOfertas } from './escolher';
import { BUSCAS } from './itens';
import { LOJAS, type Loja, type Produto } from './lojas';
import { lerRobots, permitido, type Regras } from './robots';

const AGENTE = 'RendeuBot/1.0 (+https://github.com/abreuhans/rendeu)';
const PAUSA_MS = 700;
const espera = (ms: number) => new Promise(r => setTimeout(r, ms));

interface StatusLoja {
  ok: boolean;
  itens: number;
  buscas: number;
  erros: number;
  fonte: string;
  /** Data dos preços publicados desta loja (pode ser de uma coleta anterior se esta falhou). */
  data?: string;
  exemplosErro?: string[];
}

async function baixar(url: string): Promise<Response> {
  return fetch(url, { headers: { 'user-agent': AGENTE, accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
}

const robotsCache = new Map<string, Promise<Regras>>();
function robotsDe(url: string): Promise<Regras> {
  const host = new URL(url).origin;
  let r = robotsCache.get(host);
  if (!r) {
    r = baixar(host + '/robots.txt')
      .then(res => (res.ok ? res.text() : ''))
      .then(lerRobots)
      .catch(() => ({ allow: [], disallow: [] }));
    robotsCache.set(host, r);
  }
  return r;
}

async function buscar(loja: Loja, termo: string): Promise<Produto[]> {
  const url = loja.url(termo);
  if (!permitido(await robotsDe(url), url)) throw Object.assign(new Error('robots.txt não permite este caminho'), { definitivo: true });
  for (let tentativa = 0; ; tentativa++) {
    try {
      const res = await baixar(url);
      if (res.status === 429 || res.status >= 500) throw new Error('HTTP ' + res.status);
      if (!res.ok) throw Object.assign(new Error('HTTP ' + res.status), { definitivo: true });
      return loja.ler(await res.json());
    } catch (e) {
      if ((e as { definitivo?: boolean }).definitivo || tentativa >= 2) throw e;
      await espera(3000 * (tentativa + 1));
    }
  }
}

async function coletarLoja(loja: Loja, itens: string[]) {
  const resultado: Record<string, OfertaSite[]> = {};
  let buscas = 0, erros = 0;
  const exemplos: string[] = [];
  for (const id of itens) {
    const produtos: Produto[] = [];
    for (const termo of BUSCAS[id].busca) {
      buscas++;
      try {
        produtos.push(...(await buscar(loja, termo)));
      } catch (e) {
        erros++;
        if (exemplos.length < 5) exemplos.push(`${termo}: ${(e as Error).message}`);
        if (/robots/.test((e as Error).message)) return { resultado, buscas, erros, exemplos };
      }
      await espera(PAUSA_MS + Math.random() * 300);
    }
    const ofertas = escolherOfertas(id, produtos);
    if (ofertas.length) resultado[id] = ofertas;
  }
  return { resultado, buscas, erros, exemplos };
}

async function lerJson(caminho?: string): Promise<unknown> {
  if (!caminho) return null;
  try { return JSON.parse(await readFile(caminho, 'utf8')); } catch { return null; }
}

async function main() {
  const args = process.argv.slice(2);
  const opcao = (nome: string) => args.find(a => a.startsWith(`--${nome}=`))?.split('=')[1]?.split(',');
  const [saida = 'saida/precos.json', anteriorArq] = args.filter(a => !a.startsWith('--'));
  const soItens = opcao('itens'), soLojas = opcao('lojas');
  const itens = Object.keys(BUSCAS).filter(id => ITEM[id] && (!soItens || soItens.includes(id)));
  const lojas = LOJAS.filter(l => !soLojas || soLojas.includes(l.id));
  const anterior = lerPrecosSite(await lerJson(anteriorArq));
  const agora = new Date().toISOString();
  console.log(`Coletando ${itens.length} itens em ${lojas.length} lojas…`);

  const resultados = await Promise.all(lojas.map(async l => [l, await coletarLoja(l, itens)] as const));
  const publicadas: Record<string, LojaSite> = {};
  const status: Record<string, StatusLoja> = {};
  for (const [l, r] of resultados) {
    const n = Object.keys(r.resultado).length;
    // Uma coleta que trouxe poucos itens provavelmente falhou (site fora do ar, bloqueio): mantém a anterior.
    const ok = n >= Math.max(1, itens.length * 0.25);
    if (ok) publicadas[l.id] = { data: agora, itens: r.resultado };
    else if (anterior?.lojas[l.id]) publicadas[l.id] = anterior.lojas[l.id];
    status[l.id] = { ok, itens: n, buscas: r.buscas, erros: r.erros, fonte: l.fonte, data: publicadas[l.id]?.data, ...(r.exemplos.length ? { exemplosErro: r.exemplos } : {}) };
    console.log(`${l.nome}: ${n} itens com preço · ${r.buscas} buscas · ${r.erros} erros${ok ? '' : ' (mantidos os preços anteriores)'}`);
    for (const e of r.exemplos) console.log('   ' + e);
  }
  // Mesmo sem nenhuma loja, publica o status: é por ele que dá para ver o que falhou (o app ignora lojas vazias).
  if (!Object.keys(publicadas).length) console.warn('Nenhuma loja respondeu nesta coleta.');
  const arquivo: PrecosSite & { status: Record<string, StatusLoja> } = { versao: 1, geradoEm: agora, lojas: publicadas, status };
  await mkdir(dirname(saida), { recursive: true });
  await writeFile(saida, JSON.stringify(arquivo));
  console.log(`Gravado ${saida} (${(JSON.stringify(arquivo).length / 1024).toFixed(0)} KB).`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
