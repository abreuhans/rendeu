// Resultado: resumo, cardápio, receita, lista de compras, mercados e bastidores.
const cacheTabela = new WeakMap();
function tabelaDo(plano) {
  if (!cacheTabela.has(plano)) cacheTabela.set(plano, Core.tabela(plano.mercados));
  return cacheTabela.get(plano);
}
const fmtDelta = d => (Math.abs(d) < 0.005 ? 'mesmo total' : (d > 0 ? '+' : '−') + din(Math.abs(d)));

function infoReceita(v) {
  if (v.ia) return { nome: v.ia.nome, tempo: v.ia.tempo, cozinha: '' };
  const r = Core.RECEITA[v.rid];
  const c = Core.COZINHAS.find(x => x.id === r.cozinha);
  return { nome: r.nome, tempo: r.tempo, cozinha: c ? c.nome : '' };
}

function custoPorcao(plano, v) {
  const tab = tabelaDo(plano), casa = new Set(plano.prefs.despensa);
  let c = 0;
  for (const l of v.linhas) if (!casa.has(l.id)) c += l.q * Core.precoUnitarioMinimo(l.id, tab).porUnidade;
  return c;
}

function ehSobra(plano, i) {
  const s = plano.slots[i];
  if (s.r !== 'L' || s.d === 0) return false;
  const j = plano.slots.findIndex(x => x.d === s.d - 1 && x.r === 'D');
  if (j < 0) return false;
  const a = plano.vmap[plano.keys[i]], b = plano.vmap[plano.keys[j]];
  return a.rid === b.rid && !a.ia && Core.RECEITA[a.rid].sobra;
}

function selos(plano, i, v) {
  const out = [];
  if (ehSobra(plano, i)) out.push('<span class="badge">Sobra do jantar</span>');
  if (v.ia) out.push(`<span class="badge ai">${ICONE.ia}Criada com IA</span>`);
  if (v.lowcarb) out.push('<span class="badge">Versão low carb</span>');
  return out.length ? `<span class="badges">${out.join('')}</span>` : '';
}

function telaPlano() {
  const pl = S.plano, p = pl.prefs;
  const sobra = p.orcamento - pl.custo.total;
  const pct = Math.min(100, (pl.custo.total / p.orcamento) * 100);
  const usados = new Set(pl.custo.itens.filter(x => !x.emCasa).map(x => x.compra.mercado));
  const mercado = usados.size > 1 ? `${usados.size} mercados` : nomeMercado([...usados][0] || pl.mercados[0]);
  return `${barra(false)}
  <section class="screen results">
    <div class="summary">
      <p class="eyebrow">Seu plano · ${p.dias} ${plural(p.dias, 'dia', 'dias')} · ${p.pessoas} ${plural(p.pessoas, 'pessoa', 'pessoas')}</p>
      <div class="total-row"><span class="total">${din(pl.custo.total)}</span><span class="of">de ${din(p.orcamento)}</span></div>
      <div class="meter" role="img" aria-label="${Math.round(pct)}% do orçamento"><span style="width:${pct}%"></span></div>
      <p class="left">Sobram ${din(sobra)}</p>
      <dl class="facts">
        <div><dt>Refeições</dt><dd>${pl.keys.length}${p.pessoas > 1 ? ` × ${p.pessoas}` : ''}</dd></div>
        <div><dt>Por porção</dt><dd>${din(pl.custo.total / pl.porcoes)}</dd></div>
        <div><dt>Média por dia</dt><dd>${num(pl.porDia.kcal)} kcal · ${num(pl.porDia.p)} g prot.</dd></div>
        <div><dt>Onde comprar</dt><dd>${mercado}</dd></div>
      </dl>
      <div class="row-actions">
        <button class="btn small ghost" data-acao="editar">Editar escolhas</button>
        <button class="btn small ghost" data-acao="refazer">${ICONE.refazer}<span>Gerar outro plano</span></button>
      </div>
    </div>
    <nav class="tabs" role="tablist">${[['cardapio', 'Cardápio'], ['compras', 'Compras'], ['mercados', 'Mercados'], ['bastidores', 'Bastidores']].map(([k, t]) => `<button role="tab" data-acao="aba" data-v="${k}" aria-selected="${S.aba === k}">${t}</button>`).join('')}</nav>
    <div class="panel" role="tabpanel">${{ cardapio: abaCardapio, compras: abaCompras, mercados: abaMercados, bastidores: abaBastidores }[S.aba](pl)}</div>
  </section>`;
}

function abaCardapio(pl) {
  return pl.dias.map(dia => {
    const refs = Core.ORDEM_REFEICOES.filter(r => dia.refeicoes[r]);
    const kcal = refs.reduce((a, r) => a + pl.vmap[dia.refeicoes[r].key].nut.kcal, 0);
    return `<section class="day"><h3 class="day-title">Dia ${dia.d + 1}<span>${num(kcal)} kcal</span></h3>
      ${refs.map(r => cartaoRefeicao(pl, dia.refeicoes[r].i)).join('')}</section>`;
  }).join('');
}

function cartaoRefeicao(pl, i) {
  const v = pl.vmap[pl.keys[i]], info = infoReceita(v);
  return `<button class="meal" data-acao="abrir" data-i="${i}">
    <span class="meal-when">${NOME_REF[pl.slots[i].r]}</span>
    <span class="meal-name">${esc(info.nome)}</span>
    <span class="meal-meta">${info.tempo} min · ${num(v.nut.kcal)} kcal · ${num(v.nut.p)} g prot.</span>
    <span class="meal-price">${din(custoPorcao(pl, v))}<small>por porção</small></span>
    ${selos(pl, i, v)}
  </button>`;
}

// --- Folha da receita -----------------------------------------------------------
function abrirFolha(i, origem) {
  S.folha = { i };
  S.ia.msg = ''; S.ia.pedido = '';
  S.origemFolha = origem ? assinatura(origem) : null;
  renderFolha();
  document.body.classList.add('locked');
  const f = $('#folha .sheet [data-acao="fechar"]');
  if (f) f.focus();
}

function fecharFolha() {
  if (S.ia.ctl) S.ia.ctl.abort();
  S.folha = null;
  renderFolha();
  document.body.classList.remove('locked');
  refocar(S.origemFolha);
}

function renderFolha() {
  const raiz = $('#folha');
  if (!S.folha || !S.plano) { raiz.innerHTML = ''; document.body.classList.remove('locked'); return; }
  const pl = S.plano, i = S.folha.i, v = pl.vmap[pl.keys[i]], slot = pl.slots[i], info = infoReceita(v);
  const H = pl.prefs.pessoas, tab = tabelaDo(pl), casa = new Set(pl.prefs.despensa);
  const ings = v.linhas.map(l => {
    const it = Core.ITEM[l.id], q = l.q * H, temCasa = casa.has(l.id);
    const c = temCasa ? 0 : q * Core.precoUnitarioMinimo(l.id, tab).porUnidade;
    return `<li><span class="iq">${Core.quantidade(l.id, q)}</span><span class="in">${esc(it.nome)}${l.opt ? ' <small>opcional</small>' : ''}</span><span class="ic">${temCasa ? '<em>tem em casa</em>' : din(c)}</span></li>`;
  }).join('');
  const passos = Core.passosDe(v, pl.prefs.aparelhos, S.metodo).map(s => `<li>
      ${s.aparelho ? `<span class="appl">${Core.nomeAparelho(s.aparelho)}</span>` : ''}
      <p>${esc(s.texto)}</p>
      ${s.dica ? `<p class="fine">Dica: ${esc(s.dica)}</p>` : ''}
      ${s.alternativas && s.alternativas.length ? `<div class="alts"><span>Outros jeitos:</span>${s.alternativas.map(a => `<button class="chip tiny" data-acao="metodo" data-k="${s.chave}" data-v="${a}">${Core.nomeAparelho(a)}</button>`).join('')}</div>` : ''}
    </li>`).join('');
  const nut = [['kcal', v.nut.kcal, ''], ['prot.', v.nut.p, ' g'], ['carb.', v.nut.c, ' g'], ['gord.', v.nut.g, ' g']];
  raiz.innerHTML = `<div class="backdrop" data-acao="fechar"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="titulo-folha">
    <div class="grip" aria-hidden="true"></div>
    <div class="sheet-head">
      <div><p class="eyebrow">Dia ${slot.d + 1} · ${NOME_REF[slot.r]}</p><h2 id="titulo-folha">${esc(info.nome)}</h2></div>
      <button class="icon-btn" data-acao="fechar" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <p class="sheet-meta">${info.tempo} min · ${H} ${plural(H, 'porção', 'porções')}${info.cozinha ? ' · ' + info.cozinha : ''} · ${din(custoPorcao(pl, v))} por porção</p>
    ${selos(pl, i, v)}
    <div class="nutri">${nut.map(([k, x, u]) => `<div><b>${num(x)}${u}</b><span>${k}</span></div>`).join('')}</div>
    <p class="fine">${v.ia ? 'Nutrição e preço calculados pelo app a partir do catálogo.' : 'Valores por porção.'}</p>
    <h3>Ingredientes para ${H} ${plural(H, 'porção', 'porções')}</h3>
    <ul class="ings">${ings}</ul>
    <h3>Modo de preparo</h3>
    <ol class="steps">${passos}</ol>
    <div class="sheet-actions"><button class="btn ghost" data-acao="trocar">${ICONE.trocar}<span>Trocar receita</span></button></div>
    ${caixaIA()}
  </div>`;
}

function trocarReceita() {
  const pl = S.plano, i = S.folha.i;
  const atual = pl.vmap[pl.keys[i]].rid;
  S.tentadas[i] = S.tentadas[i] || [];
  if (!S.tentadas[i].includes(atual)) S.tentadas[i].push(atual);
  let novo = Core.trocar(pl, i, S.tentadas[i]);
  if (!novo && S.tentadas[i].length > 1) { S.tentadas[i] = [atual]; novo = Core.trocar(pl, i, S.tentadas[i]); }
  if (!novo) { aviso('Nenhuma outra receita cabe no orçamento.'); return; }
  const delta = novo.custo.total - pl.custo.total;
  S.plano = novo;
  salvar(); render();
  aviso(`Trocado por ${infoReceita(novo.vmap[novo.keys[i]]).nome} (${fmtDelta(delta)})`);
}

// --- Lista de compras -------------------------------------------------------------
function descricaoCompra(x) {
  const it = Core.ITEM[x.id], c = x.compra;
  if (it.granel) {
    const n = c.pacotes.reduce((a, p) => a + p.qtd, 0);
    return `${n} ${plural(n, 'unidade', 'unidades')} (~${num(n * it.granel.pesoUn)} g) · ${din(c.kg)}/kg`;
  }
  const pac = c.pacotes.map(p => `${p.qtd > 1 ? p.qtd + '× ' : ''}${p.rotulo}`).join(' + ');
  const maior = c.pacotes[c.pacotes.length - 1];
  const medida = Core.precoPorMedida(x.id, maior.preco, maior.tamanho);
  return pac + (medida ? ` · ${medida}` : '');
}

function linhasCompra(pl) {
  return pl.custo.itens.filter(x => !x.emCasa).sort((a, b) =>
    (a.compra.mercado > b.compra.mercado ? 1 : a.compra.mercado < b.compra.mercado ? -1 : 0)
    || ORDEM_SECOES.indexOf(Core.ITEM[a.id].secao) - ORDEM_SECOES.indexOf(Core.ITEM[b.id].secao)
    || Core.ITEM[a.id].nome.localeCompare(Core.ITEM[b.id].nome));
}

function abaCompras(pl) {
  const p = pl.prefs, linhas = linhasCompra(pl);
  const porMercado = {};
  for (const x of linhas) (porMercado[x.compra.mercado] = porMercado[x.compra.mercado] || []).push(x);
  const blocos = Object.entries(porMercado).map(([m, xs]) => {
    let sec = '', html = '';
    for (const x of xs) {
      const it = Core.ITEM[x.id];
      if (it.secao !== sec) { sec = it.secao; html += `<p class="rsec">${SECOES[sec]}</p>`; }
      html += `<label class="line"><input type="checkbox" data-marcar="${x.id}" ${S.marcados[x.id] ? 'checked' : ''}>
        <span class="ln"><span class="ln-name">${esc(it.nome)}${x.compra.oferta ? ' <i class="sale">OFERTA</i>' : ''}${x.compra.real ? ' <i class="sale real">NOTA</i>' : ''}</span><small>${esc(descricaoCompra(x))}</small></span>
        <span class="lq"></span><span class="lp">${din(x.custo)}</span></label>`;
    }
    const sub = xs.reduce((a, x) => a + x.custo, 0);
    return `<div class="rstore"><p class="rhead">${nomeMercado(m).toUpperCase()}</p>${html}
      ${Object.keys(porMercado).length > 1 ? `<div class="rsub"><span>Subtotal</span><span>${din(sub)}</span></div>` : ''}</div>`;
  }).join('');
  const emCasa = pl.custo.itens.filter(x => x.emCasa).map(x => Core.ITEM[x.id].nome);
  const sobras = pl.custo.itens.filter(x => !x.emCasa && x.compra && x.sobra > x.compra.comprado * 0.04);
  const pereciveis = sobras.filter(x => Core.PERECIVEIS.has(Core.ITEM[x.id].secao));
  const despensa = sobras.filter(x => !Core.PERECIVEIS.has(Core.ITEM[x.id].secao));
  const valorDespensa = despensa.reduce((a, x) => a + (x.sobra / x.compra.comprado) * x.custo, 0);
  return `<div class="receipt">
      <div class="rtop"><strong>Lista de compras</strong><span>${linhas.length} itens · preços estimados</span></div>
      ${blocos}
      <div class="rtotal"><span>TOTAL</span><span>${din(pl.custo.total)}</span></div>
      <div class="rsub"><span>Orçamento</span><span>${din(p.orcamento)}</span></div>
      <div class="rsub"><span>Sobra</span><span>${din(p.orcamento - pl.custo.total)}</span></div>
      <p class="rfoot">* * * Rendeu * * *</p>
    </div>
    <div class="row-actions"><button class="btn small ghost" data-acao="copiar">${ICONE.copiar}<span>Copiar lista</span></button></div>
    <textarea id="caixa-copia" class="copy-box" readonly hidden></textarea>
    ${emCasa.length ? `<section class="aside"><h3>Você já tem (fora da conta)</h3><p>${emCasa.map(esc).join(', ')}</p></section>` : ''}
    ${sobras.length ? `<section class="aside"><h3>O que sobra depois do plano</h3>
      ${despensa.length ? `<p>Fica na despensa: cerca de ${din(valorDespensa)} em itens como ${despensa.slice(0, 4).map(x => Core.ITEM[x.id].nome.toLowerCase()).join(', ')}.</p>` : ''}
      ${pereciveis.length ? `<p>Perecíveis que sobram (dica: congele ou use na semana seguinte):</p><ul class="left-list">${pereciveis.map(x => `<li><span>${Core.quantidade(x.id, x.sobra)}</span> ${esc(Core.ITEM[x.id].nome)}</li>`).join('')}</ul>` : ''}
    </section>` : ''}`;
}

function copiarLista() {
  const pl = S.plano, linhas = linhasCompra(pl);
  const titulo = `Rendeu — Lista de compras (${[...new Set(linhas.map(x => nomeMercado(x.compra.mercado)))].join(' + ')})`;
  const corpo = linhas.map(x => `[ ] ${Core.ITEM[x.id].nome} — ${descricaoCompra(x)} — ${din(x.custo)}`);
  const texto = [titulo, ...corpo, '', `TOTAL: ${din(pl.custo.total)} (orçamento ${din(pl.prefs.orcamento)})`].join('\n');
  const plano_b = () => {
    const caixa = $('#caixa-copia');
    caixa.hidden = false; caixa.value = texto; caixa.focus(); caixa.select();
    aviso('Não deu para copiar automaticamente. Selecione o texto abaixo.');
  };
  try { navigator.clipboard.writeText(texto).then(() => aviso('Lista copiada.'), plano_b); } catch (e) { plano_b(); }
}

// --- Mercados e bastidores ---------------------------------------------------------
function abaMercados(pl) {
  const p = pl.prefs;
  const linhas = pl.porMercado.slice().sort((a, b) => a.total - b.total);
  const escala = Math.max(p.orcamento, ...linhas.map(x => x.total)) * 1.04;
  return `<h3 class="panel-title">A mesma lista em cada mercado</h3>
  <div class="bars" style="--budget:${(p.orcamento / escala) * 100}%">
    ${linhas.map((x, i) => `<div class="bar-row ${x.total > p.orcamento ? 'over' : ''}">
      <span class="bar-name">${nomeMercado(x.mercado)}${i === 0 ? ' <em>mais barato</em>' : ''}</span>
      <span class="bar-track"><span style="width:${(x.total / escala) * 100}%"></span></span>
      <span class="bar-val">${din(x.total)}</span></div>`).join('')}
    <p class="bar-legend"><span class="budget-swatch"></span>Orçamento ${din(p.orcamento)}</p>
  </div>
  ${p.mercados.length > 1 ? `<p class="help">Dividindo entre os mercados: ${din(pl.dividido)}</p>` : ''}
  <p class="note">Preços estimados para o protótipo. No app, cada nota fiscal lida atualiza os preços daquele mercado.</p>`;
}

function abaBastidores(pl) {
  const p = pl.prefs, st = pl.meta.stats;
  const itens = [
    ['Preços', `${Core.ITENS.length} produtos com preço por embalagem em ${p.mercados.length} ${plural(p.mercados.length, 'mercado', 'mercados')} da Grande Florianópolis.`],
    ['Filtro de receitas', `${st.total} receitas no catálogo → ${st.combinam} combinam com sua dieta, restrições e gostos → ${st.possiveis} dá para fazer com seus aparelhos.`],
    ['Otimização', `${num(pl.meta.rodadas)} cardápios simulados. O escolhido custa ${din(pl.custo.total)} (limite ${din(p.orcamento)}). Conta embalagens inteiras e reaproveita o que sobra de uma receita na outra.`],
    ['Passo a passo', 'Cada etapa de cozimento tem versões para fogão, forno, micro-ondas, air fryer, panela de pressão e outros. Você vê a do aparelho que tem.'],
    ['Preços reais', 'No app, você lê o QR Code da nota fiscal (NFC-e). O app abre a nota na Sefaz, lê os itens e passa a usar aqueles preços para o mercado da nota.'],
    ['IA (opcional)', 'Cria uma receita nova sob pedido. O app confere se os ingredientes existem e se o total continua dentro do orçamento.'],
  ];
  return `<h3 class="panel-title">O que acontece quando você toca em “Gerar”</h3>
  <ol class="how">${itens.map(([h, t]) => `<li><b>${h}</b><p>${t}</p></li>`).join('')}</ol>`;
}
