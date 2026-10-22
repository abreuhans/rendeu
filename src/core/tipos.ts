// Tipos compartilhados pelo app (Expo) e pelo protótipo web.

/** B = café da manhã, L = almoço, D = jantar, S = lanche */
export type Refeicao = 'B' | 'L' | 'D' | 'S';

export type Unidade = 'g' | 'ml' | 'un' | 'dente' | 'fatia' | 'tablete';

export type Secao = 'hortifruti' | 'acougue' | 'frios' | 'padaria' | 'mercearia' | 'congelados' | 'temperos';

export type Tag = 'carne' | 'peixe' | 'lactose' | 'gluten' | 'amendoim';

export type TipoMercado = 'atacarejo' | 'supermercado' | 'premium';

export interface Mercado {
  id: string;
  nome: string;
  grupo?: string;
  tipo: TipoMercado;
  /** Multiplicador sobre o preço de referência (estimativa). */
  fator: number;
  /** 1 = mais barato, 3 = mais caro */
  nivel: 1 | 2 | 3;
}

export interface Aparelho {
  id: string;
  nome: string;
  curto?: string;
}

/** Embalagem: tamanho na unidade do item, preço de referência em R$ e rótulo. */
export type Embalagem = [tamanho: number, preco: number, rotulo: string];

export interface Item {
  id: string;
  nome: string;
  secao: Secao;
  u: Unidade;
  /** Embalagens vendidas (do menor para o maior). Itens a granel usam `granel`. */
  pk?: Embalagem[];
  /** Hortifrúti vendido por unidade, com preço por kg. */
  granel?: { kg: number; pesoUn: number };
  /** Nutrição: por 100 g/ml (u = g ou ml) ou por unidade (demais) → [kcal, proteína, carboidrato, gordura] */
  n: [number, number, number, number];
  tags?: Tag[];
  /** Grupo usado em "não como" / "adoro". */
  g?: string;
  /** g ou ml em 1 colher de sopa (para mostrar quantidades pequenas em colheres). */
  cs?: number;
}

export interface Metodo {
  /** Aparelhos em ordem de preferência. */
  ordem: string[];
  /** Texto do passo por aparelho. {item} é preenchido pela receita. */
  v: Record<string, string>;
  /** Passo opcional: sem aparelho, mostra `sem` e a receita continua possível. */
  opcional?: boolean;
  sem?: string;
  dica?: string;
}

export type Passo =
  | { t: string; cond?: string }
  | { m: string; item?: string; cond?: string };

/** [itemId, quantidade por porção, opcional?] */
export type Linha = [string, number, 1?];

export interface Receita {
  id: string;
  refeicoes: Refeicao[];
  cozinha: string;
  tempo: number;
  nome: string;
  ing: Linha[];
  passos: Passo[];
  /** Versão low carb: multiplicadores por item (0 remove). */
  lc?: Record<string, number>;
  lcMais?: [string, number][];
  /** Rende bem para o dia seguinte (marmita). */
  sobra?: boolean;
  /** Algum destes aparelhos é obrigatório (além dos métodos). */
  requer?: string[];
  /** Ajuste de popularidade: pratos que dividem opiniões (fígado, quiabo) ficam negativos. */
  peso?: number;
}

export interface Preferencias {
  orcamento: number;
  pessoas: number;
  cep: string;
  mercados: string[];
  modo: 'um' | 'dividir';
  dieta: 'equilibrada' | 'proteica' | 'low_carb' | 'leve' | 'calorica';
  restricoes: string[];
  aparelhos: string[];
  despensa: string[];
  naoCome: string[];
  adora: string[];
  cozinhas: string[];
  dias: number;
  refeicoes: Refeicao[];
  estilo: 'economia' | 'equilibrado' | 'variedade';
}

/** Preço observado numa nota fiscal (sobrepõe a estimativa). */
export interface PrecoReal {
  itemId: string;
  mercadoId: string;
  /** Preço por unidade base do item (por g, ml ou un). */
  porUnidade: number;
  data: string;
  descricao: string;
}
