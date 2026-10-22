// Roda o robô no seu computador e publica os preços no branch "precos" do GitHub, de onde o app baixa.
// Os sites dos mercados recusam os servidores do GitHub Actions, mas respondem a uma internet de casa.
// Uso (na pasta do projeto, com o git logado no GitHub): npm run robo:publicar [-- --lojas=koch,hippo]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEIA_ME, coletar } from './coleta';
import { precosPublicados, publicarNoBranch } from './git';

async function main() {
  const args = process.argv.slice(2);
  const opcao = (nome: string) => args.find(a => a.startsWith(`--${nome}=`))?.split('=')[1]?.split(',');
  // As lojas que falharem agora continuam com os preços já publicados.
  const { existe, anterior } = precosPublicados();
  const arquivo = await coletar({ itens: opcao('itens'), lojas: opcao('lojas'), anterior });
  mkdirSync('saida', { recursive: true });
  writeFileSync(join('saida', 'precos.json'), JSON.stringify(arquivo));
  if (!Object.values(arquivo.status).some(s => s.ok)) {
    console.log('Nenhuma loja respondeu: nada foi publicado.');
    process.exitCode = 1;
    return;
  }
  try {
    publicarNoBranch({ 'precos.json': JSON.stringify(arquivo), 'README.md': LEIA_ME }, `Preços de ${new Date().toLocaleString('pt-BR')} (coletados num computador)`, existe);
    console.log('Publicado no branch "precos". O app usa na próxima vez que abrir.');
  } catch (e) {
    const msg = (e as { stderr?: string }).stderr || (e as Error).message;
    console.error(`Não deu para publicar: ${msg}\nO arquivo ficou em saida/precos.json. Se o GitHub recusou porque o robô publicou ao mesmo tempo, é só rodar de novo.`);
    process.exitCode = 1;
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
