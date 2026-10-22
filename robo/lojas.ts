// Adaptadores das lojas: buscam um termo na API pública do site e devolvem produtos num formato só.
// Usam apenas endpoints de busca que os próprios sites usam e que o robots.txt de cada um permite.

export interface Produto {
  nome: string;
  /** Preço que a pessoa paga hoje (já com promoção). */
  preco: number;
  promo: boolean;
  /** Vendido a peso: `preco` é por kg. */
  porKg: boolean;
  /** Tamanho que a loja informa fora do nome (quando informa). */
  tamanho?: { valor: number; unidade: 'g' | 'ml' | 'un' };
  disponivel: boolean;
}

export interface Loja {
  /** id do mercado no catálogo do app */
  id: string;
  nome: string;
  fonte: string;
  url: (termo: string) => string;
  ler: (json: unknown) => Produto[];
}

const num = (x: unknown): number => (typeof x === 'number' ? x : typeof x === 'string' ? Number(x.replace(',', '.')) : NaN);

/** "multiplicador" + "unidade" (Giassi) ou "Quantidade da embalagem" + "Unidade de medida" (Angeloni). */
function tamanhoVtex(props: { name: string; values: string[] }[]): Produto['tamanho'] {
  const valor = (nome: string) => props.find(p => p.name === nome)?.values?.[0];
  const mult = valor('multiplicador'), un = valor('unidade');
  if (mult && un) {
    const v = num(mult);
    const u = un.toLowerCase();
    if (v > 0 && (u === 'kg' || u === 'l')) return { valor: v * 1000, unidade: u === 'kg' ? 'g' : 'ml' };
    if (v > 0 && (u === 'g' || u === 'ml')) return { valor: v, unidade: u };
    if (v > 0 && u === 'un') return { valor: v, unidade: 'un' };
  }
  return undefined;
}

interface VtexProduto {
  productName: string;
  properties?: { name: string; values: string[] }[];
  items: {
    name?: string;
    measurementUnit?: string;
    unitMultiplier?: number;
    sellers: { sellerDefault?: boolean; commertialOffer: { Price: number; ListPrice?: number; AvailableQuantity?: number; IsAvailable?: boolean } }[];
  }[];
}

/** Resposta da busca inteligente da VTEX (Giassi, Angeloni). */
export function lerVtex(json: unknown): Produto[] {
  const produtos = (json as { products?: VtexProduto[] })?.products;
  if (!Array.isArray(produtos)) throw new Error('resposta VTEX sem "products"');
  const out: Produto[] = [];
  for (const p of produtos) {
    const tamanho = tamanhoVtex(p.properties || []);
    for (const it of p.items || []) {
      const vend = it.sellers?.find(s => s.sellerDefault) || it.sellers?.[0];
      const of = vend?.commertialOffer;
      if (!of || !(of.Price > 0)) continue;
      const porKg = (it.measurementUnit || '').toLowerCase() === 'kg';
      out.push({
        nome: p.productName,
        preco: of.Price,
        promo: !!of.ListPrice && of.ListPrice - of.Price > 0.009,
        porKg,
        tamanho: porKg ? undefined : tamanho,
        disponivel: (of.AvailableQuantity ?? 1) > 0 && of.IsAvailable !== false,
      });
    }
  }
  return out;
}

interface OsuperHit {
  name: string;
  saleUnit?: string;
  pricing?: { price: number; promotion?: boolean; promotionalPrice?: number };
  quantity?: { inStock?: number };
}

/** Resposta da busca da OSuper (Koch, Hippo). */
export function lerOsuper(json: unknown): Produto[] {
  const hits = (json as { hits?: OsuperHit[] })?.hits;
  if (!Array.isArray(hits)) throw new Error('resposta OSuper sem "hits"');
  const out: Produto[] = [];
  for (const h of hits) {
    const pr = h.pricing;
    if (!pr || !(pr.price > 0)) continue;
    const promo = !!pr.promotion && !!pr.promotionalPrice && pr.promotionalPrice < pr.price - 0.009;
    out.push({
      nome: h.name,
      preco: promo ? pr.promotionalPrice! : pr.price,
      promo,
      porKg: (h.saleUnit || '').toUpperCase() === 'KG',
      disponivel: (h.quantity?.inStock ?? 1) > 0,
    });
  }
  return out;
}

const vtex = (host: string) => (termo: string) =>
  `https://${host}/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(termo)}` +
  '&page=1&count=24&sort=orders:desc&operator=and&fuzzy=0&locale=pt-BR';

const osuper = (org: number, loja: number) => (termo: string) =>
  `https://sense.osuper.com.br/${org}/${loja}/v2/search?size=30&from=0&search=${encodeURIComponent(termo)}`;

/**
 * Lojas com preço online. Ficam de fora: Bistek (o robots.txt proíbe /api/),
 * Komprão, Fort e Imperatriz (sem catálogo online com preço) — essas usam estimativa.
 */
export const LOJAS: Loja[] = [
  { id: 'giassi', nome: 'Giassi', fonte: 'giassi.com.br (busca VTEX)', url: vtex('www.giassi.com.br'), ler: lerVtex },
  { id: 'angeloni', nome: 'Angeloni', fonte: 'super.angeloni.com.br (busca VTEX)', url: vtex('super.angeloni.com.br'), ler: lerVtex },
  { id: 'koch', nome: 'Koch (Florianópolis)', fonte: 'superkoch.com.br (busca OSuper, loja 1411)', url: osuper(295, 1411), ler: lerOsuper },
  { id: 'hippo', nome: 'Hippo', fonte: 'hipposupermercados.com.br (busca OSuper, loja 1384)', url: osuper(286, 1384), ler: lerOsuper },
];
