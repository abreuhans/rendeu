// Leitura simples do robots.txt: antes de buscar, o robô confere se o site permite aquele caminho.
// Segue a regra mais específica (a mais longa) entre Allow e Disallow do grupo "User-agent: *".

export interface Regras { allow: string[]; disallow: string[] }

export function lerRobots(texto: string): Regras {
  const regras: Regras = { allow: [], disallow: [] };
  let doGrupo = false, viuRegra = false;
  for (const linhaBruta of texto.split(/\r?\n/)) {
    const linha = linhaBruta.replace(/#.*/, '').trim();
    const m = linha.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const campo = m[1].toLowerCase(), valor = m[2].trim();
    if (campo === 'user-agent') {
      if (viuRegra) { doGrupo = false; viuRegra = false; }
      if (valor === '*') doGrupo = true;
      continue;
    }
    if (campo !== 'allow' && campo !== 'disallow') continue;
    viuRegra = true;
    if (!doGrupo || !valor) continue;
    regras[campo].push(valor);
  }
  return regras;
}

/** O padrão do robots.txt (com * e $) bate com o caminho+consulta? */
function bate(padrao: string, caminho: string): boolean {
  const fim = padrao.endsWith('$');
  const corpo = (fim ? padrao.slice(0, -1) : padrao).split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp('^' + (corpo.startsWith('/') || corpo.startsWith('.*') ? '' : '.*') + corpo + (fim ? '$' : '')).test(caminho);
}

export function permitido(regras: Regras, url: string): boolean {
  const u = new URL(url);
  const caminho = u.pathname + u.search;
  let melhor = { tam: -1, ok: true };
  for (const p of regras.disallow) if (bate(p, caminho) && p.length > melhor.tam) melhor = { tam: p.length, ok: false };
  for (const p of regras.allow) if (bate(p, caminho) && p.length >= melhor.tam) melhor = { tam: p.length, ok: true };
  return melhor.ok;
}
