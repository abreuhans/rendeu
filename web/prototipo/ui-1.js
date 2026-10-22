// Protótipo web do Rendeu — telas em JavaScript puro sobre o núcleo (Core),
// o mesmo código de planejamento usado no app.
const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const REDUZIR = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const din = x => Core.dinheiro(x);
const num = (x, c = 0) => Core.numero(x, c);
const PASSOS = 6;

const PADRAO = {
  orcamento: 150, pessoas: 1, cep: '', mercados: ['komprao', 'koch', 'angeloni'], modo: 'um', dieta: 'equilibrada',
  restricoes: [], aparelhos: ['fogao', 'forno', 'microondas', 'pressao', 'liquidificador'],
  despensa: ['oleo', 'acucar', 'pimenta_reino', 'colorau', 'oregano'], naoCome: [], adora: [], cozinhas: [],
  dias: 5, refeicoes: ['B', 'L', 'D'], estilo: 'equilibrado',
};

const S = {
  tela: 'inicio', passo: 1, prefs: clone(PADRAO), semente: 1, plano: null, problema: null, exemplo: null,
  aba: 'cardapio', folha: null, metodo: {}, marcados: {}, tentadas: {},
  ia: { disponivel: null, ocupada: false, etapa: '', msg: '', tipo: '', pedido: '', ctl: null },
};

const NOME_REF = { B: 'Café da manhã', L: 'Almoço', D: 'Jantar', S: 'Lanche' };
const DIETAS = [
  ['equilibrada', 'Equilibrada', 'Prato completo, sem exageros'],
  ['proteica', 'Rica em proteína', 'Mais proteína em cada refeição'],
  ['low_carb', 'Low carb', 'Troca arroz, pão e massa por legumes'],
  ['leve', 'Menos calorias', 'Pratos mais leves'],
  ['calorica', 'Mais calorias', 'Porções maiores para ganhar massa'],
];
const RESTR = [['vegetariana', 'Vegetariana'], ['sem_lactose', 'Sem lactose'], ['sem_gluten', 'Sem glúten'], ['sem_amendoim', 'Alergia a amendoim']];
const ESTILOS = [
  ['economia', 'Mais economia', 'Repete pratos e usa a sobra do jantar no almoço'],
  ['equilibrado', 'Equilibrado', 'Variedade sem desperdiçar'],
  ['variedade', 'Mais variedade', 'Prato diferente quase toda refeição'],
];
const TIPO_MERCADO = { atacarejo: 'Atacarejo', supermercado: 'Supermercado', premium: 'Premium' };
const SECOES = { hortifruti: 'Hortifrúti', acougue: 'Açougue e peixaria', frios: 'Frios, laticínios e ovos', padaria: 'Padaria', mercearia: 'Mercearia', congelados: 'Congelados', temperos: 'Temperos' };
const ORDEM_SECOES = ['hortifruti', 'acougue', 'frios', 'padaria', 'mercearia', 'congelados', 'temperos'];

const ICONE = {
  voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  trocar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  refazer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ia: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" fill="currentColor"/></svg>',
  copiar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};

const nomeMercado = id => (Core.MERCADOS.find(m => m.id === id) || { nome: 'Outro mercado' }).nome;
const plural = (n, um, varios) => (n === 1 ? um : varios);
const alterna = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); };
const remove = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); };
const topo = () => window.scrollTo({ top: 0, behavior: REDUZIR ? 'auto' : 'smooth' });

function regiaoCep(cep) {
  const d = cep.replace(/\D/g, '');
  if (d.length < 5) return null;
  const n = Number(d.slice(0, 5));
  if (n >= 88000 && n <= 88099) return { ok: true, texto: 'Florianópolis/SC' };
  if ((n >= 88100 && n <= 88139) || (n >= 88160 && n <= 88169)) return { ok: true, texto: 'Grande Florianópolis/SC' };
  return { ok: false, texto: 'Fora da Grande Florianópolis: por enquanto o protótipo só tem mercados daqui.' };
}

// --- Guardar escolhas neste navegador (só conveniência) -------------------------
const CHAVE = 'rendeu.v1';
function salvar() {
  try {
    const plano = S.plano ? { keys: S.plano.keys, mercados: S.plano.mercados, custom: S.plano.custom, meta: S.plano.meta, prefs: S.plano.prefs } : null;
    localStorage.setItem(CHAVE, JSON.stringify({ prefs: S.prefs, semente: S.semente, plano, marcados: S.marcados }));
  } catch (e) { /* sem armazenamento */ }
}
function restaurar() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (!d) return;
    if (d.prefs) S.prefs = { ...clone(PADRAO), ...d.prefs };
    if (d.semente) S.semente = d.semente;
    if (d.plano) {
      const p = Core.finalizar(d.plano.prefs, d.plano.keys, d.plano.mercados, d.plano.custom || {}, d.plano.meta);
      if (Object.values(p.vmap).every(Boolean)) { S.plano = p; S.marcados = d.marcados || {}; S.tela = 'plano'; }
    }
  } catch (e) { S.plano = null; }
}

// --- Renderização ------------------------------------------------------------
function assinatura(el) {
  if (!el || !el.dataset || !el.dataset.acao) return el && el.id ? '#' + el.id : null;
  return ['acao', 'k', 'id', 'v', 'd', 'i'].map(k => el.dataset[k] ?? '').join('|');
}
function refocar(sig) {
  if (!sig) return;
  if (sig[0] === '#') { const el = document.getElementById(sig.slice(1)); if (el) el.focus(); return; }
  for (const el of document.querySelectorAll('[data-acao]')) if (assinatura(el) === sig) { el.focus(); return; }
}
function render() {
  const sig = assinatura(document.activeElement);
  const tela = { inicio: telaInicio, passo: telaPasso, carregando: telaCarregando, plano: telaPlano, problema: telaProblema }[S.tela];
  $('#app').innerHTML = tela();
  $('#sobre').innerHTML = sobreHTML();
  renderFolha();
  refocar(sig);
}

function barra(voltar) {
  return `<header class="bar">
    ${voltar ? `<button class="icon-btn" data-acao="voltar" aria-label="Voltar">${ICONE.voltar}</button>` : '<span class="bar-spacer"></span>'}
    <button class="brand" data-acao="inicio" aria-label="Rendeu, início"><span class="tag-mark" aria-hidden="true"></span>Rendeu</button>
    <span class="bar-spacer"></span>
  </header>`;
}

function sobreHTML() {
  return `<h2>Sobre este protótipo</h2><ul>
    <li>Mercados da Grande Florianópolis com <b>preços estimados</b> para testar a ideia.</li>
    <li>Conta embalagens inteiras (ninguém compra ⅓ de bandeja de frango), reaproveita sobras entre receitas e nunca passa do orçamento.</li>
    <li>O passo a passo muda conforme os aparelhos marcados.</li>
    <li>No app, os preços reais entram pelo QR Code da nota fiscal (NFC-e).</li>
    <li>O botão de IA cria uma receita nova; o app confere preço e orçamento antes de aceitar.</li>
  </ul>`;
}

function telaInicio() {
  const ex = S.exemplo;
  return `${barra(false)}
  <section class="screen welcome">
    <h1 class="hero">Receitas que cabem no seu bolso</h1>
    <p class="lead">Diga quanto pode gastar, onde compra e o que tem na cozinha. O Rendeu monta o cardápio, as receitas e a lista de compras sem passar do valor.</p>
    ${ex && ex.ok ? cartaoExemplo(ex) : ''}
    <div class="stack">
      ${S.plano ? '<button class="btn primary" data-acao="retomar">Voltar ao meu plano</button>' : ''}
      <button class="btn ${S.plano ? 'ghost' : 'primary'}" data-acao="comecar">Montar meu plano</button>
      <button class="btn ghost" data-acao="exemplo">Ver um exemplo pronto</button>
    </div>
    <p class="note">Protótipo: mercados reais de Florianópolis, preços estimados (não são os de hoje).</p>
    <div class="about-inline">${sobreHTML()}</div>
  </section>`;
}

function cartaoExemplo(ex) {
  const linhas = ex.keys.slice(0, 3).map((k, i) => `<li><span>${NOME_REF[ex.slots[i].r]}</span><b>${esc(Core.RECEITA[ex.vmap[k].rid].nome)}</b></li>`).join('');
  return `<div class="preview">
    <p class="preview-title">Exemplo: R$ 150 · 5 dias · 3 refeições por dia</p>
    <ul>${linhas}</ul>
    <div class="preview-total"><span>Total da compra</span><strong>${din(ex.custo.total)}</strong></div>
    <p class="preview-foot">${ex.keys.length} refeições · sobram ${din(ex.prefs.orcamento - ex.custo.total)} · ${nomeMercado(ex.mercados[0])}</p>
  </div>`;
}

// --- Passos do cadastro --------------------------------------------------------
function passoValido(n) {
  const p = S.prefs;
  if (n === 1 && (!(p.orcamento >= 20) || S.orcamentoRuim)) return { ok: false, msg: 'Digite um valor a partir de R$ 20.' };
  if (n === 2 && !p.mercados.length) return { ok: false, msg: 'Escolha pelo menos um mercado.' };
  if (n === 6 && !p.refeicoes.length) return { ok: false, msg: 'Escolha pelo menos uma refeição.' };
  return { ok: true };
}

function telaPasso() {
  const n = S.passo;
  const corpo = [null, passoOrcamento, passoMercados, passoDieta, passoCozinha, passoGostos, passoPlano][n]();
  const v = passoValido(n);
  return `${barra(true)}
  <div class="progress" aria-hidden="true"><span style="width:${(n / PASSOS) * 100}%"></span></div>
  <section class="screen step"><p class="eyebrow">Passo ${n} de ${PASSOS}</p>${corpo}</section>
  <div class="cta">
    <p class="cta-msg" id="cta-msg">${v.msg || ''}</p>
    <button class="btn primary wide" id="cta" data-acao="seguir" ${v.ok ? '' : 'disabled'}>${n === PASSOS ? 'Gerar meu plano' : 'Continuar'}</button>
  </div>`;
}

const textoPorRefeicao = () => {
  const p = S.prefs, total = p.dias * p.refeicoes.length * p.pessoas;
  return `≈ ${din(p.orcamento / Math.max(1, total))} por refeição por pessoa (${p.dias} dias × ${p.refeicoes.length} refeições)`;
};

function passoOrcamento() {
  const p = S.prefs;
  return `<h1 class="q">Quanto você tem para gastar?</h1><p class="help">O total da compra nunca passa desse valor.</p>
  <label class="money" for="orcamento"><span aria-hidden="true">R$</span><input id="orcamento" type="number" inputmode="decimal" min="20" max="5000" step="1" value="${p.orcamento}" aria-label="Orçamento em reais"></label>
  <div class="chips" id="chips-orc">${[100, 150, 200, 300, 500].map(v => `<button class="chip" data-acao="orc" data-v="${v}" aria-pressed="${p.orcamento === v}">R$ ${v}</button>`).join('')}</div>
  <h2 class="label">Quantas pessoas vão comer?</h2>
  <div class="stepper" role="group" aria-label="Pessoas">
    <button class="icon-btn" data-acao="pessoas" data-d="-1" ${p.pessoas <= 1 ? 'disabled' : ''} aria-label="Menos uma pessoa">−</button>
    <output aria-live="polite">${p.pessoas}</output>
    <button class="icon-btn" data-acao="pessoas" data-d="1" ${p.pessoas >= 6 ? 'disabled' : ''} aria-label="Mais uma pessoa">+</button>
  </div>
  <p class="hint" id="por-refeicao">${textoPorRefeicao()}</p>`;
}

function opcao(nome, v, titulo, desc) {
  return `<button class="option" data-acao="def" data-k="${nome}" data-v="${v}" aria-pressed="${String(S.prefs[nome]) === String(v)}">
    <span class="option-title">${titulo}</span><span class="option-desc">${desc}</span></button>`;
}
function chip(lista, id, rotulo, cls = '') {
  return `<button class="chip ${cls}" data-acao="alternar" data-k="${lista}" data-id="${id}" aria-pressed="${S.prefs[lista].includes(id)}">${esc(rotulo)}</button>`;
}

function passoMercados() {
  const p = S.prefs, reg = regiaoCep(p.cep);
  return `<h1 class="q">Onde você quer comprar?</h1>
  <label class="field" for="cep"><span>Seu CEP</span><input id="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" value="${esc(p.cep)}"></label>
  <p class="note ${reg && !reg.ok ? 'warn' : ''}" id="cep-msg">${reg ? esc(reg.texto) : 'No app, o CEP mostra as lojas mais perto de você. No protótipo, a lista abaixo é fixa.'}</p>
  <div class="stores">${Core.MERCADOS.map(m => `<button class="store" data-acao="mercado" data-id="${m.id}" aria-pressed="${p.mercados.includes(m.id)}">
      <span class="store-name">${m.nome}</span><span class="store-type">${TIPO_MERCADO[m.tipo]}${m.grupo ? ' · ' + m.grupo : ''}</span>
      <span class="level" aria-label="Nível de preço ${m.nivel} de 3"><b>${'●'.repeat(m.nivel)}</b>${'●'.repeat(3 - m.nivel)}</span>
      <span class="tick">${ICONE.ok}</span></button>`).join('')}</div>
  <h2 class="label">Como comprar</h2>
  <div class="options two">${opcao('modo', 'um', 'Um mercado só', 'O app escolhe o mais barato entre os marcados')}${opcao('modo', 'dividir', 'Dividir entre mercados', 'Cada item onde for mais barato (mais paradas)')}</div>`;
}

function passoDieta() {
  return `<h1 class="q">Como você quer comer?</h1>
  <div class="options">${DIETAS.map(([id, t, d]) => opcao('dieta', id, t, d)).join('')}</div>
  <h2 class="label">Restrições</h2>
  <div class="chips">${RESTR.map(([id, t]) => chip('restricoes', id, t)).join('')}</div>
  <p class="note">As restrições são aplicadas de forma conservadora. Em caso de alergia, confira sempre o rótulo.</p>`;
}

function passoCozinha() {
  return `<h1 class="q">O que tem na sua cozinha?</h1><p class="help">O passo a passo das receitas usa só os aparelhos que você marcar.</p>
  <div class="chips">${Core.APARELHOS.map(a => chip('aparelhos', a.id, a.nome)).join('')}</div>
  ${S.prefs.aparelhos.length ? '' : '<p class="note warn">Sem nenhum aparelho, só entram receitas que não vão ao fogo.</p>'}
  <h2 class="label">Já tenho em casa</h2><p class="help">Esses itens não entram na compra. Sal e água já contam como “de casa”.</p>
  ${Core.DESPENSA.map(g => `<p class="sub">${g.titulo}</p><div class="chips tight">${g.itens.map(id => chip('despensa', id, Core.ITEM[id].nome.replace(/ \(.*\)$/, ''))).join('')}</div>`).join('')}`;
}

function passoGostos() {
  return `<h1 class="q">Do que você gosta?</h1>
  <h2 class="label">Não como</h2>
  <div class="chips">${Core.GRUPOS.map(g => chip('naoCome', g.id, g.nome, 'no')).join('')}</div>
  <h2 class="label">Adoro</h2>
  <div class="chips">${Core.GRUPOS.map(g => chip('adora', g.id, g.nome, 'yes')).join('')}</div>
  <h2 class="label">Estilos favoritos</h2>
  <div class="chips">${Core.COZINHAS.map(c => chip('cozinhas', c.id, c.nome, 'yes')).join('')}</div>`;
}

function passoPlano() {
  const p = S.prefs;
  return `<h1 class="q">Quantos dias e refeições?</h1>
  <h2 class="label">Dias</h2>
  <div class="days">${[1, 2, 3, 4, 5, 6, 7].map(d => `<button class="day-pick" data-acao="def" data-k="dias" data-v="${d}" aria-pressed="${p.dias === d}">${d}</button>`).join('')}</div>
  <h2 class="label">Refeições por dia</h2>
  <div class="chips">${Core.ORDEM_REFEICOES.map(r => chip('refeicoes', r, NOME_REF[r])).join('')}</div>
  <h2 class="label">Estilo do cardápio</h2>
  <div class="options">${ESTILOS.map(([id, t, d]) => opcao('estilo', id, t, d)).join('')}</div>`;
}

// --- Carregando e problemas ------------------------------------------------------
function telaCarregando() {
  const p = S.prefs;
  const linhas = [
    `Lendo ${num(Core.ITENS.length * p.mercados.length)} preços em ${p.mercados.length} ${plural(p.mercados.length, 'mercado', 'mercados')}`,
    `Filtrando ${Core.RECEITAS.length} receitas pelo seu perfil`,
    `Testando ${num((p.modo === 'dividir' ? 1 : p.mercados.length) * 140)} combinações até ${din(p.orcamento)}`,
    'Montando a lista de compras',
  ];
  return `${barra(false)}
  <section class="screen loading" aria-busy="true">
    <div class="tape" aria-hidden="true"><span></span></div>
    <ul class="load-list">${linhas.map((l, i) => `<li style="--d:${i * 0.3}s">${ICONE.ok}<span>${l}</span></li>`).join('')}</ul>
  </section>`;
}

function telaProblema() {
  const pr = S.problema, p = S.prefs;
  if (pr.motivo === 'orcamento') {
    const x = Math.ceil(pr.minimo + 1);
    const dias = Math.max(1, Math.floor((p.dias * p.orcamento) / pr.minimo));
    return `${barra(true)}<section class="screen problem">
      <h1 class="q">Não deu para caber em ${din(p.orcamento)}</h1>
      <p class="help">O plano mais barato possível com essas escolhas custa cerca de ${din(pr.minimo)}.</p>
      <div class="stack">
        <button class="btn primary" data-acao="usar-orc" data-v="${x}">Usar R$ ${x}</button>
        ${dias < p.dias ? `<button class="btn ghost" data-acao="menos-dias" data-v="${dias}">Reduzir para ${dias} ${plural(dias, 'dia', 'dias')}</button>` : ''}
        <button class="btn ghost" data-acao="editar">Editar escolhas</button>
      </div></section>`;
  }
  const ref = NOME_REF[pr.refeicao].toLowerCase();
  return `${barra(true)}<section class="screen problem">
    <h1 class="q">Faltam receitas para o ${ref}</h1>
    <p class="help">Nenhuma receita de ${ref} combina com todas as escolhas. Libere algum alimento, restrição ou aparelho.</p>
    <div class="stack"><button class="btn primary" data-acao="editar">Editar escolhas</button></div></section>`;
}

function gerar(novaSemente) {
  if (novaSemente) S.semente++;
  S.folha = null;
  S.tela = 'carregando';
  render();
  window.scrollTo(0, 0);
  const t0 = Date.now();
  setTimeout(() => {
    const r = Core.planejar(S.prefs, S.semente);
    const espera = Math.max(0, (REDUZIR ? 150 : 1300) - (Date.now() - t0));
    setTimeout(() => {
      if (r.ok) { S.plano = r; S.problema = null; S.tela = 'plano'; S.aba = 'cardapio'; S.marcados = {}; S.tentadas = {}; S.metodo = {}; }
      else { S.problema = r; S.tela = 'problema'; }
      salvar(); render(); window.scrollTo(0, 0);
    }, espera);
  }, 50);
}

// --- Eventos -----------------------------------------------------------------
function atualizarOrcamento() {
  const pr = $('#por-refeicao'); if (pr) pr.textContent = textoPorRefeicao();
  document.querySelectorAll('#chips-orc .chip').forEach(c => c.setAttribute('aria-pressed', String(+c.dataset.v === S.prefs.orcamento)));
  const v = passoValido(1), cta = $('#cta'), msg = $('#cta-msg');
  if (cta) cta.disabled = !v.ok;
  if (msg) msg.textContent = v.msg || '';
}

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'orcamento') {
    const v = parseFloat(el.value);
    S.orcamentoRuim = !(v >= 20 && v <= 5000);
    if (!S.orcamentoRuim) S.prefs.orcamento = Math.round(v * 100) / 100;
    atualizarOrcamento();
  } else if (el.id === 'cep') {
    const d = el.value.replace(/\D/g, '').slice(0, 8);
    const f = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
    if (f !== el.value) el.value = f;
    S.prefs.cep = f;
    const reg = regiaoCep(f), msg = $('#cep-msg');
    if (msg) { msg.textContent = reg ? reg.texto : 'No app, o CEP mostra as lojas mais perto de você. No protótipo, a lista abaixo é fixa.'; msg.classList.toggle('warn', !!reg && !reg.ok); }
  } else if (el.id === 'ia-pedido') {
    S.ia.pedido = el.value;
  }
});

document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.marcar) { S.marcados[el.dataset.marcar] = el.checked; salvar(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.folha) fecharFolha();
  if (e.key === 'Enter' && e.target.id === 'ia-pedido' && !S.ia.ocupada) { e.preventDefault(); rodarIA(); }
  if (e.key === 'Enter' && e.target.id === 'orcamento') { e.preventDefault(); if (passoValido(1).ok) { S.passo = 2; render(); } }
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-acao]');
  if (!b || b.disabled) return;
  const d = b.dataset, p = S.prefs;
  switch (d.acao) {
    case 'inicio': S.tela = 'inicio'; S.folha = null; render(); topo(); break;
    case 'comecar': S.tela = 'passo'; S.passo = 1; render(); topo(); break;
    case 'exemplo': S.prefs = clone(PADRAO); S.semente = 1; gerar(false); break;
    case 'retomar': S.tela = 'plano'; render(); topo(); break;
    case 'voltar':
      if (S.tela === 'passo' && S.passo > 1) S.passo--;
      else if (S.tela === 'passo') S.tela = 'inicio';
      else if (S.tela === 'problema') { S.tela = 'passo'; S.passo = PASSOS; }
      render(); topo(); break;
    case 'seguir':
      if (!passoValido(S.passo).ok) break;
      if (S.passo < PASSOS) { S.passo++; render(); topo(); } else gerar(false);
      break;
    case 'orc': p.orcamento = +d.v; S.orcamentoRuim = false; render(); break;
    case 'pessoas': p.pessoas = Math.max(1, Math.min(6, p.pessoas + +d.d)); render(); break;
    case 'mercado': alterna(p.mercados, d.id); render(); break;
    case 'def': p[d.k] = d.k === 'dias' ? +d.v : d.v; render(); break;
    case 'alternar':
      alterna(p[d.k], d.id);
      if (d.k === 'adora') remove(p.naoCome, d.id);
      if (d.k === 'naoCome') remove(p.adora, d.id);
      render(); break;
    case 'editar': S.prefs = { ...clone(PADRAO), ...clone(S.plano ? S.plano.prefs : S.prefs) }; S.tela = 'passo'; S.passo = 1; S.folha = null; render(); topo(); break;
    case 'refazer': S.prefs = clone(S.plano.prefs); gerar(true); break;
    case 'usar-orc': p.orcamento = +d.v; gerar(false); break;
    case 'menos-dias': p.dias = +d.v; gerar(false); break;
    case 'aba': S.aba = d.v; render(); break;
    case 'abrir': abrirFolha(+d.i, b); break;
    case 'fechar': fecharFolha(); break;
    case 'metodo': S.metodo[d.k] = d.v; renderFolha(); break;
    case 'trocar': trocarReceita(); break;
    case 'copiar': copiarLista(); break;
    case 'ia': rodarIA(); break;
    case 'ia-parar': if (S.ia.ctl) S.ia.ctl.abort(); break;
  }
});

let timerAviso = null;
function aviso(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => el.classList.remove('show'), 3800);
}
