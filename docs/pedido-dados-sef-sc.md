# Como pedir à Sefaz/SC os preços das notas fiscais

## O que já existe

- Desde maio de 2026, Santa Catarina está no app **Menor Preço Brasil**. A SEF/SC liberou para ele a base das notas fiscais eletrônicas (NF-e e NFC-e) emitidas no estado.
  - O app mostra o preço de cada produto por loja, num raio de até 30 km, atualizado conforme as notas são emitidas.
  - O app foi desenvolvido pela PROCERGS, no Sistema de Visão de Recursos Compartilhados (SVRS) da Sefaz-RS, e pede login gov.br.
  - Fonte: [notícia do Governo de SC, 13/05/2026](https://noticias.sc.gov.br/consumidor-catarinense-ja-pode-comparar-precos-em-tempo-real-por-aplicativo/).
- Não achei API pública nem dados abertos do Menor Preço Brasil.
  - Usar a API interna do app por fora exigiria o login gov.br de alguém e fere os termos de uso. **Não faça isso.**
- Argumento forte para o pedido: os preços **já são mostrados ao público por loja** no app oficial. O pedido é para receber esses mesmos dados em formato aberto, sem nenhum dado de consumidor.

## Caminho 1 — Pedido pela Lei de Acesso à Informação (grátis, qualquer pessoa)

1. Acesse o e-SIC do Estado: <https://www.ouvidoria.sc.gov.br/cidadao_lai.php>
   - Ou entre pelo portal da Ouvidoria-Geral (<https://www.ouvidoria.sc.gov.br/cidadao/>) e escolha **E-SIC**.
   - O pedido segue a Lei Federal nº 12.527/2011 e o Decreto Estadual nº 1.048/2012.
2. Identifique-se: nome, CPF (ou CNPJ, se tiver empresa) e e-mail. A identificação é obrigatória, mas o motivo do pedido não precisa ser explicado (art. 10, § 3º).
3. Escolha o órgão **Secretaria de Estado da Fazenda (SEF)**.
4. Cole o texto do modelo abaixo.
5. Guarde o protocolo. O prazo de resposta é de **20 dias**, prorrogáveis por mais 10 com justificativa (art. 11).
6. Se negarem, ou só derem parte dos dados, há **recurso em 10 dias** (art. 15). As instâncias aparecem no próprio e-SIC.
   - Peça sempre o acesso parcial: a parte que não for sigilosa precisa ser entregue (art. 7º, § 2º).

### Modelo de pedido

> Com base na Lei nº 12.527/2011 e no Decreto Estadual nº 1.048/2012, solicito à Secretaria de Estado da Fazenda:
>
> 1. Os preços unitários de venda ao consumidor de produtos de supermercado registrados em NFC-e, os mesmos que a SEF/SC disponibiliza ao aplicativo Menor Preço Brasil. O pedido vale para estabelecimentos dos municípios de Florianópolis, São José, Palhoça e Biguaçu e cobre os últimos 30 dias, com a data mais recente disponível.
>    - Campos desejados, por item: código de barras (GTIN), descrição do produto, unidade comercial, valor unitário, data e hora da venda, CNPJ, nome fantasia e endereço do estabelecimento.
>    - Não solicito nenhum dado do consumidor (CPF, nome) nem dados de valor total de vendas ou faturamento. Peço os dados já agregados por produto, estabelecimento e dia, se for preciso para proteger informações protegidas por sigilo.
> 2. O formato: arquivo aberto e legível por máquina (CSV ou JSON). Também pergunto se existe, ou se está previsto, um serviço de consulta (API) ou publicação periódica desses dados no portal de dados abertos.
> 3. Caso algum dado seja considerado sigiloso (art. 198 do CTN), solicito o acesso à parte não sigilosa (art. 7º, § 2º, da LAI). Também peço a indicação do setor responsável e de como celebrar um acordo de cooperação ou termo de uso desses dados para um aplicativo gratuito de planejamento de compras de interesse público.
>
> Observo que esses preços já são exibidos ao público, por estabelecimento, no aplicativo oficial Menor Preço Brasil.

### O que esperar

- A resposta mais provável é a negativa, com base no sigilo fiscal (art. 198 do CTN), ou a indicação de que o caminho é um acordo formal. Mesmo assim, o pedido gera um registro oficial e costuma apontar quem decide.
- Se vierem dados, eles entram no app como mais uma fonte, parecida com o `precos.json` do robô. O formato está em `src/core/motor/site.ts`.

## Caminho 2 — Acordo de cooperação técnica com a SEF/SC

- Combina mais com um projeto que já está nas lojas e tem usuários. Ajuda ter:
  - uma pessoa jurídica: MEI, associação ou parceria com uma universidade (UFSC, Udesc);
  - política de privacidade e descrição do uso dos dados;
  - compromisso de não identificar consumidores.
- A resposta do Caminho 1 deve indicar o setor certo. Com ela, dá para pedir uma reunião ou enviar um ofício.

## Caminho 3 — O que o app já faz sem depender da Sefaz

- **Sites dos mercados:** o robô (`robo/`) lê duas vezes por dia os preços do Angeloni, Giassi, Koch e Hippo.
- **Notas lidas pelos usuários:** o QR Code da NFC-e de cada compra atualiza os preços daquele mercado. Um próximo passo é juntar as notas de todos os usuários num servidor gratuito (Supabase). Assim, a nota de uma pessoa ajuda todo mundo, sem pedir nada ao governo: cada pessoa compartilha a própria nota.
