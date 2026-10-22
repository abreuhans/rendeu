// Chave de acesso da NFC-e (44 dígitos) e link do QR Code do cupom fiscal.
// Estrutura: cUF(2) AAMM(4) CNPJ(14) modelo(2) série(3) número(9) tpEmis(1) código(8) DV(1)

const UFS: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
  '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

export interface InfoChave {
  chave: string;
  uf: string;
  ano: number;
  mes: number;
  cnpj: string;
  modelo: string;
  serie: number;
  numero: number;
  /** Dígito verificador confere. */
  valida: boolean;
}

/** Dígito verificador (módulo 11, pesos 2 a 9 da direita para a esquerda). */
export function digitoVerificador(chave43: string): number {
  let soma = 0, peso = 2;
  for (let i = chave43.length - 1; i >= 0; i--) {
    soma += Number(chave43[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const dv = 11 - (soma % 11);
  return dv >= 10 ? 0 : dv;
}

/** Acha a chave de 44 dígitos num link de QR Code ou num texto digitado. */
export function extrairChave(texto: string): string | null {
  const t = decodeURIComponent(texto.trim());
  const p = t.match(/[?&](?:p|chNFe)=(\d{44})/i);
  if (p) return p[1];
  const digitos = t.replace(/\D/g, '');
  if (digitos.length === 44) return digitos;
  const solta = t.match(/(?:\d[\s.]?){44}/);
  if (solta) { const d = solta[0].replace(/\D/g, ''); if (d.length === 44) return d; }
  return null;
}

export function lerChave(chave: string): InfoChave {
  const c = chave.replace(/\D/g, '');
  const cnpj = c.slice(6, 20);
  return {
    chave: c,
    uf: UFS[c.slice(0, 2)] || '??',
    ano: 2000 + Number(c.slice(2, 4)),
    mes: Number(c.slice(4, 6)),
    cnpj,
    modelo: c.slice(20, 22),
    serie: Number(c.slice(22, 25)),
    numero: Number(c.slice(25, 34)),
    valida: c.length === 44 && digitoVerificador(c.slice(0, 43)) === Number(c[43]),
  };
}

export const formatarCnpj = (c: string) => c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

/**
 * Link de consulta pública da nota. O QR Code do cupom já traz o link completo
 * (com o código de segurança); só a chave digitada costuma pedir captcha no site.
 */
export function linkConsulta(textoQr: string): string | null {
  const t = textoQr.trim();
  if (/^https?:\/\//i.test(t)) return t.replace(/^http:\/\//i, 'https://');
  const chave = extrairChave(t);
  if (chave && chave.startsWith('42')) return `https://sat.sef.sc.gov.br/nfce/consulta?p=${chave}`;
  return null;
}
