import { describe, expect, it } from 'vitest';
import { casarItem, digitoVerificador, extrairChave, lerChave, lerHtmlNfce, linkConsulta, mercadoDaNota, precosDaNota, tamanhoNaDescricao } from '../src/core';

// Chave de exemplo (fictícia) de Santa Catarina com dígito verificador correto.
const SEM_DV = '42' + '2610' + '83646984000150' + '65' + '001' + '000012345' + '1' + '00123456';
const CHAVE = SEM_DV + digitoVerificador(SEM_DV);

const item = (desc: string, qtd: string, un: string, vl: string, total: string, cod = '789') => `
  <tr id="Item + 1"><td valign="top"><span class="txtTit2">${desc}</span><span class="RCod">(Código: ${cod} )</span><br/>
  <span class="Rqtd"><strong>Qtde.:</strong>${qtd}</span><span class="RUN"><strong>UN: </strong>${un}</span>
  <span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;${vl}</span></td>
  <td align="right" valign="top" class="txtTit noWrap">Vl. Total<br/><span class="valor">${total}</span></td></tr>`;

// Página no layout padrão de consulta da NFC-e (dados fictícios).
const HTML = `<html><body><div id="conteudo">
  <div class="txtCenter"><div id="u20" class="txtTopo">ANGELONI &amp; CIA LTDA</div>
  <div class="text">CNPJ: 83.646.984/0001-50</div>
  <div class="text">RUA DE EXEMPLO, 100, , CENTRO, FLORIANOPOLIS, SC</div></div>
  <table id="tabResult">
  ${item('ARROZ TIO JOAO T1 5KG', '1', 'UN', '24,90', '24,90')}
  ${item('CEBOLA KG', '0,815', 'KG', '5,49', '4,47')}
  ${item('OVOS BRANCOS GRANDES C/30', '1', 'UN', '23,90', '23,90')}
  ${item('LEITE UHT INTEGRAL 1L', '6', 'UN', '5,19', '31,14')}
  ${item('CHOCOLATE AO LEITE 90G', '1', 'UN', '6,99', '6,99')}
  </table>
  <div id="totalNota"><div id="linhaTotal"><label>Qtd. total de itens:</label><span class="totalNumb">5</span></div>
  <div id="linhaTotal" class="linhaShade"><label>Valor a pagar R$:</label><span class="totalNumb txtMax">91,40</span></div></div>
  <div id="infos"><ul><li><strong>Emissão: </strong>21/10/2026 18:42:10 - Via Consumidor</li></ul>
  <span class="chave">${CHAVE.replace(/(\d{4})/g, '$1 ').trim()}</span></div>
</div></body></html>`;

describe('chave da NFC-e', () => {
  it('lê a chave do link do QR Code e confere o dígito', () => {
    const qr = `http://sat.sef.sc.gov.br/nfce/consulta?p=${CHAVE}|2|1|1|3F2A9C0B7E`;
    expect(extrairChave(qr)).toBe(CHAVE);
    const info = lerChave(CHAVE);
    expect(info.uf).toBe('SC');
    expect(info.cnpj).toBe('83646984000150');
    expect(info.modelo).toBe('65');
    expect(info.mes).toBe(10);
    expect(info.valida).toBe(true);
    expect(lerChave(CHAVE.slice(0, 43) + ((Number(CHAVE[43]) + 1) % 10)).valida).toBe(false);
    expect(linkConsulta(qr)).toMatch(/^https:\/\/sat\.sef\.sc\.gov\.br\/nfce\/consulta\?p=/);
    expect(extrairChave(CHAVE.replace(/(\d{4})/g, '$1 '))).toBe(CHAVE);
  });
});

describe('página da nota', () => {
  it('extrai emitente, itens, total, data e chave', () => {
    const nota = lerHtmlNfce(HTML);
    expect(nota.emitente.nome).toBe('ANGELONI & CIA LTDA');
    expect(nota.emitente.cnpj).toBe('83.646.984/0001-50');
    expect(nota.emitente.endereco).toContain('FLORIANOPOLIS');
    expect(nota.itens).toHaveLength(5);
    expect(nota.itens[1]).toMatchObject({ descricao: 'CEBOLA KG', quantidade: 0.815, unidade: 'KG', valorUnitario: 5.49, valorTotal: 4.47 });
    expect(nota.total).toBe(91.4);
    expect(nota.data).toBe('21/10/2026 18:42:10');
    expect(nota.chave).toBe(CHAVE);
  });

  it('transforma os itens em preços por unidade do catálogo', () => {
    const nota = lerHtmlNfce(HTML);
    expect(mercadoDaNota(nota.emitente.nome)).toBe('angeloni');
    const r = precosDaNota(nota);
    const por = Object.fromEntries(r.precos.map(p => [p.itemId, p.porUnidade]));
    expect(por.arroz).toBeCloseTo(24.9 / 5000, 6);
    expect(por.cebola).toBeCloseTo((5.49 * 150) / 1000, 4);
    expect(por.ovos).toBeCloseTo(23.9 / 30, 4);
    expect(por.leite).toBeCloseTo(5.19 / 1000, 6);
    expect(r.naoReconhecidos.map(i => i.descricao)).toEqual(['CHOCOLATE AO LEITE 90G']);
    expect(r.precos.every(p => p.mercadoId === 'angeloni')).toBe(true);
  });

  it('reconhece descrições comuns de cupom', () => {
    const casos: [string, string, string][] = [
      ['FEIJAO PRETO CALDAO 1KG', 'UN', 'feijao_preto'], ['FEIJ CARIOCA KICALDO 1KG', 'UN', 'feijao_carioca'],
      ['OLEO SOJA SOYA 900ML', 'UN', 'oleo'], ['PEITO FRANGO FILE KG', 'KG', 'peito_frango'],
      ['CARNE MOIDA 2A KG', 'KG', 'carne_moida'], ['MAC ESPAGUETE RENATA 500G', 'UN', 'macarrao'],
      ['MOLHO TOMATE POMAROLA SACHE 300G', 'UN', 'molho_tomate'], ['BATATA DOCE KG', 'KG', 'batata_doce'],
      ['PAO FRANCES KG', 'KG', 'pao_frances'], ['QJO MUSSARELA FAT KG', 'KG', 'mussarela'],
      ['CREME DE LEITE NESTLE 200G', 'UN', 'creme_leite'], ['MACA GALA KG', 'KG', 'maca'],
      ['AIPIM DESCASCADO KG', 'KG', 'aipim'], ['LINGUICA TOSCANA AURORA KG', 'KG', 'linguica'],
    ];
    for (const [desc, un, id] of casos) {
      const c = casarItem({ descricao: desc, quantidade: 1, unidade: un, valorUnitario: 10, valorTotal: 10 });
      expect(c?.itemId, desc).toBe(id);
    }
    expect(tamanhoNaDescricao('LEITE UHT 1L', 'ml')).toBe(1000);
    expect(tamanhoNaDescricao('OVOS VERMELHOS DZ', 'un')).toBe(12);
    expect(casarItem({ descricao: 'DETERGENTE YPE 500ML', quantidade: 1, unidade: 'UN', valorUnitario: 2.5, valorTotal: 2.5 })).toBeNull();
  });

  it('lê o texto copiado da página da nota (versão do navegador)', () => {
    const texto = [
      'ANGELONI & CIA LTDA',
      'CNPJ: 83.646.984/0001-50',
      'AV. MADRE BENVENUTA, 687, SANTA MONICA, FLORIANOPOLIS, SC',
      'ARROZ TIO JOAO T1 5KG (Código: 7893500018490 )',
      'Qtde.:1 UN: UN Vl. Unit.: 25,90\tVl. Total',
      '25,90',
      'CEBOLA KG (Código: 2000123 )',
      'Qtde.:0,812 UN: KG Vl. Unit.: 6,98\tVl. Total',
      '5,67',
      'Qtd. total de itens: 2',
      'Valor a pagar R$: 31,57',
      'Emissão: 20/10/2026 18:42:10',
    ].join('\n');
    const nota = lerHtmlNfce(texto);
    expect(nota.itens.map(i => i.descricao)).toEqual(['ARROZ TIO JOAO T1 5KG', 'CEBOLA KG']);
    expect(nota.total).toBe(31.57);
    expect(nota.data).toBe('20/10/2026 18:42:10');
    const r = precosDaNota(nota);
    expect(r.precos.map(p => p.itemId)).toEqual(['arroz', 'cebola']);
    expect(mercadoDaNota(texto.slice(0, 400))).toBe('angeloni');
  });
});
