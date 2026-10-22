// Relatório rápido para conferir receitas e planos: node scripts/relatorio (via esbuild).
import { RECEITAS, candidatos, dinheiro, planejar, tabela, type Preferencias } from '../src/core';
import { PADRAO } from '../tests/fixtures';

const prefs: Preferencias = { ...PADRAO };
const tab = tabela(['koch']);
const { cands } = candidatos({ ...prefs, aparelhos: ['fogao', 'forno', 'microondas', 'airfryer', 'pressao', 'pressao_eletrica', 'arroz_eletrica', 'liquidificador', 'sanduicheira', 'torradeira'] });
const linhas: string[] = [];
for (const r of ['B', 'L', 'S'] as const) for (const v of cands[r] || []) {
  let c = 0;
  for (const l of v.linhas) { const ops = tab.opcoes[l.id].koch; const best = Math.min(...ops.map(o => o.preco / o.tamanho)); c += l.q * best; }
  linhas.push(`${r} ${v.rid.padEnd(26)} ${String(Math.round(v.nut.kcal)).padStart(5)} kcal ${String(Math.round(v.nut.p)).padStart(4)}p ${String(Math.round(v.nut.c)).padStart(4)}c  ${dinheiro(c).padStart(9)}`);
}
console.log(linhas.join('\n'));
console.log('receitas:', RECEITAS.length);
const casos: [string, Partial<Preferencias>][] = [
  ['padrão R$150, 1 pessoa, 5 dias, café+almoço+jantar', {}],
  ['R$90 apertado', { orcamento: 90 }],
  ['2 pessoas, 7 dias, 4 refeições, R$450, dividir', { pessoas: 2, dias: 7, refeicoes: ['B', 'L', 'D', 'S'], orcamento: 450, modo: 'dividir' }],
  ['low carb R$200', { dieta: 'low_carb', orcamento: 200 }],
  ['vegetariana', { restricoes: ['vegetariana'] }],
  ['só micro-ondas', { aparelhos: ['microondas'] }],
  ['adora frango, cozinha nordestina, variedade R$220', { adora: ['frango'], cozinhas: ['nordestina'], estilo: 'variedade', orcamento: 220 }],
];
for (const [nome, extra] of casos) {
  const t0 = Date.now();
  const p = planejar({ ...prefs, ...extra }, 1);
  const ms = Date.now() - t0;
  if (!p.ok) { console.log(`\n## ${nome}: SEM PLANO`, p); continue; }
  console.log(`\n## ${nome}: ${dinheiro(p.custo.total)} de ${dinheiro(p.prefs.orcamento)} · ${p.mercados.join('+')} · ${ms} ms · ${new Set(p.keys.map(k => p.vmap[k].rid)).size}/${p.keys.length} pratos · ${Math.round(p.porDia.kcal)} kcal/dia`);
  for (const d of p.dias) console.log(`  D${d.d + 1}: ` + Object.entries(d.refeicoes).map(([r, x]) => `${r}=${p.vmap[x!.key].rid}${p.vmap[x!.key].lowcarb ? '*' : ''}`).join('  '));
  console.log('  por mercado:', p.porMercado.map(m => `${m.mercado} ${dinheiro(m.total)}`).join(' | '), '| dividindo', dinheiro(p.dividido));
}
