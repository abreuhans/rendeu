import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ancorasDoSite, lerPrecosSite, opcoesItem, planejar, tabela, type PrecosSite } from '../src/core';
import { candidatas, escolherOfertas, produtoServe } from '../robo/escolher';
import { BUSCAS } from '../robo/itens';
import { LOJAS, lerOsuper, lerVtex, type Produto } from '../robo/lojas';
import { lerRobots, permitido } from '../robo/robots';
import { PADRAO } from './fixtures';

const amostra = (nome: string) => JSON.parse(readFileSync(new URL(`../robo/amostras/${nome}.json`, import.meta.url), 'utf8'));
const produto = (nome: string, preco: number, extra: Partial<Produto> = {}): Produto => ({ nome, preco, promo: false, porKg: false, disponivel: true, ...extra });

describe('robô: leitura dos sites', () => {
  it('lê a busca VTEX do Giassi e escolhe arroz branco tipo 1 (1 kg e 5 kg)', () => {
    const produtos = lerVtex(amostra('giassi-arroz'));
    expect(produtos.length).toBe(15);
    const ofertas = escolherOfertas('arroz', produtos);
    expect(ofertas.map(o => [o.tamanho, o.preco])).toEqual([[1000, 3.88], [5000, 19.09]]);
    expect(ofertas.every(o => /Branco Tipo 1 Giassi/.test(o.nome))).toBe(true);
    // parboilizado, integral e arbório não contam como arroz branco
    expect(produtos.filter(p => produtoServe('arroz', p)).some(p => /Parboil|Integral|Arbório/.test(p.nome))).toBe(false);
  });

  it('lê tomate vendido a peso no Angeloni (preço por kg → preço da unidade média)', () => {
    const ofertas = escolherOfertas('tomate', lerVtex(amostra('angeloni-tomate')));
    expect(ofertas).toHaveLength(1);
    expect(ofertas[0].kg).toBe(14.89);
    expect(ofertas[0].preco).toBeCloseTo(1.79, 2);
    expect(ofertas[0].nome).toBe('Tomate Kg');
  });

  it('lê a busca OSuper do Koch e não confunde banana prata com banana-maçã, passa ou bolo', () => {
    const produtos = lerOsuper(amostra('koch-banana'));
    expect(produtos.find(p => p.nome === 'Banana Maça Kg')).toMatchObject({ porKg: true, preco: 11.99 });
    expect(escolherOfertas('banana', produtos)).toEqual([]);
  });

  it('lê a busca OSuper com várias palavras (vem misturada) e fica só com o arroz branco', () => {
    const produtos = lerOsuper(amostra('koch-arroz'));
    expect(escolherOfertas('arroz', produtos)).toEqual([{ tamanho: 1000, preco: 3.79, nome: 'Arroz Kika Branco Pacote 1Kg' }]);
    expect(escolherOfertas('feijao_carioca', produtos)).toEqual([{ tamanho: 1000, preco: 7.99, nome: 'Feijão Reserva Carioca Tipo1 Pacote com 1Kg' }]);
    expect(produtos.find(p => /PÉ VERMELHO/.test(p.nome))).toMatchObject({ preco: 8.99, promo: true });
  });

  it('converte tamanhos para a unidade de cada item', () => {
    expect(candidatas('ovos', produto('Ovos Vermelhos Friolar Bandeja 30 Unidades', 14.98))[0]).toMatchObject({ tamanho: 30, preco: 14.98 });
    expect(candidatas('ovos', produto('Ovos Brancos Grandes Dúzia', 9.99))[0].tamanho).toBe(12);
    expect(candidatas('pao_forma', produto('Pão de Forma Tradicional Pullman 500g', 8.99))[0].tamanho).toBe(20);
    expect(candidatas('leite', produto('Leite UHT Integral Tirol Caixa com Tampa 1l', 4.78))[0].tamanho).toBe(1000);
    const pao = candidatas('pao_frances', produto('Pão Francês Kg', 16.9, { porKg: true }))[0];
    expect(pao).toMatchObject({ tamanho: 1, kg: 16.9 });
    expect(pao.preco).toBeCloseTo(0.84, 2);
    const carne = candidatas('carne_moida', produto('Carne Moída de Acém Kg', 36.9, { porKg: true }));
    expect(carne.map(o => [o.tamanho, o.preco])).toEqual([[500, 18.45], [1000, 36.9]]);
    expect(candidatas('alho', produto('Alho Nacional Kg', 30, { porKg: true }))[0]).toMatchObject({ tamanho: 10, preco: 1.5 });
  });

  it('descarta embalagem múltipla, item errado e preço fora da realidade', () => {
    expect(produtoServe('leite', produto('Leite Integral Tirol 1L C/12', 57.36))).toBe(false);
    expect(produtoServe('leite', produto('Leite Condensado Moça 395g', 7.99))).toBe(false);
    expect(produtoServe('arroz', produto('Arroz Luppy Cachorro Pacote 5kg', 15.9))).toBe(false);
    expect(escolherOfertas('arroz', [produto('Arroz Branco Tipo 1 Pacote 1kg', 0.5)])).toEqual([]);
  });

  it('todo item do catálogo tem busca configurada e toda loja tem fonte', () => {
    for (const l of LOJAS) expect(l.url('arroz tipo 1')).toMatch(/^https:\/\//);
    expect(Object.values(BUSCAS).every(b => b.busca.length > 0)).toBe(true);
  });
});

describe('robô: robots.txt', () => {
  it('respeita as regras das lojas', () => {
    const angeloni = lerRobots('User-agent: *\nDisallow: /*ft=*\nDisallow: *?fq=*\nDisallow: /*map=*\nDisallow: /busca\nAllow: /');
    const url = LOJAS.find(l => l.id === 'angeloni')!.url('feijão preto');
    expect(permitido(angeloni, url)).toBe(true);
    expect(permitido(angeloni, 'https://super.angeloni.com.br/api/catalog_system/pub/products/search?ft=arroz')).toBe(false);
    expect(permitido(angeloni, 'https://super.angeloni.com.br/busca?q=arroz')).toBe(false);
    const bistek = lerRobots('User-agent: Googlebot\nDisallow: /x\n\nUser-agent: *\nDisallow: /api/\n');
    expect(permitido(bistek, 'https://www.bistek.com.br/api/io/_v/api/intelligent-search/product_search/?query=arroz')).toBe(false);
    expect(permitido(bistek, 'https://www.bistek.com.br/x')).toBe(true);
  });
});

describe('preços do site no app', () => {
  const agora = Date.parse('2026-10-22T12:00:00Z');
  const site: PrecosSite = lerPrecosSite({
    versao: 1,
    geradoEm: '2026-10-22T09:17:00Z',
    lojas: {
      giassi: { data: '2026-10-22T09:17:00Z', itens: { arroz: [{ tamanho: 1000, preco: 3.88, nome: 'Arroz Branco Tipo 1 Giassi Pacote 1kg' }, { tamanho: 5000, preco: 19.09, nome: 'Arroz Branco Tipo 1 Giassi Pacote 5kg' }], tomate: [{ tamanho: 1, preco: 1.68, kg: 13.98, nome: 'Tomate Longa Vida kg', promo: true }] } },
      angeloni: { data: '2026-10-22T09:17:00Z', itens: { tomate: [{ tamanho: 1, preco: 1.79, kg: 14.89, nome: 'Tomate Kg' }], inexistente: [{ tamanho: 1, preco: 1, nome: 'x' }] } },
      hippo: { data: '2026-09-01T09:17:00Z', itens: { arroz: [{ tamanho: 1000, preco: 9.9, nome: 'Arroz velho' }] } },
    },
  })!;

  it('valida o JSON baixado', () => {
    expect(site).not.toBeNull();
    expect(site.lojas.angeloni.itens.inexistente).toBeUndefined();
    expect(lerPrecosSite({ versao: 2 })).toBeNull();
    expect(lerPrecosSite('lixo')).toBeNull();
  });

  it('usa o preço do site, marca promoção e ignora loja com preço velho', () => {
    const arroz = opcoesItem('arroz', 'giassi', { site, agora });
    expect(arroz.map(o => [o.tamanho, o.preco, o.site])).toEqual([[1000, 3.88, true], [5000, 19.09, true]]);
    expect(arroz[0].rotulo).toBe('Arroz Branco Tipo 1 Giassi Pacote 1kg');
    expect(opcoesItem('tomate', 'giassi', { site, agora })[0]).toMatchObject({ oferta: true, kg: 13.98 });
    expect(opcoesItem('arroz', 'hippo', { site, agora })[0].site).toBeFalsy();
  });

  it('estima os mercados sem site acompanhando o preço real (tomate caro puxa a estimativa)', () => {
    const semSite = opcoesItem('tomate', 'komprao')[0].kg!;
    const ancorado = opcoesItem('tomate', 'komprao', { site, agora })[0].kg!;
    expect(ancorasDoSite({ giassi: site.lojas.giassi, angeloni: site.lojas.angeloni }).tomate).toBeGreaterThan(1.5);
    expect(ancorado).toBeGreaterThan(semSite * 1.4);
  });

  it('nota fiscal recente vale mais que o site; antiga não', () => {
    const reais = { 'giassi:arroz': { porUnidade: 0.005, data: '20/10/2026' } };
    expect(opcoesItem('arroz', 'giassi', { site, reais, agora })[0]).toMatchObject({ real: true, preco: 5 });
    const velha = { 'giassi:arroz': { porUnidade: 0.005, data: '01/06/2026' } };
    expect(opcoesItem('arroz', 'giassi', { site, reais: velha, agora })[0].site).toBe(true);
  });

  it('planeja com os preços do site sem passar do orçamento', () => {
    const p = planejar({ ...PADRAO, mercados: ['giassi', 'komprao'] }, 1, { site, agora });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.custo.total).toBeLessThanOrEqual(PADRAO.orcamento);
    expect(tabela(['giassi'], { site, agora }).opcoes.arroz.giassi[0].site).toBe(true);
  });
});
