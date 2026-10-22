// Ajudas para as notas fiscais: só aceitar links de sites do governo e mostrar o preço lido.
import { ITEM, dinheiro, precoPorMedida, type PrecoReal } from '@/core';

/** Os portais de consulta da NFC-e são das Secretarias da Fazenda (domínios .gov.br). */
export function ehLinkDeNota(url: string): boolean {
  const m = url.match(/^https?:\/\/([^/?#:]+)/i);
  return !!m && /(^|\.)gov\.br$/i.test(m[1]);
}

/** "R$ 7,99/kg", "R$ 5,49/L" ou "R$ 0,92 cada (R$ 7,66/kg)". */
export function precoLido(p: Pick<PrecoReal, 'itemId' | 'porUnidade'>): string {
  const it = ITEM[p.itemId];
  if (!it) return dinheiro(p.porUnidade);
  if (it.u === 'g' || it.u === 'ml') return precoPorMedida(p.itemId, p.porUnidade, 1);
  if (it.granel) return `${dinheiro(p.porUnidade)} cada (${dinheiro((p.porUnidade * 1000) / it.granel.pesoUn)}/kg)`;
  return `${dinheiro(p.porUnidade)} cada`;
}
