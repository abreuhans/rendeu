// Coleta de preços: busca cada item do catálogo nos sites das lojas e escolhe as embalagens.
// Usada pelo GitHub Actions (coletar.ts) e no seu computador (publicar.ts).
// É educada: confere o robots.txt, se identifica, espera entre as buscas, respeita o
// "Retry-After" e desiste da loja quando o site deixa claro que está bloqueando.
import { ITEM, lerPrecosSite, type LojaSite, type OfertaSite, type PrecosSite } from '../src/core';
import { escolherOfertas } from './escolher';
import { BUSCAS } from './itens';
import { LOJAS, type Loja, type Produto } from './lojas';
import { lerRobots, permitido, type Regras } from './robots';

const AGENTE = 'RendeuBot/1.0 (+https://github.com/abreuhans/rendeu)';
/** Intervalo entre buscas na mesma loja (as lojas rodam em paralelo). */
const PAUSA_MS = 1500;
/** Erros seguidos que fazem o robô desistir da loja nesta coleta (bloqueio ou site fora do ar). */
const DESISTE_APOS = 6;
const espera = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface StatusLoja {
  ok: boolean;
  itens: number;
  buscas: number;
  erros: number;
  fonte: string;
  /** Data dos preços publicados desta loja (pode ser de uma coleta anterior se esta falhou). */
  data?: string;
  /** Por que a coleta desta loja parou antes do fim. */
  parou?: string;
  exemplosErro?: string[];
}

export type ArquivoPrecos = PrecosSite & { status: Record<string, StatusLoja> };

/** README publicado junto com o precos.json no branch "precos". */
export const LEIA_ME = `# Preços dos mercados (gerado automaticamente)

Este branch guarda só o \`precos.json\` que o app Rendeu baixa. Quem atualiza é o robô em \`robo/\`
(branch \`main\`): pelo GitHub Actions, duas vezes por dia, ou com \`npm run robo:publicar\` num computador.
O histórico de commits deste branch é o histórico de preços. Não edite à mão.
`;

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

/** Erro que não adianta repetir (robots.txt, bloqueio, pedido recusado). */
class Definitivo extends Error {}

async function buscar(loja: Loja, termo: string): Promise<Produto[]> {
  const url = loja.url(termo);
  if (!permitido(await robotsDe(url), url)) throw new Definitivo('robots.txt não permite este caminho');
  for (let tentativa = 0; ; tentativa++) {
    let res: Response | null = null;
    try {
      res = await baixar(url);
    } catch (e) {
      if (tentativa >= 2) throw e;
    }
    if (res?.ok) return loja.ler(await res.json());
    if (res && res.status >= 400 && res.status < 500 && res.status !== 429) {
      throw new Definitivo(`HTTP ${res.status}${res.status === 403 ? ' (o site recusou o acesso)' : ''}`);
    }
    if (tentativa >= 2) throw new Error(res ? `HTTP ${res.status}${res.status === 429 ? ' (pedidos demais)' : ''}` : 'sem resposta');
    // 429: espera o que o site pedir (até 1 min); erro de servidor ou rede: espera um pouco e tenta de novo.
    const pedido = Number(res?.headers.get('retry-after'));
    const segundos = res?.status === 429 ? Math.min(60, pedido > 0 ? pedido : 15 * 3 ** tentativa) : 5 * (tentativa + 1);
    await espera(segundos * 1000);
  }
}

async function coletarLoja(loja: Loja, itens: string[]) {
  const resultado: Record<string, OfertaSite[]> = {};
  let buscas = 0, erros = 0, seguidos = 0;
  let parou: string | undefined;
  const exemplos: string[] = [];
  fora: for (const id of itens) {
    const produtos: Produto[] = [];
    for (const termo of BUSCAS[id].busca) {
      buscas++;
      try {
        produtos.push(...(await buscar(loja, termo)));
        seguidos = 0;
      } catch (e) {
        erros++;
        seguidos++;
        const msg = (e as Error).message;
        if (exemplos.length < 5) exemplos.push(`${termo}: ${msg}`);
        if (/robots/.test(msg)) { parou = msg; break fora; }
        if (seguidos >= DESISTE_APOS) { parou = `${DESISTE_APOS} erros seguidos (${msg}): o site está bloqueando o robô ou fora do ar`; break fora; }
      }
      await espera(PAUSA_MS + Math.random() * 500);
    }
    const ofertas = escolherOfertas(id, produtos);
    if (ofertas.length) resultado[id] = ofertas;
  }
  return { resultado, buscas, erros, exemplos, parou };
}

export interface OpcoesColeta {
  itens?: string[];
  lojas?: string[];
  /** precos.json anterior: as lojas que falharem agora continuam com os preços dele. */
  anterior?: unknown;
  log?: (linha: string) => void;
}

export async function coletar({ itens: soItens, lojas: soLojas, anterior: bruto, log = console.log }: OpcoesColeta = {}): Promise<ArquivoPrecos> {
  const itens = Object.keys(BUSCAS).filter(id => ITEM[id] && (!soItens || soItens.includes(id)));
  const lojas = LOJAS.filter(l => !soLojas || soLojas.includes(l.id));
  const anterior = lerPrecosSite(bruto);
  const agora = new Date().toISOString();
  log(`Coletando ${itens.length} itens em ${lojas.length} lojas…`);

  const resultados = await Promise.all(lojas.map(async l => [l, await coletarLoja(l, itens)] as const));
  const publicadas: Record<string, LojaSite> = {};
  const status: Record<string, StatusLoja> = {};
  for (const [l, r] of resultados) {
    const n = Object.keys(r.resultado).length;
    // Uma coleta que trouxe poucos itens provavelmente falhou (site fora do ar, bloqueio): mantém a anterior.
    const ok = n >= Math.max(1, itens.length * 0.25);
    if (ok) publicadas[l.id] = { data: agora, itens: r.resultado };
    else if (anterior?.lojas[l.id]) publicadas[l.id] = anterior.lojas[l.id];
    status[l.id] = {
      ok, itens: n, buscas: r.buscas, erros: r.erros, fonte: l.fonte, data: publicadas[l.id]?.data,
      ...(r.parou ? { parou: r.parou } : {}), ...(r.exemplos.length ? { exemplosErro: r.exemplos } : {}),
    };
    log(`${l.nome}: ${n} itens com preço · ${r.buscas} buscas · ${r.erros} erros${ok ? '' : ' (mantidos os preços anteriores)'}`);
    if (r.parou) log(`   parou: ${r.parou}`);
    for (const e of r.exemplos) log('   ' + e);
  }
  // Mesmo sem nenhuma loja, o status vai junto: é por ele que dá para ver o que falhou (o app ignora lojas vazias).
  if (!Object.keys(publicadas).length) log('Nenhuma loja respondeu nesta coleta.');
  return { versao: 1, geradoEm: agora, lojas: publicadas, status };
}
