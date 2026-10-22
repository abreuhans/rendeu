// Monta o passo a passo de uma receita com os aparelhos que a pessoa tem.
import { APARELHOS, METODOS, RECEITA } from '../dados';
import { type Variante, passoAtivo, temAparelho } from './planejador';

export interface PassoPronto {
  texto: string;
  aparelho?: string;
  alternativas?: string[];
  chave?: string;
  dica?: string;
}

export function passosDe(v: Variante, aparelhos: string[], escolhas: Record<string, string> = {}): PassoPronto[] {
  if (v.ia) return v.ia.passos.map(texto => ({ texto }));
  const rec = RECEITA[v.rid];
  const out: PassoPronto[] = [];
  for (const p of rec.passos) {
    if (!passoAtivo(p.cond, v.linhas)) continue;
    if ('t' in p) { out.push({ texto: p.t }); continue; }
    const m = METODOS[p.m];
    const disp = m.ordem.filter(a => temAparelho(a, aparelhos));
    if (!disp.length) { if (m.sem) out.push({ texto: m.sem }); continue; }
    const chave = v.rid + ':' + p.m;
    const esc = disp.includes(escolhas[chave]) ? escolhas[chave] : disp[0];
    out.push({ texto: m.v[esc].replace('{item}', p.item || ''), aparelho: esc, alternativas: disp.filter(a => a !== esc), chave, dica: m.dica });
  }
  return out;
}

export function nomeAparelho(id: string): string {
  const a = APARELHOS.find(x => x.id === id);
  return a ? a.curto || a.nome : id;
}
