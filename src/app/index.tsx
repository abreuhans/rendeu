import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { dinheiro, planejarSemTravar, RECEITA, type Plano } from '@/core';
import { Papel } from '@/components/papel';
import { SituacaoPrecos } from '@/components/situacao-precos';
import { BotaoCabecalho, Tela } from '@/components/tela';
import { Botao, Cartao, Nota } from '@/components/ui';
import { useApp } from '@/estado/app';
import { NOME_REF, PADRAO, nomeMercado } from '@/lib/textos';
import { FONTES, useCores } from '@/theme';

export default function Inicio() {
  const { plano, fontes, notas } = useApp();
  const c = useCores();
  const [exemplo, setExemplo] = useState<Plano | null>(null);

  // O exemplo só aparece para quem ainda não tem plano; é refeito quando chegam os preços do dia.
  useEffect(() => {
    if (plano) return;
    let vivo = true;
    const t = setTimeout(() => {
      planejarSemTravar(PADRAO, 1, fontes)
        .then(r => { if (vivo && r.ok) setExemplo(r); })
        .catch(() => { if (vivo) setExemplo(null); });
    }, 350);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [plano, fontes]);

  return (
    <Tela>
      <Stack.Screen options={{ headerRight: () => <BotaoCabecalho icone="nota" rotulo="Preços reais das notas fiscais" onPress={() => router.push('/notas')} /> }} />
      <Text accessibilityRole="header" style={{ fontFamily: FONTES.titulo, fontSize: 40, lineHeight: 42, letterSpacing: -1.3, color: c.tinta, marginTop: 14 }}>
        Receitas que cabem no seu bolso
      </Text>
      <Text style={{ fontFamily: FONTES.texto, fontSize: 17, lineHeight: 25, color: c.tinta2, marginTop: 12 }}>
        Diga quanto pode gastar, onde compra e o que tem na cozinha. O Rendeu monta o cardápio, as receitas e a lista de compras sem passar do valor.
      </Text>

      {!plano && exemplo ? <CartaoExemplo plano={exemplo} /> : null}

      <View style={{ gap: 10, marginTop: 24 }}>
        {plano ? <Botao onPress={() => router.push('/plano')}>Voltar ao meu plano</Botao> : null}
        <Botao variante={plano ? 'contorno' : 'primario'} onPress={() => router.push('/passo/1')}>
          {plano ? 'Montar um plano novo' : 'Montar meu plano'}
        </Botao>
        {!plano ? (
          <Botao variante="contorno" onPress={() => router.push({ pathname: '/gerando', params: { exemplo: '1' } })}>
            Ver um exemplo pronto
          </Botao>
        ) : null}
        <Botao variante="contorno" icone="nota" onPress={() => router.push('/notas')}>
          {notas.length ? `Preços reais (${notas.length} ${notas.length === 1 ? 'nota' : 'notas'})` : 'Ler nota fiscal'}
        </Botao>
      </View>
      <SituacaoPrecos />
      <Nota>
        Mercados reais da Grande Florianópolis. Angeloni, Giassi, Koch e Hippo têm preço do site, lido duas vezes por dia; Komprão, Fort, Bistek e Imperatriz não vendem online e são estimados a partir dos outros. Uma nota fiscal sua vale mais que tudo.
      </Nota>

      <Cartao style={{ marginTop: 22, padding: 18, gap: 8 }}>
        <Text accessibilityRole="header" style={{ fontFamily: FONTES.tituloForte, fontSize: 16, color: c.tinta }}>Como funciona</Text>
        {[
          'Conta embalagens inteiras (ninguém compra ⅓ de bandeja de frango), reaproveita sobras entre receitas e nunca passa do orçamento.',
          'O passo a passo muda conforme os aparelhos que você tem: fogão, forno, air fryer, micro-ondas, panela de pressão…',
          'Preços de verdade: um robô lê os sites dos mercados de manhã e no fim da tarde, e você ainda pode ler o QR Code da nota fiscal (NFC-e) das suas compras.',
        ].map(t => (
          <View key={t} style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={{ fontFamily: FONTES.textoNegrito, color: c.folha, fontSize: 14 }}>•</Text>
            <Text style={{ flex: 1, fontFamily: FONTES.texto, fontSize: 14, lineHeight: 20, color: c.tinta2 }}>{t}</Text>
          </View>
        ))}
      </Cartao>
    </Tela>
  );
}

function CartaoExemplo({ plano }: { plano: Plano }) {
  const c = useCores();
  const mono = { fontFamily: FONTES.mono, color: c.papelTinta };
  return (
    <Papel inclinado style={{ marginTop: 26 }}>
      <View style={{ padding: 18, gap: 8 }}>
        <Text style={{ ...mono, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', opacity: 0.7 }}>
          Exemplo: R$ 150 · 5 dias · 3 refeições por dia
        </Text>
        {plano.keys.slice(0, 3).map((k, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={{ ...mono, fontSize: 13.5, width: 118, opacity: 0.7 }}>{NOME_REF[plano.slots[i].r]}</Text>
            <Text style={{ ...mono, fontFamily: FONTES.monoMedio, fontSize: 13.5, flex: 1 }}>{RECEITA[plano.vmap[k].rid]?.nome}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.papelLinha, paddingTop: 10, marginTop: 4 }}>
          <Text style={{ ...mono, fontSize: 13.5 }}>Total da compra</Text>
          <Text style={{ ...mono, fontFamily: FONTES.monoForte, fontSize: 22, fontVariant: ['tabular-nums'] }}>{dinheiro(plano.custo.total)}</Text>
        </View>
        <Text style={{ ...mono, fontSize: 12, opacity: 0.7 }}>
          {plano.keys.length} refeições · sobram {dinheiro(plano.prefs.orcamento - plano.custo.total)} · {nomeMercado(plano.mercados[0])}
        </Text>
      </View>
    </Papel>
  );
}
