// Planejador: filtra receitas pelo perfil, monta o cardápio que cabe no orçamento
// (contando embalagens inteiras e reaproveitando sobras) e permite trocar pratos.
import { APARELHO_REQUER, ITEM, METODOS, RECEITA, RECEITAS } from '../dados';
import type { Preferencias, Receita, Refeicao } from '../tipos';
import { type CustoPlano, type FontesPreco, PERECIVEIS, type Tabela, custoNecessidades, hash, melhorCompra, precoUnitarioMinimo, tabela } from './precos';

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

/**
 * Peso do gasto por real (por pessoa): `lambda` até `alvo` × orçamento e `lambdaAlto` acima disso.
 * Assim, quem tem orçamento folgado ganha pratos melhores e mais variados em vez de sobrar dinheiro à toa.
 * desperdicio: peso de perecíveis que sobram · guarda: quanto vale o que sobra e dura (carne no congelador,
 * pacote de arroz aberto), descontado do gasto na nota do plano (o orçamento continua contando tudo).
 * sabor: bônus sorteado por receita a cada plano, para "refazer" mostrar outras combinações boas.
 */
export const ESTILOS = {
  economia: { lambda: 1, lambdaAlto: 1, alvo: 0, guarda: 0.2, sabor: 0.3, desperdicio: 0.6, repete: 0.8, mesmoDia: 4, seguido: 0.5, sobra: 1.1, distintos: 0.3, ruido: 0.5, proteina: 0.1 },
  equilibrado: { lambda: 0.08, lambdaAlto: 0.45, alvo: 0.7, guarda: 0.35, sabor: 0.7, desperdicio: 0.3, repete: 1.5, mesmoDia: 4, seguido: 1.0, sobra: 0.6, distintos: 0.5, ruido: 0.7, proteina: 0.3 },
  variedade: { lambda: 0.04, lambdaAlto: 0.3, alvo: 0.9, guarda: 0.5, sabor: 1, desperdicio: 0.2, repete: 2.5, mesmoDia: 5, seguido: 2.0, sobra: 0, distintos: 0.6, ruido: 0.7, proteina: 0.6 },
} as const;
type Estilo = Record<keyof (typeof ESTILOS)['economia'], number>;

/** Penalidade do gasto por pessoa `t` para um teto de referência `teto` (parte do orçamento). */
function pesoGasto(t: number, teto: number, E: Estilo): number {
  const base = Math.min(t, teto);
  return E.lambda * base + E.lambdaAlto * (t - base);
}

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

/** Ruído de Gumbel pré-calculado (sorteio com peso sem calcular logaritmos no laço). */
const GUMBEL = Float64Array.from({ length: 4096 }, (_, i) => -Math.log(-Math.log((i + 0.5) / 4096)));

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
  const score = 2.2 * scoreDieta(nut, r, prefs) + scoreGosto(linhas, receita, prefs) + pf + (receita.peso || 0);
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

/** Contagens do que já entrou no cardápio, para medir a repetição de cada candidato sem reler o plano. */
class Historico {
  private usos = new Map<string, number>();
  private noDia = new Set<string>();
  private hoje = new Map<Refeicao, string>();
  private ontem = new Map<Refeicao, string>();
  private dia = -1;
  private prot = new Map<string, number>();
  private protRid = new Map<string, Map<string, number>>();
  constructor(private E: Estilo) {}

  limpar() {
    this.usos.clear(); this.noDia.clear(); this.hoje.clear(); this.ontem.clear(); this.prot.clear(); this.protRid.clear();
    this.dia = -1;
  }

  /** Chame ao chegar em cada refeição, antes de medir os candidatos dela. */
  entrar(s: Slot) {
    if (s.d === this.dia) return;
    const velho = this.ontem;
    this.ontem = this.hoje;
    if (s.d !== this.dia + 1) this.ontem.clear();
    velho.clear();
    this.hoje = velho;
    this.noDia.clear();
    this.dia = s.d;
  }

  penalidade(v: Variante, s: Slot): number {
    const E = this.E;
    const usos = this.usos.get(v.rid) || 0;
    const leve = s.r === 'B' || s.r === 'S' ? 0.5 : 1;
    let pen = E.repete * usos * leve;
    if ((s.r === 'L' || s.r === 'D') && v.prot) {
      const mesmas = (this.prot.get(v.prot) || 0) - (this.protRid.get(v.prot)?.get(v.rid) || 0);
      pen += E.proteina * Math.max(0, mesmas - 2);
    }
    if (usos) {
      const sobra = s.r === 'L' && this.ontem.get('D') === v.rid && !!RECEITA[v.rid]?.sobra;
      if (this.noDia.has(v.rid)) pen += E.mesmoDia;
      if (this.ontem.get(s.r) === v.rid && !sobra) pen += E.seguido * leve;
      if (sobra) pen -= E.sobra + E.repete * 0.5;
    }
    return pen;
  }

  registrar(v: Variante, s: Slot) {
    this.usos.set(v.rid, (this.usos.get(v.rid) || 0) + 1);
    this.noDia.add(v.rid);
    this.hoje.set(s.r, v.rid);
    if ((s.r === 'L' || s.r === 'D') && v.prot) {
      this.prot.set(v.prot, (this.prot.get(v.prot) || 0) + 1);
      let m = this.protRid.get(v.prot);
      if (!m) this.protRid.set(v.prot, (m = new Map()));
      m.set(v.rid, (m.get(v.rid) || 0) + 1);
    }
  }
}

/** Soma de (nota da receita − penalidade de repetição) ao longo do cardápio. */
function notaPratos(vs: Variante[], slots: Slot[], E: Estilo, h = new Historico(E)): number {
  h.limpar();
  let s = 0;
  for (let i = 0; i < vs.length; i++) {
    h.entrar(slots[i]);
    s += vs[i].score - h.penalidade(vs[i], slots[i]);
    h.registrar(vs[i], slots[i]);
  }
  return s;
}

export function custoDe(variantes: Variante[], prefs: Preferencias, tab: Tabela): CustoPlano {
  const nec = new Map<string, number>();
  for (const v of variantes) for (const l of v.linhas) nec.set(l.id, (nec.get(l.id) || 0) + l.q * prefs.pessoas);
  return custoNecessidades(nec, tab, new Set(prefs.despensa));
}

export function avaliar(keys: string[], slots: Slot[], getV: (k: string) => Variante, prefs: Preferencias, tab: Tabela, E: Estilo) {
  const vs = keys.map(getV);
  const custo = custoDe(vs, prefs, tab);
  const distintos = new Set(vs.map(v => v.rid)).size;
  const H = prefs.pessoas;
  const gasto = (custo.total - E.guarda * custo.guardado) / H;
  const score = notaPratos(vs, slots, E) - pesoGasto(gasto, (E.alvo * prefs.orcamento) / H, E) - (E.desperdicio * custo.desperdicio) / H + E.distintos * distintos;
  return { score, total: custo.total };
}

type Melhor = { keys: string[]; score: number; total: number };
/** Os laços longos são geradores: param (yield) de tempos em tempos para o app não travar a tela. */
type Passos<T> = Generator<void, T, void>;

function* buscar(prefs: Preferencias, cands: Partial<Record<Refeicao, Variante[]>>, slots: Slot[], tab: Tabela, semente: number, E: Estilo, rodadas: number): Passos<{ melhor: Melhor | null; maisBarato: Melhor | null; getV: (k: string) => Variante }> {
  const H = prefs.pessoas, B = prefs.orcamento, emCasa = new Set(prefs.despensa);
  const aleatorio = rng(semente);
  const byKey: Record<string, Variante> = {};
  for (const r in cands) for (const v of cands[r as Refeicao]!) byKey[v.key] = v;
  const getV = (k: string) => byKey[k];

  // Cada item vira um número e cada candidato, listas de números: o laço abaixo roda milhares de vezes.
  const indice = new Map<string, number>();
  const pacote: number[] = [], precoPacote: number[] = [], unidade: number[] = [], guarda: number[] = [];
  const linhasDe = new Map<Variante, { ids: Int32Array; qs: Float64Array }>();
  for (const v of Object.values(byKey)) {
    const ls = v.linhas.filter(l => !emCasa.has(l.id));
    const ids = new Int32Array(ls.length), qs = new Float64Array(ls.length);
    ls.forEach((l, j) => {
      let k = indice.get(l.id);
      if (k === undefined) {
        k = pacote.length;
        indice.set(l.id, k);
        const p = precoUnitarioMinimo(l.id, tab);
        pacote.push(p.menorPacote);
        precoPacote.push(p.precoMenor);
        unidade.push(p.porUnidade);
        // Crédito por unidade que sobra e dura (zero para perecíveis).
        guarda.push(PERECIVEIS.has(ITEM[l.id].secao) ? 0 : (E.guarda * p.precoMenor) / p.menorPacote);
      }
      ids[j] = k;
      qs[j] = l.q * H;
    });
    linhasDe.set(v, { ids, qs });
  }
  const amort = (v: Variante) => {
    const { ids, qs } = linhasDe.get(v)!;
    let c = 0;
    for (let j = 0; j < ids.length; j++) c += qs[j] * unidade[ids[j]];
    return c;
  };
  const minPorRef: Partial<Record<Refeicao, number>> = {};
  for (const r in cands) minPorRef[r as Refeicao] = Math.min(...cands[r as Refeicao]!.map(amort));
  const reserva = new Array(slots.length + 1).fill(0);
  for (let i = slots.length - 1; i >= 0; i--) reserva[i] = reserva[i + 1] + (minPorRef[slots[i].r] || 0) * 0.75;
  // Teto de referência acumulado até cada refeição (o gasto barato vale para a semana toda, não só para o começo).
  const teto = slots.map((_, i) => (E.alvo * B * (i + 1)) / slots.length / H);

  let melhor: { keys: string[]; score: number; total: number } | null = null;
  let maisBarato: { keys: string[]; score: number; total: number } | null = null;
  const estoque = new Float64Array(pacote.length);
  const hist = new Historico(E);
  for (let rod = 0; rod < rodadas; rod++) {
    if (rod % 6 === 5) yield;
    estoque.fill(0);
    hist.limpar();
    const keys: string[] = [];
    let gasto = 0, gastoEfetivo = 0;
    for (let i = 0; i < slots.length; i++) {
      hist.entrar(slots[i]);
      let pick: Variante | null = null, pickU = -Infinity, fallback: Variante | null = null, fallbackC = Infinity;
      for (const v of cands[slots[i].r]!) {
        const { ids, qs } = linhasDe.get(v)!;
        let mc = 0, credito = 0;
        for (let j = 0; j < ids.length; j++) {
          const k = ids[j], falta = qs[j] - estoque[k];
          let pac = 0;
          if (falta > 1e-9) { pac = Math.ceil(falta / pacote[k] - 1e-9); mc += pac * precoPacote[k]; }
          // O estoque muda em (pac × pacote − q): sobra que fica guardada vale crédito, usar o guardado custa o crédito de volta.
          credito += guarda[k] * (pac * pacote[k] - qs[j]);
        }
        if (mc < fallbackC) { fallbackC = mc; fallback = v; }
        if (gasto + mc + reserva[i + 1] > B + 1e-9) continue;
        const efetivo = Math.max(0, gastoEfetivo + mc - credito);
        const custo = pesoGasto(efetivo / H, teto[i], E) - pesoGasto(gastoEfetivo / H, teto[i], E);
        const u = v.score - custo - hist.penalidade(v, slots[i]) + E.ruido * 0.6 * GUMBEL[(aleatorio() * 4096) | 0];
        if (u > pickU) { pickU = u; pick = v; }
      }
      const v = (pick || fallback)!;
      const { ids, qs } = linhasDe.get(v)!;
      for (let j = 0; j < ids.length; j++) {
        const k = ids[j], tem = estoque[k];
        let pac = 0;
        if (qs[j] > tem + 1e-9) {
          pac = Math.ceil((qs[j] - tem) / pacote[k] - 1e-9);
          gasto += pac * precoPacote[k];
          gastoEfetivo += pac * precoPacote[k];
        }
        gastoEfetivo -= guarda[k] * (pac * pacote[k] - qs[j]);
        estoque[k] = tem + pac * pacote[k] - qs[j];
      }
      gastoEfetivo = Math.max(0, gastoEfetivo);
      hist.registrar(v, slots[i]);
      keys.push(v.key);
    }
    const av = avaliar(keys, slots, getV, prefs, tab, E);
    if (!maisBarato || av.total < maisBarato.total) maisBarato = { keys, ...av };
    if (av.total <= B + 1e-9 && (!melhor || av.score > melhor.score)) melhor = { keys, ...av };
  }
  return { melhor, maisBarato, getV };
}

/** Busca local: troca uma refeição por vez enquanto a nota do cardápio sobe (contas incrementais). */
function* melhorar(plano: Melhor, prefs: Preferencias, cands: Partial<Record<Refeicao, Variante[]>>, slots: Slot[], getV: (k: string) => Variante, tab: Tabela, E: Estilo): Passos<Melhor> {
  const H = prefs.pessoas, B = prefs.orcamento, emCasa = new Set(prefs.despensa);
  const keys = plano.keys.slice();
  const vs = keys.map(getV);
  const nec = new Map<string, number>();
  for (const v of vs) for (const l of v.linhas) if (!emCasa.has(l.id)) nec.set(l.id, (nec.get(l.id) || 0) + l.q * H);
  /** [custo, desperdício, guardado] de comprar q do item. */
  const conta = (id: string, q: number): [number, number, number] => {
    if (q <= 1e-9) return [0, 0, 0];
    const c = melhorCompra(id, q, tab);
    const sobra = c.comprado > 0 ? c.custo * (1 - q / c.comprado) : 0;
    return PERECIVEIS.has(ITEM[id].secao) ? [c.custo, sobra, 0] : [c.custo, 0, sobra];
  };
  let total = 0, desp = 0, guard = 0;
  for (const [id, q] of nec) { const [c, d, g] = conta(id, q); total += c; desp += d; guard += g; }
  const usos = new Map<string, number>();
  for (const v of vs) usos.set(v.rid, (usos.get(v.rid) || 0) + 1);
  const hist = new Historico(E);
  let pratos = notaPratos(vs, slots, E, hist);
  const tetoP = (E.alvo * B) / H;
  const nota = (p: number, t: number, d: number, g: number, distintos: number) =>
    p - pesoGasto((t - E.guarda * g) / H, tetoP, E) - (E.desperdicio * d) / H + E.distintos * distintos;
  let score = nota(pratos, total, desp, guard, usos.size);
  // Só as receitas mais bem avaliadas de cada refeição entram na busca local.
  const topo: Partial<Record<Refeicao, Variante[]>> = {};
  for (const r in cands) topo[r as Refeicao] = [...cands[r as Refeicao]!].sort((a, b) => b.score - a.score).slice(0, 45);

  for (let passe = 0; passe < 2; passe++) {
    let mudou = false;
    for (let i = 0; i < slots.length; i++) {
      if (i % 3 === 2) yield;
      for (const v of topo[slots[i].r]!) {
        const a = vs[i];
        if (v.key === a.key) continue;
        const delta = new Map<string, number>();
        for (const l of a.linhas) if (!emCasa.has(l.id)) delta.set(l.id, (delta.get(l.id) || 0) - l.q * H);
        for (const l of v.linhas) if (!emCasa.has(l.id)) delta.set(l.id, (delta.get(l.id) || 0) + l.q * H);
        let t = total, d = desp, g = guard;
        for (const [id, dq] of delta) {
          if (Math.abs(dq) < 1e-9) continue;
          const q0 = nec.get(id) || 0;
          const [c0, d0, g0] = conta(id, q0), [c1, d1, g1] = conta(id, q0 + dq);
          t += c1 - c0; d += d1 - d0; g += g1 - g0;
        }
        if (t > B + 1e-9) continue;
        vs[i] = v;
        const p = notaPratos(vs, slots, E, hist);
        const distintos = usos.size - (a.rid !== v.rid && usos.get(a.rid) === 1 ? 1 : 0) + (a.rid !== v.rid && !usos.get(v.rid) ? 1 : 0);
        const sc = nota(p, t, d, g, distintos);
        if (sc > score + 1e-6) {
          for (const [id, dq] of delta) nec.set(id, (nec.get(id) || 0) + dq);
          usos.set(a.rid, usos.get(a.rid)! - 1);
          if (!usos.get(a.rid)) usos.delete(a.rid);
          usos.set(v.rid, (usos.get(v.rid) || 0) + 1);
          keys[i] = v.key;
          total = t; desp = d; guard = g; pratos = p; score = sc;
          mudou = true;
        } else vs[i] = a;
      }
    }
    if (!mudou) break;
  }
  return { keys, ...avaliar(keys, slots, getV, prefs, tab, E) };
}

/** Monta o plano. `fontes` traz os preços de notas fiscais e dos sites (sem elas, só estimativas). */
export function planejar(prefs: Preferencias, semente: number, fontes?: FontesPreco): Plano | Problema {
  const g = passosDoPlano(prefs, semente, fontes);
  let r = g.next();
  while (!r.done) r = g.next();
  return r.value;
}

/** O mesmo que `planejar`, mas devolve o controle à tela a cada ~`fatiaMs` (o celular não congela). */
export async function planejarSemTravar(prefs: Preferencias, semente: number, fontes?: FontesPreco, fatiaMs = 12): Promise<Plano | Problema> {
  const g = passosDoPlano(prefs, semente, fontes);
  let inicio = Date.now();
  let r = g.next();
  while (!r.done) {
    if (Date.now() - inicio >= fatiaMs) {
      await new Promise(ok => setTimeout(ok, 0));
      inicio = Date.now();
    }
    r = g.next();
  }
  return r.value;
}

function* passosDoPlano(prefs: Preferencias, semente: number, fontes?: FontesPreco): Passos<Plano | Problema> {
  const slots = slotsDe(prefs);
  const { cands: base, stats } = candidatos(prefs);
  for (const r of ORDEM_REFEICOES) if (base[r] && !base[r]!.length) return { ok: false, motivo: 'receitas', refeicao: r, stats };
  const E = ESTILOS[prefs.estilo];
  // "Sabor da semana": cada semente favorece algumas receitas, então cada plano refeito explora outras combinações.
  const cands: typeof base = {};
  for (const r in base) {
    cands[r as Refeicao] = base[r as Refeicao]!.map(v => ({ ...v, score: v.score + E.sabor * ((hash(semente + ':' + v.rid) % 2001) / 1000 - 1) }));
  }
  const barato = { ...ESTILOS.economia, lambda: 6, lambdaAlto: 6, ruido: 0.3 };
  const contextos = prefs.modo === 'dividir' ? [prefs.mercados] : prefs.mercados.map(m => [m]);
  let melhor: { keys: string[]; score: number; mercados: string[] } | null = null;
  let maisBarato: { total: number } | null = null;
  let rodadas = 0;
  for (let ci = 0; ci < contextos.length; ci++) {
    const mercados = contextos[ci];
    const tab = tabela(mercados, fontes);
    yield;
    const r1 = yield* buscar(prefs, cands, slots, tab, semente * 31 + ci, E, 110);
    const r2 = yield* buscar(prefs, cands, slots, tab, semente * 31 + ci + 7, barato, 30);
    rodadas += 140;
    let local: Melhor | null = null;
    for (const r of [r1, r2]) {
      if (r.melhor) {
        const av = avaliar(r.melhor.keys, slots, r1.getV, prefs, tab, E);
        if (!local || av.score > local.score) local = { keys: r.melhor.keys, ...av };
      }
      if (r.maisBarato && (!maisBarato || r.maisBarato.total < maisBarato.total)) maisBarato = { total: r.maisBarato.total };
    }
    if (local) {
      const m = yield* melhorar(local, prefs, cands, slots, r1.getV, tab, E);
      if (!melhor || m.score > melhor.score) melhor = { keys: m.keys, score: m.score, mercados };
    }
  }
  if (!melhor) return { ok: false, motivo: 'orcamento', minimo: (maisBarato as { total: number } | null)?.total ?? 0, stats };
  const m = melhor as { keys: string[]; mercados: string[] };
  return finalizar(prefs, m.keys, m.mercados, {}, { semente, rodadas, stats }, fontes);
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
export function finalizar(prefs: Preferencias, keys: string[], mercados: string[], custom: Record<string, Variante>, meta: Plano['meta'], fontes?: FontesPreco): Plano {
  const slots = slotsDe(prefs);
  const vmap: Record<string, Variante> = {};
  for (const k of keys) if (!vmap[k]) vmap[k] = obterVariante(k, prefs, custom)!;
  const vs = keys.map(k => vmap[k]);
  const custo = custoDe(vs, prefs, tabela(mercados, fontes));
  const porMercado = prefs.mercados.map(m => ({ mercado: m, total: custoDe(vs, prefs, tabela([m], fontes)).total }));
  const dividido = custoDe(vs, prefs, tabela(prefs.mercados, fontes)).total;
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
export function trocar(plano: Plano, i: number, jaTentadas: string[], fontes?: FontesPreco): Plano | null {
  const prefs = plano.prefs;
  const { cands } = candidatos(prefs);
  const E = ESTILOS[prefs.estilo];
  const tab = tabela(plano.mercados, fontes);
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
  return finalizar(prefs, melhor.keys, plano.mercados, plano.custom, plano.meta, fontes);
}
