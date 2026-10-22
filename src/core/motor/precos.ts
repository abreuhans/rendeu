// Preços por mercado e a conta de compra: quantas embalagens levar de cada item.
import { ITEM, MERCADOS, OFERTAS } from '../dados/catalogo';
import type { Secao } from '../tipos';

export interface Opcao {
  tamanho: number;
  preco: number;
  rotulo: string;
  oferta: boolean;
  /** Preço veio de nota fiscal (não é estimativa). */
  real: boolean;
  /** Preço por kg (hortifrúti a granel), para mostrar como na gôndola. */
  kg?: number;
}

/** Preços reais por unidade base, chave `${mercadoId}:${itemId}`. */
export type PrecosReais = Record<string, { porUnidade: number; data: string }>;

export interface Tabela {
  mercados: string[];
  /** opcoes[itemId][mercadoId] */
  opcoes: Record<string, Record<string, Opcao[]>>;
}

export interface Compra {
  mercado: string;
  pacotes: { rotulo: string; tamanho: number; preco: number; qtd: number }[];
  custo: number;
  comprado: number;
  oferta: boolean;
  real: boolean;
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

/** Embalagens de um item num mercado (estimativa ou preço real de nota). */
export function opcoesItem(itemId: string, mercadoId: string, reais?: PrecosReais): Opcao[] {
  const it = ITEM[itemId];
  const m = MERCADO[mercadoId];
  const real = reais && reais[mercadoId + ':' + itemId];
  const oferta = !real && OFERTAS[mercadoId] && OFERTAS[mercadoId][itemId];
  const mult = m.fator * (1 + ((hash(mercadoId + ':' + itemId) % 19) - 9) / 100) * (oferta || 1);
  if (it.granel) {
    const { pesoUn } = it.granel;
    if (real) {
      return [{ tamanho: 1, preco: r2(real.porUnidade), rotulo: `unidade (~${pesoUn} g)`, oferta: false, real: true, kg: r2((real.porUnidade * 1000) / pesoUn) }];
    }
    const kg = precoGondola(it.granel.kg * mult, mercadoId + itemId);
    return [{ tamanho: 1, preco: r2((kg * pesoUn) / 1000), rotulo: `unidade (~${pesoUn} g)`, oferta: !!oferta, real: false, kg }];
  }
  return (it.pk || []).map(([tamanho, preco, rotulo]) => ({
    tamanho, rotulo, oferta: !!oferta, real: !!real,
    preco: real ? r2(real.porUnidade * tamanho) : precoGondola(preco * mult, mercadoId + itemId + tamanho),
  }));
}

export function tabela(mercados: string[], reais?: PrecosReais): Tabela {
  const opcoes: Tabela['opcoes'] = {};
  for (const id in ITEM) {
    opcoes[id] = {};
    for (const m of mercados) opcoes[id][m] = opcoesItem(id, m, reais);
  }
  return { mercados, opcoes };
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
  let best: Compra | null = null;
  for (const m of tab.mercados) {
    const ops = tab.opcoes[itemId][m];
    const c = melhorCombinacao(ops, necessidade);
    if (!best || c.custo < best.custo) {
      best = { mercado: m, ...c, oferta: ops.some(o => o.oferta), real: ops.some(o => o.real), kg: ops[0].kg };
    }
  }
  return best as Compra;
}

/** Custo exato de um conjunto de necessidades (item → quantidade). */
export function custoNecessidades(necessidades: Map<string, number>, tab: Tabela, emCasa: Set<string>): CustoPlano {
  let total = 0, usado = 0, desperdicio = 0;
  const itens: ItemCompra[] = [];
  for (const [id, q] of necessidades) {
    if (emCasa.has(id)) { itens.push({ id, necessidade: q, emCasa: true, custo: 0, sobra: 0 }); continue; }
    const compra = melhorCompra(id, q, tab);
    total += compra.custo;
    const fracUsada = compra.comprado > 0 ? q / compra.comprado : 1;
    usado += compra.custo * fracUsada;
    if (PERECIVEIS.has(ITEM[id].secao)) desperdicio += compra.custo * (1 - fracUsada);
    itens.push({ id, necessidade: q, emCasa: false, compra, custo: compra.custo, sobra: Math.max(0, compra.comprado - q) });
  }
  return { total: r2(total), itens, aproveitamento: total > 0 ? usado / total : 1, desperdicio };
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
