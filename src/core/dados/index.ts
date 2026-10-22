import type { Receita } from '../tipos';
import { CAFE_E_LANCHES } from './receitas/cafe';
import { CAFE_E_LANCHES_2 } from './receitas/cafe2';
import { PRINCIPAIS_1 } from './receitas/principais';
import { PRINCIPAIS_2 } from './receitas/principais2';
import { PRINCIPAIS_3 } from './receitas/principais3';
import { PRINCIPAIS_4 } from './receitas/principais4';
import { PRINCIPAIS_5 } from './receitas/principais5';

export * from './catalogo';
export { METODOS } from './metodos';

export const RECEITAS: Receita[] = [
  ...CAFE_E_LANCHES, ...CAFE_E_LANCHES_2, ...PRINCIPAIS_1, ...PRINCIPAIS_2, ...PRINCIPAIS_3, ...PRINCIPAIS_4, ...PRINCIPAIS_5,
];
export const RECEITA: Record<string, Receita> = Object.fromEntries(RECEITAS.map(r => [r.id, r]));
