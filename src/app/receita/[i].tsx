import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ITEM, dinheiro, nomeAparelho, numero, passosDe, precoUnitarioMinimo, quantidade } from '@/core';
import { Sobrelinha, Tela } from '@/components/tela';
import { Ajuda, Botao, Chip, Selo } from '@/components/ui';
import { useApp } from '@/estado/app';
import { custoPorcao, fmtDelta, infoReceita, selos, tabelaDo } from '@/lib/plano';
import { NOME_REF, plural } from '@/lib/textos';
import { FONTES, useCores } from '@/theme';

export default function Receita() {
  const { i: param } = useLocalSearchParams<{ i: string }>();
  const { plano, fontes, metodo, escolherMetodo, trocarReceita } = useApp();
  const c = useCores();
  const [status, setStatus] = useState<{ texto: string; ok: boolean } | null>(null);
  const i = Number(param);

  const fechar = (
    <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={10} style={{ paddingHorizontal: 8 }}>
      <Text style={{ fontFamily: FONTES.textoForte, fontSize: 16, color: c.folha }}>Fechar</Text>
    </Pressable>
  );

  if (!plano || !(i >= 0 && i < plano.keys.length)) {
    return (
      <Tela fundo={c.superficie}>
        <Stack.Screen options={{ headerRight: () => fechar }} />
        <Ajuda>Essa receita não está mais no plano.</Ajuda>
      </Tela>
    );
  }

  const v = plano.vmap[plano.keys[i]];
  const slot = plano.slots[i];
  const info = infoReceita(v);
  const H = plano.prefs.pessoas;
  const tab = tabelaDo(plano, fontes);
  const casa = new Set(plano.prefs.despensa);
  const passos = passosDe(v, plano.prefs.aparelhos, metodo);
  const nut: [string, number, string][] = [['kcal', v.nut.kcal, ''], ['prot.', v.nut.p, ' g'], ['carb.', v.nut.c, ' g'], ['gord.', v.nut.g, ' g']];

  const trocar = () => {
    const r = trocarReceita(i);
    if (!r) {
      setStatus({ texto: 'Nenhuma outra receita cabe no orçamento.', ok: false });
      return;
    }
    if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
    setStatus({ texto: `Trocada por ${infoReceita(r.plano.vmap[r.plano.keys[i]]).nome} (${fmtDelta(r.delta)})`, ok: true });
  };

  return (
    <Tela fundo={c.superficie}>
      <Stack.Screen options={{ headerRight: () => fechar }} />
      <Sobrelinha>{`Dia ${slot.d + 1} · ${NOME_REF[slot.r]}`}</Sobrelinha>
      <Text accessibilityRole="header" style={{ fontFamily: FONTES.titulo, fontSize: 27, lineHeight: 31, letterSpacing: -0.5, color: c.tinta, marginTop: 4 }}>
        {info.nome}
      </Text>
      <Text style={{ fontFamily: FONTES.texto, fontSize: 14, color: c.tinta2, marginTop: 8 }}>
        {info.tempo} min · {H} {plural(H, 'porção', 'porções')}{info.cozinha ? ' · ' + info.cozinha : ''} · {dinheiro(custoPorcao(plano, v, fontes))} por porção
      </Text>
      {selos(plano, i).length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {selos(plano, i).map(s => <Selo key={s}>{s}</Selo>)}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {nut.map(([k, x, u]) => (
          <View key={k} style={{ flex: 1, backgroundColor: c.superficie2, borderRadius: 12, borderCurve: 'continuous', paddingVertical: 10, alignItems: 'center', gap: 2 }}>
            <Text style={{ fontFamily: FONTES.titulo, fontSize: 18, color: c.tinta, fontVariant: ['tabular-nums'] }}>{numero(x)}{u}</Text>
            <Text style={{ fontFamily: FONTES.textoForte, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: c.tinta2 }}>{k}</Text>
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: FONTES.texto, fontSize: 12, color: c.tinta2, marginTop: 6 }}>Valores por porção.</Text>

      <Titulo>{`Ingredientes para ${H} ${plural(H, 'porção', 'porções')}`}</Titulo>
      {v.linhas.map(l => {
        const it = ITEM[l.id];
        const q = l.q * H;
        const temCasa = casa.has(l.id);
        const custo = temCasa ? 0 : q * precoUnitarioMinimo(l.id, tab).porUnidade;
        return (
          <View key={l.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: c.linha, alignItems: 'baseline' }}>
            <Text style={{ width: 104, fontFamily: FONTES.monoMedio, fontSize: 13, color: c.tinta2 }}>{quantidade(l.id, q)}</Text>
            <Text style={{ flex: 1, fontFamily: FONTES.texto, fontSize: 15, color: c.tinta }}>
              {it.nome}
              {l.opt ? <Text style={{ fontSize: 12, color: c.tinta2 }}> opcional</Text> : null}
            </Text>
            {temCasa ? (
              <Text style={{ fontFamily: FONTES.textoForte, fontSize: 12, color: c.folha }}>tem em casa</Text>
            ) : (
              <Text style={{ fontFamily: FONTES.monoMedio, fontSize: 13, color: c.tinta2, fontVariant: ['tabular-nums'] }}>{dinheiro(custo)}</Text>
            )}
          </View>
        );
      })}

      <Titulo>Modo de preparo</Titulo>
      <View style={{ gap: 18 }}>
        {passos.map((s, n) => (
          <View key={n} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.tinta, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FONTES.tituloForte, fontSize: 14, color: c.fundo }}>{n + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              {s.aparelho ? (
                <View style={{ alignSelf: 'flex-start', backgroundColor: c.folhaSuave, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: FONTES.textoForte, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: c.folha }}>{nomeAparelho(s.aparelho)}</Text>
                </View>
              ) : null}
              <Text selectable style={{ fontFamily: FONTES.texto, fontSize: 16, lineHeight: 23, color: c.tinta }}>{s.texto}</Text>
              {s.dica ? <Text style={{ fontFamily: FONTES.texto, fontSize: 13, lineHeight: 18, color: c.tinta2 }}>Dica: {s.dica}</Text> : null}
              {s.alternativas?.length && s.chave ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: FONTES.texto, fontSize: 12.5, color: c.tinta2 }}>Outros jeitos:</Text>
                  {s.alternativas.map(a => (
                    <Chip key={a} pequeno rotulo={nomeAparelho(a)} ativo={false} onPress={() => escolherMetodo(s.chave!, a)} />
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 26, gap: 10, alignItems: 'flex-start' }}>
        <Botao variante="contorno" icone="trocar" onPress={trocar}>Trocar receita</Botao>
        {status ? (
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: FONTES.textoForte, fontSize: 14, color: status.ok ? c.folha : c.tomate }}>{status.texto}</Text>
        ) : null}
      </View>
    </Tela>
  );
}

function Titulo({ children }: { children: string }) {
  const c = useCores();
  return (
    <Text accessibilityRole="header" style={{ fontFamily: FONTES.tituloForte, fontSize: 18, color: c.tinta, marginTop: 24, marginBottom: 6 }}>
      {children}
    </Text>
  );
}
