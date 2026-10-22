# Rendeu

Aplicativo que monta o cardápio da semana **dentro do valor que você tem**, com receitas que usam os aparelhos da sua cozinha e a lista de compras com preços dos mercados da Grande Florianópolis.

Você informa:

- o orçamento (R$) e quantas pessoas vão comer;
- o CEP e os mercados (Komprão, Fort, Giassi, Koch, Bistek, Imperatriz, Angeloni, Hippo);
- a dieta (equilibrada, rica em proteína, low carb, menos calorias, mais calorias) e as restrições;
- os aparelhos da cozinha e o que já tem em casa;
- do que gosta e do que não gosta;
- quantos dias e quais refeições.

O app entrega:

- o cardápio com o custo de cada porção;
- as receitas com passo a passo para os aparelhos que você tem;
- a lista de compras em embalagens inteiras, agrupada por mercado e seção;
- a comparação entre os mercados.

O total da compra nunca passa do orçamento.

## Como testar no Windows com o iPhone (Expo Go)

1. Instale o [Node.js LTS](https://nodejs.org) e o [Git](https://git-scm.com/download/win).
2. No PowerShell, baixe o projeto e instale as dependências:
   ```powershell
   git clone https://github.com/<seu-usuario>/rendeu.git
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

## Estrutura

```
src/
  app/            telas (Expo Router): início, passo/[n], gerando, plano, receita/[i], notas/…
  screens/        corpo das telas maiores (passos do cadastro, abas do plano)
  components/     logo, botões, chips, papel de cupom, leitor da nota (WebView)
  estado/         estado do app e armazenamento no aparelho
  lib/            textos e contas derivadas do plano
  core/           núcleo em TypeScript puro, sem React Native
    dados/        mercados, ~80 itens com preço de referência, métodos de preparo e 84 receitas
    motor/        planejador, preços por embalagem, formatos (R$, quantidades), passo a passo
    nfce/         chave e link da NFC-e, leitura da página da nota, ligação com o catálogo
tests/            testes do núcleo (Vitest) e de ponta a ponta (Playwright)
web/prototipo/    protótipo web de um arquivo só, feito com o mesmo núcleo
```

O núcleo (`src/core`) roda igual no app, no protótipo web e nos testes.

## Como o plano é montado

1. **Filtro:** as receitas são filtradas pela dieta, pelas restrições, pelo que a pessoa não come e pelos aparelhos.
2. **Busca:** para cada mercado (ou para a divisão entre mercados), o planejador testa cerca de 140 cardápios. A busca combina:
   - sorteio guiado por pontuação;
   - reserva de dinheiro para as refeições que faltam;
   - melhoria local.
3. **Custo real da compra:** a conta usa embalagens inteiras, na combinação de tamanhos mais barata, e reaproveita o que sobra de uma receita na outra.
4. **Desempate:** a pontuação equilibra preço, variedade, desperdício de perecíveis, gostos e dieta. Também favorece a sobra do jantar como marmita do dia seguinte.
5. **Resultado:** o plano escolhido nunca passa do orçamento. Se não couber, o app mostra o valor mínimo e oferece ajustes.

## Preços: estimados e reais

- **Sem nota fiscal:** os preços são **estimados**. O cálculo usa o preço de referência do item, o fator do mercado (atacarejo, supermercado, premium) e uma variação por produto.
- **Com nota fiscal (NFC-e):** depois de uma compra, a pessoa lê o QR Code do cupom.
  - O app abre a consulta pública da nota no site da Sefaz/SC dentro de uma WebView. Se o site pedir a verificação do Cloudflare, a pessoa confirma.
  - O app lê a tabela de produtos e liga cada linha ao catálogo, por exemplo "ARROZ TIO JOAO T1 5KG" → arroz, R$/kg.
  - Esses preços passam a valer para aquele mercado nos próximos planos.
- **No navegador do computador:** o site da Sefaz não pode ser lido por dentro. A pessoa abre a nota em outra aba, copia o texto da página e cola no app.
- **Privacidade:** da nota, o app guarda só produto, preço, mercado e data. Não guarda CPF. Tudo fica no aparelho.

Preços em tempo real de todos os mercados ainda não existem por API pública:

- O [Menor Preço Brasil](https://www.sef.sc.gov.br/noticias/consumidor-catarinense-ja-pode-comparar-precos-em-tempo-real-por-aplicativo) já usa as notas fiscais de SC, mas não oferece API.

Caminhos para ir além das notas lidas por cada pessoa:

- juntar as notas de todos os usuários num servidor (Supabase, por exemplo), para que uma nota ajude todo mundo;
- pedir os dados à Sefaz/SC (Lei de Acesso à Informação) ou propor uma parceria;
- usar um serviço pago de consulta de NFC-e, como a [Infosimples](https://infosimples.com/consultas/sefaz-sc-nfce/);
- ler os sites de compra online dos mercados, respeitando os termos de uso de cada um.

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

- Testar a leitura de notas reais de vários mercados de Florianópolis e ajustar o casamento de produtos.
- Servidor para compartilhar os preços das notas entre usuários (preços mais frescos para todos).
- CEP e localização para sugerir as lojas mais perto.
- Mais receitas e itens no catálogo.
- Receitas criadas com IA. A chamada passa por um servidor (a chave da API nunca fica no app), e o app confere ingredientes, preço e orçamento antes de aceitar a receita.
