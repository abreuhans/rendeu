// Catálogo: mercados da Grande Florianópolis, aparelhos e produtos.
// PREÇOS = ESTIMATIVAS DE REFERÊNCIA (out/2026) para o protótipo. Os preços reais
// entram pelas notas fiscais (NFC-e) lidas no app — ver src/core/nfce.
import type { Aparelho, Item, Mercado } from '../tipos';

export const MERCADOS: Mercado[] = [
  { id: 'komprao', nome: 'Komprão', grupo: 'Grupo Koch', tipo: 'atacarejo', fator: 0.87, nivel: 1 },
  { id: 'fort', nome: 'Fort Atacadista', grupo: 'Grupo Pereira', tipo: 'atacarejo', fator: 0.88, nivel: 1 },
  { id: 'giassi', nome: 'Giassi', tipo: 'supermercado', fator: 0.97, nivel: 2 },
  { id: 'koch', nome: 'Koch', grupo: 'Grupo Koch', tipo: 'supermercado', fator: 0.98, nivel: 2 },
  { id: 'bistek', nome: 'Bistek', tipo: 'supermercado', fator: 1.0, nivel: 2 },
  { id: 'imperatriz', nome: 'Imperatriz', grupo: 'Mundialmix', tipo: 'supermercado', fator: 1.04, nivel: 2 },
  { id: 'angeloni', nome: 'Angeloni', tipo: 'supermercado', fator: 1.06, nivel: 2 },
  { id: 'hippo', nome: 'Hippo', tipo: 'premium', fator: 1.3, nivel: 3 },
];

/** Ofertas da semana (exemplo): multiplicador sobre o preço. */
export const OFERTAS: Record<string, Record<string, number>> = {
  komprao: { arroz: 0.88, oleo: 0.85, ovos: 0.9 },
  fort: { feijao_preto: 0.85, frango_coxa: 0.85, macarrao: 0.85 },
  giassi: { carne_moida: 0.85, banana: 0.8 },
  koch: { peito_frango: 0.85, leite: 0.9 },
  bistek: { tomate: 0.8, cebola: 0.8, batata: 0.8 },
  imperatriz: { mussarela: 0.85, linguica: 0.85 },
  angeloni: { tilapia: 0.85, pao_frances: 0.85 },
};

export const APARELHOS: Aparelho[] = [
  { id: 'fogao', nome: 'Fogão' },
  { id: 'forno', nome: 'Forno' },
  { id: 'microondas', nome: 'Micro-ondas' },
  { id: 'airfryer', nome: 'Air fryer' },
  { id: 'pressao', nome: 'Panela de pressão', curto: 'Pressão' },
  { id: 'pressao_eletrica', nome: 'Panela de pressão elétrica', curto: 'Pressão elétrica' },
  { id: 'arroz_eletrica', nome: 'Panela elétrica de arroz', curto: 'Panela de arroz' },
  { id: 'liquidificador', nome: 'Liquidificador' },
  { id: 'sanduicheira', nome: 'Sanduicheira / grill', curto: 'Sanduicheira' },
  { id: 'torradeira', nome: 'Torradeira' },
];

/** A panela de pressão comum só funciona com fogão. */
export const APARELHO_REQUER: Record<string, string[]> = { pressao: ['pressao', 'fogao'] };

const I = (x: Item): Item => x;

export const ITENS: Item[] = [
  // Mercearia
  I({ id: 'arroz', nome: 'Arroz branco tipo 1', secao: 'mercearia', u: 'g', pk: [[1000, 5.79, 'pacote 1 kg'], [5000, 25.9, 'pacote 5 kg']], n: [358, 7.2, 78.8, 0.3], g: 'arroz' }),
  I({ id: 'feijao_preto', nome: 'Feijão preto', secao: 'mercearia', u: 'g', pk: [[1000, 7.69, 'pacote 1 kg']], n: [324, 21.3, 58.8, 1.3], g: 'feijao' }),
  I({ id: 'feijao_carioca', nome: 'Feijão carioca', secao: 'mercearia', u: 'g', pk: [[1000, 7.99, 'pacote 1 kg']], n: [329, 20, 61.2, 1.3], g: 'feijao' }),
  I({ id: 'macarrao', nome: 'Macarrão (espaguete ou parafuso)', secao: 'mercearia', u: 'g', pk: [[500, 4.59, 'pacote 500 g']], n: [371, 10, 77.9, 1.3], tags: ['gluten'], g: 'massa' }),
  I({ id: 'massa_lasanha', nome: 'Massa para lasanha', secao: 'mercearia', u: 'g', pk: [[500, 7.99, 'pacote 500 g']], n: [360, 12, 74, 1.5], tags: ['gluten'], g: 'massa' }),
  I({ id: 'farinha_trigo', nome: 'Farinha de trigo', secao: 'mercearia', u: 'g', pk: [[1000, 5.49, 'pacote 1 kg']], n: [360, 9.8, 75.1, 1.4], tags: ['gluten'], cs: 8 }),
  I({ id: 'farinha_mandioca', nome: 'Farinha de mandioca', secao: 'mercearia', u: 'g', pk: [[500, 5.29, 'pacote 500 g']], n: [361, 1.6, 87.9, 0.3], cs: 10 }),
  I({ id: 'fuba', nome: 'Fubá', secao: 'mercearia', u: 'g', pk: [[500, 2.99, 'pacote 500 g'], [1000, 4.89, 'pacote 1 kg']], n: [353, 7.2, 78.9, 1.9], g: 'milho' }),
  I({ id: 'flocao', nome: 'Flocão de milho (cuscuz)', secao: 'mercearia', u: 'g', pk: [[500, 3.89, 'pacote 500 g']], n: [356, 7.5, 79, 1.5], g: 'milho' }),
  I({ id: 'goma_tapioca', nome: 'Goma de tapioca', secao: 'mercearia', u: 'g', pk: [[500, 7.49, 'pacote 500 g']], n: [240, 0.2, 60, 0] }),
  I({ id: 'aveia', nome: 'Aveia em flocos', secao: 'mercearia', u: 'g', pk: [[200, 4.99, 'caixa 200 g'], [500, 10.49, 'pacote 500 g']], n: [394, 13.9, 66.6, 8.5], tags: ['gluten'], g: 'aveia' }),
  I({ id: 'granola', nome: 'Granola', secao: 'mercearia', u: 'g', pk: [[250, 10.9, 'pacote 250 g']], n: [420, 9, 66, 13], tags: ['gluten'], g: 'aveia' }),
  I({ id: 'acucar', nome: 'Açúcar refinado', secao: 'mercearia', u: 'g', pk: [[1000, 4.69, 'pacote 1 kg']], n: [387, 0, 99.5, 0], cs: 12 }),
  I({ id: 'oleo', nome: 'Óleo de soja', secao: 'mercearia', u: 'ml', pk: [[900, 7.99, 'garrafa 900 ml']], n: [884, 0, 0, 100], cs: 15 }),
  I({ id: 'azeite', nome: 'Azeite de oliva', secao: 'mercearia', u: 'ml', pk: [[500, 37.9, 'garrafa 500 ml']], n: [884, 0, 0, 100], cs: 15 }),
  I({ id: 'vinagre', nome: 'Vinagre', secao: 'mercearia', u: 'ml', pk: [[750, 3.49, 'garrafa 750 ml']], n: [18, 0, 0.6, 0], cs: 15 }),
  I({ id: 'molho_tomate', nome: 'Molho de tomate', secao: 'mercearia', u: 'g', pk: [[300, 2.89, 'sachê 300 g']], n: [38, 1.4, 7.7, 0.2], g: 'tomate' }),
  I({ id: 'milho_lata', nome: 'Milho verde em lata', secao: 'mercearia', u: 'g', pk: [[170, 4.49, 'lata 170 g drenado']], n: [98, 3.2, 17.1, 2.4], g: 'milho' }),
  I({ id: 'ervilha_lata', nome: 'Ervilha em lata', secao: 'mercearia', u: 'g', pk: [[170, 4.39, 'lata 170 g drenado']], n: [74, 4.6, 13.4, 0.4], g: 'ervilha' }),
  I({ id: 'atum', nome: 'Atum em lata', secao: 'mercearia', u: 'g', pk: [[170, 9.99, 'lata 170 g']], n: [180, 25, 0, 9], tags: ['peixe'], g: 'peixe' }),
  I({ id: 'sardinha', nome: 'Sardinha em lata', secao: 'mercearia', u: 'g', pk: [[125, 6.79, 'lata 125 g']], n: [250, 16, 0, 20], tags: ['peixe'], g: 'peixe' }),
  I({ id: 'maionese', nome: 'Maionese', secao: 'mercearia', u: 'g', pk: [[500, 10.49, 'pote 500 g']], n: [280, 0.5, 4, 29], cs: 15 }),
  I({ id: 'shoyu', nome: 'Molho shoyu', secao: 'mercearia', u: 'ml', pk: [[150, 5.99, 'frasco 150 ml']], n: [61, 6, 9, 0], tags: ['gluten'], cs: 15 }),
  I({ id: 'leite_coco', nome: 'Leite de coco', secao: 'mercearia', u: 'ml', pk: [[200, 4.99, 'vidro 200 ml']], n: [166, 1, 2.2, 18], cs: 15 }),
  I({ id: 'creme_leite', nome: 'Creme de leite', secao: 'mercearia', u: 'g', pk: [[200, 3.99, 'caixinha 200 g']], n: [221, 1.5, 3.5, 22], tags: ['lactose'], cs: 15 }),
  I({ id: 'batata_palha', nome: 'Batata palha', secao: 'mercearia', u: 'g', pk: [[100, 6.99, 'pacote 100 g']], n: [540, 6, 50, 35], g: 'batata' }),
  I({ id: 'pasta_amendoim', nome: 'Pasta de amendoim', secao: 'mercearia', u: 'g', pk: [[500, 16.9, 'pote 500 g']], n: [590, 25, 20, 48], tags: ['amendoim'], g: 'amendoim', cs: 15 }),
  I({ id: 'achocolatado', nome: 'Achocolatado em pó', secao: 'mercearia', u: 'g', pk: [[370, 9.49, 'pote 370 g']], n: [401, 4, 91, 2], cs: 8 }),
  I({ id: 'cafe', nome: 'Café em pó', secao: 'mercearia', u: 'g', pk: [[500, 32.9, 'pacote 500 g']], n: [0, 0, 0, 0], cs: 6 }),
  I({ id: 'milho_pipoca', nome: 'Milho de pipoca', secao: 'mercearia', u: 'g', pk: [[500, 5.49, 'pacote 500 g']], n: [380, 12, 74, 4], g: 'milho' }),
  I({ id: 'caldo_galinha', nome: 'Caldo de galinha (tablete)', secao: 'temperos', u: 'tablete', pk: [[6, 3.29, 'caixa com 6']], n: [20, 1, 2, 1] }),
  I({ id: 'fermento', nome: 'Fermento químico em pó', secao: 'mercearia', u: 'g', pk: [[100, 4.49, 'lata 100 g']], n: [0, 0, 0, 0], cs: 12 }),
  // Temperos
  I({ id: 'colorau', nome: 'Colorau', secao: 'temperos', u: 'g', pk: [[80, 2.99, 'pacote 80 g']], n: [300, 12, 50, 10], cs: 5 }),
  I({ id: 'oregano', nome: 'Orégano', secao: 'temperos', u: 'g', pk: [[10, 2.79, 'pacote 10 g']], n: [306, 11, 64, 10], cs: 1.5 }),
  I({ id: 'cominho', nome: 'Cominho', secao: 'temperos', u: 'g', pk: [[40, 3.49, 'pacote 40 g']], n: [375, 18, 44, 22], cs: 5 }),
  I({ id: 'pimenta_reino', nome: 'Pimenta-do-reino', secao: 'temperos', u: 'g', pk: [[50, 5.49, 'pacote 50 g']], n: [251, 10, 64, 3], cs: 5 }),
  I({ id: 'canela', nome: 'Canela em pó', secao: 'temperos', u: 'g', pk: [[20, 3.69, 'pacote 20 g']], n: [247, 4, 81, 1], cs: 5 }),
  // Padaria
  I({ id: 'pao_frances', nome: 'Pão francês', secao: 'padaria', u: 'un', granel: { kg: 17.9, pesoUn: 50 }, n: [150, 4.7, 29.3, 1.6], tags: ['gluten'], g: 'pao' }),
  I({ id: 'pao_forma', nome: 'Pão de forma', secao: 'padaria', u: 'fatia', pk: [[20, 8.99, 'pacote 500 g (~20 fatias)']], n: [63, 2.4, 12.3, 0.7], tags: ['gluten'], g: 'pao' }),
  I({ id: 'pao_hamburguer', nome: 'Pão de hambúrguer', secao: 'padaria', u: 'un', pk: [[6, 7.99, 'pacote com 6']], n: [140, 4.5, 26, 2], tags: ['gluten'], g: 'pao' }),
  I({ id: 'tortilha', nome: 'Tortilha / pão folha (tipo Rap10)', secao: 'padaria', u: 'un', pk: [[6, 9.49, 'pacote com 6']], n: [160, 4.5, 28, 3.5], tags: ['gluten'], g: 'pao' }),
  // Frios, laticínios e ovos
  I({ id: 'ovos', nome: 'Ovos', secao: 'frios', u: 'un', pk: [[12, 11.49, 'dúzia'], [30, 25.9, 'bandeja com 30']], n: [72, 6.3, 0.4, 4.8], g: 'ovo' }),
  I({ id: 'leite', nome: 'Leite integral', secao: 'frios', u: 'ml', pk: [[1000, 5.39, 'caixa 1 L']], n: [61, 3.2, 4.6, 3.3], tags: ['lactose'], g: 'leite' }),
  I({ id: 'manteiga', nome: 'Manteiga', secao: 'frios', u: 'g', pk: [[200, 13.9, 'pote 200 g']], n: [726, 0.4, 0.1, 82], tags: ['lactose'], cs: 15 }),
  I({ id: 'margarina', nome: 'Margarina', secao: 'frios', u: 'g', pk: [[500, 8.99, 'pote 500 g']], n: [590, 0, 0, 65], cs: 15 }),
  I({ id: 'requeijao', nome: 'Requeijão cremoso', secao: 'frios', u: 'g', pk: [[200, 7.99, 'copo 200 g']], n: [257, 9.6, 2.4, 23.4], tags: ['lactose'], g: 'queijo', cs: 20 }),
  I({ id: 'mussarela', nome: 'Queijo mussarela fatiado', secao: 'frios', u: 'g', pk: [[150, 8.99, 'bandeja 150 g'], [500, 26.9, '500 g fatiado no balcão']], n: [330, 22.6, 3, 25.2], tags: ['lactose'], g: 'queijo' }),
  I({ id: 'queijo_minas', nome: 'Queijo minas frescal', secao: 'frios', u: 'g', pk: [[400, 15.9, 'peça 400 g']], n: [264, 17.4, 3.2, 20.2], tags: ['lactose'], g: 'queijo' }),
  I({ id: 'parmesao', nome: 'Queijo parmesão ralado', secao: 'frios', u: 'g', pk: [[50, 6.49, 'pacote 50 g']], n: [453, 35.6, 1.7, 33.5], tags: ['lactose'], g: 'queijo', cs: 6 }),
  I({ id: 'iogurte', nome: 'Iogurte natural', secao: 'frios', u: 'g', pk: [[170, 3.49, 'pote 170 g']], n: [51, 4.1, 1.9, 3], tags: ['lactose'], g: 'leite' }),
  I({ id: 'presunto', nome: 'Presunto fatiado', secao: 'frios', u: 'g', pk: [[150, 6.79, 'bandeja 150 g']], n: [110, 14, 2, 5], tags: ['carne'], g: 'porco' }),
  // Açougue e peixaria
  I({ id: 'peito_frango', nome: 'Filé de peito de frango', secao: 'acougue', u: 'g', pk: [[500, 11.9, 'bandeja ~500 g'], [1000, 22.9, 'bandeja ~1 kg']], n: [119, 21.5, 0, 3], tags: ['carne'], g: 'frango' }),
  I({ id: 'frango_coxa', nome: 'Coxa e sobrecoxa de frango', secao: 'acougue', u: 'g', pk: [[1000, 13.9, 'bandeja ~1 kg']], n: [160, 12.5, 0, 12], tags: ['carne'], g: 'frango' }),
  I({ id: 'carne_moida', nome: 'Carne moída (acém)', secao: 'acougue', u: 'g', pk: [[500, 19.9, 'bandeja 500 g'], [1000, 38.9, 'bandeja 1 kg']], n: [150, 19, 0, 8], tags: ['carne'], g: 'carne' }),
  I({ id: 'acem', nome: 'Acém em cubos', secao: 'acougue', u: 'g', pk: [[500, 19.9, 'bandeja 500 g'], [1000, 37.9, 'bandeja 1 kg']], n: [137, 19.4, 0, 5.9], tags: ['carne'], g: 'carne' }),
  I({ id: 'bife', nome: 'Bife de coxão mole', secao: 'acougue', u: 'g', pk: [[500, 27.9, 'bandeja 500 g']], n: [169, 21.2, 0, 8.7], tags: ['carne'], g: 'carne' }),
  I({ id: 'linguica', nome: 'Linguiça toscana', secao: 'acougue', u: 'g', pk: [[500, 13.9, 'pacote 500 g']], n: [230, 16, 0, 18], tags: ['carne'], g: 'porco' }),
  I({ id: 'calabresa', nome: 'Linguiça calabresa defumada', secao: 'acougue', u: 'g', pk: [[400, 13.9, 'pacote 400 g']], n: [300, 15, 2, 26], tags: ['carne'], g: 'porco' }),
  I({ id: 'bisteca', nome: 'Bisteca suína', secao: 'acougue', u: 'g', pk: [[1000, 21.9, 'bandeja ~1 kg']], n: [170, 16, 0, 11], tags: ['carne'], g: 'porco' }),
  I({ id: 'salsicha', nome: 'Salsicha', secao: 'acougue', u: 'g', pk: [[500, 9.49, 'pacote 500 g']], n: [250, 12, 4, 21], tags: ['carne'], g: 'porco' }),
  I({ id: 'tilapia', nome: 'Filé de tilápia', secao: 'acougue', u: 'g', pk: [[500, 29.9, 'bandeja 500 g']], n: [96, 20.1, 0, 1.7], tags: ['peixe'], g: 'peixe' }),
  I({ id: 'merluza', nome: 'Filé de merluza congelado', secao: 'congelados', u: 'g', pk: [[500, 19.9, 'pacote 500 g']], n: [89, 16.6, 0, 2], tags: ['peixe'], g: 'peixe' }),
  I({ id: 'camarao', nome: 'Camarão descascado congelado', secao: 'congelados', u: 'g', pk: [[400, 36.9, 'pacote 400 g']], n: [85, 18, 0, 1], tags: ['peixe'], g: 'camarao' }),
  // Hortifrúti (vendido por unidade, preço por kg)
  I({ id: 'banana', nome: 'Banana prata', secao: 'hortifruti', u: 'un', granel: { kg: 6.99, pesoUn: 110 }, n: [98, 1.3, 26, 0.1], g: 'banana' }),
  I({ id: 'maca', nome: 'Maçã', secao: 'hortifruti', u: 'un', granel: { kg: 10.9, pesoUn: 150 }, n: [84, 0.4, 22.5, 0] }),
  I({ id: 'limao', nome: 'Limão', secao: 'hortifruti', u: 'un', granel: { kg: 6.99, pesoUn: 90 }, n: [10, 0.3, 3, 0] }),
  I({ id: 'tomate', nome: 'Tomate', secao: 'hortifruti', u: 'un', granel: { kg: 7.99, pesoUn: 120 }, n: [18, 1.3, 3.7, 0.2], g: 'tomate' }),
  I({ id: 'cebola', nome: 'Cebola', secao: 'hortifruti', u: 'un', granel: { kg: 5.49, pesoUn: 150 }, n: [59, 2.6, 13.4, 0.2], g: 'cebola' }),
  I({ id: 'alho', nome: 'Alho', secao: 'hortifruti', u: 'dente', pk: [[10, 1.89, 'cabeça (~10 dentes)']], n: [4.5, 0.3, 1, 0] }),
  I({ id: 'batata', nome: 'Batata', secao: 'hortifruti', u: 'un', granel: { kg: 5.99, pesoUn: 170 }, n: [109, 3, 25, 0], g: 'batata' }),
  I({ id: 'batata_doce', nome: 'Batata-doce', secao: 'hortifruti', u: 'un', granel: { kg: 5.49, pesoUn: 200 }, n: [236, 2.5, 56, 0.2], g: 'batata_doce' }),
  I({ id: 'cenoura', nome: 'Cenoura', secao: 'hortifruti', u: 'un', granel: { kg: 4.99, pesoUn: 130 }, n: [44, 1.7, 10, 0.3], g: 'cenoura' }),
  I({ id: 'abobrinha', nome: 'Abobrinha', secao: 'hortifruti', u: 'un', granel: { kg: 6.99, pesoUn: 250 }, n: [48, 2.8, 10.7, 0.5], g: 'abobrinha' }),
  I({ id: 'chuchu', nome: 'Chuchu', secao: 'hortifruti', u: 'un', granel: { kg: 3.99, pesoUn: 250 }, n: [43, 1.8, 10, 0.3], g: 'chuchu' }),
  I({ id: 'pimentao', nome: 'Pimentão verde', secao: 'hortifruti', u: 'un', granel: { kg: 10.9, pesoUn: 150 }, n: [32, 1.6, 7.4, 0.2], g: 'pimentao' }),
  I({ id: 'brocolis', nome: 'Brócolis', secao: 'hortifruti', u: 'un', pk: [[1, 7.49, 'unidade (maço)']], n: [63, 9, 11, 1], g: 'brocolis' }),
  I({ id: 'repolho', nome: 'Repolho', secao: 'hortifruti', u: 'g', pk: [[500, 2.99, '½ unidade (~500 g)'], [1000, 4.99, 'unidade (~1 kg)']], n: [17, 0.9, 3.9, 0.1], g: 'repolho' }),
  I({ id: 'alface', nome: 'Alface', secao: 'hortifruti', u: 'un', pk: [[1, 3.49, 'pé']], n: [22, 2.7, 3.4, 0.4] }),
  I({ id: 'couve', nome: 'Couve', secao: 'hortifruti', u: 'un', pk: [[1, 3.99, 'maço']], n: [54, 5.8, 8.6, 1], g: 'couve' }),
  I({ id: 'cheiro_verde', nome: 'Cheiro-verde', secao: 'hortifruti', u: 'un', pk: [[1, 2.99, 'maço']], n: [10, 1, 1.5, 0.2] }),
  I({ id: 'aipim', nome: 'Aipim (mandioca)', secao: 'hortifruti', u: 'g', pk: [[500, 3.49, '500 g'], [1000, 5.99, '1 kg']], n: [151, 1.1, 36.2, 0.3], g: 'aipim' }),
  I({ id: 'abobora', nome: 'Abóbora cabotiá', secao: 'hortifruti', u: 'g', pk: [[1000, 4.99, 'pedaço ~1 kg']], n: [39, 1.7, 8.4, 0.5], g: 'abobora' }),
  // Congelados
  I({ id: 'pao_queijo', nome: 'Pão de queijo congelado', secao: 'congelados', u: 'g', pk: [[400, 13.9, 'pacote 400 g']], n: [363, 5.1, 34.2, 24.6], tags: ['lactose'], g: 'queijo' }),
  I({ id: 'seleta', nome: 'Seleta de legumes congelada', secao: 'congelados', u: 'g', pk: [[300, 7.99, 'pacote 300 g']], n: [70, 3.5, 13, 0.5], g: 'ervilha' }),
];

export const ITEM: Record<string, Item> = Object.fromEntries(ITENS.map(i => [i.id, i]));

/** "Já tenho em casa", em grupos para a tela. */
export const DESPENSA: { titulo: string; itens: string[] }[] = [
  { titulo: 'Básicos', itens: ['oleo', 'azeite', 'vinagre', 'acucar', 'cafe'] },
  { titulo: 'Grãos e farinhas', itens: ['arroz', 'feijao_preto', 'feijao_carioca', 'macarrao', 'farinha_trigo', 'farinha_mandioca', 'fuba', 'aveia', 'goma_tapioca'] },
  { titulo: 'Geladeira', itens: ['leite', 'ovos', 'manteiga', 'margarina', 'creme_leite', 'requeijao'] },
  { titulo: 'Temperos', itens: ['alho', 'cebola', 'colorau', 'oregano', 'cominho', 'pimenta_reino', 'canela', 'caldo_galinha', 'shoyu'] },
  { titulo: 'Outros', itens: ['molho_tomate', 'maionese', 'fermento', 'achocolatado'] },
];

export const GRUPOS: { id: string; nome: string }[] = [
  ['frango', 'Frango'], ['carne', 'Carne bovina'], ['porco', 'Porco e linguiça'], ['peixe', 'Peixe'], ['camarao', 'Camarão'],
  ['ovo', 'Ovo'], ['feijao', 'Feijão'], ['queijo', 'Queijo'], ['leite', 'Leite e iogurte'], ['arroz', 'Arroz'],
  ['massa', 'Massas'], ['pao', 'Pão'], ['aveia', 'Aveia'], ['milho', 'Milho'], ['ervilha', 'Ervilha'],
  ['batata', 'Batata'], ['batata_doce', 'Batata-doce'], ['aipim', 'Aipim'], ['abobora', 'Abóbora'], ['cenoura', 'Cenoura'],
  ['abobrinha', 'Abobrinha'], ['chuchu', 'Chuchu'], ['brocolis', 'Brócolis'], ['couve', 'Couve'], ['repolho', 'Repolho'],
  ['tomate', 'Tomate'], ['cebola', 'Cebola'], ['pimentao', 'Pimentão'], ['banana', 'Banana'], ['amendoim', 'Amendoim'],
].map(([id, nome]) => ({ id, nome }));

export const COZINHAS: { id: string; nome: string }[] = [
  ['brasileira', 'Caseira brasileira'], ['mineira', 'Mineira'], ['nordestina', 'Nordestina'], ['italiana', 'Massas e italiana'],
  ['oriental', 'Oriental'], ['praia', 'Peixes e frutos do mar'], ['lanche', 'Lanches'], ['fit', 'Fit / leve'],
].map(([id, nome]) => ({ id, nome }));
