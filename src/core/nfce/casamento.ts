// Liga cada linha da nota ("ARROZ TIO JOAO T1 5KG") a um item do catálogo e
// calcula o preço por unidade base (g, ml ou unidade) para usar no planejamento.
import { ITEM, MERCADOS } from '../dados/catalogo';
import type { PrecoReal } from '../tipos';
import type { ItemNota, Nota } from './parser';

const ACENTOS: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e', í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o', ú: 'u', ù: 'u', û: 'u', ü: 'u', ç: 'c', ñ: 'n',
};

/** Maiúsculas, sem acento e com espaços simples. */
export function normalizar(s: string): string {
  return s.toLowerCase().replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, c => ACENTOS[c]).toUpperCase().replace(/[^\w/,.-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Regras em ordem: a primeira que bater vence (as mais específicas vêm antes). */
const REGRAS: [string, RegExp, RegExp?][] = [
  ['batata_palha', /BATATA.*PALHA/],
  ['batata_doce', /BATATA[ -]?DOCE|BAT\.? DOCE/],
  ['pao_queijo', /PAO.*QUEIJO/],
  ['coco_ralado', /COCO.*RALADO|RALADO.*COCO/],
  ['leite_coco', /LEITE.*COCO/],
  ['creme_leite', /CREME.*LEITE|CR\.? ?LEITE/],
  ['farinha_mandioca', /FAR(INHA|\.)?.*MAND/],
  ['farinha_trigo', /FAR(INHA|\.)?.*TRIGO/],
  ['massa_lasanha', /LASANHA/, /PRONTA|CONGEL|BOLONH/],
  ['massa_pastel', /PASTEL/, /FORNO|ASSADO|PRONTO|CONGEL/],
  ['macarrao_instantaneo', /INSTANT|LAMEN|MIOJO|NISSIN|CUP NOODLES/, /COPO/],
  ['macarrao', /MACARRAO|\bMAC\b|ESPAGUET|ESPAG\b|PARAFUSO|PENNE|FUSILLI|TALHARIM/, /INSTANT|LAMEN|MIOJO|NISSIN|COPO/],
  ['milho_pipoca', /PIPOCA/],
  ['milho_lata', /MILHO/, /PIPOCA|FUBA|FLOC|CANJICA|SUCRILHOS/],
  ['flocao', /FLOCAO|FLOCOS DE MILHO|FLOC.*MILHO|CUSCUZ/],
  ['fuba', /FUBA/],
  ['goma_tapioca', /TAPIOCA|GOMA/],
  ['granola', /GRANOLA/],
  ['aveia', /AVEIA/],
  ['arroz', /\bARROZ\b/, /INTEGRAL|ARBORIO|JAPON|BISC|FARINHA|DOCE/],
  ['grao_bico', /GRAO.?DE.?BICO|GRAO BICO/],
  ['lentilha', /LENTILHA/],
  ['feijao_preto', /FEIJ.*(PRETO|\bPTO\b)/],
  ['feijao_carioca', /FEIJ.*(CARIOCA|\bCAR\b|\bCARIOQ)/],
  ['acucar', /ACUCAR|ACUC\b/, /MASCAVO|DEMERARA|CONFEIT/],
  ['oleo', /OLEO.*SOJA|\bOL\.? ?SOJA/],
  ['azeite', /AZEITE/],
  ['vinagre', /VINAGRE/],
  ['molho_tomate', /MOLHO.*TOM|EXTRATO.*TOM|POLPA.*TOM|PASSATA/],
  ['ervilha_lata', /ERVILHA/],
  ['atum', /\bATUM\b/],
  ['sardinha', /SARDINHA/],
  ['maionese', /MAIONESE/],
  ['shoyu', /SHOYU|MOLHO DE SOJA/],
  ['pasta_amendoim', /PASTA.*AMENDOIM/],
  ['achocolatado', /ACHOCOLAT|NESCAU|TODDY/],
  ['cafe', /\bCAFE\b/, /CAPSULA|SOLUVEL|FILTRO|BISC/],
  ['caldo_galinha', /CALDO.*GALINHA/],
  ['fermento', /FERMENTO/, /BIOLOG/],
  ['paprica', /PAPRICA/],
  ['curry', /CURRY/],
  ['colorau', /COLORAU|COLORIFICO/],
  ['oregano', /OREGANO/],
  ['cominho', /COMINHO/],
  ['pimenta_reino', /PIMENTA.*REINO/],
  ['canela', /CANELA/],
  ['pao_hamburguer', /PAO.*HAMB/],
  ['tortilha', /RAP ?10|TORTILHA|PAO FOLHA|\bWRAP\b/],
  ['pao_forma', /PAO.*FORMA|\bPULLMAN\b|WICKBOLD|SEVEN BOYS/],
  ['pao_frances', /PAO (FRANCES|FRANC|DE SAL|D SAL|TIPO FRANCES|CARIOCA)/],
  ['ovos', /\bOVOS?\b/, /PASCOA|CHOCOLATE|CODORNA/],
  ['requeijao', /REQUEIJAO|\bREQ\b/],
  ['ricota', /RICOTA/],
  ['mussarela', /MUSSARELA|MUCARELA|MOZZARELLA|\bMUSS\b/],
  ['queijo_minas', /MINAS|FRESCAL/],
  ['parmesao', /PARMESAO|QUEIJO RALADO/],
  ['iogurte', /IOGURTE|IOG\b/],
  ['manteiga', /MANTEIGA/],
  ['margarina', /MARGARINA|QUALY|DORIANA/],
  ['leite', /\bLEITE\b/, /CONDENS|\bPO\b|EM PO|FERMENT|ACHOC|CHOC|DOCE|BISC|SORVETE|\bBEB/],
  ['presunto', /PRESUNTO/],
  ['peito_frango', /PEITO.*FRANGO|FILE.*PEITO|FILE DE FRANGO|SASSAMI/],
  ['asa_frango', /(COXINHA|MEIO|TULIPA).*\bASAS?\b|\bASAS? (DE )?FRANGO/],
  ['frango_coxa', /COXA|SOBRECOXA/],
  ['carne_seca', /CARNE.*SECA|CHARQUE|JERKED/],
  ['figado', /FIGADO/, /FRANGO|GALINHA/],
  ['costela', /COSTELA|PONTA (DE )?AGULHA/, /SUIN|PORCO|BARBECUE|DEFUM/],
  ['lombo', /LOMBO/, /CANADENSE|DEFUM|COZIDO/],
  ['carne_moida', /MOID[AO]/],
  ['acem', /\bACEM\b/],
  ['bife', /COXAO MOLE|PATINHO|\bBIFE\b|ALCATRA|CONTRA ?FILE/],
  ['calabresa', /CALABRESA/],
  ['linguica', /LINGUICA|\bLING\b/],
  ['bisteca', /BISTECA/],
  ['salsicha', /SALSICHA/],
  ['bacon', /BACON/, /SABOR|BATATA|SALGAD|BISC/],
  ['tilapia', /TILAPIA/],
  ['merluza', /MERLUZA/],
  ['camarao', /CAMARAO/],
  ['marisco', /MARISCO|MEXILHAO/],
  ['banana', /BANANA/],
  ['maca', /\bMACA\b/],
  ['mamao', /MAMAO|PAPAIA|PAPAYA/],
  ['laranja', /LARANJA/, /SUCO|NECTAR|REFRIG|\bBEB|GELEIA|DOCE|BOLO|BISC/],
  ['abacate', /ABACATE/],
  ['limao', /LIMAO/],
  ['tomate', /\bTOMATE\b/, /MOLHO|EXTRATO|POLPA|SECO|PELADO|PASSATA/],
  ['cebola', /\bCEBOLA\b/],
  ['alho', /\bALHO\b/, /PORO|MOLHO|PASTA/],
  ['batata', /\bBATATA\b/, /CHIPS|PRE.?FRIT|CONGEL|SORRISO/],
  ['cenoura', /CENOURA/],
  ['abobrinha', /ABOBRINHA/],
  ['abobora', /ABOBORA|CABOTIA/],
  ['chuchu', /CHUCHU/],
  ['berinjela', /BERINJELA|BERINGELA/],
  ['beterraba', /BETERRABA/],
  ['pepino', /PEPINO/, /CONSERVA/],
  ['quiabo', /QUIABO/],
  ['vagem', /\bVAGEM\b/],
  ['espinafre', /ESPINAFRE/],
  ['pimentao', /PIMENTAO/],
  ['brocolis', /BROCOLI/],
  ['repolho', /REPOLHO/],
  ['alface', /ALFACE/],
  ['couve', /\bCOUVE\b/, /FLOR/],
  ['cheiro_verde', /CHEIRO VERDE|CEBOLINHA|\bSALSA\b/],
  ['aipim', /AIPIM|MANDIOCA/],
  ['seleta', /SELETA|LEGUMES CONG|MIX.*LEGUMES/],
];

const POR_PESO = /^(KG|KGS|QUILO)$/;

/** Tamanho da embalagem escrito na descrição, na unidade base do item (g, ml ou un). */
export function tamanhoNaDescricao(desc: string, u: string): number | null {
  const n = normalizar(desc);
  const m = n.match(/(\d+(?:[.,]\d+)?)\s*(KG|G|GR|GRS|L|LT|LTS|ML)\b/);
  if (m && (u === 'g' || u === 'ml')) {
    const v = Number(m[1].replace(',', '.'));
    const un = m[2];
    if (un === 'KG' || un === 'L' || un === 'LT' || un === 'LTS') return v * 1000;
    return v;
  }
  if (u === 'un' || u === 'fatia' || u === 'tablete' || u === 'dente') {
    const c = n.match(/C\/\s?(\d+)|(\d+)\s?(UN|UNID|UNIDADES)\b|\bCX\s?(\d+)/);
    if (c) return Number(c[1] || c[2] || c[4]);
    if (/\bDZ\b|DUZIA/.test(n)) return 12;
  }
  return null;
}

export interface Casamento {
  itemId: string;
  /** Preço por unidade base do item (por g, ml ou unidade). */
  porUnidade: number;
  confianca: number;
  como: string;
}

/** Item do catálogo que a descrição do produto representa (a primeira regra que bate). */
export function itemDaDescricao(descricao: string): string | null {
  const desc = normalizar(descricao);
  const regra = REGRAS.find(([, inc, exc]) => inc.test(desc) && !(exc && exc.test(desc)));
  return regra ? regra[0] : null;
}

export function casarItem(linha: ItemNota): Casamento | null {
  const id = itemDaDescricao(linha.descricao);
  if (!id || !(linha.valorUnitario > 0)) return null;
  const it = ITEM[id];
  const unidadeNota = normalizar(linha.unidade);
  // Vendido por peso (hortifrúti, carnes, pão francês): o valor unitário é por kg.
  if (POR_PESO.test(unidadeNota)) {
    const porKg = linha.valorUnitario;
    if (it.u === 'g') return { itemId: it.id, porUnidade: porKg / 1000, confianca: 0.9, como: 'preço por kg' };
    if (it.granel) return { itemId: it.id, porUnidade: (porKg * it.granel.pesoUn) / 1000, confianca: 0.85, como: 'preço por kg ÷ peso médio' };
    return null;
  }
  const tam = tamanhoNaDescricao(linha.descricao, it.u);
  if (tam && tam > 0) return { itemId: it.id, porUnidade: linha.valorUnitario / tam, confianca: 0.9, como: 'tamanho na descrição' };
  if (it.granel || ((it.u === 'un' || it.u === 'dente') && it.pk && it.pk.length === 1 && it.pk[0][0] === 1)) {
    return { itemId: it.id, porUnidade: linha.valorUnitario, confianca: 0.7, como: 'preço por unidade' };
  }
  if (it.pk && it.pk.length === 1) {
    return { itemId: it.id, porUnidade: linha.valorUnitario / it.pk[0][0], confianca: 0.5, como: `embalagem padrão (${it.pk[0][2]})` };
  }
  return null;
}

/** Identifica o mercado pelo nome da empresa na nota. */
export function mercadoDaNota(nome?: string): string | null {
  const n = normalizar(nome || '');
  if (/KOMPRAO/.test(n)) return 'komprao';
  if (/\bKOCH\b|SUPERKOCH/.test(n)) return 'koch';
  if (/ANGELONI/.test(n)) return 'angeloni';
  if (/GIASSI/.test(n)) return 'giassi';
  if (/BISTEK/.test(n)) return 'bistek';
  if (/IMPERATRIZ|MUNDIALMIX/.test(n)) return 'imperatriz';
  if (/\bFORT\b|PEREIRA/.test(n)) return 'fort';
  if (/HIPPO/.test(n)) return 'hippo';
  return MERCADOS.find(m => n.includes(normalizar(m.nome)))?.id ?? null;
}

export interface ResultadoNota {
  mercadoId: string | null;
  precos: PrecoReal[];
  naoReconhecidos: ItemNota[];
}

/** Converte uma nota lida em preços reais por item (o mais recente vence). */
export function precosDaNota(nota: Nota, mercadoForcado?: string): ResultadoNota {
  const mercadoId = mercadoForcado || mercadoDaNota(nota.emitente.nome);
  const data = nota.data || new Date().toLocaleDateString('pt-BR');
  const precos: PrecoReal[] = [];
  const naoReconhecidos: ItemNota[] = [];
  for (const linha of nota.itens) {
    const c = casarItem(linha);
    if (!c) { naoReconhecidos.push(linha); continue; }
    precos.push({ itemId: c.itemId, mercadoId: mercadoId || 'outro', porUnidade: c.porUnidade, data, descricao: linha.descricao });
  }
  return { mercadoId, precos, naoReconhecidos };
}
