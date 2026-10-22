// Modos de preparo por aparelho. A receita aponta para um método e o app mostra
// o texto do aparelho que a pessoa tem (na ordem de preferência).
// {item} é preenchido pela receita.
import type { Metodo } from '../tipos';

export const METODOS: Record<string, Metodo> = {
  arroz: {
    ordem: ['arroz_eletrica', 'fogao', 'pressao_eletrica', 'microondas'],
    v: {
      arroz_eletrica: 'Lave o arroz e cozinhe na panela elétrica com a água indicada (em geral 1 xícara de arroz para 1½ de água), um fio de óleo e sal.',
      fogao: 'Refogue o alho no óleo, junte o arroz e mexa por 1 min. Acrescente 2 partes de água quente para 1 de arroz e sal. Cozinhe em fogo baixo, semitampado, por 15–18 min, até secar.',
      pressao_eletrica: 'Na função dourar, refogue o alho no óleo, junte o arroz, água na proporção de 1 para 1½ e sal. Programe 6 min de pressão e espere a pressão sair sozinha.',
      microondas: 'Numa tigela grande, misture o arroz, 2 partes de água, um fio de óleo e sal. Leve por 10 min na potência alta e mais 6–8 min na média. Descanse 5 min tampado.',
    },
  },
  feijao: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    dica: 'Cozinhe 500 g de uma vez e guarde em porções: 5 dias na geladeira ou 3 meses no congelador.',
    v: {
      pressao: 'Deixe o feijão de molho por 8 h (ou pelo menos 4 h) e escorra. Cozinhe na panela de pressão com 3 partes de água por 25–30 min depois que pegar pressão. Refogue alho e cebola no óleo, junte ao feijão com sal e deixe ferver mais 10 min.',
      pressao_eletrica: 'Deixe o feijão de molho por 8 h e escorra. Cozinhe na panela de pressão elétrica com 3 partes de água por 35 min (função feijão). Depois refogue alho e cebola, junte e deixe 10 min na função dourar.',
      fogao: 'Deixe o feijão de molho por 8 h e escorra. Cozinhe numa panela comum com bastante água, tampado, por 1h30 a 2h, completando a água quando precisar. Tempere com alho e cebola refogados e sal.',
    },
  },
  carne_moida: {
    ordem: ['fogao', 'pressao_eletrica', 'microondas'],
    v: {
      fogao: 'Refogue a cebola e o alho no óleo, junte a carne moída e cozinhe em fogo alto por 8–10 min, mexendo até soltar e dourar. Tempere com sal e colorau.',
      pressao_eletrica: 'Na função dourar, refogue cebola e alho, junte a carne e mexa por 8–10 min até dourar. Tempere com sal e colorau.',
      microondas: 'Misture a carne com a cebola, o alho e sal numa tigela. Leve em etapas de 2 min, mexendo entre elas, por 7–9 min no total, até não ficar rosada.',
    },
  },
  molho_carne: {
    ordem: ['fogao', 'pressao_eletrica', 'microondas'],
    v: {
      fogao: 'Refogue cebola e alho no óleo, junte a carne moída e doure por 8 min. Acrescente o molho de tomate e ½ xícara de água e cozinhe em fogo baixo por 10 min.',
      pressao_eletrica: 'Na função dourar, refogue cebola, alho e a carne por 8 min. Junte o molho e ½ xícara de água e deixe apurar mais 10 min.',
      microondas: 'Cozinhe a carne com cebola e alho no micro-ondas em etapas de 2 min (7–9 min no total), mexendo. Junte o molho e aqueça mais 3 min.',
    },
  },
  cozinhar_junto: {
    ordem: ['fogao', 'pressao_eletrica', 'microondas'],
    v: {
      fogao: 'Junte {item}, tampe e cozinhe em fogo baixo por 12–15 min, até ficar macio.',
      pressao_eletrica: 'Junte {item} e programe 5 min de pressão.',
      microondas: 'Junte {item}, tampe e aqueça por 6–8 min, mexendo na metade.',
    },
  },
  molho: {
    ordem: ['fogao', 'microondas', 'pressao_eletrica'],
    v: {
      fogao: 'Junte {item} e deixe apurar em fogo baixo por 5–8 min, mexendo de vez em quando.',
      microondas: 'Junte {item}, tampe e aqueça por 3–4 min, mexendo na metade.',
      pressao_eletrica: 'Junte {item} e deixe apurar na função dourar por 5 min.',
    },
  },
  frango_grelhado: {
    ordem: ['fogao', 'airfryer', 'sanduicheira', 'forno'],
    v: {
      fogao: 'Tempere o filé com sal, alho e limão. Grelhe numa frigideira untada e bem quente por 4–5 min de cada lado, até não ficar rosado por dentro.',
      airfryer: 'Tempere o filé com sal, alho e limão e leve à air fryer a 200 °C por 14–18 min, virando na metade.',
      sanduicheira: 'Tempere o filé com sal, alho e limão e grelhe na sanduicheira fechada por 7–9 min.',
      forno: 'Tempere o filé com sal, alho e limão e asse numa forma untada a 200 °C por 20–25 min.',
    },
  },
  frango_cubos: {
    ordem: ['fogao', 'airfryer', 'forno'],
    v: {
      fogao: 'Doure o frango em cubos numa frigideira com óleo em fogo alto por 8–10 min, mexendo, até ficar dourado por fora e cozido por dentro.',
      airfryer: 'Leve o frango em cubos temperado à air fryer a 200 °C por 12–15 min, mexendo na metade.',
      forno: 'Espalhe o frango em cubos numa assadeira untada e asse a 220 °C por 18–20 min.',
    },
  },
  frango_desfiado: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Cozinhe o peito de frango na panela de pressão com água, sal e alho por 15 min depois que pegar pressão. Escorra (guarde o caldo) e desfie com dois garfos.',
      pressao_eletrica: 'Coloque o frango com água, sal e alho na panela de pressão elétrica e programe 15 min. Escorra e desfie com dois garfos.',
      fogao: 'Cozinhe o peito de frango numa panela com água, sal e alho por 25–30 min. Escorra e desfie com dois garfos.',
    },
  },
  frango_assado: {
    ordem: ['forno', 'airfryer', 'pressao', 'pressao_eletrica', 'fogao'],
    v: {
      forno: 'Tempere o frango com sal, alho, limão e colorau. Asse numa assadeira com os legumes a 200 °C por 50–60 min (coberto com papel-alumínio nos primeiros 30 min).',
      airfryer: 'Tempere o frango e leve à air fryer a 190 °C por 25–30 min, virando na metade. Faça os legumes em seguida, por 15–20 min a 200 °C.',
      pressao: 'Doure o frango temperado na própria panela de pressão, junte os legumes e ½ xícara de água e cozinhe por 15 min depois que pegar pressão.',
      pressao_eletrica: 'Doure o frango temperado na função dourar, junte os legumes e ½ xícara de água e programe 15 min de pressão.',
      fogao: 'Doure o frango temperado numa panela, junte os legumes e 1 xícara de água, tampe e cozinhe em fogo baixo por 35–40 min.',
    },
  },
  ensopado: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Doure o frango na panela de pressão com óleo, cebola e alho. Junte o tomate, a batata, o colorau e 1 xícara de água e cozinhe por 15 min depois que pegar pressão.',
      pressao_eletrica: 'Doure o frango com cebola e alho (função dourar), junte o tomate, a batata, o colorau e 1 xícara de água e programe 15 min.',
      fogao: 'Doure o frango numa panela com cebola e alho, junte o tomate, a batata, o colorau e 2 xícaras de água. Tampe e cozinhe em fogo baixo por 35–40 min.',
    },
  },
  carne_panela: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Doure a carne em cubos na panela de pressão com óleo, junte cebola, alho, tomate e água até cobrir. Cozinhe por 35–40 min depois que pegar pressão. Abra, junte os legumes e cozinhe mais 8 min na pressão.',
      pressao_eletrica: 'Doure a carne na função dourar, junte cebola, alho, tomate e água até cobrir e programe 40 min. Junte os legumes e programe mais 8 min.',
      fogao: 'Doure a carne numa panela com óleo, junte cebola, alho, tomate e água até cobrir. Tampe e cozinhe em fogo baixo por cerca de 2 h, completando a água. Junte os legumes nos últimos 25 min.',
    },
  },
  bife: {
    ordem: ['fogao', 'sanduicheira', 'airfryer'],
    v: {
      fogao: 'Tempere os bifes com sal e alho. Frite numa frigideira bem quente com um fio de óleo, 2–3 min de cada lado.',
      sanduicheira: 'Tempere os bifes com sal e alho e grelhe na sanduicheira fechada por 4–5 min.',
      airfryer: 'Tempere os bifes com sal e alho e leve à air fryer a 200 °C por 8–10 min, virando na metade.',
    },
  },
  linguica: {
    ordem: ['fogao', 'airfryer', 'forno', 'sanduicheira'],
    v: {
      fogao: 'Coloque a linguiça na frigideira com ½ xícara de água e cozinhe tampado por 10 min. Destampe e doure por mais 8–10 min, virando.',
      airfryer: 'Fure a linguiça com um garfo e leve à air fryer a 200 °C por 15–18 min, virando na metade.',
      forno: 'Asse a linguiça furada numa assadeira a 200 °C por 30–35 min, virando na metade.',
      sanduicheira: 'Corte a linguiça ao meio no comprimento e grelhe na sanduicheira por 10–12 min.',
    },
  },
  calabresa_acebolada: {
    ordem: ['fogao', 'airfryer'],
    v: {
      fogao: 'Frite a calabresa em rodelas na frigideira por 5 min, junte a cebola em rodelas e refogue mais 4–5 min.',
      airfryer: 'Leve a calabresa e a cebola em rodelas à air fryer a 200 °C por 12–15 min, mexendo na metade.',
    },
  },
  bisteca: {
    ordem: ['fogao', 'airfryer', 'forno', 'sanduicheira'],
    v: {
      fogao: 'Tempere a bisteca com sal, alho e limão. Frite numa frigideira com óleo em fogo médio, 5–6 min de cada lado.',
      airfryer: 'Tempere a bisteca com sal, alho e limão e leve à air fryer a 200 °C por 15–18 min, virando na metade.',
      forno: 'Tempere a bisteca e asse a 220 °C por 25–30 min, virando na metade.',
      sanduicheira: 'Tempere a bisteca e grelhe na sanduicheira fechada por 8–10 min.',
    },
  },
  hamburguer: {
    ordem: ['fogao', 'sanduicheira', 'airfryer', 'forno'],
    v: {
      fogao: 'Modele a carne em discos de 1,5 cm, tempere com sal e pimenta e frite numa frigideira bem quente, 4 min de cada lado.',
      sanduicheira: 'Modele e tempere os hambúrgueres e grelhe na sanduicheira fechada por 5–6 min.',
      airfryer: 'Modele e tempere os hambúrgueres e leve à air fryer a 200 °C por 10–12 min, virando na metade.',
      forno: 'Modele e tempere os hambúrgueres e asse a 220 °C por 15 min, virando na metade.',
    },
  },
  salsicha: {
    ordem: ['fogao', 'microondas', 'airfryer'],
    v: {
      fogao: 'Cozinhe as salsichas em água fervente por 5 min.',
      microondas: 'Coloque as salsichas num prato fundo com um pouco de água, tampe e aqueça por 2 min.',
      airfryer: 'Leve as salsichas à air fryer a 180 °C por 8 min.',
    },
  },
  peixe_grelhado: {
    ordem: ['fogao', 'airfryer', 'forno'],
    v: {
      fogao: 'Tempere {item} com sal e limão. Grelhe numa frigideira untada em fogo médio, 3–4 min de cada lado.',
      airfryer: 'Tempere {item} com sal e limão e leve à air fryer a 200 °C por 10–12 min (congelado: 15–18 min).',
      forno: 'Tempere {item} com sal e limão e asse numa forma untada a 200 °C por 15–20 min.',
    },
  },
  peixe_molho: {
    ordem: ['fogao', 'forno'],
    v: {
      fogao: 'Numa panela, faça camadas de cebola, tomate e pimentão em rodelas e o peixe temperado com sal e limão. Regue com o leite de coco e um fio de óleo, tampe e cozinhe em fogo baixo por 15–20 min, sem mexer.',
      forno: 'Numa travessa, faça camadas de legumes e do peixe temperado com sal e limão. Regue com o leite de coco, cubra com papel-alumínio e asse a 200 °C por 25–30 min.',
    },
  },
  camarao: {
    ordem: ['fogao', 'airfryer'],
    v: {
      fogao: 'Doure bastante alho no óleo, junte o camarão e salteie em fogo alto por 3–4 min, só até ficar rosado. Tempere com sal e limão.',
      airfryer: 'Tempere o camarão com alho, sal e um fio de óleo e leve à air fryer a 200 °C por 6–8 min.',
    },
  },
  empanar: {
    ordem: ['airfryer', 'forno', 'fogao'],
    v: {
      airfryer: 'Passe {item} na farinha de trigo, no ovo batido e na farinha de mandioca. Borrife óleo e leve à air fryer a 200 °C por 12–15 min, virando na metade.',
      forno: 'Empane {item} (farinha de trigo, ovo batido e farinha de mandioca) e asse numa assadeira untada a 220 °C por 20–25 min, virando na metade.',
      fogao: 'Empane {item} (farinha de trigo, ovo batido e farinha de mandioca) e frite em óleo quente, 3–4 min de cada lado. Escorra no papel-toalha.',
    },
  },
  ovo_frito: {
    ordem: ['fogao', 'airfryer', 'microondas'],
    v: {
      fogao: 'Frite o ovo numa frigideira com um fio de óleo em fogo médio por 2–3 min.',
      airfryer: 'Quebre o ovo numa forminha untada e leve à air fryer a 180 °C por 5–7 min.',
      microondas: 'Quebre o ovo num prato untado, fure a gema com um garfo, cubra e aqueça por 40–60 s.',
    },
  },
  ovo_mexido: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Bata os ovos com sal e mexa numa frigideira com manteiga ou óleo em fogo baixo por 2–3 min, até ficarem cremosos.',
      microondas: 'Bata os ovos com sal numa caneca untada. Aqueça 40 s, mexa e aqueça mais 30–40 s.',
    },
  },
  ovo_cozido: {
    ordem: ['fogao', 'pressao_eletrica', 'airfryer'],
    v: {
      fogao: 'Coloque os ovos em água fervente e cozinhe por 10 min. Passe para água fria e descasque.',
      pressao_eletrica: 'Coloque os ovos na grade com 1 xícara de água e programe 5 min. Passe para água fria.',
      airfryer: 'Leve os ovos à air fryer a 150 °C por 15 min e passe para água fria.',
    },
  },
  omelete: {
    ordem: ['fogao', 'microondas', 'airfryer', 'forno'],
    v: {
      fogao: 'Bata os ovos com sal e os recheios. Despeje numa frigideira untada em fogo baixo, tampe e cozinhe por 4–5 min. Dobre ao meio.',
      microondas: 'Bata os ovos com os recheios num prato fundo untado. Aqueça 1 min, mexa e aqueça mais 1–1½ min.',
      airfryer: 'Despeje a mistura numa forminha untada e leve à air fryer a 170 °C por 10–12 min.',
      forno: 'Despeje a mistura numa forma pequena untada e asse a 180 °C por 15–20 min.',
    },
  },
  batata_cozida: {
    ordem: ['pressao', 'pressao_eletrica', 'microondas', 'fogao'],
    v: {
      pressao: 'Cozinhe {item} na panela de pressão com água e sal por 5–8 min depois que pegar pressão.',
      pressao_eletrica: 'Cozinhe {item} com água e sal na panela de pressão elétrica por 8 min.',
      microondas: 'Coloque {item} numa tigela com 3 colheres de água, tampe e aqueça por 8–10 min, até ficar macio.',
      fogao: 'Cozinhe {item} numa panela com água e sal por 20–25 min, até ficar macio.',
    },
  },
  aipim_cozido: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Cozinhe o aipim descascado na panela de pressão com água e sal por 15–20 min depois que pegar pressão, até ficar bem macio.',
      pressao_eletrica: 'Cozinhe o aipim descascado com água e sal na panela de pressão elétrica por 20 min.',
      fogao: 'Cozinhe o aipim descascado numa panela com água e sal por 35–45 min, até desmanchar com o garfo.',
    },
  },
  batata_assada: {
    ordem: ['airfryer', 'forno', 'fogao'],
    v: {
      airfryer: 'Tempere {item} em cubos com óleo, sal e orégano e leve à air fryer a 200 °C por 20–25 min, sacudindo o cesto 2 vezes.',
      forno: 'Tempere {item} em cubos com óleo, sal e orégano e asse a 220 °C por 35–40 min, virando na metade.',
      fogao: 'Cozinhe {item} em cubos numa frigideira tampada com óleo por 15 min, mexendo, e destampe para dourar.',
    },
  },
  legumes_refogados: {
    ordem: ['fogao', 'microondas', 'airfryer', 'forno'],
    v: {
      fogao: 'Refogue {item} no óleo com alho e sal em fogo médio por 6–8 min, até ficar macio.',
      microondas: 'Cozinhe {item} numa tigela tampada com 2 colheres de água por 4–6 min. Tempere com sal e um fio de óleo.',
      airfryer: 'Tempere {item} com óleo e sal e leve à air fryer a 200 °C por 10–12 min.',
      forno: 'Tempere {item} com óleo e sal e asse a 200 °C por 20–25 min.',
    },
  },
  couve_refogada: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Corte a couve em tiras bem finas. Refogue o alho no óleo e junte a couve por 2–3 min, só até murchar. Tempere com sal.',
      microondas: 'Coloque a couve em tiras finas com alho e um fio de óleo numa tigela tampada e aqueça por 2 min. Misture e tempere com sal.',
    },
  },
  vapor: {
    ordem: ['microondas', 'fogao', 'airfryer'],
    v: {
      microondas: 'Cozinhe {item} no vapor do micro-ondas: tigela tampada com 3 colheres de água, por 4–5 min.',
      fogao: 'Cozinhe {item} numa panela com um pouco de água fervente e sal, tampada, por 5–7 min.',
      airfryer: 'Tempere {item} com óleo e sal e leve à air fryer a 200 °C por 8–10 min.',
    },
  },
  macarrao: {
    ordem: ['fogao', 'pressao_eletrica', 'microondas'],
    v: {
      fogao: 'Cozinhe o macarrão em bastante água fervente com sal pelo tempo da embalagem (8–10 min). Escorra.',
      pressao_eletrica: 'Coloque o macarrão quebrado na panela elétrica, cubra com água e sal e programe 4 min de pressão, com liberação rápida.',
      microondas: 'Coloque o macarrão numa tigela grande, cubra com água (2 dedos acima) e sal. Aqueça pelo tempo da embalagem + 3 min, mexendo na metade. Escorra.',
    },
  },
  sopa: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Refogue cebola e alho no óleo na panela de pressão, junte {item} e água até cobrir com folga (cerca de 2 xícaras por porção). Cozinhe por 15 min depois que pegar pressão.',
      pressao_eletrica: 'Refogue cebola e alho na função dourar, junte {item} e cerca de 2 xícaras de água por porção. Programe 15 min.',
      fogao: 'Refogue cebola e alho no óleo numa panela, junte {item} e cerca de 2½ xícaras de água por porção. Cozinhe tampado em fogo baixo por 35–40 min.',
    },
  },
  bater: {
    ordem: ['liquidificador'],
    opcional: true,
    sem: 'Sem liquidificador, amasse bem com um garfo ou bata com um batedor de arame.',
    v: { liquidificador: 'Bata no liquidificador {item} por 1–2 min, até ficar liso.' },
  },
  vitamina: {
    ordem: ['liquidificador'],
    v: { liquidificador: 'Bata tudo no liquidificador por 1 min e sirva gelado.' },
  },
  polenta: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Dissolva o fubá em água fria (4 partes de água para 1 de fubá) com sal. Leve ao fogo mexendo sempre até engrossar e cozinhe em fogo baixo por 15–20 min, mexendo.',
      microondas: 'Misture o fubá com 4 partes de água e sal numa tigela grande. Aqueça em etapas de 2 min, mexendo entre elas, por 8–10 min, até engrossar.',
    },
  },
  cuscuz: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Hidrate o flocão com água e sal (½ xícara de água para cada xícara de flocão) por 10 min. Cozinhe na cuscuzeira, ou numa peneira tampada sobre panela com água fervente, por 10–12 min.',
      microondas: 'Hidrate o flocão com água e sal por 10 min. Coloque num prato fundo, cubra e aqueça por 3–4 min.',
    },
  },
  tapioca: {
    ordem: ['fogao'],
    v: { fogao: 'Peneire a goma numa frigideira antiaderente fria, formando um disco. Leve ao fogo médio por 1–2 min, até as bordas soltarem. Recheie, dobre ao meio e deixe mais 1 min.' },
  },
  crepioca: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Bata o ovo com a goma e uma pitada de sal. Despeje numa frigideira antiaderente untada em fogo médio e cozinhe 2 min de cada lado. Recheie e dobre.',
      microondas: 'Bata o ovo com a goma e sal num prato untado e aqueça por 1½–2 min. Recheie e dobre.',
    },
  },
  panqueca: {
    ordem: ['fogao'],
    v: { fogao: 'Bata a farinha, o leite, o ovo e uma pitada de sal até ficar liso. Despeje uma concha numa frigideira untada, espalhe e cozinhe 1 min de cada lado.' },
  },
  panqueca_banana: {
    ordem: ['fogao'],
    v: { fogao: 'Amasse a banana com o ovo e a aveia. Despeje porções numa frigideira untada em fogo baixo e doure 2 min de cada lado.' },
  },
  mingau: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Leve a aveia ao fogo com o leite e uma pitada de sal (e açúcar, se quiser), mexendo por 4–5 min, até engrossar.',
      microondas: 'Misture a aveia e o leite numa tigela grande e aqueça por 2–3 min, mexendo na metade.',
    },
  },
  cafe_leite: {
    ordem: ['microondas', 'fogao'],
    opcional: true,
    sem: 'Sirva o leite frio, se preferir.',
    v: {
      microondas: 'Passe o café e aqueça o leite no micro-ondas por 1–1½ min. Misture.',
      fogao: 'Passe o café e aqueça o leite numa leiteira. Misture.',
    },
  },
  pao_queijo: {
    ordem: ['airfryer', 'forno'],
    v: {
      airfryer: 'Coloque os pães de queijo congelados na air fryer, sem encostar uns nos outros, e asse a 180 °C por 15–18 min.',
      forno: 'Asse os pães de queijo congelados numa assadeira a 180 °C por 25–30 min, até dourar.',
    },
  },
  misto: {
    ordem: ['sanduicheira', 'fogao', 'airfryer', 'forno'],
    v: {
      sanduicheira: 'Monte o sanduíche e feche na sanduicheira por 3–4 min, até dourar.',
      fogao: 'Doure o sanduíche numa frigideira com um pouco de manteiga, 2 min de cada lado, apertando com uma espátula.',
      airfryer: 'Leve o sanduíche à air fryer a 180 °C por 5–6 min, virando na metade.',
      forno: 'Asse o sanduíche a 200 °C por 8–10 min, virando na metade.',
    },
  },
  tostar: {
    ordem: ['torradeira', 'sanduicheira', 'airfryer', 'fogao', 'forno'],
    opcional: true,
    sem: 'Sem aparelho para tostar, o pão pode ir assim mesmo.',
    v: {
      torradeira: 'Toste o pão na torradeira.',
      sanduicheira: 'Toste o pão na sanduicheira por 2–3 min.',
      airfryer: 'Toste o pão na air fryer a 180 °C por 3–4 min.',
      fogao: 'Toste o pão na frigideira ou chapa com um pouco de manteiga, 1–2 min de cada lado.',
      forno: 'Toste o pão no forno a 200 °C por 5–6 min.',
    },
  },
  farofa: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Derreta a manteiga numa frigideira, refogue a cebola, junte a farinha de mandioca e mexa em fogo baixo por 3–4 min, até tostar levemente. Tempere com sal.',
      microondas: 'Misture a farinha de mandioca com a manteiga derretida, a cebola picada e sal. Aqueça em etapas de 1 min, mexendo, por 3–4 min.',
    },
  },
  strogonoff: {
    ordem: ['fogao', 'pressao_eletrica'],
    v: {
      fogao: 'Doure {item} com cebola e alho no óleo. Junte o molho de tomate e cozinhe por 5 min. Desligue o fogo e misture o creme de leite, sem deixar ferver.',
      pressao_eletrica: 'Na função dourar, doure {item} com cebola e alho. Junte o molho de tomate por 5 min, desligue e misture o creme de leite.',
    },
  },
  arroz_junto: {
    ordem: ['fogao', 'pressao_eletrica'],
    v: {
      fogao: 'Doure {item} na panela com óleo, cebola, alho e colorau. Junte o arroz, refogue por 1 min e cubra com 2½ partes de água quente e sal. Cozinhe em fogo baixo, semitampado, por 18–20 min.',
      pressao_eletrica: 'Na função dourar, doure {item} com cebola, alho e colorau. Junte o arroz, água na proporção de 1 para 1½ e sal e programe 6 min de pressão.',
    },
  },
  yakisoba: {
    ordem: ['fogao'],
    v: { fogao: 'Numa frigideira grande ou wok, doure o frango em tiras, junte os legumes e salteie por 3–4 min. Acrescente o macarrão cozido e o shoyu e misture por 2 min.' },
  },
  gratinar: {
    ordem: ['forno', 'airfryer'],
    opcional: true,
    sem: 'Sem forno, tampe a panela ou frigideira por 2–3 min para o queijo derreter.',
    v: {
      forno: 'Leve ao forno a 200 °C por 15–20 min, até gratinar.',
      airfryer: 'Leve à air fryer a 180 °C por 8–10 min, até gratinar.',
    },
  },
  assar: {
    ordem: ['forno', 'airfryer'],
    v: {
      forno: 'Asse {item} a 200 °C por 25–30 min.',
      airfryer: 'Asse {item} na air fryer a 180 °C por 15–20 min.',
    },
  },
  assar_lasanha: {
    ordem: ['forno', 'airfryer'],
    v: {
      forno: 'Cubra com papel-alumínio e asse a 200 °C por 30 min. Retire o papel e deixe mais 10 min para gratinar.',
      airfryer: 'Monte numa forma que caiba na air fryer e asse a 170 °C por 25–30 min, coberta com papel-alumínio nos primeiros 15 min.',
    },
  },
  torta: {
    ordem: ['forno', 'airfryer'],
    v: {
      forno: 'Despeje metade da massa numa forma untada, espalhe o recheio, cubra com o resto da massa e asse a 200 °C por 35–40 min, até dourar.',
      airfryer: 'Monte a torta numa forma que caiba na air fryer (massa, recheio, massa) e asse a 170 °C por 25–30 min.',
    },
  },
  pipoca: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Aqueça o óleo numa panela com 3 grãos. Quando estourarem, junte o resto do milho, tampe e sacuda até os estouros diminuírem.',
      microondas: 'Coloque o milho com uma pitada de sal num saco de papel pardo dobrado 2 vezes e aqueça por 2–3 min, até os estouros ficarem espaçados.',
    },
  },
  bolo_caneca: {
    ordem: ['microondas'],
    v: { microondas: 'Misture tudo numa caneca grande untada, até ficar liso, e aqueça no micro-ondas por 1½–2 min.' },
  },
  // Métodos das receitas novas (out/2026).
  lentilha: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Lave a lentilha (não precisa de molho) e cozinhe na panela de pressão com 3 partes de água e sal por 6–8 min depois que pegar pressão.',
      pressao_eletrica: 'Lave a lentilha e cozinhe na panela de pressão elétrica com 3 partes de água e sal por 10 min.',
      fogao: 'Lave a lentilha e cozinhe numa panela com 3 partes de água e sal, tampada, por 20–25 min, até ficar macia sem desmanchar.',
    },
  },
  grao_bico: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    dica: 'Cozinhe o pacote todo e congele em porções: dura 3 meses no congelador.',
    v: {
      pressao: 'Deixe o grão-de-bico de molho por 8–12 h e escorra. Cozinhe na panela de pressão com 3 partes de água e sal por 25–30 min depois que pegar pressão.',
      pressao_eletrica: 'Deixe o grão-de-bico de molho por 8–12 h e escorra. Cozinhe com 3 partes de água e sal por 35 min (função feijão).',
      fogao: 'Deixe o grão-de-bico de molho por 8–12 h e escorra. Cozinhe numa panela com bastante água e sal, tampada, por 1h30 a 2h, até ficar macio.',
    },
  },
  risoto: {
    ordem: ['fogao', 'pressao_eletrica'],
    v: {
      fogao: 'Refogue a cebola e o alho no óleo, junte o arroz e mexa por 1 min. Acrescente {item}. Vá juntando água quente com o caldo dissolvido, 1 concha por vez, mexendo sempre, por 18–20 min, até o arroz ficar macio e cremoso.',
      pressao_eletrica: 'Na função dourar, refogue a cebola e o alho, junte o arroz por 1 min e acrescente {item}. Junte água quente com o caldo (2½ partes para 1 de arroz) e programe 5 min de pressão, com liberação rápida. Mexa bem.',
    },
  },
  frango_molho: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Tempere o frango com sal e alho e doure na panela de pressão com óleo e a cebola. Junte o tomate picado, o colorau e ½ xícara de água e cozinhe por 12 min depois que pegar pressão.',
      pressao_eletrica: 'Tempere o frango com sal e alho e doure na função dourar com a cebola. Junte o tomate picado, o colorau e ½ xícara de água e programe 12 min de pressão.',
      fogao: 'Tempere o frango com sal e alho e doure numa panela com óleo e a cebola. Junte o tomate picado, o colorau e 1 xícara de água, tampe e cozinhe em fogo baixo por 30–35 min, até ficar macio.',
    },
  },
  costela: {
    ordem: ['pressao', 'pressao_eletrica', 'forno', 'fogao'],
    v: {
      pressao: 'Tempere a costela com sal, alho e pimenta e doure os pedaços na própria panela de pressão com um fio de óleo. Junte a cebola, água até cobrir e cozinhe por 45–50 min depois que pegar pressão, até soltar do osso.',
      pressao_eletrica: 'Tempere a costela com sal, alho e pimenta e doure na função dourar. Junte a cebola, água até cobrir e programe 50 min de pressão.',
      forno: 'Tempere a costela com sal, alho e pimenta, embrulhe bem em papel-alumínio com a cebola e asse a 180 °C por 3 h. Abra o papel e doure por mais 20 min a 220 °C.',
      fogao: 'Tempere a costela com sal, alho e pimenta e doure numa panela grande com a cebola. Cubra com água, tampe e cozinhe em fogo baixo por cerca de 3 h, completando a água, até soltar do osso.',
    },
  },
  figado: {
    ordem: ['fogao', 'airfryer'],
    v: {
      fogao: 'Corte o fígado em tiras e tempere com sal, alho e limão. Frite em fogo alto com um fio de óleo por 3–4 min, mexendo, só até perder o rosado (cozinhar demais endurece).',
      airfryer: 'Corte o fígado em tiras, tempere com sal, alho e limão e leve à air fryer a 200 °C por 8–10 min, mexendo na metade.',
    },
  },
  lombo_assado: {
    ordem: ['forno', 'airfryer', 'pressao', 'pressao_eletrica'],
    v: {
      forno: 'Tempere o lombo com sal, alho, limão e pimenta (se puder, na véspera). Asse coberto com papel-alumínio a 200 °C por 50 min; retire o papel e doure por mais 20–25 min.',
      airfryer: 'Corte o lombo temperado (sal, alho, limão e pimenta) em medalhões de 3 cm e leve à air fryer a 180 °C por 25–30 min, virando na metade.',
      pressao: 'Tempere o lombo com sal, alho, limão e pimenta e doure na própria panela de pressão com um fio de óleo. Junte ½ xícara de água e cozinhe por 25 min depois que pegar pressão. Fatie e regue com o caldo.',
      pressao_eletrica: 'Tempere o lombo e doure na função dourar. Junte ½ xícara de água e programe 25 min de pressão. Fatie e regue com o caldo.',
    },
  },
  lombo_bifes: {
    ordem: ['fogao', 'sanduicheira', 'airfryer'],
    v: {
      fogao: 'Tempere os bifes de lombo com sal, alho e limão. Frite numa frigideira com um fio de óleo em fogo médio, 3–4 min de cada lado, até não ficarem rosados por dentro.',
      sanduicheira: 'Tempere os bifes de lombo com sal, alho e limão e grelhe na sanduicheira fechada por 6–7 min.',
      airfryer: 'Tempere os bifes de lombo com sal, alho e limão e leve à air fryer a 200 °C por 12–14 min, virando na metade.',
    },
  },
  asa_assada: {
    ordem: ['airfryer', 'forno', 'fogao'],
    v: {
      airfryer: 'Tempere a coxinha da asa com sal, alho, limão e páprica (se tiver). Leve à air fryer a 200 °C por 20–25 min, virando na metade, até dourar.',
      forno: 'Tempere a coxinha da asa com sal, alho, limão e páprica (se tiver) e asse numa assadeira a 220 °C por 40–45 min, virando na metade.',
      fogao: 'Tempere a coxinha da asa e coloque numa frigideira grande com um fio de óleo. Tampe e cozinhe em fogo médio por 15 min, virando; destampe e doure por mais 8–10 min.',
    },
  },
  almondegas: {
    ordem: ['fogao', 'airfryer', 'forno'],
    v: {
      fogao: 'Misture a carne moída com o ovo, a farinha, a cebola ralada, o alho e sal. Faça bolinhas de 3 cm e doure numa frigideira com óleo, virando, por 6–8 min.',
      airfryer: 'Misture a carne moída com o ovo, a farinha, a cebola ralada, o alho e sal. Faça bolinhas de 3 cm e leve à air fryer a 180 °C por 12–15 min, sacudindo na metade.',
      forno: 'Misture a carne moída com o ovo, a farinha, a cebola ralada, o alho e sal. Faça bolinhas de 3 cm e asse numa assadeira untada a 200 °C por 20 min.',
    },
  },
  bolo_carne: {
    ordem: ['forno', 'airfryer', 'microondas'],
    v: {
      forno: 'Misture a carne moída com o ovo, a farinha, a cebola ralada, o alho e sal. Aperte numa forma de bolo inglês untada, cubra com o molho e asse a 200 °C por 40–45 min.',
      airfryer: 'Misture a carne moída com o ovo, a farinha, a cebola ralada, o alho e sal. Aperte numa forma que caiba na air fryer, cubra com o molho e asse a 170 °C por 30–35 min.',
      microondas: 'Misture a carne moída com o ovo, a farinha, a cebola ralada, o alho e sal. Aperte numa travessa de vidro, cubra com o molho e aqueça por 12–14 min na potência alta. Descanse 5 min antes de cortar.',
    },
  },
  bolo: {
    ordem: ['forno', 'airfryer', 'microondas'],
    v: {
      forno: 'Despeje a massa numa forma untada e enfarinhada e asse a 180 °C por 35–40 min, até o palito sair limpo.',
      airfryer: 'Despeje a massa numa forma untada que caiba na air fryer e asse a 160 °C por 25–30 min, até o palito sair limpo.',
      microondas: 'Despeje a massa numa forma de vidro ou de silicone untada e aqueça por 6–8 min na potência alta. Deixe descansar 5 min.',
    },
  },
  cookies: {
    ordem: ['forno', 'airfryer'],
    v: {
      forno: 'Faça bolinhas, achate numa assadeira untada e asse a 180 °C por 15–18 min, até dourar as bordas.',
      airfryer: 'Faça bolinhas achatadas e asse na air fryer, sobre papel-manteiga, a 160 °C por 10–12 min.',
    },
  },
  pastel: {
    ordem: ['airfryer', 'fogao', 'forno'],
    v: {
      airfryer: 'Recheie os discos, feche e aperte as bordas com um garfo. Pincele óleo e asse na air fryer a 200 °C por 8–10 min, virando na metade.',
      fogao: 'Recheie os discos, feche e aperte as bordas com um garfo. Frite em óleo bem quente, 1–2 min de cada lado, até dourar e estufar. Escorra no papel-toalha.',
      forno: 'Recheie os discos, feche e aperte as bordas com um garfo. Pincele óleo e asse a 200 °C por 15–20 min, até dourar.',
    },
  },
  pizza_tortilha: {
    ordem: ['airfryer', 'forno', 'fogao'],
    v: {
      airfryer: 'Espalhe o molho na tortilha, cubra com o queijo e a cobertura e leve à air fryer a 180 °C por 5–7 min, até o queijo derreter.',
      forno: 'Espalhe o molho na tortilha, cubra com o queijo e a cobertura e asse a 220 °C por 8–10 min.',
      fogao: 'Espalhe o molho na tortilha, cubra com o queijo e a cobertura e leve a uma frigideira tampada em fogo baixo por 5–6 min, até o queijo derreter e a base ficar crocante.',
    },
  },
  polenta_frita: {
    ordem: ['airfryer', 'forno', 'fogao'],
    v: {
      airfryer: 'Corte a polenta firme e fria em palitos grossos, pincele óleo e leve à air fryer a 200 °C por 20–25 min, sem mexer nos primeiros 15 min.',
      forno: 'Corte a polenta firme e fria em palitos, arrume numa assadeira untada, pincele óleo e asse a 220 °C por 35–40 min, virando na metade.',
      fogao: 'Corte a polenta firme e fria em palitos e frite em óleo bem quente, aos poucos, por 4–5 min, até dourar. Escorra no papel-toalha.',
    },
  },
  batata_frita: {
    ordem: ['airfryer', 'forno', 'fogao'],
    v: {
      airfryer: 'Corte {item} em palitos, seque bem num pano, tempere com um fio de óleo e sal e leve à air fryer a 200 °C por 20–25 min, sacudindo o cesto 2 vezes.',
      forno: 'Corte {item} em palitos, seque bem, tempere com óleo e sal e asse espalhado numa assadeira a 220 °C por 35–40 min, virando na metade.',
      fogao: 'Corte {item} em palitos, seque bem e frite em óleo quente, aos poucos, por 6–8 min, até dourar. Escorra no papel-toalha e salgue.',
    },
  },
  carne_seca: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Escorra a carne seca dessalgada, cubra com água nova e cozinhe na panela de pressão por 20–25 min depois que pegar pressão. Escorra e desfie.',
      pressao_eletrica: 'Escorra a carne seca dessalgada, cubra com água nova e programe 25 min de pressão. Escorra e desfie.',
      fogao: 'Escorra a carne seca dessalgada, cubra com água nova e cozinhe tampado por 50–60 min, até ficar macia. Escorra e desfie.',
    },
  },
  bife_role: {
    ordem: ['pressao', 'pressao_eletrica', 'fogao'],
    v: {
      pressao: 'Doure os rolinhos na panela de pressão com um fio de óleo. Junte a cebola, o molho de tomate e 1 xícara de água e cozinhe por 20 min depois que pegar pressão.',
      pressao_eletrica: 'Doure os rolinhos na função dourar. Junte a cebola, o molho de tomate e 1 xícara de água e programe 20 min de pressão.',
      fogao: 'Doure os rolinhos numa panela com óleo. Junte a cebola, o molho de tomate e 2 xícaras de água, tampe e cozinhe em fogo baixo por 50–60 min, virando e completando a água.',
    },
  },
  peixe_ensopado: {
    ordem: ['fogao', 'pressao_eletrica'],
    v: {
      fogao: 'Refogue a cebola, o alho e o tomate no óleo, junte 2 xícaras de água e deixe ferver. Coloque {item} temperado com sal e limão, tampe e cozinhe em fogo baixo por 10–12 min, sem mexer. Guarde o caldo.',
      pressao_eletrica: 'Na função dourar, refogue a cebola, o alho e o tomate, junte 2 xícaras de água e deixe ferver. Coloque {item} temperado com sal e limão e cozinhe tampado por 10–12 min, sem pressão. Guarde o caldo.',
    },
  },
  pirao: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Leve 1 xícara do caldo ao fogo e junte a farinha de mandioca aos poucos, mexendo sem parar, por 3–4 min, até virar um creme grosso.',
      microondas: 'Numa tigela, misture a farinha de mandioca a 1 xícara do caldo quente. Aqueça 1 min, mexa e aqueça mais 1 min, até engrossar.',
    },
  },
  marisco: {
    ordem: ['fogao', 'microondas'],
    v: {
      fogao: 'Cozinhe o marisco numa panela tampada com ½ xícara de água por 3–4 min depois de ferver (o limpo congelado não precisa de mais). Escorra.',
      microondas: 'Coloque o marisco numa tigela tampada com 2 colheres de água e aqueça por 3–4 min, mexendo na metade. Escorra.',
    },
  },
  ovos_molho: {
    ordem: ['fogao', 'forno', 'microondas'],
    v: {
      fogao: 'Numa frigideira, refogue a cebola, o alho e o pimentão no óleo, junte o molho de tomate e deixe apurar 5 min. Abra espaços, quebre os ovos dentro, tampe e cozinhe por 6–8 min, até as claras firmarem.',
      forno: 'Misture a cebola, o alho e o pimentão picados ao molho de tomate numa travessa, quebre os ovos por cima e asse a 200 °C por 12–15 min.',
      microondas: 'Misture a cebola, o alho e o pimentão picados ao molho numa tigela e aqueça 3 min. Quebre os ovos por cima, fure as gemas com um garfo, cubra e aqueça por 1½–2 min.',
    },
  },
  bacon: {
    ordem: ['fogao', 'airfryer', 'microondas'],
    v: {
      fogao: 'Frite o bacon numa frigideira sem óleo, em fogo médio, por 5–6 min, até dourar. Escorra o excesso de gordura.',
      airfryer: 'Leve o bacon à air fryer a 180 °C por 8–10 min, mexendo na metade.',
      microondas: 'Espalhe o bacon num prato entre folhas de papel-toalha e aqueça por 2–3 min, até dourar.',
    },
  },
  muffin_ovo: {
    ordem: ['forno', 'airfryer', 'microondas'],
    v: {
      forno: 'Distribua a mistura em forminhas de muffin untadas (até ¾) e asse a 180 °C por 18–22 min.',
      airfryer: 'Distribua a mistura em forminhas de silicone e asse na air fryer a 160 °C por 12–15 min.',
      microondas: 'Distribua a mistura em xícaras untadas e aqueça cada uma por 1–1½ min.',
    },
  },
  chips: {
    ordem: ['airfryer', 'forno', 'microondas'],
    v: {
      airfryer: 'Corte {item} em lâminas bem finas, tempere com um fio de óleo e sal e leve à air fryer a 160 °C por 15–20 min, mexendo a cada 5 min, até secar.',
      forno: 'Corte {item} em lâminas bem finas, espalhe numa assadeira com papel-manteiga, pincele óleo e asse a 180 °C por 25–30 min, virando na metade.',
      microondas: 'Corte {item} em lâminas bem finas e arrume num prato com papel-manteiga, sem sobrepor. Aqueça por 4–6 min, até secar.',
    },
  },
  arroz_frito: {
    ordem: ['fogao'],
    v: { fogao: 'Numa frigideira grande bem quente com óleo, mexa os ovos até firmarem, junte os legumes e salteie por 2 min. Acrescente o arroz cozido (de preferência frio) e o shoyu e misture por 3–4 min.' },
  },
  nhoque: {
    ordem: ['fogao'],
    v: { fogao: 'Faça rolinhos com a massa, corte em pedaços de 2 cm e cozinhe em água fervente com sal, aos poucos: quando subirem à superfície, retire com uma escumadeira.' },
  },
  panqueca_americana: {
    ordem: ['fogao'],
    v: { fogao: 'Misture a farinha, o leite, o ovo, o açúcar, o fermento e uma pitada de sal até ficar liso. Despeje ¼ de xícara numa frigideira untada em fogo baixo e vire quando aparecerem bolhinhas, 1–2 min de cada lado.' },
  },
};
