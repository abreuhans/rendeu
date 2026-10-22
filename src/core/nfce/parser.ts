// Lê a página pública de consulta da NFC-e (layout padrão do Portal da NFC-e,
// usado por SC, PR, RS e outros estados) e devolve os itens com preço.
// Não guarda dados do consumidor (CPF), só o que interessa para preço.

export interface ItemNota {
  descricao: string;
  codigo?: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
}

export interface Nota {
  emitente: { nome?: string; cnpj?: string; endereco?: string };
  itens: ItemNota[];
  total?: number;
  data?: string;
  chave?: string;
}

const ENTIDADES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };

export function textoLimpo(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z#0-9]+;/gi, e => ENTIDADES[e.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "1.234,56" → 1234.56 ; "0,7900" → 0.79 */
export function numeroBr(s: string): number {
  const m = s.replace(/[^\d.,-]/g, '');
  if (!m) return NaN;
  return m.includes(',') ? Number(m.replace(/\./g, '').replace(',', '.')) : Number(m);
}

function span(chunk: string, classe: string): string | undefined {
  const re = new RegExp(`class="(?:[^"]*\\s)?${classe}(?:\\s[^"]*)?"[^>]*>([\\s\\S]*?)</span>`, 'i');
  const m = chunk.match(re);
  return m ? textoLimpo(m[1]) : undefined;
}

function itensPorSpans(html: string): ItemNota[] {
  const ini = html.search(/id="tabResult"/i);
  const corpo = ini >= 0 ? html.slice(ini) : html;
  const partes = corpo.split(/(?=<span[^>]*class="(?:[^"]*\s)?txtTit2?(?:\s[^"]*)?")/i).slice(1);
  const itens: ItemNota[] = [];
  for (const p of partes) {
    const descricao = span(p, 'txtTit2?');
    const qtd = span(p, 'Rqtd');
    const vlUnit = span(p, 'RvlUnit');
    if (!descricao || !qtd || !vlUnit) continue;
    const codigo = (span(p, 'RCod') || '').match(/\d+/)?.[0];
    const unidade = (span(p, 'RUN') || 'UN').replace(/UN\s*:/i, '').trim().toUpperCase() || 'UN';
    const quantidade = numeroBr(qtd.replace(/Qtde\.?\s*:?/i, ''));
    const valorUnitario = numeroBr(vlUnit.replace(/Vl\.?\s*Unit\.?\s*:?/i, ''));
    const valorTotal = numeroBr(span(p, 'valor') || '');
    itens.push({
      descricao, codigo, unidade, quantidade, valorUnitario,
      valorTotal: Number.isFinite(valorTotal) ? valorTotal : Math.round(quantidade * valorUnitario * 100) / 100,
    });
  }
  return itens.filter(i => Number.isFinite(i.quantidade) && Number.isFinite(i.valorUnitario));
}

/** Texto da página mantendo as quebras de linha (para o texto copiado e colado da nota). */
function textoComLinhas(html: string): string {
  return html
    .replace(/<br\s*\/?>|<\/(?:div|p|tr|li|table|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z#0-9]+;/gi, e => ENTIDADES[e.toLowerCase()] ?? ' ')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n[\s]*/g, '\n');
}

/**
 * Plano B: página só com texto (ou texto copiado da nota), no formato
 * "DESC (Código: 1) Qtde.: 1 UN: UN Vl. Unit.: 9,99 Vl. Total 9,99". A descrição não passa de uma linha.
 */
function itensPorTexto(texto: string): ItemNota[] {
  const re = /([A-Z0-9][^()\n]{2,80}?)\s*\(\s*C[óo]digo:\s*(\d+)\s*\)\s*Qtde\.?:\s*([\d.,]+)\s*UN:\s*(\w+)\s*Vl\.?\s*Unit\.?:\s*([\d.,]+)\s*Vl\.?\s*Total\s*([\d.,]+)/gi;
  const itens: ItemNota[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    itens.push({ descricao: m[1].trim(), codigo: m[2], quantidade: numeroBr(m[3]), unidade: m[4].toUpperCase(), valorUnitario: numeroBr(m[5]), valorTotal: numeroBr(m[6]) });
  }
  return itens;
}

export function lerHtmlNfce(html: string): Nota {
  const texto = textoLimpo(html);
  let itens = itensPorSpans(html);
  if (!itens.length) itens = itensPorTexto(textoComLinhas(html));
  const nome = html.match(/class="txtTopo"[^>]*>([\s\S]*?)<\/div>/i);
  const cnpj = texto.match(/CNPJ:?\s*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i);
  let endereco: string | undefined;
  if (cnpj) {
    const depois = html.slice(html.indexOf(cnpj[1]) + cnpj[1].length);
    const div = depois.match(/<div[^>]*class="text"[^>]*>([\s\S]*?)<\/div>/i);
    if (div) endereco = textoLimpo(div[1]);
  }
  const total = texto.match(/Valor a pagar R\$:?\s*([\d.,]+)/i) || texto.match(/Valor total R\$:?\s*([\d.,]+)/i);
  const data = texto.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)/);
  const chave = texto.match(/((?:\d{4}\s?){10}\d{4})/);
  return {
    emitente: { nome: nome ? textoLimpo(nome[1]) : undefined, cnpj: cnpj ? cnpj[1] : undefined, endereco },
    itens,
    total: total ? numeroBr(total[1]) : undefined,
    data: data ? `${data[1]} ${data[2]}` : undefined,
    chave: chave ? chave[1].replace(/\s/g, '') : undefined,
  };
}
