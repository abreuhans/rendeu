import { describe, expect, it } from 'vitest';
import {
  DESPENSA, GRUPOS, ITEM, ITENS, MERCADOS, METODOS, RECEITAS, RESTRICOES, APARELHOS, COZINHAS,
  candidatos, dinheiro, melhorCombinacao, opcoesItem, passosDe, planejar, quantidade, rng, trocar,
  type Plano, type Preferencias,
} from '../src/core';
import { PADRAO } from './fixtures';



describe('dados', () => {
  it('receitas usam só itens, métodos e condições que existem', () => {
    const erros: string[] = [];
    const ids = new Set<string>();
    for (const r of RECEITAS) {
      if (ids.has(r.id)) erros.push('id repetido ' + r.id);
      ids.add(r.id);
      for (const [id] of r.ing) if (!ITEM[id]) erros.push(`${r.id}: item ${id}`);
      for (const [id] of r.lcMais || []) if (!ITEM[id]) erros.push(`${r.id}: lcMais ${id}`);
      for (const id in r.lc || {}) if (!r.ing.some(l => l[0] === id)) erros.push(`${r.id}: lc ${id} não está nos ingredientes`);
      for (const p of r.passos) {
        if ('m' in p && !METODOS[p.m]) erros.push(`${r.id}: método ${p.m}`);
        if ('m' in p && METODOS[p.m] && /\{item\}/.test(Object.values(METODOS[p.m].v).join()) && !p.item) erros.push(`${r.id}: ${p.m} sem item`);
        if (p.cond && !ITEM[p.cond.replace('!', '')]) erros.push(`${r.id}: cond ${p.cond}`);
      }
      if (!COZINHAS.some(c => c.id === r.cozinha)) erros.push(`${r.id}: cozinha ${r.cozinha}`);
    }
    const aparelhos = new Set(APARELHOS.map(a => a.id));
    for (const [id, m] of Object.entries(METODOS)) for (const a of m.ordem) {
      if (!m.v[a]) erros.push(`método ${id} sem texto para ${a}`);
      if (!aparelhos.has(a)) erros.push(`método ${id}: aparelho ${a}`);
    }
    const grupos = new Set(GRUPOS.map(g => g.id));
    for (const it of ITENS) {
      if (it.g && !grupos.has(it.g)) erros.push(`item ${it.id}: grupo ${it.g}`);
      if (!it.pk && !it.granel) erros.push(`item ${it.id} sem preço`);
    }
    for (const d of DESPENSA) for (const id of d.itens) if (!ITEM[id]) erros.push(`despensa ${id}`);
    expect(erros).toEqual([]);
    expect(RECEITAS.length).toBeGreaterThanOrEqual(80);
  });

  it('preços seguem o padrão de gôndola e variam por mercado', () => {
    const komprao = opcoesItem('arroz', 'komprao')[1].preco;
    const hippo = opcoesItem('arroz', 'hippo')[1].preco;
    expect(komprao).toBeLessThan(hippo);
    expect(String(opcoesItem('arroz', 'koch')[1].preco)).toMatch(/\.(9|99)$/);
  });

  it('escolhe a combinação de embalagens mais barata', () => {
    const ops = [
      { tamanho: 1000, preco: 5.79, rotulo: '1 kg', oferta: false, real: false },
      { tamanho: 5000, preco: 25.9, rotulo: '5 kg', oferta: false, real: false },
    ];
    const c = melhorCombinacao(ops, 6000);
    expect(c.custo).toBeCloseTo(31.69, 2);
    expect(melhorCombinacao(ops, 300).custo).toBeCloseTo(5.79, 2);
  });

  it('formata dinheiro e quantidades no padrão brasileiro', () => {
    expect(dinheiro(1234.5)).toBe('R$\u00a01.234,50');
    expect(quantidade('oleo', 15)).toBe('1 colher (sopa)');
    expect(quantidade('arroz', 140)).toBe('140 g');
    expect(quantidade('arroz', 1500)).toBe('1,5 kg');
    expect(quantidade('alho', 2)).toBe('2 dentes');
  });
});

const total = (p: Plano) => p.custo.total;

describe('planejador', () => {
  it('monta o plano padrão dentro do orçamento', () => {
    const p = planejar(PADRAO, 1);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(total(p)).toBeLessThanOrEqual(PADRAO.orcamento);
    expect(p.keys).toHaveLength(15);
    expect(new Set(p.keys.map(k => p.vmap[k].rid)).size).toBeGreaterThanOrEqual(8);
  });

  it('nunca passa do orçamento em perfis aleatórios', () => {
    const r = rng(7);
    const escolha = <T,>(xs: T[], chance: number) => xs.filter(() => r() < chance);
    let possiveis = 0;
    for (let i = 0; i < 40; i++) {
      const prefs: Preferencias = {
        ...PADRAO,
        orcamento: 40 + Math.round(r() * 400),
        pessoas: 1 + Math.floor(r() * 4),
        dias: 1 + Math.floor(r() * 7),
        refeicoes: (() => { const x = escolha(['B', 'L', 'D', 'S'] as const, 0.6); return x.length ? [...x] : ['L' as const]; })(),
        dieta: (['equilibrada', 'proteica', 'low_carb', 'leve', 'calorica'] as const)[Math.floor(r() * 5)],
        modo: r() < 0.5 ? 'um' : 'dividir',
        mercados: (() => { const x = escolha(MERCADOS.map(m => m.id), 0.4); return x.length ? x : ['koch']; })(),
        aparelhos: (() => { const x = escolha(APARELHOS.map(a => a.id), 0.5); return x.length ? x : ['fogao']; })(),
        estilo: (['economia', 'equilibrado', 'variedade'] as const)[Math.floor(r() * 3)],
        restricoes: escolha(Object.keys(RESTRICOES), 0.15),
        naoCome: escolha(GRUPOS.map(g => g.id), 0.06),
      };
      const p = planejar(prefs, i + 1);
      if (!p.ok) continue;
      possiveis++;
      expect(total(p)).toBeLessThanOrEqual(prefs.orcamento + 1e-9);
    }
    expect(possiveis).toBeGreaterThan(20);
  });

  it('respeita restrições, "não como" e low carb', () => {
    const veg = candidatos({ ...PADRAO, restricoes: ['vegetariana', 'sem_lactose'], naoCome: ['ovo'] });
    for (const vs of Object.values(veg.cands)) for (const v of vs!) for (const l of v.linhas) {
      const it = ITEM[l.id];
      expect(it.tags || []).not.toContain('carne');
      expect(it.tags || []).not.toContain('peixe');
      expect(it.tags || []).not.toContain('lactose');
      expect(it.g).not.toBe('ovo');
    }
    const lc = candidatos({ ...PADRAO, dieta: 'low_carb' });
    for (const v of lc.cands.L!) expect(v.nut.c).toBeLessThanOrEqual(25);
    expect(lc.cands.L!.length).toBeGreaterThanOrEqual(8);
  });

  it('só usa receitas que dão para fazer com os aparelhos marcados', () => {
    const prefs = { ...PADRAO, aparelhos: ['microondas'] };
    const p = planejar(prefs, 3);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    for (const k of p.keys) for (const passo of passosDe(p.vmap[k], prefs.aparelhos)) {
      if (passo.aparelho) expect(prefs.aparelhos).toContain(passo.aparelho);
    }
  });

  it('avisa quando o orçamento não dá', () => {
    const p = planejar({ ...PADRAO, orcamento: 15 }, 1);
    expect(p.ok).toBe(false);
    if (!p.ok && p.motivo === 'orcamento') expect(p.minimo).toBeGreaterThan(15);
  });

  it('troca uma receita mantendo o orçamento', () => {
    const p = planejar(PADRAO, 2);
    if (!p.ok) throw new Error('sem plano');
    const t = trocar(p, 1, []);
    expect(t).not.toBeNull();
    expect(t!.custo.total).toBeLessThanOrEqual(PADRAO.orcamento);
    expect(t!.vmap[t!.keys[1]].rid).not.toBe(p.vmap[p.keys[1]].rid);
  });
});
