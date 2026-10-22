// Do produto do site para a oferta do app: confere se é o item certo, converte o tamanho para a
// unidade do item e escolhe as embalagens mais baratas parecidas com as do catálogo.
import { ITEM, itemDaDescricao, normalizar, quantidade, tamanhoNaDescricao, unitarioCatalogo, type OfertaSite } from '../src/core';
import { BUSCAS, EXCLUI_SEMPRE, MULTIPACK } from './itens';
import type { Produto } from './lojas';

const r2 = (x: number) => Math.round(x * 100) / 100;

/** O produto é este item? (regras da nota fiscal + filtros do robô) */
export function produtoServe(itemId: string, p: Produto): boolean {
  if (!p.disponivel || !(p.preco > 0)) return false;
  const b = BUSCAS[itemId];
  const n = normalizar(p.nome);
  if (itemDaDescricao(p.nome) !== itemId) return false;
  if (EXCLUI_SEMPRE.test(n) || (b?.exclui && b.exclui.test(n))) return false;
  if (b?.inclui && !b.inclui.test(n)) return false;
  if (b?.semPeso && p.porKg) return false;
  const u = ITEM[itemId].u;
  if ((u === 'g' || u === 'ml') && MULTIPACK.test(n)) return false;
  return true;
}

/** Gramas (ou ml) do produto: primeiro o nome, depois o que a loja informa. */
function gramas(p: Produto, u: 'g' | 'ml'): number | null {
  const t = tamanhoNaDescricao(p.nome, u);
  if (t) return t;
  if (p.tamanho && p.tamanho.unidade === u) return p.tamanho.valor;
  return null;
}

/** Unidades do produto (ovos, pães, tabletes): nome ou dado da loja. */
function contagem(p: Produto): number | null {
  const t = tamanhoNaDescricao(p.nome, 'un');
  if (t) return t;
  if (p.tamanho?.unidade === 'un') return p.tamanho.valor;
  return null;
}

const rotuloMedida = (itemId: string, t: number) => quantidade(itemId, t).replace(/ \(sopa\)| \(chá\)/, '');

/** Ofertas candidatas (na unidade do item) que um produto gera. */
export function candidatas(itemId: string, p: Produto): OfertaSite[] {
  const it = ITEM[itemId];
  const b = BUSCAS[itemId] || { busca: [] };
  const promo = p.promo ? { promo: true } : {};
  const nome = p.nome.trim().replace(/\s+/g, ' ');
  // Hortifrúti vendido por unidade no app (banana, tomate...): o que importa é o preço por kg.
  if (it.granel) {
    const { pesoUn } = it.granel;
    let kg: number | null = null;
    if (p.porKg) kg = p.preco;
    else {
      const g = gramas(p, 'g');
      if (g) kg = p.preco / (g / 1000);
      else if (/\bUN\b|UNIDADE|\bUND\b/.test(normalizar(nome))) kg = (p.preco / (contagem(p) || 1)) * (1000 / pesoUn);
    }
    if (!kg) return [];
    return [{ tamanho: 1, preco: r2((kg * pesoUn) / 1000), kg: r2(kg), nome, ...promo }];
  }
  const tamanhos = (it.pk || []).map(([t]) => t);
  if (it.u === 'g' || it.u === 'ml') {
    // A peso (balcão de frios, açougue, hortifrúti): vira as embalagens do catálogo.
    if (p.porKg) return tamanhos.map(t => ({ tamanho: t, preco: r2((p.preco * t) / 1000), kg: r2(p.preco), nome: `${nome} (${rotuloMedida(itemId, t)})`, ...promo }));
    let g = gramas(p, it.u);
    if (!g && b.gPorUn && /\bUN\b|UNIDADE|\bUND\b|\bPE\b|MACO/.test(normalizar(nome))) g = b.gPorUn;
    return g ? [{ tamanho: g, preco: r2(p.preco), nome, ...promo }] : [];
  }
  // Itens contados (un, dente, fatia, tablete).
  const porUn = b.gPorUn;
  if (p.porKg) {
    if (!porUn) return [];
    const precoUn = (p.preco * porUn) / 1000;
    return tamanhos.map(t => ({ tamanho: t, preco: r2(precoUn * t), kg: r2(p.preco), nome: `${nome} (${rotuloMedida(itemId, t)})`, ...promo }));
  }
  let n = contagem(p);
  if (!n && porUn) {
    const g = gramas(p, 'g');
    if (g) n = Math.max(1, Math.round(g / porUn));
  }
  if (!n && tamanhos.length === 1 && tamanhos[0] === 1) n = 1;
  return n ? [{ tamanho: n, preco: r2(p.preco), nome, ...promo }] : [];
}

/** Preço por unidade razoável perto da referência (protege contra produto errado ou erro do site). */
export const FAIXA_REFERENCIA: [number, number] = [0.3, 3];

/**
 * Até 3 ofertas por item: para cada embalagem do catálogo, a mais barata (por unidade) de tamanho
 * parecido. Hortifrúti por unidade: só a mais barata por kg.
 */
export function escolherOfertas(itemId: string, produtos: Produto[]): OfertaSite[] {
  const it = ITEM[itemId];
  const ref = unitarioCatalogo(itemId);
  const todas = produtos
    .filter(p => produtoServe(itemId, p))
    .flatMap(p => candidatas(itemId, p))
    .filter(o => {
      const u = o.preco / o.tamanho;
      return u >= ref * FAIXA_REFERENCIA[0] && u <= ref * FAIXA_REFERENCIA[1];
    });
  if (!todas.length) return [];
  const unit = (o: OfertaSite) => o.preco / o.tamanho;
  if (it.granel) return [todas.reduce((a, b) => (unit(b) < unit(a) ? b : a))];
  const tamanhos = (it.pk || []).map(([t]) => t);
  const escolhidas: OfertaSite[] = [];
  for (const t of tamanhos) {
    const perto = todas.filter(o => o.tamanho >= t * 0.6 && o.tamanho <= t * 1.7);
    if (!perto.length) continue;
    const melhor = perto.reduce((a, b) => (unit(b) < unit(a) - 1e-9 || (Math.abs(unit(b) - unit(a)) < 1e-9 && Math.abs(b.tamanho - t) < Math.abs(a.tamanho - t)) ? b : a));
    if (!escolhidas.some(e => e.nome === melhor.nome && e.tamanho === melhor.tamanho)) escolhidas.push(melhor);
  }
  if (!escolhidas.length) {
    const min = Math.min(...tamanhos), max = Math.max(...tamanhos);
    const aceitaveis = todas.filter(o => o.tamanho >= min * 0.25 && o.tamanho <= max * 3);
    if (aceitaveis.length) escolhidas.push(aceitaveis.reduce((a, b) => (unit(b) < unit(a) ? b : a)));
  }
  return escolhidas.sort((a, b) => a.tamanho - b.tamanho).slice(0, 3);
}
