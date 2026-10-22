// Teste de ponta a ponta da versão web do app (Expo exportado em dist/).
// Uso: npx expo export --platform web && NODE_PATH=$(npm root -g) node tests/e2e-app.cjs dist [pasta-de-capturas]
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const raiz = path.resolve(process.argv[2] || 'dist');
const capturas = process.argv[3];
const TIPOS = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.json': 'application/json' };

const servidor = http.createServer((req, res) => {
  let f = path.join(raiz, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(raiz, 'index.html');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const NOTA = [
  'ANGELONI & CIA LTDA',
  'CNPJ: 83.646.984/0001-50',
  'ARROZ TIO JOAO T1 5KG (Código: 7893500018490 )',
  'Qtde.:1 UN: UN Vl. Unit.: 25,90\tVl. Total',
  '25,90',
  'CEBOLA KG (Código: 2000123 )',
  'Qtde.:0,812 UN: KG Vl. Unit.: 6,98\tVl. Total',
  '5,67',
  'Valor a pagar R$: 31,57',
  'Emissão: 20/10/2026 18:42:10',
].join('\n');

/** O que o robô publicaria hoje para Koch e Angeloni (o teste não depende da internet). */
function precosDeHoje() {
  const data = new Date().toISOString();
  const loja = itens => ({ data, itens });
  return {
    versao: 1,
    geradoEm: data,
    lojas: {
      koch: loja({
        arroz: [{ tamanho: 1000, preco: 3.79, nome: 'Arroz Kika Branco Pacote 1Kg' }],
        feijao_preto: [{ tamanho: 1000, preco: 6.99, nome: 'Feijão Preto Kicaldo Tipo 1 1Kg' }],
        ovos: [{ tamanho: 12, preco: 9.49, nome: 'Ovos Brancos Grandes Dúzia' }, { tamanho: 30, preco: 19.9, nome: 'Ovos Brancos Bandeja 30 Unidades' }],
        tomate: [{ tamanho: 1, preco: 1.68, kg: 13.99, nome: 'Tomate Longa Vida Kg', promo: true }],
        cebola: [{ tamanho: 1, preco: 1.2, kg: 7.99, nome: 'Cebola Kg' }],
        banana: [{ tamanho: 1, preco: 0.66, kg: 5.99, nome: 'Banana Caturra Kg' }],
        leite: [{ tamanho: 1000, preco: 4.99, nome: 'Leite UHT Integral Tirol 1L' }],
        peito_frango: [{ tamanho: 1000, preco: 21.9, nome: 'Filé de Peito de Frango Congelado Sadia 1Kg' }],
      }),
      angeloni: loja({
        arroz: [{ tamanho: 1000, preco: 4.29, nome: 'Arroz Branco Tipo 1 Prato Fino 1kg' }, { tamanho: 5000, preco: 21.9, nome: 'Arroz Branco Tipo 1 Prato Fino 5kg' }],
        tomate: [{ tamanho: 1, preco: 1.79, kg: 14.89, nome: 'Tomate Kg' }],
        cebola: [{ tamanho: 1, preco: 1.34, kg: 8.95, nome: 'Cebola Kg' }],
        leite: [{ tamanho: 1000, preco: 5.29, nome: 'Leite UHT Integral Piracanjuba 1l' }],
      }),
    },
  };
}

async function main() {
  await new Promise(r => servidor.listen(0, r));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const browser = await chromium.launch();
  const contexto = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR' });
  await contexto.route('**/abreuhans/rendeu/precos/precos.json', r => r.fulfill({
    contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(precosDeHoje()),
  }));
  const page = await contexto.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  const foto = async nome => { if (capturas) await page.screenshot({ path: path.join(capturas, nome + '.png') }); };
  const passo = async (nome, fn) => {
    try { await fn(); console.log('ok  ', nome); } catch (e) { await foto('falha-' + nome.replace(/\W+/g, '-')); throw new Error(`${nome}: ${e.message}`); }
  };
  const botao = nome => page.getByRole('button', { name: nome, exact: true });

  await passo('tela inicial', async () => {
    await page.goto(base + '/');
    await page.getByText('Receitas que cabem no seu bolso').waitFor();
    await page.getByText('Exemplo: R$ 150').waitFor({ timeout: 15000 });
    await page.getByText(/Preços dos sites de Koch e Angeloni, lidos hoje às/).waitFor({ timeout: 15000 });
    await foto('01-inicio');
  });

  await passo('passo 1: orçamento', async () => {
    await botao('Montar meu plano').click();
    await page.getByText('Quanto você tem para gastar?').waitFor();
    const campo = page.getByLabel('Orçamento em reais');
    await campo.fill('10');
    await page.getByText('Digite um valor a partir de R$ 20.').waitFor();
    await campo.fill('200');
    await page.getByText(/≈ R\$\s1[3-4],\d\d por refeição/).waitFor();
    await foto('02-orcamento');
    await botao('Continuar').click();
  });

  await passo('passo 2: CEP e mercados', async () => {
    await page.getByText('Onde você quer comprar?').waitFor();
    await page.getByLabel('Seu CEP').fill('88015200');
    await page.getByText('Florianópolis/SC').waitFor();
    if ((await page.getByLabel('Seu CEP').inputValue()) !== '88015-200') throw new Error('máscara do CEP');
    await foto('03-mercados');
    await botao('Continuar').click();
  });

  await passo('passos 3 a 6', async () => {
    await page.getByText('Como você quer comer?').waitFor();
    await botao('Continuar').click();
    await page.getByText('O que tem na sua cozinha?').waitFor();
    await page.getByRole('checkbox', { name: 'Air fryer' }).click();
    await page.getByText('Já tenho em casa').waitFor();
    await foto('04-cozinha');
    await botao('Continuar').click();
    await page.getByText('Do que você gosta?').waitFor();
    await botao('Continuar').click();
    await page.getByText('Quantos dias e refeições?').waitFor();
    await botao('Gerar meu plano').click();
  });

  await passo('plano gerado', async () => {
    await page.getByText(/Seu plano · 5 dias · 1 pessoa/i).waitFor({ timeout: 20000 });
    await page.getByText('de R$ 200,00').waitFor();
    await page.getByText(/^Sobram R\$/).waitFor();
    await foto('05-plano');
  });

  await passo('receita e troca', async () => {
    await page.getByRole('button', { name: /^Almoço: / }).first().click();
    await page.getByText(/Ingredientes para 1 porção/).waitFor();
    await page.getByText('Modo de preparo').waitFor();
    await foto('06-receita');
    await botao('Trocar receita').click();
    await page.getByText(/^(Trocada por|Nenhuma outra receita)/).waitFor({ timeout: 15000 });
    await botao('Fechar').click();
    await page.getByText(/Seu plano · 5 dias/i).waitFor();
  });

  await passo('abas do plano', async () => {
    await page.getByRole('tab', { name: 'Compras' }).click();
    await page.getByText('Lista de compras', { exact: true }).waitFor();
    await page.getByText('TOTAL', { exact: true }).waitFor();
    await page.getByText(/\d+ itens · (preços estimados|\d+ do site)/).waitFor();
    const primeiro = page.getByRole('checkbox').first();
    await primeiro.click();
    if ((await primeiro.getAttribute('aria-checked')) !== 'true') throw new Error('item não ficou marcado');
    await foto('07-compras');
    await page.getByRole('tab', { name: 'Mercados' }).click();
    await page.getByText('A mesma lista em cada mercado').waitFor();
    await page.getByText(/^site · hoje às/).first().waitFor();
    await page.getByRole('tab', { name: 'Bastidores' }).click();
    await page.getByText(/O que acontece quando você toca/).waitFor();
  });

  await passo('nota fiscal colada', async () => {
    await page.getByRole('button', { name: 'Preços reais das notas fiscais' }).click();
    await page.getByText('Ler QR Code da nota').waitFor();
    await page.getByLabel('Link ou chave da nota fiscal').fill('https://exemplo.com/nota');
    await botao('Abrir').click();
    await page.getByText(/Não reconheci esse link/).waitFor();
    await page.getByLabel('Link ou chave da nota fiscal').fill('https://sat.sef.sc.gov.br/nfce/consulta?p=42261083646984000150650010000123451001234560|2|1|1|ABCDEF');
    await botao('Abrir').click();
    await page.getByText('Ler a nota no computador').waitFor();
    await page.getByLabel('Texto da página da nota').fill(NOTA);
    await botao('Ler produtos').click();
    await page.getByText('2 de 2 produtos reconhecidos').waitFor();
    await foto('08-nota');
    await botao('Salvar 2 preços').click();
    await page.getByText(/2 preços salvos para Angeloni/).waitFor();
    await page.getByText(/· 2 preços/).waitFor();
    await foto('09-precos');
  });

  await passo('lembra tudo depois de recarregar', async () => {
    await page.goto(base + '/');
    await botao('Voltar ao meu plano').waitFor({ timeout: 15000 });
    await botao('Voltar ao meu plano').click();
    await page.getByRole('tab', { name: 'Mercados' }).click();
    await page.getByText(/2 preços de nota/).waitFor();
  });

  await passo('tela larga (computador)', async () => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto(base + '/plano');
    await page.getByText(/Seu plano · 5 dias/i).waitFor({ timeout: 15000 });
    await foto('10-computador');
  });

  await browser.close();
  servidor.close();
  const relevantes = erros.filter(e => !/favicon/i.test(e));
  if (relevantes.length) {
    console.log('Erros no console:\n' + relevantes.join('\n'));
    process.exitCode = 1;
  } else console.log('Sem erros no console.');
}

main().catch(e => {
  console.error('FALHOU:', e.message);
  servidor.close();
  process.exit(1);
});
