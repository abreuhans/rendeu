// Planejador: filtra receitas pelo perfil, monta o cardápio que cabe no orçamento
// (contando embalagens inteiras e reaproveitando sobras) e permite trocar pratos.
import { APARELHO_REQUER, ITEM, METODOS, RECEITA, RECEITAS } from '../dados';
import type { Preferencias, Receita, Refeicao } from '../tipos';
import { type CustoPlano, type PrecosReais, type Tabela, custoNecessidades, precoUnitarioMinimo, tabela } from './precos';

export const ORDEM_REFEICOES: Refeicao[] = ['B', 'L', 'D', 'S'];

export const DIETAS = {
  equilibrada: { kcal: { B: 400, L: 650, D: 600, S: 200 }, dia: 2000 },
  proteica: { proteina: { B: 25, L: 35, D: 35, S: 15 }, dia: 2000 },
  low_carb: { carbMax: { B: 20, L: 25, D: 25, S: 12 }, dia: 1800 },
  leve: { kcal: { B: 300, L: 480, D: 450, S: 150 }, kcalMax: { B: 380, L: 600, D: 560, S: 220 }, dia: 1500 },
  calorica: { kcal: { B: 600, L: 950, D: 900, S: 350 }, porcao: { B: 1.25, L: 1.35, D: 1.35, S: 1.25 }, dia: 2800 },
} as const;

export const RESTRICOES: Record<string, string[]> = {
  vegetariana: ['carne', 'peixe'], sem_lactose: ['lactose'], sem_gluten: ['gluten'], sem_amendoim: ['amendoim'],
};

/** lambda: peso do gasto · desperdicio: peso de perecíveis que sobram */
export const ESTILOS = {
  economia: { lambda: 1.2, desperdicio: 0.6, repete: 0.3, mesmoDia: 4, seguido: 0.3, sobra: 0.9, distintos: 0.05, ruido: 0.5, proteina: 0.1 },
  equilibrado: { lambda: 0.25, desperdicio: 0.3, repete: 1.5, mesmoDia: 4, seguido: 1.0, sobra: 0.6, distintos: 0.5, ruido: 0.7, proteina: 0.3 },
  variedade: { lambda: 0.1, desperdicio: 0.2, repete: 2.5, mesmoDia: 5, seguido: 2.0, sobra: 0, distintos: 0.6, ruido: 0.7, proteina: 0.6 },
} as const;
type Estilo = Record<keyof (typeof ESTILOS)['economia'], number>;

export interface LinhaV { id: string; q: number; opt: boolean }
export interface Nutricao { kcal: number; p: number; c: number; g: number }
export interface Variante {
  key: string;
  rid: string;
  refeicao: Refeicao;
  linhas: LinhaV[];
  nut: Nutricao;
  lowcarb: boolean;
  score: number;
  /** Grupo da proteína principal (frango, carne, ovo...). */
  prot?: string;
  /** Receita criada pela IA (nome e passos próprios). */
  ia?: { nome: string; passos: string[]; tempo: number };
}
export type Falha = { falha: 'restricao' | 'naoCome' | 'dieta' | 'aparelho' };

export interface Slot { d: number; r: Refeicao }

const GRUPOS_PROTEINA = new Set(['frango', 'carne', 'porco', 'peixe', 'camarao', 'ovo', 'feijao', 'queijo']);

/** Grupo da proteína principal (o que mais contribui com proteína), para variar o cardápio. */
export function proteinaPrincipal(linhas: LinhaV[]): string | undefined {
  let melhor: string | undefined, max = 0;
  for (const l of linhas) {
    const it = ITEM[l.id];
    if (!it.g || !GRUPOS_PROTEINA.has(it.g)) continue;
    const p = (it.u === 'g' || it.u === 'ml' ? l.q / 100 : l.q) * it.n[1];
    if (p > max) { max = p; melhor = it.g; }
  }
  return melhor;
}

export interface Plano {
  ok: true;
  prefs: Preferencias;
  keys: string[];
  slots: Slot[];
  mercados: string[];
  custom: Record<string, Variante>;
  vmap: Record<string, Variante>;
  dias: { d: number; refeicoes: Partial<Record<Refeicao, { key: string; i: number }>> }[];
  custo: CustoPlano;
  porMercado: { mercado: string; total: number }[];
  dividido: number;
  porDia: Nutricao;
  porcoes: number;
  meta: { semente: number; rodadas: number; stats: { total: number; combinam: number; possiveis: number } };
}
export type Problema =
  | { ok: false; motivo: 'orcamento'; minimo: number; stats: Plano['meta']['stats'] }
  | { ok: false; motivo: 'receitas'; refeicao: Refeicao; stats: Plano['meta']['stats'] };

export const temAparelho = (a: string, tem: string[]) => (APARELHO_REQUER[a] || [a]).every(x => tem.includes(x));

export function rng(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function passoAtivo(cond: string | undefined, linhas: LinhaV[]): boolean {
  if (!cond) return true;
  const neg = cond[0] === '!';
  const id = neg ? cond.slice(1) : cond;
  const tem = linhas.some(l => l.id === id && l.q > 0);
  return neg ? !tem : tem;
}

export function nutricao(linhas: LinhaV[]): Nutricao {
  const n = { kcal: 0, p: 0, c: 0, g: 0 };
  for (const l of linhas) {
    const it = ITEM[l.id];
    const f = it.u === 'g' || it.u === 'ml' ? l.q / 100 : l.q;
    n.kcal += f * it.n[0]; n.p += f * it.n[1]; n.c += f * it.n[2]; n.g += f * it.n[3];
  }
  return n;
}

export function scoreDieta(nut: Nutricao, r: Refeicao, prefs: Preferencias): number {
  const { kcal, p, c } = nut;
  const pr = kcal > 0 ? (p * 4) / kcal : 0;
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  switch (prefs.dieta) {
    case 'proteica': return Math.min(1.2, p / DIETAS.proteica.proteina[r]) + 0.6 * Math.min(1, pr / 0.3);
    case 'low_carb': return 0.8 * clamp(1 - c / DIETAS.low_carb.carbMax[r]) + 0.6 * Math.min(1, pr / 0.25);
    case 'leve': { const t = DIETAS.leve.kcal[r]; return clamp(1 - Math.max(0, kcal - t) / t) + 0.5 * Math.min(1, pr / 0.25); }
    case 'calorica': return Math.min(1.2, kcal / DIETAS.calorica.kcal[r]) + 0.3 * Math.min(1, pr / 0.2);
    default: {
      const t = DIETAS.equilibrada.kcal[r];
      const prato = r === 'L' || r === 'D' ? 0.5 * Math.min(1, p / 25) : 0;
      return clamp(1 - Math.abs(kcal - t) / t) + 0.5 * Math.min(1, pr / 0.2) + prato;
    }
  }
}

export function scoreGosto(linhas: LinhaV[], receita: Receita | undefined, prefs: Preferencias): number {
  const grupos = new Set(linhas.map(l => ITEM[l.id].g).filter(Boolean));
  let s = Math.min(1.4, prefs.adora.filter(g => grupos.has(g)).length * 0.7);
  if (receita && prefs.cozinhas.includes(receita.cozinha)) s += 0.6;
  return s;
}

/** A versão da receita que serve para esta pessoa, ou o motivo de não servir. */
export function variante(receita: Receita, r: Refeicao, prefs: Preferencias): Variante | Falha {
  const tagsProibidas = new Set(prefs.restricoes.flatMap(x => RESTRICOES[x] || []));
  const gruposProibidos = new Set(prefs.naoCome);
  let linhas: LinhaV[] = receita.ing.map(([id, q, opt]) => ({ id, q, opt: !!opt }));
  let lowcarb = false;
  if (prefs.dieta === 'low_carb' && (receita.lc || receita.lcMais)) {
    lowcarb = true;
    linhas = linhas.map(l => ({ ...l, q: receita.lc && receita.lc[l.id] !== undefined ? l.q * receita.lc[l.id] : l.q }));
    for (const [id, q] of receita.lcMais || []) {
      const ex = linhas.find(l => l.id === id);
      if (ex) ex.q += q; else linhas.push({ id, q, opt: true });
    }
  }
  const mantidas: LinhaV[] = [];
  for (const l of linhas.filter(x => x.q > 0)) {
    const it = ITEM[l.id];
    const restr = (it.tags || []).some(t => tagsProibidas.has(t));
    const naoCome = !!it.g && gruposProibidos.has(it.g);
    if (!restr && !naoCome) { mantidas.push(l); continue; }
    if (!l.opt) return { falha: restr ? 'restricao' : 'naoCome' };
  }
  const dieta = DIETAS[prefs.dieta] as { porcao?: Record<Refeicao, number>; carbMax?: Record<Refeicao, number>; kcalMax?: Record<Refeicao, number> };
  const porcao = (dieta.porcao && dieta.porcao[r]) || 1;
  linhas = mantidas.map(l => ({ ...l, q: l.q * porcao }));
  const nut = nutricao(linhas);
  if (dieta.carbMax && nut.c > dieta.carbMax[r]) return { falha: 'dieta' };
  if (dieta.kcalMax && nut.kcal > dieta.kcalMax[r]) return { falha: 'dieta' };
  if (receita.requer && !receita.requer.some(a => temAparelho(a, prefs.aparelhos))) return { falha: 'aparelho' };
  for (const p of receita.passos) {
    if (!('m' in p) || !passoAtivo(p.cond, linhas)) continue;
    const m = METODOS[p.m];
    if (!m.opcional && !m.ordem.some(a => temAparelho(a, prefs.aparelhos))) return { falha: 'aparelho' };
  }
  // Arroz com feijão é a base do prato brasileiro: um pequeno bônus.
  const pf = linhas.some(l => l.id === 'arroz') && linhas.some(l => l.id === 'feijao_preto' || l.id === 'feijao_carioca') ? 0.4 : 0;
  const score = 2.2 * scoreDieta(nut, r, prefs) + scoreGosto(linhas, receita, prefs) + pf;
  return { key: receita.id + '@' + r, rid: receita.id, refeicao: r, linhas, nut, lowcarb, score, prot: proteinaPrincipal(linhas) };
}

export function slotsDe(prefs: Preferencias): Slot[] {
  const refs = ORDEM_REFEICOES.filter(r => prefs.refeicoes.includes(r));
  const out: Slot[] = [];
  for (let d = 0; d < prefs.dias; d++) for (const r of refs) out.push({ d, r });
  return out;
}

export function candidatos(prefs: Preferencias) {
  const refs = ORDEM_REFEICOES.filter(r => prefs.refeicoes.includes(r));
  const cands: Partial<Record<Refeicao, Variante[]>> = {};
  const combinam = new Set<string>(), possiveis = new Set<string>();
  for (const r of refs) {
    cands[r] = [];
    for (const rec of RECEITAS) {
      if (!rec.refeicoes.includes(r)) continue;
      const v = variante(rec, r, prefs);
      if (!('falha' in v) || v.falha === 'aparelho') combinam.add(rec.id);
      if (!('falha' in v)) { possiveis.add(rec.id); cands[r]!.push(v); }
    }
  }
  return { cands, stats: { total: RECEITAS.length, combinam: combinam.size, possiveis: possiveis.size } };
}

function penalidade(v: Variante, i: number, keys: string[], slots: Slot[], getV: (k: string) => Variante, E: Estilo): number {
  const s = slots[i];
  let usos = 0, mesmoDia = false, seguido = false, sobra = false;
  for (let j = 0; j < i; j++) {
    const o = getV(keys[j]);
    if (o.rid !== v.rid) continue;
    usos++;
    if (slots[j].d === s.d) mesmoDia = true;
    if (slots[j].d === s.d - 1 && slots[j].r === s.r) seguido = true;
    if (s.r === 'L' && slots[j].d === s.d - 1 && slots[j].r === 'D' && RECEITA[v.rid] && RECEITA[v.rid].sobra) sobra = true;
  }
  const leve = s.r === 'B' || s.r === 'S' ? 0.5 : 1;
  let pen = E.repete * usos * leve;
  if (s.r === 'L' || s.r === 'D') {
    if (v.prot) {
      let mesmas = 0;
      for (let j = 0; j < i; j++) {
        if (slots[j].r !== 'L' && slots[j].r !== 'D') continue;
        const o = getV(keys[j]);
        if (o.rid !== v.rid && o.prot === v.prot) mesmas++;
      }
      pen += E.proteina * Math.max(0, mesmas - 2);
    }
  }
  if (mesmoDia) pen += E.mesmoDia;
  if (seguido && !sobra) pen += E.seguido * leve;
  if (sobra) pen -= E.sobra + E.repete * 0.5;
  return pen;
}

export function custoDe(variantes: Variante[], prefs: Preferencias, tab: Tabela): CustoPlano {
  const nec = new Map<string, number>();
  for (const v of variantes) for (const l of v.linhas) nec.set(l.id, (nec.get(l.id) || 0) + l.q * prefs.pessoas);
  return custoNecessidades(nec, tab, new Set(prefs.despensa));
}

export function avaliar(keys: string[], slots: Slot[], getV: (k: string) => Variante, prefs: Preferencias, tab: Tabela, E: Estilo) {
  let s = 0;
  for (let i = 0; i < keys.length; i++) {
    const v = getV(keys[i]);
    s += v.score - penalidade(v, i, keys, slots, getV, E);
  }
  const custo = custoDe(keys.map(getV), prefs, tab);
  const distintos = new Set(keys.map(k => getV(k).rid)).size;
  return { score: s - (E.lambda * custo.total + E.desperdicio * custo.desperdicio) / prefs.pessoas + E.distintos * distintos, total: custo.total };
}

function buscar(prefs: Preferencias, cands: Partial<Record<Refeicao, Variante[]>>, slots: Slot[], tab: Tabela, semente: number, E: Estilo, rodadas: number) {
  const H = prefs.pessoas, B = prefs.orcamento, emCasa = new Set(prefs.despensa);
  const aleatorio = rng(semente);
  const byKey: Record<string, Variante> = {};
  const unit: Record<string, ReturnType<typeof precoUnitarioMinimo>> = {};
  const preco = (id: string) => (unit[id] = unit[id] || precoUnitarioMinimo(id, tab));
  const amort = (v: Variante) => v.linhas.reduce((a, l) => a + (emCasa.has(l.id) ? 0 : l.q * preco(l.id).porUnidade), 0);
  for (const r in cands) for (const v of cands[r as Refeicao]!) byKey[v.key] = v;
  const getV = (k: string) => byKey[k];
  const minPorRef: Partial<Record<Refeicao, number>> = {};
  for (const r in cands) minPorRef[r as Refeicao] = Math.min(...cands[r as Refeicao]!.map(amort));
  const reserva = new Array(slots.length + 1).fill(0);
  for (let i = slots.length - 1; i >= 0; i--) reserva[i] = reserva[i + 1] + (minPorRef[slots[i].r] || 0) * H * 0.75;

  let melhor: { keys: string[]; score: number; total: number } | null = null;
  let maisBarato: { keys: string[]; score: number; total: number } | null = null;
  for (let rod = 0; rod < rodadas; rod++) {
    const estoque = new Map<string, number>();
    const keys: string[] = [];
    let gasto = 0;
    for (let i = 0; i < slots.length; i++) {
      let pick: Variante | null = null, pickU = -Infinity, fallback: Variante | null = null, fallbackC = Infinity;
      for (const v of cands[slots[i].r]!) {
        let mc = 0;
        for (const l of v.linhas) {
          if (emCasa.has(l.id)) continue;
          const falta = l.q * H - (estoque.get(l.id) || 0);
          if (falta > 1e-9) { const p = preco(l.id); mc += Math.ceil(falta / p.menorPacote - 1e-9) * p.precoMenor; }
        }
        if (mc < fallbackC) { fallbackC = mc; fallback = v; }
        if (gasto + mc + reserva[i + 1] > B + 1e-9) continue;
        const gumbel = -Math.log(-Math.log(aleatorio() * 0.999998 + 0.000001));
        const u = v.score - (E.lambda * mc) / H - penalidade(v, i, keys, slots, getV, E) + E.ruido * 0.6 * gumbel;
        if (u > pickU) { pickU = u; pick = v; }
      }
      const v = (pick || fallback)!;
      for (const l of v.linhas) {
        if (emCasa.has(l.id)) continue;
        const nec = l.q * H, tem = estoque.get(l.id) || 0;
        if (nec > tem + 1e-9) {
          const p = preco(l.id);
          const pac = Math.ceil((nec - tem) / p.menorPacote - 1e-9);
          gasto += pac * p.precoMenor;
          estoque.set(l.id, tem + pac * p.menorPacote - nec);
        } else estoque.set(l.id, tem - nec);
      }
      keys.push(v.key);
    }
    const av = avaliar(keys, slots, getV, prefs, tab, E);
    if (!maisBarato || av.total < maisBarato.total) maisBarato = { keys, ...av };
    if (av.total <= B + 1e-9 && (!melhor || av.score > melhor.score)) melhor = { keys, ...av };
  }
  if (melhor) melhor = melhorar(melhor, prefs, cands, slots, getV, tab, E);
  return { melhor, maisBarato, getV };
}

function melhorar(plano: { keys: string[]; score: number; total: number }, prefs: Preferencias, cands: Partial<Record<Refeicao, Variante[]>>, slots: Slot[], getV: (k: string) => Variante, tab: Tabela, E: Estilo) {
  let atual = plano;
  for (let passe = 0; passe < 2; passe++) {
    let mudou = false;
    for (let i = 0; i < slots.length; i++) {
      for (const v of cands[slots[i].r]!) {
        if (v.key === atual.keys[i]) continue;
        const keys = atual.keys.slice();
        keys[i] = v.key;
        const av = avaliar(keys, slots, getV, prefs, tab, E);
        if (av.total <= prefs.orcamento + 1e-9 && av.score > atual.score + 1e-6) { atual = { keys, ...av }; mudou = true; }
      }
    }
    if (!mudou) break;
  }
  return atual;
}

/** Monta o plano. Com `reais`, os preços de notas fiscais substituem as estimativas. */
export function planejar(prefs: Preferencias, semente: number, reais?: PrecosReais): Plano | Problema {
  const slots = slotsDe(prefs);
  const { cands, stats } = candidatos(prefs);
  for (const r of ORDEM_REFEICOES) if (cands[r] && !cands[r]!.length) return { ok: false, motivo: 'receitas', refeicao: r, stats };
  const E = ESTILOS[prefs.estilo];
  const barato = { ...ESTILOS.economia, lambda: 6, ruido: 0.3 };
  const contextos = prefs.modo === 'dividir' ? [prefs.mercados] : prefs.mercados.map(m => [m]);
  let melhor: { keys: string[]; score: number; mercados: string[] } | null = null;
  let maisBarato: { total: number } | null = null;
  let rodadas = 0;
  contextos.forEach((mercados, ci) => {
    const tab = tabela(mercados, reais);
    const r1 = buscar(prefs, cands, slots, tab, semente * 31 + ci, E, 110);
    const r2 = buscar(prefs, cands, slots, tab, semente * 31 + ci + 7, barato, 30);
    rodadas += 140;
    for (const r of [r1, r2]) {
      if (r.melhor) {
        const av = avaliar(r.melhor.keys, slots, r.getV, prefs, tab, E);
        if (!melhor || av.score > melhor.score) melhor = { keys: r.melhor.keys, score: av.score, mercados };
      }
      if (r.maisBarato && (!maisBarato || r.maisBarato.total < maisBarato.total)) maisBarato = { total: r.maisBarato.total };
    }
  });
  if (!melhor) return { ok: false, motivo: 'orcamento', minimo: (maisBarato as { total: number } | null)?.total ?? 0, stats };
  const m = melhor as { keys: string[]; mercados: string[] };
  return finalizar(prefs, m.keys, m.mercados, {}, { semente, rodadas, stats }, reais);
}

export function obterVariante(key: string, prefs: Preferencias, custom: Record<string, Variante>): Variante | null {
  if (custom[key]) return custom[key];
  const [rid, r] = key.split('@');
  const rec = RECEITA[rid];
  if (!rec) return null;
  const v = variante(rec, r as Refeicao, prefs);
  return 'falha' in v ? null : v;
}

/** Tudo o que as telas precisam a partir das escolhas. */
export function finalizar(prefs: Preferencias, keys: string[], mercados: string[], custom: Record<string, Variante>, meta: Plano['meta'], reais?: PrecosReais): Plano {
  const slots = slotsDe(prefs);
  const vmap: Record<string, Variante> = {};
  for (const k of keys) if (!vmap[k]) vmap[k] = obterVariante(k, prefs, custom)!;
  const vs = keys.map(k => vmap[k]);
  const custo = custoDe(vs, prefs, tabela(mercados, reais));
  const porMercado = prefs.mercados.map(m => ({ mercado: m, total: custoDe(vs, prefs, tabela([m], reais)).total }));
  const dividido = custoDe(vs, prefs, tabela(prefs.mercados, reais)).total;
  const dias: Plano['dias'] = [];
  const soma = { kcal: 0, p: 0, c: 0, g: 0 };
  slots.forEach((s, i) => {
    if (!dias[s.d]) dias[s.d] = { d: s.d, refeicoes: {} };
    dias[s.d].refeicoes[s.r] = { key: keys[i], i };
    const n = vmap[keys[i]].nut;
    soma.kcal += n.kcal; soma.p += n.p; soma.c += n.c; soma.g += n.g;
  });
  const porDia = { kcal: soma.kcal / prefs.dias, p: soma.p / prefs.dias, c: soma.c / prefs.dias, g: soma.g / prefs.dias };
  return {
    ok: true, prefs: JSON.parse(JSON.stringify(prefs)), keys, slots, mercados, custom, vmap, dias,
    custo, porMercado, dividido, porDia, porcoes: keys.length * prefs.pessoas, meta,
  };
}

/** Troca uma refeição pela melhor outra receita que mantém o plano no orçamento. */
export function trocar(plano: Plano, i: number, jaTentadas: string[], reais?: PrecosReais): Plano | null {
  const prefs = plano.prefs;
  const { cands } = candidatos(prefs);
  const E = ESTILOS[prefs.estilo];
  const tab = tabela(plano.mercados, reais);
  const todas: Record<string, Variante> = { ...plano.custom };
  for (const r in cands) for (const v of cands[r as Refeicao]!) todas[v.key] = v;
  const getV = (k: string) => todas[k] || plano.vmap[k];
  const atual = getV(plano.keys[i]).rid;
  let melhor: { keys: string[]; score: number } | null = null;
  for (const v of cands[plano.slots[i].r] || []) {
    if (v.rid === atual || jaTentadas.includes(v.rid)) continue;
    const keys = plano.keys.slice();
    keys[i] = v.key;
    const av = avaliar(keys, plano.slots, getV, prefs, tab, E);
    if (av.total <= prefs.orcamento + 1e-9 && (!melhor || av.score > melhor.score)) melhor = { keys, score: av.score };
  }
  if (!melhor) return null;
  return finalizar(prefs, melhor.keys, plano.mercados, plano.custom, plano.meta, reais);
}
