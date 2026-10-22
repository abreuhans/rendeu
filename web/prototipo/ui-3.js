// Receita alternativa com IA: o Claude sugere, o app confere itens, preço e orçamento.
// Usa a capacidade `sample` do artefato (a conta Claude de quem está vendo).
const IA_DESLIGADA = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

async function iniciarIA() {
  try {
    const sample = window.claude && window.claude.use ? await window.claude.use('sample') : null;
    S.ia.sample = sample;
    S.ia.disponivel = !!sample;
  } catch (e) {
    S.ia.disponivel = false;
  }
  if (S.folha) renderFolha();
}

function caixaIA() {
  if (S.ia.disponivel === null) return '';
  if (S.ia.disponivel === false) return `<div class="ai"><p class="note">${S.ia.negada ? 'A IA não foi autorizada nesta página.' : 'A criação com IA funciona quando esta página é aberta no Claude.'}</p></div>`;
  return `<div class="ai">
    <h3>${ICONE.ia}<span>Criar alternativa com IA</span></h3>
    <p class="note">A IA escreve a receita; o app confere ingredientes, preço e orçamento antes de aceitar.</p>
    <div class="ai-row">
      <input id="ia-pedido" type="text" maxlength="140" placeholder="Algum pedido? ex.: algo com peixe, sem forno, mais rápido" value="${esc(S.ia.pedido || '')}" ${S.ia.ocupada ? 'disabled' : ''} aria-label="Pedido para a IA">
      ${S.ia.ocupada ? '<button class="btn small ghost" data-acao="ia-parar">Parar</button>' : '<button class="btn small accent" data-acao="ia">Criar com IA</button>'}
    </div>
    ${S.ia.ocupada ? `<p class="ai-status" role="status"><span class="dot" aria-hidden="true"></span>${S.ia.etapa === 'conferir' ? 'Conferindo preços e orçamento…' : 'A IA está criando uma receita…'}</p>` : ''}
    ${S.ia.msg ? `<p class="ai-msg ${S.ia.tipo}" role="status">${esc(S.ia.msg)}</p>` : ''}
  </div>`;
}

function itensPermitidos(prefs) {
  const tags = new Set(prefs.restricoes.flatMap(x => Core.RESTRICOES[x] || []));
  const grupos = new Set(prefs.naoCome);
  return Core.ITENS.filter(it => !(it.tags || []).some(t => tags.has(t)) && !(it.g && grupos.has(it.g)));
}

const UNIDADES = { g: 'g', ml: 'ml', un: 'unidade', dente: 'dente', fatia: 'fatia', tablete: 'tablete' };

function promptIA(pl, i) {
  const p = pl.prefs, slot = pl.slots[i], H = p.pessoas;
  const tab = tabelaDo(pl), casa = new Set(p.despensa);
  const outras = pl.keys.filter((_, j) => j !== i).map(k => pl.vmap[k]);
  const sem = Core.custoDe(outras, p, tab);
  const folga = Math.max(0, p.orcamento - sem.total);
  const sobras = {};
  for (const x of sem.itens) if (!x.emCasa && x.sobra > 0.01) sobras[x.id] = x.sobra;
  const catalogo = itensPermitidos(p).map(it => {
    const pu = Core.precoUnitarioMinimo(it.id, tab);
    const notas = [];
    if (casa.has(it.id)) notas.push('já tem em casa: grátis');
    if (sobras[it.id]) notas.push(`sobra ${num(sobras[it.id])} ${UNIDADES[it.u]} de outras refeições: grátis`);
    return `${it.id} | ${it.nome} | ${UNIDADES[it.u]} | ${din(pu.porUnidade * (it.u === 'g' || it.u === 'ml' ? 100 : 1))} por ${it.u === 'g' || it.u === 'ml' ? '100 ' + it.u : UNIDADES[it.u]} | menor embalagem ${num(pu.menorPacote)} ${UNIDADES[it.u]} = ${din(pu.precoMenor)}${notas.length ? ' | ' + notas.join('; ') : ''}`;
  }).join('\n');
  const aparelhos = p.aparelhos.map(a => Core.APARELHOS.find(x => x.id === a).nome).join(', ') || 'nenhum (só receitas sem fogo)';
  const dieta = { equilibrada: 'equilibrada', proteica: 'rica em proteína', low_carb: 'low carb (até 25 g de carboidrato por porção)', leve: 'leve (até 500 kcal por porção)', calorica: 'calórica, porções generosas' }[p.dieta];
  const restricoes = p.restricoes.map(x => RESTR.find(r => r[0] === x)[1]).join(', ');
  const grupo = id => (Core.GRUPOS.find(g => g.id === id) || {}).nome || id;
  const atual = infoReceita(pl.vmap[pl.keys[i]]).nome;
  const nomesOutras = [...new Set(outras.map(v => infoReceita(v).nome))].slice(0, 10).join('; ');
  return `Você é quem cria as receitas de um app brasileiro que monta cardápios dentro do orçamento, com preços de mercados de Florianópolis.
Crie UMA receita nova de ${NOME_REF[slot.r].toLowerCase()} para substituir "${atual}", para ${H} ${plural(H, 'pessoa', 'pessoas')}.

Regras:
- Use SOMENTE ingredientes do catálogo, pelo id. Sal e água são grátis e não precisam de id.
- Cozinhe só com: ${aparelhos}. Cada passo de cozimento diz o aparelho, a temperatura em °C e o tempo.
- Dieta: ${dieta}.${restricoes ? ' Restrições: ' + restricoes + '.' : ''}
- Nunca use: ${p.naoCome.map(grupo).join(', ') || 'nada em especial'}. A pessoa adora: ${p.adora.map(grupo).join(', ') || 'nada em especial'}.
- As compras são em embalagens inteiras: prefira itens marcados como grátis e itens que outras refeições já usam. Há cerca de ${din(folga)} disponíveis para embalagens novas.
- Comida caseira brasileira, bem diferente de: ${nomesOutras}.
${S.ia.pedido ? `- A pessoa pediu: "${S.ia.pedido.replace(/"/g, "'")}"\n` : ''}
Catálogo (id | nome | unidade | preço | menor embalagem | notas):
${catalogo}

Responda só com um objeto JSON, por exemplo:
{"nome": "Frango ao curry com arroz", "tempo_min": 30, "ingredientes": [{"id": "peito_frango", "qtd": 300}], "passos": ["...", "..."]}
- "qtd" é o TOTAL para ${H} ${plural(H, 'porção', 'porções')}, na unidade do catálogo.
- "passos": de 3 a 7 passos claros, em português do Brasil.`;
}

function validarIA(dados, pl, i) {
  if (!dados || typeof dados !== 'object' || !Array.isArray(dados.ingredientes) || !Array.isArray(dados.passos)) return { erro: 'formato' };
  const p = pl.prefs, H = p.pessoas, slot = pl.slots[i];
  const ok = new Set(itensPermitidos(p).map(x => x.id));
  const somas = new Map();
  for (const x of dados.ingredientes) {
    const id = String((x && x.id) || ''), q = Number(x && x.qtd);
    const it = Core.ITEM[id];
    const maior = it ? (it.pk ? it.pk[it.pk.length - 1][0] : 6) : 0;
    if (!ok.has(id) || !(q > 0) || q / H > maior * 2) return { erro: 'itens' };
    somas.set(id, (somas.get(id) || 0) + q / H);
  }
  const linhas = [...somas].map(([id, q]) => ({ id, q, opt: false }));
  const passos = dados.passos.map(s => String(s).trim()).filter(Boolean).slice(0, 10);
  const nome = String(dados.nome || '').slice(0, 90);
  if (linhas.length < 2) return { erro: 'itens' };
  if (passos.length < 2 || !nome) return { erro: 'formato' };
  const nut = Core.nutricao(linhas);
  if (p.dieta === 'low_carb' && nut.c > (slot.r === 'B' ? 20 : slot.r === 'S' ? 12 : 25)) return { erro: 'dieta' };
  const key = 'ia' + Date.now().toString(36) + '@' + slot.r;
  const v = {
    key, rid: key.split('@')[0], refeicao: slot.r, linhas, nut, lowcarb: false,
    score: 2.2 * Core.scoreDieta(nut, slot.r, p) + Core.scoreGosto(linhas, undefined, p),
    prot: Core.proteinaPrincipal(linhas),
    ia: { nome, passos, tempo: Math.max(2, Math.min(240, Math.round(Number(dados.tempo_min) || 20))) },
  };
  return { v };
}

function msgIA(msg, tipo) { S.ia.msg = msg; S.ia.tipo = tipo; }

async function rodarIA() {
  if (!S.ia.sample || S.ia.ocupada || !S.folha) return;
  const pl = S.plano, i = S.folha.i;
  const ctl = new AbortController();
  Object.assign(S.ia, { ctl, ocupada: true, etapa: 'criar', msg: '' });
  renderFolha();
  try {
    const dados = await S.ia.sample.json(promptIA(pl, i), { signal: ctl.signal, cache: false });
    S.ia.etapa = 'conferir';
    renderFolha();
    const r = validarIA(dados, pl, i);
    if (r.erro) {
      msgIA({ itens: 'A IA usou itens fora da lista dos mercados. Tente de novo.', dieta: 'A receita da IA não ficou low carb. Tente de novo.', formato: 'A resposta veio num formato inválido. Tente de novo.' }[r.erro], 'warn');
      return;
    }
    const keys = pl.keys.slice();
    keys[i] = r.v.key;
    const novo = Core.finalizar(pl.prefs, keys, pl.mercados, { ...pl.custom, [r.v.key]: r.v }, pl.meta);
    if (novo.custo.total > pl.prefs.orcamento + 1e-9) {
      msgIA(`A IA sugeriu “${r.v.ia.nome}”, mas a compra iria para ${din(novo.custo.total)} e passaria do orçamento em ${din(novo.custo.total - pl.prefs.orcamento)}. Tente de novo ou peça algo mais barato.`, 'warn');
      return;
    }
    const delta = novo.custo.total - pl.custo.total;
    S.plano = novo;
    salvar();
    msgIA(`Receita criada pela IA e conferida pelo app: ${r.v.ia.nome} (${fmtDelta(delta)})`, 'ok');
    render();
  } catch (e) {
    const code = e && e.code;
    if (code === 'cancelled') msgIA('', '');
    else if (IA_DESLIGADA.includes(code)) { S.ia.disponivel = false; S.ia.negada = code === 'not_granted'; }
    else if (code === 'rate_limited') msgIA('Muitos pedidos seguidos. Espere um pouco e tente de novo.', 'warn');
    else if (code === 'refused') msgIA('A IA recusou esse pedido. Tente pedir de outro jeito.', 'warn');
    else if (code === 'invalid_json') msgIA('A resposta veio num formato inválido. Tente de novo.', 'warn');
    else msgIA('A IA não respondeu. Tente de novo.', 'warn');
  } finally {
    Object.assign(S.ia, { ocupada: false, ctl: null, etapa: '' });
    if (S.folha) renderFolha();
  }
}

// --- Início ------------------------------------------------------------------------
function iniciar() {
  restaurar();
  render();
  setTimeout(() => {
    try { S.exemplo = Core.planejar(PADRAO, 1); } catch (e) { S.exemplo = null; }
    if (S.tela === 'inicio') render();
  }, 30);
  iniciarIA();
}
iniciar();
