// O que o robô procura em cada site para cada item do catálogo. O produto só vale se as regras
// de leitura de nota (src/core/nfce/casamento.ts) também o reconhecerem como aquele item.

export interface Busca {
  /** Termos digitados na busca do site. */
  busca: string[];
  /** O nome precisa ter isto (ex.: leite INTEGRAL). */
  inclui?: RegExp;
  /** Variações que não servem (temperado, pronto, light...). */
  exclui?: RegExp;
  /** Gramas por unidade, para itens contados (fatia, dente, maço) quando o site vende por peso. */
  gPorUn?: number;
  /** Não aceitar produto vendido a peso (ex.: pão de queijo já assado da padaria). */
  semPeso?: boolean;
}

/** Vale para todos: kits, pets, comida de bebê, orgânicos (preço de outro patamar). */
export const EXCLUI_SEMPRE = /\bKIT\b|\bCOMBO\b|\bLEVE \d|\bPAGUE\b|\bFARDO\b|\bPACK\b|CACHORRO|\bCAES\b|\bCAO\b|\bGATOS?\b|\bPET\b|RACAO|PETISCO|INFANTIL|PAPINHA|\bBEBE\b|ORGANIC/;

/** Embalagens múltiplas (só para itens por peso/volume, onde o preço viria multiplicado). */
export const MULTIPACK = /\bC\/\s?\d+\b|\bCOM \d+ UN|\bCX\s?\d+|\b\d+\s?X\s?\d+/;

export const BUSCAS: Record<string, Busca> = {
  // Mercearia
  arroz: { busca: ['arroz tipo 1'], exclui: /PARBOIL|INTEGRAL|ARBORIO|JAPON|CATETO|BASMATI|RISOTO|NEGRO|VERMELHO|GRAOS|SELVAGEM|COZIDO|PRONTO|SNACK|MINGAU|FLOCOS|CEREAL/ },
  feijao_preto: { busca: ['feijão preto'], exclui: /COZIDO|PRONTO|LATA|SACHE|TEMPERAD|FEIJOADA|CALDO|SOPA|CONGELAD/ },
  feijao_carioca: { busca: ['feijão carioca'], exclui: /COZIDO|PRONTO|LATA|SACHE|TEMPERAD|FEIJOADA|CALDO|SOPA|CONGELAD/ },
  lentilha: { busca: ['lentilha'], exclui: /COZID|PRONT|LATA|SOPA|SNACK|MASSA|MACARRAO|FARINHA|CHIPS/ },
  grao_bico: { busca: ['grão de bico'], exclui: /COZID|PRONT|LATA|SNACK|MASSA|MACARRAO|FARINHA|HOMUS|HUMMUS|CHIPS|TORRAD/ },
  macarrao: { busca: ['macarrão espaguete', 'macarrão parafuso'], exclui: /INTEGRAL|SEM GLUTEN|INSTANT|LAMEN|ARROZ|FRESC|RECHEAD|NHOQUE|PRONTO|COPO|LEGUMES|GRAO|LENTILHA|ESPINAFRE|ZERO|PROTEIN|LOW CARB/ },
  massa_lasanha: { busca: ['massa para lasanha'], exclui: /FRESC|PRONTA|CONGEL|BOLONH|INTEGRAL|SEM GLUTEN|VERDE|ESPINAFRE/ },
  macarrao_instantaneo: { busca: ['macarrão instantâneo'], exclui: /COPO|\bCUP\b|COREAN|BULDAK|KIMCHI|PREMIUM|ZERO|INTEGRAL|VEGETAL/ },
  farinha_trigo: { busca: ['farinha de trigo'], exclui: /INTEGRAL|FERMENTO|ROSCA|PASTEL|SEM GLUTEN|PIZZA|BOLO|SALGAD|MISTURA|PANKO|\b00\b/ },
  farinha_mandioca: { busca: ['farinha de mandioca'], exclui: /TEMPERAD|PRONTA|FAROFA|TAPIOCA|SURUI|BIJU|PUBA/ },
  fuba: { busca: ['fubá'], exclui: /CREME|BOLO|MISTURA|POLENTA PRONTA|CANJIQUINHA/ },
  flocao: { busca: ['flocão de milho'], exclui: /ARROZ|TAPIOCA|SUCRILHOS|CEREAL|MATINAL|CORN FLAKES|ACUCAR/ },
  goma_tapioca: { busca: ['goma de tapioca'], exclui: /GRANULAD|PRONTA|RECHEAD|BIJU|CHIPS|MISTURA|SAGU|PEROLA|COCO|CREPIOCA/ },
  aveia: { busca: ['aveia em flocos'], exclui: /FARELO|FARINHA|BARRA|BEBIDA|MINGAU|GRANOLA|BISC|COOKIE|LEITE|SEM GLUTEN|SACHE|\bMEL\b/ },
  granola: { busca: ['granola'], exclui: /BARRA|BISC|COOKIE|IOGURTE/ },
  acucar: { busca: ['açúcar refinado'], exclui: /CRISTAL|LIGHT|ZERO|SACHE|STEVIA|ADOCANTE|BAUNILHA|COCO|INVERTIDO|LIQUIDO|GELEIA/ },
  oleo: { busca: ['óleo de soja'], exclui: /SPRAY|COMPOSTO|MISTURA/ },
  azeite: { busca: ['azeite de oliva'], exclui: /COMPOSTO|MISTURA|SPRAY|TRUFAD|SABOR|AROMATIZAD|MINI|SACHE|ALHO|LIMAO|PIMENTA|ERVAS|MANJERIC|DENDE|BALSAMIC/ },
  vinagre: { busca: ['vinagre de álcool'], exclui: /BALSAMIC|MACA|VINHO|ARROZ|LIMPEZA|MULTIUSO|CREME|GLACE|GELEIA/ },
  molho_tomate: { busca: ['molho de tomate'], exclui: /PIZZA|BOLONH|PICANT|PIMENTA|MANJERIC|ERVAS|AZEITONA|CARNE|SALSICHA|PESTO|KETCHUP|CATCHUP|ARRABIATA|PUTANESCA|QUEIJO|BRANCO|ROSE/ },
  milho_lata: { busca: ['milho verde'], exclui: /CREME|PAMONHA|ESPIGA|CONGEL|MINI|BABY|SALADA|ERVILHA|CANJICA|PIPOCA/ },
  ervilha_lata: { busca: ['ervilha'], exclui: /SECA|PARTIDA|CONGEL|PROTEINA|SNACK|MILHO|SALADA|TORTA|SOPA/ },
  atum: { busca: ['atum'], exclui: /PATE|PASTA|SALADA|SANDUICHE|PRONTO|FRESCO|POSTA|CONGEL|FILE DE ATUM|PEIXE/ },
  sardinha: { busca: ['sardinha'], exclui: /FRESCA|INTEIRA|CONGEL|PATE|DEFUMADA|LIMPA|EMPANADA|FILE DE SARDINHA/ },
  maionese: { busca: ['maionese'], exclui: /SACHE|LIGHT|ZERO|VEGAN|TEMPERAD|BACON|ALHO|LIMAO|VERDE|AZEITONA|CHIPOTLE|SRIRACHA|PICANT|DEFUMAD/ },
  shoyu: { busca: ['molho shoyu'], exclui: /TARE|TERIYAKI|SACHE|AGRIDOCE|PIMENTA|GENGIBRE|INGLES|BARBECUE|HOISIN|OSTRA/ },
  leite_coco: { busca: ['leite de coco'], exclui: /\bPO\b|EM PO|BEBIDA|SORVETE|CHOCOLATE|DOCE|CONDENSADO/ },
  coco_ralado: { busca: ['coco ralado'], exclui: /CHOCOLATE|BOMBOM|DOCE DE|COCADA|QUEIJADINHA|LEITE|AGUA/ },
  creme_leite: { busca: ['creme de leite'], exclui: /FRESCO|SEM LACTOSE|ZERO LACTOSE|CHANTILLY|VEGETAL|SPRAY|NATA/ },
  batata_palha: { busca: ['batata palha'], exclui: /CHIPS|ONDULADA|RUFFLES|FRITAS|PRINGLES/ },
  pasta_amendoim: { busca: ['pasta de amendoim'], exclui: /CHOCOLATE|AVELA|COOKIE|DOCE|WHEY|PROTEIN|CACAU|BRIGADEIRO|MORANGO|BISCOITO/ },
  achocolatado: { busca: ['achocolatado em pó'], exclui: /LIQUIDO|PRONTO|BEBIDA|CAIXINHA|ZERO|DIET|LIGHT|CAPSULA|200ML|TODDYNHO/ },
  cafe: { busca: ['café em pó'], exclui: /GRAO|DESCAFEIN|CAPPUCC|DRIP|SACHE|LATTE|SOLUVEL|COFFEE MIX|CAPSULA/ },
  milho_pipoca: { busca: ['milho de pipoca'], exclui: /MICRO|PRONTA|DOCE|CARAMEL|MANTEIGA|BACON|SABOR/ },
  caldo_galinha: { busca: ['caldo de galinha'], exclui: /\bPO\b|EM PO|LIQUID|PRONTO|SACHE|\bGEL\b|ZERO|SOPA|CREME|CASEIRO/ },
  fermento: { busca: ['fermento químico em pó'], exclui: /BIOLOG|FRESCO|SECO|\bPAO\b/ },
  // Temperos
  colorau: { busca: ['colorau'] },
  oregano: { busca: ['orégano'], exclui: /AZEITE|MOLHO/ },
  cominho: { busca: ['cominho'] },
  pimenta_reino: { busca: ['pimenta do reino'], exclui: /GRAO|BRANCA|ROSA|MOINHO|MOEDOR|SPRAY|MOLHO/ },
  canela: { busca: ['canela em pó'], exclui: /CASCA|\bPAU\b|RAMA|ACUCAR|MOLHO|\bCHA\b|BALA|CHICLETE/ },
  paprica: { busca: ['páprica defumada'] },
  curry: { busca: ['curry'], exclui: /MOLHO|PASTA|PRONT|SACHE|FRANGO|AO CURRY|PIPOCA|BATATA/ },
  // Padaria
  pao_frances: { busca: ['pão francês'], exclui: /INTEGRAL|MULTIGRAO|CONGELAD|PRE.?ASSAD|BAGUETE|QUEIJO|RECHEAD|MINI|BISNAG|DOCE|LEITE/ },
  pao_forma: { busca: ['pão de forma'], gPorUn: 25, exclui: /INTEGRAL|SEM GLUTEN|ZERO|LIGHT|AUSTRALIAN|BRIOCHE|GRAOS|CASTANHA|SEM CASCA|HOT DOG|HAMBURG|BISNAG|TORRAD|LEITE|DOCE|PROTEIN|LOW CARB|KETO/ },
  pao_hamburguer: { busca: ['pão de hambúrguer'], gPorUn: 50, exclui: /BRIOCHE|AUSTRALIAN|INTEGRAL|SEM GLUTEN|MINI|PRETZEL|BATATA|CARVAO|LOW CARB/ },
  tortilha: { busca: ['rap10', 'tortilha'], gPorUn: 55, exclui: /INTEGRAL|CHIPS|NACHO|DORITOS|SNACK|SEM GLUTEN|MINI|LOW CARB|ESPINAFRE|TOMATE|BETERRABA/ },
  // Frios, laticínios e ovos
  ovos: { busca: ['ovos'], exclui: /LIQUID|EM PO|DESIDRAT|CAIPIRA|OMEGA|COZID|CONSERVA|CODORNA|PASCOA|CHOCOLATE/ },
  leite: { busca: ['leite integral'], inclui: /INTEGRAL/, exclui: /LACTOSE|\bA2\b|CONDENS|FERMENT|ACHOCOL|EM PO|\bPO\b|CABRA|VEGETAL|AVEIA|AMENDOA|SOJA|COCO|SEMI|DESNAT|CREME|DOCE|COMPOSTO|FORMULA|CHOCOLATE|CAFE|BEBIDA|PROTEIN/ },
  manteiga: { busca: ['manteiga'], exclui: /GHEE|GARRAFA|AROMA|SABOR|MARGARINA|COMPOSTA|LIGHT|BISC|PIPOCA|CACAU|AMENDOIM|VEGETAL|TEMPERADA|ALHO|ERVAS/ },
  margarina: { busca: ['margarina'], exclui: /LIGHT|ZERO|BISC|BOLO|FOLHADO/ },
  requeijao: { busca: ['requeijão cremoso'], exclui: /LIGHT|ZERO|LACTOSE|VEGAN|CHEDDAR|SABOR|PIZZA|CULINARI|BISNAGA|ERVAS|ALHO|CALABRESA|BACON|AMIDO|GORGONZOLA|PROVOLONE/ },
  mussarela: { busca: ['queijo mussarela fatiado'], exclui: /LACTOSE|LIGHT|BUFALA|PALITO|BOLINHA|NOZINHO|RALAD|DEFUMAD|TEMPERAD|CONGEL|PAO DE QUEIJO|EMPANAD|BISNAG|CREMOS|VEGAN/ },
  queijo_minas: { busca: ['queijo minas frescal'], exclui: /LIGHT|LACTOSE|PADRAO|MEIA CURA|CURAD|RALAD|DOCE DE LEITE|GOIABADA|PAO DE QUEIJO/ },
  ricota: { busca: ['ricota'], exclui: /TEMPERAD|DEFUMAD|ERVAS|TORTA|PANQUECA|LASANHA|CANELONE|RONDELLI|LACTOSE/ },
  parmesao: { busca: ['queijo parmesão ralado'], inclui: /RALAD/, exclui: /LACTOSE|LIGHT|PALITO|SNACK|BISC|FATIAD|\bPECA\b|CUBO/ },
  iogurte: { busca: ['iogurte natural'], inclui: /NATURAL/, exclui: /LACTOSE|GREGO|MORANGO|COCO|\bMEL\b|FRUTA|AMEIXA|BAUNILHA|CHOCOLATE|POLPA|VEGETAL|PROTEIN|BEBIDA|LIQUID|KEFIR|SKYR|PETIT|GRANOLA/ },
  presunto: { busca: ['presunto fatiado'], exclui: /PARMA|\bCRU\b|SERRANO|DEFUMAD|PERU|FRANGO|TENDER|APRESUNTADO|LIGHT|ZERO|MINI|SANDUICHE|PIZZA/ },
  massa_pastel: { busca: ['massa de pastel'], exclui: /MINI|FOLHAD|SALGADO|RECHEAD|CONGEL|DOCE|SEM GLUTEN|INTEGRAL|COQUETEL/ },
  // Açougue e peixaria
  peito_frango: { busca: ['filé de peito de frango'], exclui: /COM OSSO|EMPANAD|TEMPERAD|DEFUMAD|FATIAD|PERU|NUGGET|DESFIAD|COZID|PRONT|CAIPIRA|MARINAD|ESPETINHO|ESPETO|STEAK|HAMBURG|LINGUI|ALMONDEG|MILANESA/ },
  frango_coxa: { busca: ['coxa sobrecoxa frango'], exclui: /TEMPERAD|EMPANAD|DESOSSAD|ASSAD|DEFUMAD|PRONT|CAIPIRA|ESPETO|COXINHA|\bASA\b|MARINAD/ },
  asa_frango: { busca: ['coxinha da asa'], exclui: /TEMPERAD|EMPANAD|PRONT|ASSAD|DEFUMAD|ESPETO|BARBECUE|APIMENTAD|MARINAD|SALGADINHO/ },
  carne_moida: { busca: ['carne moída'], exclui: /SOJA|VEGETAL|PLANT|FRANGO|SUIN|PORCO|PERU|HAMBURG|ALMONDEG|KIBE|QUIBE|TEMPERAD|PRONT|LINGUI|CORDEIRO|MISTA|FUTURO/ },
  acem: { busca: ['acém'], exclui: /MOID|TEMPERAD|PRONT/ },
  bife: { busca: ['coxão mole', 'patinho'], exclui: /MOID|TEMPERAD|EMPANAD|MILANESA|ROLE|PRONT|HAMBURG|FRANGO|SUIN|PORCO|PERU|PEIXE|FIGADO|STROGONOFF|ISCA|ESPETO/ },
  costela: { busca: ['costela bovina'], exclui: /TEMPERAD|ASSAD|PRONT|DESFIAD|COZID|CROCANTE|BURGER|HAMBURG/ },
  figado: { busca: ['fígado bovino'], exclui: /PATE|SUIN|ACEBOLAD|TEMPERAD/ },
  carne_seca: { busca: ['carne seca'], exclui: /PRONT|COZID|TEMPERAD|SNACK|PETISCO|PACOCA|ESCONDIDINHO|FAROFA|SALGADO/ },
  linguica: { busca: ['linguiça toscana'], exclui: /FRANGO|DEFUMAD|APIMENTAD|CUIABANA|BLUMENAU|PORTUGUES|PAIO|MISTA|COZID|PRONT|VEGETAL|CORDEIRO|BOVINA|QUEIJO|BACON|ERVAS|LIGHT|COQUETEL|MINI/ },
  calabresa: { busca: ['linguiça calabresa'], exclui: /ACEBOLAD|PRONT|FRANGO|PERU|LIGHT|MINI|COQUETEL|PIZZA|SALAME|VEGETAL|DESFIAD|MOID/ },
  bisteca: { busca: ['bisteca suína'], exclui: /TEMPERAD|DEFUMAD|BOVIN|PRONT|MARINAD|BARBECUE|ACEBOLAD/ },
  lombo: { busca: ['lombo suíno'], exclui: /TEMPERAD|RECHEAD|ASSAD|PRONT|MARINAD|BACON|PRESUNT|BARBECUE|CROCANTE/ },
  bacon: { busca: ['bacon'], exclui: /PELE|TORRESMO|CROCANTE|SNACK|FAROFA|MAIONESE|CREME|TEMPERO|PIPOCA|HAMBURG|LINGUI|SALAME|PETISCO|FRANGO|PERU|VEGETAL|DESIDRATAD|EM PO/ },
  salsicha: { busca: ['salsicha'], exclui: /VEGETAL|VEGAN|LATA|CONSERVA|COQUETEL|MINI|PRONT|EMPANAD|VIENA|BOCK|BRATWURST|WURST|ESCONDIDINHO|CACHORRO/ },
  tilapia: { busca: ['filé de tilápia'], exclui: /EMPANAD|TEMPERAD|DEFUMAD|PRONT|MILANESA|CROCANTE|INTEIRA|AO MOLHO|HAMBURG|NUGGET|ESPETO/ },
  merluza: { busca: ['filé de merluza'], exclui: /EMPANAD|TEMPERAD|PRONT|MILANESA|CROCANTE|INTEIRA|HAMBURG|NUGGET|STEAK|AO MOLHO/ },
  camarao: { busca: ['camarão descascado', 'camarão'], exclui: /INTEIRO|CASCA|SECO|DEFUMAD|SALGAD|BOBO|MOQUECA|STROGONOFF|RISOTO|EMPANAD|TEMPERAD|PRONT|SNACK|CHIPS|SABOR|MOLHO|ESPETINHO|PASTEL|COXINHA|ESCONDIDINHO|CREME|SOPA|CALDO/ },
  marisco: { busca: ['marisco', 'mexilhão'], exclui: /CONCHA|ESCABECHE|LATA|CONSERVA|EMPANAD|TEMPERAD|PRONT|MOLHO|VINAGRETE/ },
  // Hortifrúti
  banana: { busca: ['banana prata', 'banana caturra', 'banana branca'], inclui: /PRATA|BRANCA|CATURRA|NANICA/, exclui: /PASSA|CHIPS|DOCE|BOLO|DESIDRAT|TERRA|\bMACA\b|OURO|FIGO|MARMELADA|CUCA|\bCHA\b|FARINHA|SORVETE|IOGURTE|VITAMINA|BEBIDA|SHAKE|BARRA|GELEIA|MUFFIN|\bPAO\b|TORTA|CONGELAD/ },
  maca: { busca: ['maçã gala', 'maçã fuji'], exclui: /SUCO|DOCE|CHIPS|DESIDRAT|VINAGRE|VERDE|GRANNY|CIDRA|GELEIA|CANELA|BOLO|TORTA|COMPOTA|NECTAR|\bCHA\b|PURE|BARRA|SNACK/ },
  mamao: { busca: ['mamão papaia', 'mamão formosa'], exclui: /SUCO|DOCE|CRISTALIZ|DESIDRAT|POLPA|GELEIA|VERDE|CORTADO|PEDACOS/ },
  laranja: { busca: ['laranja pera', 'laranja'], exclui: /KINKAN|CASCA|CRISTALIZ|DESIDRAT|POLPA|SORVETE|ESSENCIA|AROMA|SABOR/ },
  abacate: { busca: ['abacate'], exclui: /AVOCADO|HASS|OLEO|AZEITE|CREME|GUACAMOLE|POLPA|SORVETE/ },
  limao: { busca: ['limão taiti'], exclui: /SICILIANO|CRAVO|SUCO|TEMPERO|CASCA|RASPAS|ESSENCIA|AROMA|SABOR|PIMENTA|LIMONADA|DOCE|BALA|TORTA|AZEITE|\bSAL\b|\bCHA\b|MOLHO/ },
  tomate: { busca: ['tomate'], exclui: /CEREJA|GRAPE|SWEET|MINI|CATCHUP|KETCHUP|LATA|SUCO|DESIDRAT|CONFIT|GELEIA|CHERRY|PEDAC|EM CUBOS|TRITURAD/ },
  cebola: { busca: ['cebola'], exclui: /ROXA|CONSERVA|FRITA|DESIDRAT|EM PO|CREME|SOPA|PEROLA|ANE[LI]|EMPANAD|CARAMELIZ|MOLHO|TEMPERO|CHIPS|BATATA|MINI/ },
  alho: { busca: ['alho'], gPorUn: 5, exclui: /PASTA|TRITURAD|FRITO|FRITA|EM PO|DESIDRAT|NEGRO|CONSERVA|TEMPERO|PICADO|GRANULAD|FLOCOS|\bSAL\b|CREME|DESCASCAD|OLEO|AZEITE|\bPAO\b|MAIONESE|CHIPS/ },
  batata: { busca: ['batata inglesa', 'batata lavada'], exclui: /DOCE|PALHA|CHIPS|FRITA|CONGEL|PRE.?FRIT|SORRISO|BAROA|SALSA|YACON|ROSTI|NOISETTE|SMILE|CANOA|ONDULAD|PRINGLES|RUFFLES|CRISPY|PALITO|PURE|FLOCOS|SALGADINHO|CHEDDAR|BACON|BABY|BOLINHA|MINI|RECHEAD|ASSAD|SNACK/ },
  batata_doce: { busca: ['batata doce'], exclui: /CHIPS|PALHA|FRITA|CONGEL|PURE|FARINHA|DOCE DE|SNACK|PALITO|DESIDRAT|BARRA|\bPAO\b|NHOQUE/ },
  cenoura: { busca: ['cenoura'], exclui: /BABY|RALADA|PALITO|CONGEL|SUCO|BOLO|DESIDRAT|CHIPS|CREME|PURE|SOPA|CORTADA|MINI|SALADA/ },
  abobrinha: { busca: ['abobrinha italiana', 'abobrinha'], exclui: /MINI|BABY|CONSERVA|RALAD|CORTAD|ESPAGUETE|SPAGHETTI|NOODLE|CONGEL|CHIPS|SOPA|CREME|RECHEAD|GRELHAD/ },
  chuchu: { busca: ['chuchu'], exclui: /CORTAD|CONGEL|CONSERVA|DOCE/ },
  berinjela: { busca: ['berinjela'], exclui: /CONSERVA|ANTEPASTO|PASTA|CHIPS|DESIDRAT|EMPANAD|GRELHAD|CONGEL|CAPONATA|BABA|MINI|ROLL/ },
  beterraba: { busca: ['beterraba'], exclui: /CONSERVA|RALAD|COZID|VACUO|SUCO|CHIPS|EM PO|DESIDRAT|BABY|MINI|SOPA|CREME|BOLO|SALADA|CORTAD|PALITO/ },
  pepino: { busca: ['pepino'], exclui: /AGRIDOCE|PICLES|SALADA|MINI|BABY|CORTAD|IOGURTE|TZATZIKI|SUCO/ },
  quiabo: { busca: ['quiabo'], exclui: /CONGEL|CONSERVA|CORTAD|EMPANAD|CHIPS|PICLES/ },
  vagem: { busca: ['vagem'], exclui: /CONGEL|CONSERVA|CORTAD|SALADA|MISTURA|SELETA|FEIJAO/ },
  pimentao: { busca: ['pimentão verde'], inclui: /VERDE/, exclui: /VERMELH|AMAREL|CONSERVA|EM PO|PASTA|MOLHO|RECHEAD|CORTAD|CONGEL|DESIDRAT|ASSADO|TRICOLOR|\bMIX\b|COLORIDO|MINI|BABY|BIQUINHO/ },
  brocolis: { busca: ['brócolis'], gPorUn: 450, exclui: /CONGEL|CORTAD|FLORETE|CREME|SOPA|SUFLE|EMPANAD|TORTA|ARROZ|COUVE.?FLOR|ROMANESCO|\bMIX\b|SELETA|BABY/ },
  repolho: { busca: ['repolho verde', 'repolho'], gPorUn: 1000, exclui: /ROXO|CONSERVA|CORTAD|SALADA|CHUCRUTE|RALAD|MINI|BRUXELAS|COLESLAW|FATIAD|\bMIX\b/ },
  alface: { busca: ['alface'], gPorUn: 350, exclui: /\bMIX\b|SALADA|BABY|MINI|ROXA|FRISEE|PRONTA|HIGIENIZAD|BANDEJA|LAVAD|RUCULA|AGRIAO|ESPINAFRE/ },
  couve: { busca: ['couve manteiga', 'couve'], gPorUn: 250, exclui: /CORTAD|FATIAD|PICAD|HIGIENIZAD|CONGEL|KALE|CHIPS|BRUXELAS|ROXA|CHINES|TOSCANA|REFOGAD|PRONT|SUCO/ },
  espinafre: { busca: ['espinafre'], gPorUn: 300, exclui: /CONGEL|BABY|MASSA|PANQUECA|CREME|SUFLE|TORTA|RECHEAD|NHOQUE|LASANHA|SALADA|\bMIX\b|SUCO|DESIDRAT|EM PO/ },
  cheiro_verde: { busca: ['cheiro verde'], gPorUn: 100, exclui: /DESIDRAT|FLOCOS|EM PO|SECO|CONGEL|TEMPERO|\bSAL\b|PASTA|MOLHO|MANTEIGA|AZEITE|OLEO/ },
  aipim: { busca: ['aipim', 'mandioca'], exclui: /FRITA|CHIPS|PALITO|NHOQUE|\bPAO\b|BOLO|ESCONDIDINHO|PURE|FARINHA|POLVILHO|GOMA|TAPIOCA|BISC|CROQUETE|SALGADINHO|PALHA|DOCE|CREME|SOPA|CALDO/ },
  abobora: { busca: ['abóbora cabotiá', 'abóbora'], exclui: /DOCE|PURE|CREME|SOPA|SEMENTE|\bPAO\b|BOLO|NHOQUE|CHIPS|MINI|BABY|ITALIANA|DECORATIV/ },
  // Congelados
  pao_queijo: { busca: ['pão de queijo'], semPeso: true, exclui: /RECHEAD|PALITO|BISCOITO|MISTURA|FARINHA|POLVILHO|LACTOSE|ZERO|VEGAN|FRIGIDEIRA|CHAPA|ASSAD/ },
  seleta: { busca: ['seleta de legumes'], exclui: /LATA|CONSERVA|DRENAD|SOPA|CREME|RISOTO|ARROZ|MACARRAO/ },
};
