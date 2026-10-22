import type { Receita } from '../tipos';
import { CAFE_E_LANCHES } from './receitas/cafe';
import { PRINCIPAIS_1 } from './receitas/principais';
import { PRINCIPAIS_2 } from './receitas/principais2';

export * from './catalogo';
export { METODOS } from './metodos';

export const RECEITAS: Receita[] = [...CAFE_E_LANCHES, ...PRINCIPAIS_1, ...PRINCIPAIS_2];
export const RECEITA: Record<string, Receita> = Object.fromEntries(RECEITAS.map(r => [r.id, r]));
