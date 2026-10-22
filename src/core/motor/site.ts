// Preços dos sites dos mercados, coletados pelo robô (robo/coletar.ts) duas vezes por dia
// e publicados como um JSON público (branch `precos` do repositório). O app só lê.
import { ITEM, MERCADOS } from '../dados/catalogo';

/** Uma embalagem encontrada no site, já convertida para a unidade base do item. */
export interface OfertaSite {
  /** Tamanho na unidade do item (g, ml, un, fatia...). Hortifrúti por unidade: 1 (peso médio). */
  tamanho: number;
  preco: number;
  /** Nome do produto no site (marca e embalagem), para a lista de compras. */
  nome: string;
  /** Preço por kg, quando o produto é vendido a peso. */
  kg?: number;
  /** Preço promocional (abaixo do preço "de"). */
  promo?: boolean;
}

export interface LojaSite {
  /** Quando os preços desta loja foram lidos (ISO). */
  data: string;
  itens: Record<string, OfertaSite[]>;
}

export interface PrecosSite {
  versao: 1;
  geradoEm: string;
  lojas: Record<string, LojaSite>;
}

/** Preço de loja com mais de uma semana não entra (melhor uma estimativa do que um preço velho). */
export const VALIDADE_SITE_DIAS = 7;

const numeroOk = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** Confere o JSON baixado: descarta o que não tiver o formato esperado, sem confiar no conteúdo. */
export function lerPrecosSite(x: unknown): PrecosSite | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (o.versao !== 1 || typeof o.geradoEm !== 'string' || !o.lojas || typeof o.lojas !== 'object') return null;
  const lojas: Record<string, LojaSite> = {};
  for (const m of MERCADOS) {
    const l = (o.lojas as Record<string, unknown>)[m.id] as Record<string, unknown> | undefined;
    if (!l || typeof l.data !== 'string' || !l.itens || typeof l.itens !== 'object') continue;
    const itens: Record<string, OfertaSite[]> = {};
    for (const [id, lista] of Object.entries(l.itens as Record<string, unknown>)) {
      if (!ITEM[id] || !Array.isArray(lista)) continue;
      const ofertas = lista
        .filter((z): z is OfertaSite => !!z && numeroOk(z.tamanho) && numeroOk(z.preco) && typeof z.nome === 'string')
        .slice(0, 4)
        .map(z => ({ tamanho: z.tamanho, preco: z.preco, nome: z.nome.slice(0, 120), ...(numeroOk(z.kg) ? { kg: z.kg } : {}), ...(z.promo ? { promo: true } : {}) }));
      if (ofertas.length) itens[id] = ofertas;
    }
    lojas[m.id] = { data: l.data, itens };
  }
  return { versao: 1, geradoEm: o.geradoEm, lojas };
}

/** Lojas com preço de site ainda válido em `agora`. */
export function lojasValidas(site: PrecosSite | null | undefined, agora = Date.now()): Record<string, LojaSite> {
  const out: Record<string, LojaSite> = {};
  if (!site) return out;
  for (const [id, l] of Object.entries(site.lojas)) {
    const t = Date.parse(l.data);
    if (Number.isFinite(t) && agora - t <= VALIDADE_SITE_DIAS * 864e5) out[id] = l;
  }
  return out;
}

/** Preço por unidade mais barato entre as ofertas. */
export const unitarioMinimo = (ofertas: OfertaSite[]) => Math.min(...ofertas.map(o => o.preco / o.tamanho));
