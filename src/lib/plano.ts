// Contas e textos derivados do plano, usados pelas telas de resultado e receita.
import {
  COZINHAS, ITEM, PERECIVEIS, RECEITA,
  dinheiro, numero, precoPorMedida, precoUnitarioMinimo, tabela,
  type FontesPreco, type ItemCompra, type Plano, type Tabela, type Variante,
} from '@/core';
import { ORDEM_SECOES, nomeMercado, plural } from './textos';

const cacheTabela = new WeakMap<Plano, Tabela>();

/** Tabela de preços dos mercados do plano (cada plano é recalculado quando os preços mudam). */
export function tabelaDo(plano: Plano, fontes?: FontesPreco): Tabela {
  let t = cacheTabela.get(plano);
  if (!t) {
    t = tabela(plano.mercados, fontes);
    cacheTabela.set(plano, t);
  }
  return t;
}

export const fmtDelta = (d: number) =>
  Math.abs(d) < 0.005 ? 'mesmo total' : (d > 0 ? '+' : '−') + dinheiro(Math.abs(d));

export function infoReceita(v: Variante): { nome: string; tempo: number; cozinha: string } {
  if (v.ia) return { nome: v.ia.nome, tempo: v.ia.tempo, cozinha: '' };
  const r = RECEITA[v.rid];
  return { nome: r.nome, tempo: r.tempo, cozinha: COZINHAS.find(x => x.id === r.cozinha)?.nome ?? '' };
}

/** Custo aproximado de uma porção (sem contar o que já tem em casa). */
export function custoPorcao(plano: Plano, v: Variante, fontes?: FontesPreco): number {
  const tab = tabelaDo(plano, fontes);
  const casa = new Set(plano.prefs.despensa);
  let c = 0;
  for (const l of v.linhas) if (!casa.has(l.id)) c += l.q * precoUnitarioMinimo(l.id, tab).porUnidade;
  return c;
}

/** Almoço que repete o jantar da véspera (marmita). */
export function ehSobra(plano: Plano, i: number): boolean {
  const s = plano.slots[i];
  if (s.r !== 'L' || s.d === 0) return false;
  const j = plano.slots.findIndex(x => x.d === s.d - 1 && x.r === 'D');
  if (j < 0) return false;
  const a = plano.vmap[plano.keys[i]];
  const b = plano.vmap[plano.keys[j]];
  return a.rid === b.rid && !a.ia && !!RECEITA[a.rid]?.sobra;
}

export function selos(plano: Plano, i: number): string[] {
  const v = plano.vmap[plano.keys[i]];
  const out: string[] = [];
  if (ehSobra(plano, i)) out.push('Sobra do jantar');
  if (v.lowcarb) out.push('Versão low carb');
  return out;
}

/** "2× pacote 1 kg · R$ 5,79/kg" ou "4 unidades (~480 g) · R$ 7,99/kg". */
export function descricaoCompra(x: ItemCompra): string {
  const it = ITEM[x.id];
  const c = x.compra!;
  if (it.granel) {
    const n = c.pacotes.reduce((a, p) => a + p.qtd, 0);
    return `${n} ${plural(n, 'unidade', 'unidades')} (~${numero(n * it.granel.pesoUn)} g) · ${dinheiro(c.kg ?? 0)}/kg`;
  }
  const pac = c.pacotes.map(p => `${p.qtd > 1 ? p.qtd + '× ' : ''}${p.rotulo}`).join(' + ');
  const maior = c.pacotes[c.pacotes.length - 1];
  const medida = maior ? precoPorMedida(x.id, maior.preco, maior.tamanho) : '';
  return pac + (medida ? ` · ${medida}` : '');
}

/** De onde veio o preço de uma compra: nota fiscal lida, site do mercado ou estimativa. */
export const origemPreco = (x: ItemCompra): 'nota' | 'site' | 'estimado' => (x.compra?.real ? 'nota' : x.compra?.site ? 'site' : 'estimado');

/** Itens a comprar, por mercado, seção do mercado e nome. */
export function linhasCompra(plano: Plano): ItemCompra[] {
  return plano.custo.itens
    .filter(x => !x.emCasa && x.compra)
    .sort((a, b) =>
      a.compra!.mercado.localeCompare(b.compra!.mercado)
      || ORDEM_SECOES.indexOf(ITEM[a.id].secao) - ORDEM_SECOES.indexOf(ITEM[b.id].secao)
      || ITEM[a.id].nome.localeCompare(ITEM[b.id].nome));
}

export function mercadosUsados(plano: Plano): string[] {
  return [...new Set(linhasCompra(plano).map(x => x.compra!.mercado))];
}

/** Texto da lista para copiar ou mandar no WhatsApp. */
export function textoLista(plano: Plano): string {
  const linhas = linhasCompra(plano);
  const titulo = `Rendeu — Lista de compras (${mercadosUsados(plano).map(nomeMercado).join(' + ')})`;
  const corpo = linhas.map(x => `[ ] ${ITEM[x.id].nome} — ${descricaoCompra(x)} — ${dinheiro(x.custo)}`);
  return [titulo, ...corpo, '', `TOTAL: ${dinheiro(plano.custo.total)} (orçamento ${dinheiro(plano.prefs.orcamento)})`].join('\n');
}

/** O que já tem em casa e o que sobra depois do plano. */
export function resumoSobras(plano: Plano) {
  const emCasa = plano.custo.itens.filter(x => x.emCasa).map(x => ITEM[x.id].nome);
  const sobras = plano.custo.itens.filter(x => !x.emCasa && x.compra && x.sobra > x.compra.comprado * 0.04);
  const pereciveis = sobras.filter(x => PERECIVEIS.has(ITEM[x.id].secao));
  const despensa = sobras.filter(x => !PERECIVEIS.has(ITEM[x.id].secao));
  const valorDespensa = despensa.reduce((a, x) => a + (x.sobra / x.compra!.comprado) * x.custo, 0);
  return { emCasa, pereciveis, despensa, valorDespensa };
}
