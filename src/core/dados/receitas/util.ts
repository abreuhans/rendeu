import type { Linha, Passo, Receita, Refeicao } from '../../tipos';

/** Passo escrito. cond: 'item' só aparece se o item estiver na receita final; '!item' só se não estiver. */
export const T = (t: string, cond?: string): Passo => ({ t, cond });
/** Passo que se adapta ao aparelho (ver metodos.ts). */
export const M = (m: string, item?: string, cond?: string): Passo => ({ m, item, cond });

export const R = (
  id: string, refeicoes: Refeicao[], cozinha: string, tempo: number, nome: string,
  ing: Linha[], passos: Passo[], extra: Partial<Receita> = {},
): Receita => ({ id, refeicoes, cozinha, tempo, nome, ing, passos, ...extra });
