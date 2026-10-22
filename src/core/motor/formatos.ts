// Formatos brasileiros: dinheiro, números e quantidades de cozinha.
import { ITEM } from '../dados/catalogo';

const milhar = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function dinheiro(x: number): string {
  const v = Math.abs(Math.round(x * 100) / 100);
  const [int, dec] = v.toFixed(2).split('.');
  return (x < -0.004 ? '−' : '') + 'R$\u00a0' + milhar(int) + ',' + dec;
}

export function numero(x: number, casas = 0): string {
  const [i, d] = x.toFixed(casas).split('.');
  return milhar(i) + (d ? ',' + d : '');
}

/** 0.5 → "½", 1.33 → "1⅓" */
export function fracao(x: number): string {
  const inteiro = Math.floor(x + 1e-6);
  const f = x - inteiro;
  const ops: [number, string][] = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']];
  let melhor = ops[0];
  for (const o of ops) if (Math.abs(o[0] - f) < Math.abs(melhor[0] - f)) melhor = o;
  const w = melhor[0] === 1 ? inteiro + 1 : inteiro;
  const out = (w ? String(w) : '') + melhor[1];
  return out || (x > 0 ? '⅛' : '0');
}

const plural = (q: number, um: string, varios: string) => (q > 1.01 ? varios : um);

/** Quantidade para lista de ingredientes: 250 g, 1 kg, 2 colheres (sopa), 3 dentes... */
export function quantidade(itemId: string, q: number): string {
  const it = ITEM[itemId];
  switch (it.u) {
    case 'g':
    case 'ml': {
      if (it.cs && q < it.cs * 4) {
        const cs = q / it.cs;
        if (cs < 0.5) { const cc = q / (it.cs / 3); return `${fracao(cc)} ${plural(cc, 'colher', 'colheres')} (chá)`; }
        return `${fracao(cs)} ${plural(cs, 'colher', 'colheres')} (sopa)`;
      }
      if (q >= 1000) return `${numero(q / 1000, Math.abs(q % 1000) < 1 ? 0 : 1)} ${it.u === 'g' ? 'kg' : 'L'}`;
      return `${q >= 100 ? Math.round(q / 10) * 10 : Math.max(1, Math.round(q))} ${it.u}`;
    }
    case 'dente': return `${fracao(q)} ${plural(q, 'dente', 'dentes')}`;
    case 'fatia': { const n = Math.max(1, Math.round(q)); return `${n} ${plural(n, 'fatia', 'fatias')}`; }
    case 'tablete': return `${fracao(q)} ${plural(q, 'tablete', 'tabletes')}`;
    default: return fracao(q);
  }
}

/** Preço por unidade de medida para a etiqueta (R$/kg, R$/L, R$/un). */
export function precoPorMedida(itemId: string, preco: number, tamanho: number, kg?: number): string {
  const it = ITEM[itemId];
  if (kg) return `${dinheiro(kg)}/kg`;
  if (it.u === 'g') return `${dinheiro((preco / tamanho) * 1000)}/kg`;
  if (it.u === 'ml') return `${dinheiro((preco / tamanho) * 1000)}/L`;
  if (tamanho > 1) return `${dinheiro(preco / tamanho)} cada`;
  return '';
}
