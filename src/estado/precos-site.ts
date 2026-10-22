// Preços dos sites dos mercados: o robô (robo/) publica um JSON duas vezes por dia no próprio
// repositório. O app guarda a última versão no aparelho (abre na hora, mesmo sem internet) e
// confere se há uma nova em segundo plano, sem nunca segurar a tela.
import { lerPrecosSite, type PrecosSite } from '@/core';
import { gravar, ler } from './armazenamento';

export const URL_PRECOS = 'https://raw.githubusercontent.com/abreuhans/rendeu/precos/precos.json';
const CHAVE = 'rendeu.site.v1';

/** Depois de quanto tempo vale a pena conferir de novo (o robô roda de manhã e no fim da tarde). */
export const CONFERIR_A_CADA_MS = 2 * 3600e3;

export interface Guardado {
  site: PrecosSite;
  /** Última vez que o app conseguiu baixar o arquivo (ISO). */
  conferidoEm: string;
}

export function precosGuardados(): Guardado | null {
  const g = ler<Guardado>(CHAVE);
  const site = lerPrecosSite(g?.site);
  return site && g ? { site, conferidoEm: g.conferidoEm } : null;
}

export function guardarPrecos(site: PrecosSite): Guardado {
  const g = { site, conferidoEm: new Date().toISOString() };
  gravar(CHAVE, g);
  return g;
}

/** Baixa o arquivo publicado; `null` se não houver internet, demorar demais ou vier algo estranho. */
export async function baixarPrecos(tempoMax = 12000): Promise<PrecosSite | null> {
  const controle = new AbortController();
  const t = setTimeout(() => controle.abort(), tempoMax);
  try {
    const r = await fetch(URL_PRECOS, { signal: controle.signal, headers: { accept: 'application/json' } });
    if (!r.ok) return null;
    return lerPrecosSite(await r.json());
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
