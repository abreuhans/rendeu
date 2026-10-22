// Resultado: resumo do plano e as abas Cardápio, Compras, Mercados e Bastidores.
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import {
  ITEM, ITENS, ORDEM_REFEICOES, dinheiro, lojasValidas, numero, quantidade, type Plano,
} from '@/core';
import { Icone } from '@/components/icones';
import { Papel } from '@/components/papel';
import { SituacaoPrecos } from '@/components/situacao-precos';
import { Sobrelinha } from '@/components/tela';
import { Botao, Cartao, EtiquetaPreco, Nota, Selo } from '@/components/ui';
import { useApp } from '@/estado/app';
import {
  custoPorcao, descricaoCompra, infoReceita, linhasCompra, mercadosUsados, origemPreco, resumoSobras, selos, textoLista,
} from '@/lib/plano';
import { NOME_REF, SECOES, nomeMercado, plural, quando } from '@/lib/textos';
import { FONTES, RAIO, useCores } from '@/theme';

export type Aba = 'cardapio' | 'compras' | 'mercados' | 'bastidores';

const ABAS: [Aba, string][] = [['cardapio', 'Cardápio'], ['compras', 'Compras'], ['mercados', 'Mercados'], ['bastidores', 'Bastidores']];

export function Resumo({ plano }: { plano: Plano }) {
  const c = useCores();
  const p = plano.prefs;
  const sobra = p.orcamento - plano.custo.total;
  const passou = sobra < -0.004;
  const pct = Math.min(100, (plano.custo.total / p.orcamento) * 100);
  const usados = mercadosUsados(plano);
  const onde = usados.length > 1 ? `${usados.length} mercados` : nomeMercado(usados[0] ?? plano.mercados[0]);
  const fatos: [string, string][] = [
    ['Refeições', `${plano.keys.length}${p.pessoas > 1 ? ` × ${p.pessoas}` : ''}`],
    ['Por porção', dinheiro(plano.custo.total / plano.porcoes)],
    ['Média por dia', `${numero(plano.porDia.kcal)} kcal · ${numero(plano.porDia.p)} g prot.`],
    ['Onde comprar', onde],
  ];
  return (
    <Cartao style={{ marginTop: 6 }}>
      <Sobrelinha>{`Seu plano · ${p.dias} ${plural(p.dias, 'dia', 'dias')} · ${p.pessoas} ${plural(p.pessoas, 'pessoa', 'pessoas')}`}</Sobrelinha>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10, marginTop: 4 }}>
        <Text selectable style={{ fontFamily: FONTES.titulo, fontSize: 52, letterSpacing: -1.8, color: c.tinta, fontVariant: ['tabular-nums'] }}>
          {dinheiro(plano.custo.total)}
        </Text>
        <Text style={{ fontFamily: FONTES.texto, fontSize: 16, color: c.tinta2, fontVariant: ['tabular-nums'] }}>de {dinheiro(p.orcamento)}</Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`${Math.round(pct)}% do orçamento`}
        style={{ height: 10, borderRadius: 999, backgroundColor: c.superficie2, overflow: 'hidden', marginTop: 14 }}
      >
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: passou ? c.tomate : c.folha }} />
      </View>
      <Text style={{ fontFamily: FONTES.textoNegrito, fontSize: 16, color: passou ? c.tomate : c.folha, marginTop: 8, fontVariant: ['tabular-nums'] }}>
        {passou ? `Passou ${dinheiro(-sobra)} do orçamento` : `Sobram ${dinheiro(sobra)}`}
      </Text>
      {passou ? (
        <View style={{ marginTop: 10, gap: 10 }}>
          <Text style={{ fontFamily: FONTES.texto, fontSize: 14, lineHeight: 20, color: c.tinta2 }}>
            Os preços mudaram desde que o plano foi feito (site do mercado ou nota lida). Gere de novo para voltar a caber no orçamento.
          </Text>
          <Botao pequeno onPress={() => router.push({ pathname: '/gerando', params: { novo: '1' } })}>Gerar de novo</Botao>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderColor: c.linha }}>
        {fatos.map(([k, v]) => (
          <View key={k} style={{ width: '50%', paddingRight: 8 }}>
            <Text style={{ fontFamily: FONTES.textoForte, fontSize: 11.5, letterSpacing: 0.9, textTransform: 'uppercase', color: c.tinta2 }}>{k}</Text>
            <Text selectable style={{ fontFamily: FONTES.textoNegrito, fontSize: 15, color: c.tinta, marginTop: 2, fontVariant: ['tabular-nums'] }}>{v}</Text>
          </View>
        ))}
      </View>
    </Cartao>
  );
}

export function Abas({ aba, onChange }: { aba: Aba; onChange: (a: Aba) => void }) {
  const c = useCores();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={{ marginTop: 22, marginBottom: 4, flexGrow: 0 }}
      contentContainerStyle={{ gap: 6, flexGrow: 1 }}
    >
      {ABAS.map(([k, t]) => {
        const ativa = aba === k;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            accessibilityRole="tab"
            aria-selected={ativa}
            style={({ pressed }) => ({
              flexGrow: 1, alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5,
              borderColor: ativa ? c.tinta : c.linha, backgroundColor: ativa ? c.tinta : c.superficie, opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: FONTES.textoForte, fontSize: 13.5, color: ativa ? c.fundo : c.tinta }}>{t}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Cardapio({ plano }: { plano: Plano }) {
  const c = useCores();
  return (
    <View>
      {plano.dias.map(dia => {
        const refs = ORDEM_REFEICOES.filter(r => dia.refeicoes[r]);
        const kcal = refs.reduce((a, r) => a + plano.vmap[dia.refeicoes[r]!.key].nut.kcal, 0);
        return (
          <View key={dia.d} style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <Text accessibilityRole="header" style={{ fontFamily: FONTES.titulo, fontSize: 21, color: c.tinta }}>Dia {dia.d + 1}</Text>
              <Text style={{ fontFamily: FONTES.monoMedio, fontSize: 13, color: c.tinta2 }}>{numero(kcal)} kcal</Text>
            </View>
            <View style={{ gap: 8 }}>
              {refs.map(r => <CartaoRefeicao key={r} plano={plano} i={dia.refeicoes[r]!.i} />)}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function CartaoRefeicao({ plano, i }: { plano: Plano; i: number }) {
  const c = useCores();
  const { fontes } = useApp();
  const v = plano.vmap[plano.keys[i]];
  const info = infoReceita(v);
  const marcas = selos(plano, i);
  const preco = dinheiro(custoPorcao(plano, v, fontes));
  return (
    <Pressable
      onPress={() => router.push(`/receita/${i}`)}
      accessibilityRole="button"
      accessibilityLabel={`${NOME_REF[plano.slots[i].r]}: ${info.nome}, ${preco} por porção`}
      accessibilityHint="Abre a receita"
      style={({ pressed }) => ({
        flexDirection: 'row', gap: 12, paddingVertical: 14, paddingLeft: 16, paddingRight: 12,
        backgroundColor: c.superficie, borderWidth: 1.5, borderColor: pressed ? c.folha : c.linha,
        borderRadius: RAIO.m, borderCurve: 'continuous',
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: FONTES.textoForte, fontSize: 11.5, letterSpacing: 1, textTransform: 'uppercase', color: c.tinta2 }}>
          {NOME_REF[plano.slots[i].r]}
        </Text>
        <Text style={{ fontFamily: FONTES.tituloMedio, fontSize: 17, lineHeight: 21, color: c.tinta }}>{info.nome}</Text>
        <Text style={{ fontFamily: FONTES.texto, fontSize: 13, color: c.tinta2, marginTop: 2 }}>
          {info.tempo} min · {numero(v.nut.kcal)} kcal · {numero(v.nut.p)} g prot.
        </Text>
        {marcas.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {marcas.map(m => <Selo key={m}>{m}</Selo>)}
          </View>
        ) : null}
      </View>
      <EtiquetaPreco valor={preco} legenda="por porção" />
    </Pressable>
  );
}

export function Compras({ plano }: { plano: Plano }) {
  const c = useCores();
  const { marcados, marcar, mostrarAviso } = useApp();
  const p = plano.prefs;
  const linhas = linhasCompra(plano);
  const porMercado = new Map<string, typeof linhas>();
  for (const x of linhas) porMercado.set(x.compra!.mercado, [...(porMercado.get(x.compra!.mercado) ?? []), x]);
  const origens = { nota: 0, site: 0, estimado: 0 };
  for (const x of linhas) origens[origemPreco(x)]++;
  const misturado = origens.estimado > 0 && origens.estimado < linhas.length;
  const resumoOrigem = origens.estimado === linhas.length
    ? 'preços estimados'
    : [origens.site && `${origens.site} do site`, origens.nota && `${origens.nota} de nota`, origens.estimado && `${origens.estimado} estimados`].filter(Boolean).join(' · ');
  const { emCasa, pereciveis, despensa, valorDespensa } = resumoSobras(plano);
  const mono = { fontFamily: FONTES.mono, color: c.papelTinta };

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(textoLista(plano));
      mostrarAviso('Lista copiada.');
    } catch {
      mostrarAviso('Não deu para copiar. Tente compartilhar.');
    }
  };
  const compartilhar = async () => {
    try {
      await Share.share({ message: textoLista(plano) });
    } catch {
      copiar();
    }
  };

  return (
    <View>
      <Papel style={{ marginTop: 16 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 24 }}>
          <View style={{ alignItems: 'center', gap: 2, paddingBottom: 12, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: c.papelLinha }}>
            <Text style={{ ...mono, fontFamily: FONTES.monoForte, fontSize: 15, letterSpacing: 2.4, textTransform: 'uppercase' }}>Lista de compras</Text>
            <Text style={{ ...mono, fontSize: 12, opacity: 0.7 }}>
              {linhas.length} itens · {resumoOrigem}
            </Text>
          </View>
          {[...porMercado].map(([m, xs]) => {
            let secao = '';
            const sub = xs.reduce((a, x) => a + x.custo, 0);
            return (
              <View key={m}>
                <Text style={{ ...mono, fontFamily: FONTES.monoForte, textAlign: 'center', letterSpacing: 2.4, marginTop: 16, marginBottom: 2 }}>
                  {nomeMercado(m).toUpperCase()}
                </Text>
                {xs.map(x => {
                  const it = ITEM[x.id];
                  const cabecalho = it.secao !== secao ? (secao = it.secao) : null;
                  const feito = !!marcados[x.id];
                  return (
                    <View key={x.id}>
                      {cabecalho ? (
                        <Text style={{ ...mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.6, marginTop: 12, marginBottom: 2 }}>
                          {SECOES[cabecalho]}
                        </Text>
                      ) : null}
                      <Pressable
                        onPress={() => marcar(x.id, !feito)}
                        accessibilityRole="checkbox"
                        aria-checked={feito}
                        accessibilityLabel={`${it.nome}, ${dinheiro(x.custo)}`}
                        style={{ flexDirection: 'row', gap: 10, paddingVertical: 7, alignItems: 'flex-start' }}
                      >
                        <View
                          style={{
                            width: 18, height: 18, marginTop: 1, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                            borderColor: feito ? c.folha : c.papelLinha, backgroundColor: feito ? c.folha : 'transparent',
                          }}
                        >
                          {feito ? <Icone nome="ok" cor={c.folhaTinta} tamanho={13} /> : null}
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ ...mono, fontFamily: FONTES.monoMedio, fontSize: 14, textDecorationLine: feito ? 'line-through' : 'none', opacity: feito ? 0.5 : 1 }}>
                            {it.nome}
                            {x.compra!.oferta ? <Text style={{ fontFamily: FONTES.textoNegrito, fontSize: 10, color: c.etiquetaTinta, backgroundColor: c.etiqueta }}> OFERTA </Text> : null}
                            {x.compra!.real ? <Text style={{ fontFamily: FONTES.textoNegrito, fontSize: 10, color: c.folhaTinta, backgroundColor: c.folha }}> NOTA </Text> : null}
                            {misturado && origemPreco(x) === 'estimado' ? <Text style={{ fontFamily: FONTES.textoForte, fontSize: 10, color: c.papelTinta, opacity: 0.6 }}> ≈ estimado</Text> : null}
                          </Text>
                          <Text style={{ ...mono, fontSize: 11.5, opacity: 0.68 }}>{descricaoCompra(x)}</Text>
                        </View>
                        <Text style={{ ...mono, fontSize: 14, fontVariant: ['tabular-nums'] }}>{dinheiro(x.custo)}</Text>
                      </Pressable>
                    </View>
                  );
                })}
                {porMercado.size > 1 ? <LinhaTotal rotulo="Subtotal" valor={dinheiro(sub)} /> : null}
              </View>
            );
          })}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.papelLinha }}>
            <Text style={{ ...mono, fontFamily: FONTES.monoForte, fontSize: 19 }}>TOTAL</Text>
            <Text selectable style={{ ...mono, fontFamily: FONTES.monoForte, fontSize: 19, fontVariant: ['tabular-nums'] }}>{dinheiro(plano.custo.total)}</Text>
          </View>
          <LinhaTotal rotulo="Orçamento" valor={dinheiro(p.orcamento)} />
          <LinhaTotal rotulo="Sobra" valor={dinheiro(p.orcamento - plano.custo.total)} />
          <Text style={{ ...mono, textAlign: 'center', marginTop: 16, fontSize: 12, letterSpacing: 2.4, opacity: 0.55 }}>* * * Rendeu * * *</Text>
        </View>
      </Papel>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
        <Botao pequeno variante="contorno" icone="copiar" onPress={copiar}>Copiar lista</Botao>
        {process.env.EXPO_OS !== 'web' ? <Botao pequeno variante="contorno" icone="compartilhar" onPress={compartilhar}>Compartilhar</Botao> : null}
      </View>

      {emCasa.length ? (
        <View style={{ marginTop: 22 }}>
          <Text accessibilityRole="header" style={{ fontFamily: FONTES.tituloForte, fontSize: 16, color: c.tinta }}>Você já tem (fora da conta)</Text>
          <Text style={{ fontFamily: FONTES.texto, fontSize: 14, lineHeight: 20, color: c.tinta2, marginTop: 6 }}>{emCasa.join(', ')}</Text>
        </View>
      ) : null}
      {despensa.length || pereciveis.length ? (
        <View style={{ marginTop: 22 }}>
          <Text accessibilityRole="header" style={{ fontFamily: FONTES.tituloForte, fontSize: 16, color: c.tinta }}>O que sobra depois do plano</Text>
          {despensa.length ? (
            <Text style={{ fontFamily: FONTES.texto, fontSize: 14, lineHeight: 20, color: c.tinta2, marginTop: 6 }}>
              Fica na despensa: cerca de {dinheiro(valorDespensa)} em itens como {despensa.slice(0, 4).map(x => ITEM[x.id].nome.toLowerCase()).join(', ')}.
            </Text>
          ) : null}
          {pereciveis.length ? (
            <>
              <Text style={{ fontFamily: FONTES.texto, fontSize: 14, lineHeight: 20, color: c.tinta2, marginTop: 6 }}>
                Perecíveis que sobram (dica: congele ou use na semana seguinte):
              </Text>
              {pereciveis.map(x => (
                <Text key={x.id} style={{ fontFamily: FONTES.texto, fontSize: 14, color: c.tinta, marginTop: 4 }}>
                  <Text style={{ fontFamily: FONTES.mono, fontSize: 13, color: c.tinta2 }}>{quantidade(x.id, x.sobra)}</Text> {ITEM[x.id].nome}
                </Text>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function LinhaTotal({ rotulo, valor }: { rotulo: string; valor: string }) {
  const c = useCores();
  const mono = { fontFamily: FONTES.mono, color: c.papelTinta, fontSize: 13 };
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
      <Text style={mono}>{rotulo}</Text>
      <Text style={{ ...mono, fontVariant: ['tabular-nums'] }}>{valor}</Text>
    </View>
  );
}

export function Mercados({ plano }: { plano: Plano }) {
  const c = useCores();
  const { precos, site } = useApp();
  const comSite = lojasValidas(site);
  const p = plano.prefs;
  const linhas = plano.porMercado.slice().sort((a, b) => a.total - b.total);
  const escala = Math.max(p.orcamento, ...linhas.map(x => x.total)) * 1.04;
  const orc = (p.orcamento / escala) * 100;
  const deNota = (m: string) => Object.values(precos).filter(x => x.mercadoId === m).length;
  return (
    <View>
      <Text accessibilityRole="header" style={{ fontFamily: FONTES.tituloForte, fontSize: 20, color: c.tinta, marginTop: 18, marginBottom: 14 }}>
        A mesma lista em cada mercado
      </Text>
      <View style={{ gap: 16 }}>
        {linhas.map((x, i) => {
          const passou = x.total > p.orcamento;
          const n = deNota(x.mercado);
          return (
            <View key={x.mercado} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 112 }}>
                <Text style={{ fontFamily: FONTES.textoNegrito, fontSize: 14, color: c.tinta }}>{nomeMercado(x.mercado)}</Text>
                {i === 0 ? <Text style={{ fontFamily: FONTES.textoForte, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: c.folha }}>mais barato</Text> : null}
                <Text style={{ fontFamily: FONTES.texto, fontSize: 11, color: c.tinta2 }}>
                  {comSite[x.mercado] ? `site · ${quando(comSite[x.mercado].data)}` : 'estimado'}
                  {n ? ` · ${n} ${plural(n, 'preço', 'preços')} de nota` : ''}
                </Text>
              </View>
              <View style={{ flex: 1, height: 14, borderRadius: 999, backgroundColor: c.superficie2 }}>
                <View style={{ width: `${(x.total / escala) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: passou ? c.tomate : c.folha }} />
                <View style={{ position: 'absolute', top: -5, bottom: -5, left: `${orc}%`, width: 2, borderRadius: 2, backgroundColor: c.tinta }} />
              </View>
              <Text style={{ fontFamily: FONTES.monoMedio, fontSize: 14, color: c.tinta, fontVariant: ['tabular-nums'] }}>{dinheiro(x.total)}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <View style={{ width: 2, height: 14, borderRadius: 2, backgroundColor: c.tinta }} />
        <Text style={{ fontFamily: FONTES.texto, fontSize: 12.5, color: c.tinta2 }}>Orçamento {dinheiro(p.orcamento)}</Text>
      </View>
      {p.mercados.length > 1 ? (
        <Text style={{ fontFamily: FONTES.texto, fontSize: 15, color: c.tinta2, marginTop: 12 }}>Dividindo entre os mercados: {dinheiro(plano.dividido)}</Text>
      ) : null}
      <SituacaoPrecos />
      <Nota>Quem não tem loja online (Komprão, Fort, Bistek, Imperatriz) tem preço estimado a partir dos sites dos outros. Cada nota fiscal lida passa a valer para o mercado dela.</Nota>
      <View style={{ marginTop: 14, alignItems: 'flex-start' }}>
        <Botao pequeno variante="contorno" icone="nota" onPress={() => router.push('/notas')}>Ler nota fiscal</Botao>
      </View>
    </View>
  );
}

export function Bastidores({ plano }: { plano: Plano }) {
  const c = useCores();
  const p = plano.prefs;
  const st = plano.meta.stats;
  const itens: [string, string][] = [
    ['Preços', `${ITENS.length} produtos com preço por embalagem em ${p.mercados.length} ${plural(p.mercados.length, 'mercado', 'mercados')}. Um robô lê os sites do Angeloni, Giassi, Koch e Hippo de manhã e no fim da tarde; os outros mercados são estimados a partir desses preços.`],
    ['Filtro de receitas', `${st.total} receitas no catálogo → ${st.combinam} combinam com sua dieta, restrições e gostos → ${st.possiveis} dá para fazer com seus aparelhos.`],
    ['Otimização', `${numero(plano.meta.rodadas)} cardápios simulados. O escolhido custa ${dinheiro(plano.custo.total)} (limite ${dinheiro(p.orcamento)}). Conta embalagens inteiras e reaproveita o que sobra de uma receita na outra.`],
    ['Passo a passo', 'Cada etapa de cozimento tem versões para fogão, forno, micro-ondas, air fryer, panela de pressão e outros. Você vê a do aparelho que tem.'],
    ['Notas fiscais', 'Você lê o QR Code da nota fiscal (NFC-e). O app abre a nota no site da Sefaz, lê os itens e passa a usar aqueles preços no mercado da nota (valem mais que o site por 30 dias).'],
    ['Seus dados', 'Escolhas, plano e preços ficam só no seu celular. Da nota, o app guarda apenas produtos e preços (nunca o CPF).'],
  ];
  return (
    <View>
      <Text accessibilityRole="header" style={{ fontFamily: FONTES.tituloForte, fontSize: 20, color: c.tinta, marginTop: 18, marginBottom: 12 }}>
        O que acontece quando você toca em “Gerar”
      </Text>
      <View style={{ gap: 16 }}>
        {itens.map(([t, d], i) => (
          <View key={t} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.tinta, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FONTES.tituloForte, fontSize: 14, color: c.fundo }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTES.tituloForte, fontSize: 16, color: c.tinta }}>{t}</Text>
              <Text style={{ fontFamily: FONTES.texto, fontSize: 14.5, lineHeight: 21, color: c.tinta2, marginTop: 2 }}>{d}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
