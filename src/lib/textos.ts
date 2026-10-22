// Rótulos das telas e pequenas funções de texto (as mesmas do protótipo web).
import { MERCADOS, type Preferencias, type Refeicao } from '@/core';

export const PASSOS = 6;

export const PADRAO: Preferencias = {
  orcamento: 150,
  pessoas: 1,
  cep: '',
  mercados: ['komprao', 'koch', 'angeloni'],
  modo: 'um',
  dieta: 'equilibrada',
  restricoes: [],
  aparelhos: ['fogao', 'forno', 'microondas', 'pressao', 'liquidificador'],
  despensa: ['oleo', 'acucar', 'pimenta_reino', 'colorau', 'oregano'],
  naoCome: [],
  adora: [],
  cozinhas: [],
  dias: 5,
  refeicoes: ['B', 'L', 'D'],
  estilo: 'equilibrado',
};

export const NOME_REF: Record<Refeicao, string> = { B: 'Café da manhã', L: 'Almoço', D: 'Jantar', S: 'Lanche' };

export const DIETAS: [Preferencias['dieta'], string, string][] = [
  ['equilibrada', 'Equilibrada', 'Prato completo, sem exageros'],
  ['proteica', 'Rica em proteína', 'Mais proteína em cada refeição'],
  ['low_carb', 'Low carb', 'Troca arroz, pão e massa por legumes'],
  ['leve', 'Menos calorias', 'Pratos mais leves'],
  ['calorica', 'Mais calorias', 'Porções maiores para ganhar massa'],
];

export const RESTR: [string, string][] = [
  ['vegetariana', 'Vegetariana'],
  ['sem_lactose', 'Sem lactose'],
  ['sem_gluten', 'Sem glúten'],
  ['sem_amendoim', 'Alergia a amendoim'],
];

export const ESTILOS: [Preferencias['estilo'], string, string][] = [
  ['economia', 'Mais economia', 'Repete pratos e usa a sobra do jantar no almoço'],
  ['equilibrado', 'Equilibrado', 'Variedade sem desperdiçar'],
  ['variedade', 'Mais variedade', 'Prato diferente quase toda refeição'],
];

export const TIPO_MERCADO = { atacarejo: 'Atacarejo', supermercado: 'Supermercado', premium: 'Premium' };

export const SECOES: Record<string, string> = {
  hortifruti: 'Hortifrúti',
  acougue: 'Açougue e peixaria',
  frios: 'Frios, laticínios e ovos',
  padaria: 'Padaria',
  mercearia: 'Mercearia',
  congelados: 'Congelados',
  temperos: 'Temperos',
};

export const ORDEM_SECOES = ['hortifruti', 'acougue', 'frios', 'padaria', 'mercearia', 'congelados', 'temperos'];

export const nomeMercado = (id: string) => MERCADOS.find(m => m.id === id)?.nome ?? 'Outro mercado';

export const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

/** "A", "A e B", "A, B e C". */
export function juntar(lista: string[]): string {
  return lista.length <= 1 ? lista.join('') : `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}`;
}

/** "hoje às 06:17", "ontem às 18:17" ou "21/10 às 06:17", na hora do aparelho. */
export function quando(iso: string, agora = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dois = (n: number) => String(n).padStart(2, '0');
  const hora = `${dois(d.getHours())}:${dois(d.getMinutes())}`;
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dif = Math.round((dia(agora) - dia(d)) / 864e5);
  if (dif === 0) return `hoje às ${hora}`;
  if (dif === 1) return `ontem às ${hora}`;
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${hora}`;
}

/** Tira ou põe um valor numa lista (sem mexer na original). */
export function alternar<T>(lista: T[], v: T): T[] {
  return lista.includes(v) ? lista.filter(x => x !== v) : [...lista, v];
}

export function mascaraCep(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
}

/** Por enquanto o app só tem mercados da Grande Florianópolis. */
export function regiaoCep(cep: string): { ok: boolean; texto: string } | null {
  const d = cep.replace(/\D/g, '');
  if (d.length < 5) return null;
  const n = Number(d.slice(0, 5));
  if (n >= 88000 && n <= 88099) return { ok: true, texto: 'Florianópolis/SC' };
  if ((n >= 88100 && n <= 88139) || (n >= 88160 && n <= 88169)) return { ok: true, texto: 'Grande Florianópolis/SC' };
  return { ok: false, texto: 'Fora da Grande Florianópolis: por enquanto o app só tem mercados daqui.' };
}

/** "150" ou "150,50" → 150.5 (aceita vírgula ou ponto). */
export function lerValor(texto: string): number {
  const t = texto.replace(/[^\d.,]/g, '');
  if (!t) return NaN;
  return t.includes(',') ? Number(t.replace(/\./g, '').replace(',', '.')) : Number(t);
}
