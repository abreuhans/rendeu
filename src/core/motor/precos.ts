// Preços por mercado e a conta de compra: quantas embalagens levar de cada item.
// Ordem de confiança: nota fiscal recente da pessoa > site do mercado (robô, 2× por dia) >
// nota antiga > estimativa (ancorada nos preços dos sites quando eles existem).
import { ITEM, MERCADOS } from '../dados/catalogo';
import type { Secao } from '../tipos';
import { type LojaSite, type PrecosSite, lojasValidas, unitarioMinimo } from './site';

export interface Opcao {
  tamanho: number;
  preco: number;
  rotulo: string;
  /** Promoção no site do mercado. */
  oferta: boolean;
  /** Preço veio de nota fiscal (não é estimativa). */
  real: boolean;
  /** Preço veio do site do mercado. */
  site?: boolean;
  /** Preço por kg (hortifrúti a granel), para mostrar como na gôndola. */
  kg?: number;
}

/** Preços reais por unidade base, chave `${mercadoId}:${itemId}`. */
export type PrecosReais = Record<string, { porUnidade: number; data: string }>;

/** De onde vêm os preços além da estimativa. */
export interface FontesPreco {
  reais?: PrecosReais;
  site?: PrecosSite | null;
  /** Momento de referência para a validade dos preços (testes). */
  agora?: number;
}

/** Nota fiscal com até 30 dias vale mais que o site; mais velha, só se o site não tiver o item. */
export const NOTA_RECENTE_DIAS = 30;

export interface Tabela {
  mercados: string[];
  /** opcoes[itemId][mercadoId] */
  opcoes: Record<string, Record<string, Opcao[]>>;
  /** Compras já calculadas (item e quantidade), para o planejador não refazer a conta. */
  memo: Map<string, Compra>;
}

export interface Compra {
  mercado: string;
  pacotes: { rotulo: string; tamanho: number; preco: number; qtd: number }[];
  custo: number;
  comprado: number;
  oferta: boolean;
  real: boolean;
  site?: boolean;
  kg?: number;
}

export interface ItemCompra {
  id: string;
  necessidade: number;
  /** Já tem em casa: não entra na conta. */
  emCasa: boolean;
  compra?: Compra;
  custo: number;
  sobra: number;
}

export interface CustoPlano {
  total: number;
  itens: ItemCompra[];
  /** Quanto do valor comprado é usado nas receitas (0–1). */
  aproveitamento: number;
  /** Valor estimado de perecíveis que sobram. */
  desperdicio: number;
  /** Valor do que sobra e dura (despensa, congelador): fica para as próximas semanas. */
  guardado: number;
}

/** Sobras destas seções estragam rápido. Carne sobra mas dá para congelar. */
export const PERECIVEIS = new Set<Secao>(['hortifruti', 'frios', 'padaria']);

const MERCADO = Object.fromEntries(MERCADOS.map(m => [m.id, m]));
const r2 = (x: number) => Math.round(x * 100) / 100;

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Arredonda como na gôndola: R$ 24,90 / 24,99 acima de 10; R$ 4,39 abaixo. */
function precoGondola(x: number, semente: string): number {
  if (x >= 10) return Math.floor(x) + (hash(semente) % 2 ? 0.9 : 0.99);
  return r2(Math.max(0.3, Math.floor(x * 10) / 10) + 0.09);
}

/** "21/10/2026" ou "21/10/2026 18:03:11" (data da nota) → milissegundos. */
export function dataBr(s: string): number {
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? Date.UTC(+m[3], +m[2] - 1, +m[1], 12) : Date.parse(s);
}

/** Preço de referência por unidade no catálogo (a embalagem que rende mais). */
export function unitarioCatalogo(itemId: string): number {
  const it = ITEM[itemId];
  if (it.granel) return (it.granel.kg * it.granel.pesoUn) / 1000;
  return Math.min(...(it.pk || []).map(([t, p]) => p / t));
}

const ancoras = new WeakMap<Record<string, LojaSite>, Record<string, number>>();

/**
 * Quanto o preço de cada item nos sites está acima ou abaixo da referência do catálogo
 * (mediana entre as lojas, já descontado o nível de preço de cada loja). Serve para
 * estimar os mercados sem site acompanhando o preço de verdade (ex.: tomate subiu 40%).
 */
export function ancorasDoSite(lojas: Record<string, LojaSite>): Record<string, number> {
  let a = ancoras.get(lojas);
  if (a) return a;
  a = {};
  for (const id in ITEM) {
    const vals: number[] = [];
    for (const [mid, l] of Object.entries(lojas)) {
      const ofs = l.itens[id];
      if (ofs?.length && MERCADO[mid]) vals.push(unitarioMinimo(ofs) / MERCADO[mid].fator);
    }
    if (!vals.length) continue;
    vals.sort((x, y) => x - y);
    const meio = vals.length / 2;
    const mediana = vals.length % 2 ? vals[Math.floor(meio)] : (vals[meio - 1] + vals[meio]) / 2;
    a[id] = Math.max(0.5, Math.min(2, mediana / unitarioCatalogo(id)));
  }
  ancoras.set(lojas, a);
  return a;
}

/** Embalagens de um item num mercado: nota fiscal, site do mercado ou estimativa. */
export function opcoesItem(itemId: string, mercadoId: string, fontes?: FontesPreco, lojas = lojasValidas(fontes?.site, fontes?.agora)): Opcao[] {
  const it = ITEM[itemId];
  const m = MERCADO[mercadoId];
  const real = fontes?.reais?.[mercadoId + ':' + itemId];
  const site = lojas[mercadoId]?.itens[itemId];
  const recente = !!real && (fontes?.agora ?? Date.now()) - dataBr(real.data) <= NOTA_RECENTE_DIAS * 864e5;
  if (real && (recente || !site)) {
    if (it.granel) {
      const { pesoUn } = it.granel;
      return [{ tamanho: 1, preco: r2(real.porUnidade), rotulo: `unidade (~${pesoUn} g)`, oferta: false, real: true, kg: r2((real.porUnidade * 1000) / pesoUn) }];
    }
    return (it.pk || []).map(([tamanho, , rotulo]) => ({ tamanho, rotulo, oferta: false, real: true, preco: r2(real.porUnidade * tamanho) }));
  }
  if (site) {
    return [...site].sort((a, b) => a.tamanho - b.tamanho).map(o => ({
      tamanho: o.tamanho, preco: o.preco, rotulo: o.nome, oferta: !!o.promo, real: false, site: true, ...(o.kg ? { kg: o.kg } : {}),
    }));
  }
  const ancora = ancorasDoSite(lojas)[itemId] ?? 1;
  const mult = m.fator * ancora * (1 + ((hash(mercadoId + ':' + itemId) % 19) - 9) / 100);
  if (it.granel) {
    const { pesoUn } = it.granel;
    const kg = precoGondola(it.granel.kg * mult, mercadoId + itemId);
    return [{ tamanho: 1, preco: r2((kg * pesoUn) / 1000), rotulo: `unidade (~${pesoUn} g)`, oferta: false, real: false, kg }];
  }
  return (it.pk || []).map(([tamanho, preco, rotulo]) => ({
    tamanho, rotulo, oferta: false, real: false, preco: precoGondola(preco * mult, mercadoId + itemId + tamanho),
  }));
}

export function tabela(mercados: string[], fontes?: FontesPreco): Tabela {
  const lojas = lojasValidas(fontes?.site, fontes?.agora);
  const opcoes: Tabela['opcoes'] = {};
  for (const id in ITEM) {
    opcoes[id] = {};
    for (const m of mercados) opcoes[id][m] = opcoesItem(id, m, fontes, lojas);
  }
  return { mercados, opcoes, memo: new Map() };
}

/** Combinação mais barata de embalagens que cobre a necessidade. */
export function melhorCombinacao(opcoes: Opcao[], necessidade: number): { pacotes: Compra['pacotes']; custo: number; comprado: number } {
  const ops = [...opcoes].sort((a, b) => a.tamanho - b.tamanho);
  const eps = 1e-9;
  let melhor = { pacotes: [] as Compra['pacotes'], custo: Infinity, comprado: 0 };
  const testar = (qtds: number[]) => {
    let custo = 0, comprado = 0;
    qtds.forEach((q, i) => { custo += q * ops[i].preco; comprado += q * ops[i].tamanho; });
    if (comprado + eps < necessidade) return;
    if (custo < melhor.custo - eps || (Math.abs(custo - melhor.custo) < eps && comprado < melhor.comprado)) {
      melhor = { custo, comprado, pacotes: qtds.map((q, i) => ({ rotulo: ops[i].rotulo, tamanho: ops[i].tamanho, preco: ops[i].preco, qtd: q })).filter(p => p.qtd > 0) };
    }
  };
  const menor = (rest: number, i: number) => Math.max(0, Math.ceil(rest / ops[i].tamanho - eps));
  if (ops.length === 1) testar([menor(necessidade, 0)]);
  else if (ops.length === 2) {
    for (let b = 0; b <= menor(necessidade, 1); b++) testar([menor(necessidade - b * ops[1].tamanho, 0), b]);
  } else {
    const k = ops.length - 1;
    for (let c = 0; c <= menor(necessidade, k); c++) {
      const rest = necessidade - c * ops[k].tamanho;
      for (let b = 0; b <= menor(rest, k - 1); b++) {
        const qs = new Array(ops.length).fill(0);
        qs[k] = c; qs[k - 1] = b; qs[0] = menor(rest - b * ops[k - 1].tamanho, 0);
        testar(qs);
      }
    }
  }
  melhor.custo = r2(melhor.custo);
  return melhor;
}

/** Em qual mercado (da lista) sai mais barato comprar esta quantidade. */
export function melhorCompra(itemId: string, necessidade: number, tab: Tabela): Compra {
  const chave = itemId + ':' + Math.round(necessidade * 1000);
  const salvo = tab.memo.get(chave);
  if (salvo) return salvo;
  let best: Compra | null = null;
  for (const m of tab.mercados) {
    const ops = tab.opcoes[itemId][m];
    const c = melhorCombinacao(ops, necessidade);
    if (!best || c.custo < best.custo) {
      best = { mercado: m, ...c, oferta: ops.some(o => o.oferta), real: ops.some(o => o.real), site: ops.some(o => o.site), kg: ops[0].kg };
    }
  }
  tab.memo.set(chave, best!);
  return best!;
}

/** Custo exato de um conjunto de necessidades (item → quantidade). */
export function custoNecessidades(necessidades: Map<string, number>, tab: Tabela, emCasa: Set<string>): CustoPlano {
  let total = 0, usado = 0, desperdicio = 0, guardado = 0;
  const itens: ItemCompra[] = [];
  for (const [id, q] of necessidades) {
    if (emCasa.has(id)) { itens.push({ id, necessidade: q, emCasa: true, custo: 0, sobra: 0 }); continue; }
    const compra = melhorCompra(id, q, tab);
    total += compra.custo;
    const fracUsada = compra.comprado > 0 ? q / compra.comprado : 1;
    usado += compra.custo * fracUsada;
    if (PERECIVEIS.has(ITEM[id].secao)) desperdicio += compra.custo * (1 - fracUsada);
    else guardado += compra.custo * (1 - fracUsada);
    itens.push({ id, necessidade: q, emCasa: false, compra, custo: compra.custo, sobra: Math.max(0, compra.comprado - q) });
  }
  return { total: r2(total), itens, aproveitamento: total > 0 ? usado / total : 1, desperdicio, guardado };
}

/** Preço por unidade base mais barato entre os mercados (para estimativas rápidas). */
export function precoUnitarioMinimo(itemId: string, tab: Tabela): { porUnidade: number; menorPacote: number; precoMenor: number } {
  let best = { porUnidade: Infinity, menorPacote: 1, precoMenor: 0 };
  for (const m of tab.mercados) {
    const ops = tab.opcoes[itemId][m];
    const menor = ops.reduce((a, b) => (a.tamanho <= b.tamanho ? a : b));
    const pu = Math.min(...ops.map(o => o.preco / o.tamanho));
    if (menor.preco / menor.tamanho < best.porUnidade || pu < best.porUnidade) {
      best = { porUnidade: Math.min(pu, best.porUnidade), menorPacote: menor.tamanho, precoMenor: menor.preco };
    }
  }
  return best;
}
