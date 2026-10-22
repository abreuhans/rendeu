# Rendeu

Aplicativo que monta o cardápio da semana **dentro do valor que você tem**. As receitas usam os aparelhos da sua cozinha, e a lista de compras sai com os preços de hoje dos mercados da Grande Florianópolis: um robô lê os sites dos mercados duas vezes por dia.

Você informa:

- o orçamento (R$) e quantas pessoas vão comer;
- o CEP e os mercados (Komprão, Fort, Giassi, Koch, Bistek, Imperatriz, Angeloni, Hippo);
- a dieta (equilibrada, rica em proteína, low carb, menos calorias, mais calorias) e as restrições;
- os aparelhos da cozinha e o que já tem em casa;
- do que gosta e do que não gosta;
- quantos dias e quais refeições.

O app entrega:

- o cardápio com o custo de cada porção, escolhido entre 203 receitas;
- as receitas com passo a passo para os aparelhos que você tem;
- a lista de compras em embalagens inteiras, agrupada por mercado e seção;
- a comparação entre os mercados.

O total da compra nunca passa do orçamento.

## Como testar no Windows com o iPhone (Expo Go)

1. Instale o [Node.js LTS](https://nodejs.org) e o [Git](https://git-scm.com/download/win).
2. No PowerShell, baixe o projeto e instale as dependências:
   ```powershell
   git clone https://github.com/abreuhans/rendeu.git
   cd rendeu
   npm install
   ```
3. Instale o app **Expo Go** no iPhone (App Store) e deixe-o atualizado.
4. Rode `npx expo start` no computador. Vai aparecer um QR Code no terminal.
5. Abra a **Câmera** do iPhone, aponte para o QR Code e toque em "Abrir no Expo Go".
   - O celular e o computador precisam estar no mesmo Wi-Fi. Se não abrir, use `npx expo start --tunnel`.
   - Toda mudança no código aparece na hora no celular.
6. Para ver no navegador do computador, aperte `w` no terminal (ou rode `npm run web`).

Não precisa de Mac nem de Xcode para testar. Para publicar nas lojas, o build é feito na nuvem com o EAS (ver abaixo).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npx expo start` | Abre o servidor de desenvolvimento (Expo Go, Android, web) |
| `npm test` | Testes do núcleo: planejador, preços e leitura de nota fiscal |
| `npm run typecheck` | Confere os tipos (TypeScript) |
| `npx expo lint` | Lint (ESLint com a configuração do Expo) |
| `npm run export:web` | Gera a versão web em `dist/` |
| `node tests/e2e-app.cjs dist` | Teste de ponta a ponta da versão web (precisa do Playwright instalado) |
| `npm run prototipo -- saida.html` | Gera o protótipo web de um arquivo só (em `web/prototipo`) |
| `npm run robo` | Roda o robô de preços no seu computador e só grava `saida/precos.json` (aceita `-- --itens=arroz,tomate --lojas=giassi`) |
| `npm run robo:publicar` | Roda o robô no seu computador e publica os preços no branch `precos` (o app passa a usar) |

## Estrutura

```
src/
  app/            telas (Expo Router): início, passo/[n], gerando, plano, receita/[i], notas/…
  screens/        corpo das telas maiores (passos do cadastro, abas do plano)
  components/     logo, botões, chips, papel de cupom, leitor da nota (WebView)
  estado/         estado do app e armazenamento no aparelho
  lib/            textos e contas derivadas do plano
  core/           núcleo em TypeScript puro, sem React Native
    dados/        mercados, 108 itens com preço de referência, métodos de preparo e 203 receitas
    motor/        planejador, preços (site, nota, estimativa), formatos (R$, quantidades), passo a passo
    nfce/         chave e link da NFC-e, leitura da página da nota, ligação com o catálogo
robo/             robô de preços: lê as buscas dos sites dos mercados e grava precos.json
  amostras/       respostas reais dos sites, usadas nos testes
.github/workflows/precos.yml   agenda do robô no GitHub Actions (2× por dia)
docs/             como pedir os dados das notas à Sefaz/SC
tests/            testes do núcleo e do robô (Vitest) e de ponta a ponta (Playwright)
web/prototipo/    protótipo web de um arquivo só, feito com o mesmo núcleo
```

O núcleo (`src/core`) roda igual no app, no protótipo web, no robô e nos testes.

## Como o plano é montado

1. **Filtro:** as receitas são filtradas pela dieta, pelas restrições, pelo que a pessoa não come e pelos aparelhos.
2. **Busca:** para cada mercado (ou para a divisão entre mercados), o planejador testa cerca de 140 cardápios. A busca combina:
   - sorteio guiado por pontuação;
   - reserva de dinheiro para as refeições que faltam;
   - melhoria local.
3. **Custo real da compra:** a conta usa embalagens inteiras, na combinação de tamanhos mais barata, e reaproveita o que sobra de uma receita na outra.
4. **Desempate:** a pontuação equilibra preço, variedade, desperdício de perecíveis, gostos e dieta. Também favorece a sobra do jantar como marmita do dia seguinte.
   - O gasto pesa menos quando o orçamento é folgado: em vez de sobrar dinheiro à toa, entram pratos melhores e mais variados.
   - O que sobra e dura (carne no congelador, pacote de arroz aberto) conta como guardado, não como perdido.
   - Pratos que dividem opiniões (fígado, quiabo) aparecem menos, a não ser que a pessoa diga que adora.
   - Cada vez que você gera outro plano, uma semente sorteia um "sabor da semana", e o cardápio explora outras combinações boas.
5. **Resultado:** o plano escolhido nunca passa do orçamento. Se não couber, o app mostra o valor mínimo e oferece ajustes.
6. **Sem travar:** no app, a conta roda em fatias de ~12 ms (`planejarSemTravar`), então a tela continua respondendo mesmo em celulares mais lentos.

## Preços: sites, notas fiscais e estimativas

O app usa, para cada produto em cada mercado, a melhor fonte disponível, nesta ordem:

1. **Nota fiscal lida por você nos últimos 30 dias:** é o preço que você pagou naquela loja.
2. **Site do mercado**, lido pelo robô duas vezes por dia.
3. **Nota fiscal mais antiga**.
4. **Estimativa:**
   - o preço de referência do item, corrigido pelo que os sites estão cobrando (se o tomate subiu 40% nos sites, a estimativa sobe junto);
   - multiplicado pelo nível de preço do mercado (atacarejo, supermercado, premium).

### O robô de preços (grátis, sem servidor)

| Mercado | De onde vem o preço |
| --- | --- |
| Angeloni, Giassi | Busca pública do site (VTEX Intelligent Search), ordenada pelos mais vendidos |
| Koch (loja 1411, Florianópolis), Hippo (loja 1384) | Busca pública do site (plataforma OSuper) |
| Bistek | Estimativa: o `robots.txt` do site proíbe robôs em `/api/` |
| Komprão, Fort, Imperatriz | Estimativa: não têm loja online com preço |

- **Quando roda:**
  - o GitHub Actions (`.github/workflows/precos.yml`) roda o robô às 06:17 e às 17:47 (horário de Brasília);
  - também roda quando o robô ou o catálogo mudam, e manualmente pelo botão **Run workflow** na aba **Actions**;
  - ou no seu computador, com `npm run robo:publicar` (veja abaixo).
- **O que o robô faz:**
  - procura cada um dos 108 itens com termos e filtros próprios (`robo/itens.ts`);
  - só aceita o produto que as regras de leitura de nota também reconhecem;
  - descarta preços fora da realidade;
  - escolhe as embalagens mais baratas parecidas com as do catálogo (por exemplo, arroz de 1 kg e de 5 kg).
- **Onde publica:** no branch [`precos`](https://github.com/abreuhans/rendeu/tree/precos), arquivo `precos.json`. O histórico de commits desse branch é o histórico de preços.
  - Se uma loja falhar, ficam valendo os preços anteriores dela, e o campo `status` do arquivo mostra o erro.
- **No app:**
  - ao abrir, usa os preços guardados no aparelho na hora (funciona sem internet);
  - em segundo plano, baixa a versão nova de `https://raw.githubusercontent.com/abreuhans/rendeu/precos/precos.json`;
  - refaz a conta do plano quando chegam preços novos;
  - ignora preço de loja com mais de 7 dias.
  - A lista de compras mostra o nome do produto do site (marca e embalagem) e marca o que é estimado.
- **Boas maneiras:**
  - o robô usa só as buscas que os próprios sites usam;
  - confere o `robots.txt` antes de buscar;
  - se identifica (`RendeuBot`) e faz cerca de uma busca por segundo em cada loja.
  - Antes de publicar o app nas lojas, vale pedir autorização ou propor parceria aos mercados.
- **Situação em 22/10/2026:** a primeira coleta pelo GitHub Actions foi recusada por todos os sites.
  - Giassi e Angeloni responderam "429, pedidos demais"; Koch e Hippo responderam "403, acesso recusado".
  - As mesmas buscas funcionam fora de datacenter: as respostas em `robo/amostras/` são reais.
  - O robô não se disfarça para passar pelo bloqueio. Quando um site recusa 6 buscas seguidas, ele para e anota o motivo no `status`.
  - Enquanto isso, quem traz os preços é a coleta pelo seu computador.
- **Limites:**
  - o preço do site pode ser diferente do da loja física;
  - preço de clube (com CPF) não entra;
  - "tempo real" aqui quer dizer "atualizado duas vezes por dia".

### Coletar pelo seu computador (Windows)

A internet de casa não é bloqueada como os servidores do GitHub.

**Primeira vez:** o projeto precisa estar no computador. Os comandos de npm só funcionam dentro da pasta dele, porque é lá que fica o `package.json`. No **Prompt de Comando**:

```bat
cd %USERPROFILE%
git clone https://github.com/abreuhans/rendeu.git
cd rendeu
npm install
```

- Isso cria a pasta `C:\Users\<você>\rendeu`.
- Se o projeto já estiver em outra pasta, entre nela com `cd` e rode `git pull`.

**Para coletar:** dê dois cliques em `coletar-precos.bat`, na pasta do projeto. Ou, no Prompt de Comando, dentro da pasta, rode:

```bat
npm run robo:publicar
```

O comando:

- leva uns 5 minutos;
- busca os 108 itens no Giassi, Angeloni, Koch e Hippo;
- grava `saida/precos.json`;
- publica o arquivo num commit novo do branch `precos`, sem mexer no que você está editando.

Na primeira vez que publicar, o Git pode abrir o navegador para você entrar na conta do GitHub. Se o git reclamar que não sabe quem você é, configure uma vez:

```bat
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

O app pega os preços novos na próxima vez que abrir. Loja que falhar continua com os preços anteriores.

**Para rodar sozinho todo dia:** crie duas tarefas no Agendador de Tarefas, trocando o caminho se a pasta for outra:

```bat
schtasks /Create /TN "Rendeu precos manha" /SC DAILY /ST 06:30 /TR "C:\Users\abreu\rendeu\coletar-precos.bat agendado"
schtasks /Create /TN "Rendeu precos tarde" /SC DAILY /ST 17:30 /TR "C:\Users\abreu\rendeu\coletar-precos.bat agendado"
```

- O computador precisa estar ligado nesses horários.
- No Agendador de Tarefas, marque "Executar a tarefa o mais cedo possível após uma inicialização agendada ser perdida".
- O `coletar-precos.bat`:
  - atualiza o projeto (`git pull`);
  - instala as dependências na primeira vez;
  - só espera você apertar uma tecla quando é aberto com dois cliques.

### Notas fiscais (NFC-e)

- Depois de uma compra, a pessoa lê o QR Code do cupom.
  - O app abre a consulta pública da nota no site da Sefaz/SC dentro de uma WebView. Se o site pedir a verificação do Cloudflare, a pessoa confirma.
  - O app lê a tabela de produtos e liga cada linha ao catálogo, por exemplo "ARROZ TIO JOAO T1 5KG" → arroz, R$/kg.
- **No navegador do computador:** o site da Sefaz não pode ser lido por dentro. A pessoa abre a nota em outra aba, copia o texto da página e cola no app.
- **Privacidade:** da nota, o app guarda só produto, preço, mercado e data. Não guarda CPF. Tudo fica no aparelho.

### Dados da Sefaz/SC

- Santa Catarina entrou no app [Menor Preço Brasil](https://noticias.sc.gov.br/consumidor-catarinense-ja-pode-comparar-precos-em-tempo-real-por-aplicativo/) em maio de 2026, com a base das notas fiscais do estado. Ele não tem API pública.
- O passo a passo para pedir esses dados está em [`docs/pedido-dados-sef-sc.md`](docs/pedido-dados-sef-sc.md):
  - pedido pela Lei de Acesso à Informação no e-SIC de SC, com um modelo de texto pronto;
  - acordo de cooperação com a SEF/SC.

## Publicar nas lojas (quando estiver pronto)

- Conta de desenvolvedor: Apple, US$ 99 por ano; Google Play, US$ 25 uma vez.
- Build e envio na nuvem com o EAS, sem precisar de Mac:
  ```powershell
  npx eas-cli@latest login
  npx eas-cli@latest build --platform all
  npx eas-cli@latest submit --platform ios
  ```
- Antes de publicar:
  - definir o identificador do app (`ios.bundleIdentifier` e `android.package` no `app.json`);
  - escrever a política de privacidade;
  - conferir se o nome "Rendeu" está livre no INPI.

## Próximos passos sugeridos

- Rodar `npm run robo:publicar` e ajustar os termos de busca (`robo/itens.ts`) dos itens que vierem sem preço ou com o produto errado.
- Pedir aos mercados autorização para o robô (ou um arquivo de preços oficial). Com isso, a coleta automática do GitHub volta a funcionar.
- Buscar os preços direto do celular, só para os itens da lista e com aviso do consumo de dados. Funciona para quem não usa o computador.
- Servidor gratuito (Supabase) para juntar as notas fiscais de todos os usuários. Isso cobre o Komprão, o Fort, o Bistek e o Imperatriz, que não têm site com preço.
- Pedido de dados à Sefaz/SC (veja `docs/`).
- CEP e localização para sugerir as lojas mais perto.
- Receitas criadas com IA. A chamada passa por um servidor (a chave da API nunca fica no app), e o app confere ingredientes, preço e orçamento antes de aceitar a receita.

## Licença

MIT. Veja o arquivo [LICENSE](LICENSE).
