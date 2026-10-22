import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { ITENS, RECEITAS, dinheiro, numero } from '@/core';
import { Icone } from '@/components/icones';
import { Tela } from '@/components/tela';
import { useApp } from '@/estado/app';
import { PADRAO, plural } from '@/lib/textos';
import { FONTES, useCores } from '@/theme';

export default function Gerando() {
  const { exemplo, novo } = useLocalSearchParams<{ exemplo?: string; novo?: string }>();
  const { prefs, plano, gerar } = useApp();
  const c = useCores();
  const p = exemplo ? PADRAO : novo && plano ? plano.prefs : prefs;
  const [fase, setFase] = useState(0);

  const linhas = [
    `Lendo ${numero(ITENS.length * p.mercados.length)} preços em ${p.mercados.length} ${plural(p.mercados.length, 'mercado', 'mercados')}`,
    `Filtrando ${RECEITAS.length} receitas pelo seu perfil`,
    `Testando ${numero((p.modo === 'dividir' ? 1 : p.mercados.length) * 140)} combinações até ${dinheiro(p.orcamento)}`,
    'Montando a lista de compras',
  ];

  useEffect(() => {
    const iv = setInterval(() => setFase(f => Math.min(linhas.length, f + 1)), 260);
    return () => clearInterval(iv);
  }, [linhas.length]);

  // Gera uma vez ao abrir a tela. A conta roda aos poucos (a tela continua respondendo).
  useEffect(() => {
    let viva = true;
    let depois: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();
    const antes = setTimeout(async () => {
      const r = await (exemplo
        ? gerar({ prefs: JSON.parse(JSON.stringify(PADRAO)), semente: 1 })
        : novo && plano
          ? gerar({ prefs: plano.prefs, novaSemente: true })
          : gerar());
      if (!viva) return;
      depois = setTimeout(() => {
        if (!viva) return;
        if (!r.ok) router.replace('/problema');
        else if (router.canDismiss()) {
          router.dismissAll();
          router.push('/plano');
        } else router.replace('/plano');
      }, Math.max(0, 1200 - (Date.now() - inicio)));
    }, 80);
    return () => {
      viva = false;
      clearTimeout(antes);
      if (depois) clearTimeout(depois);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tela>
      <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 28, paddingTop: 48 }}>
        <ActivityIndicator size="large" color={c.folha} accessibilityLabel="Montando o plano" />
        <View style={{ gap: 14, alignSelf: 'stretch', maxWidth: 360, marginHorizontal: 'auto' }}>
          {linhas.map((l, i) => (
            <View key={l} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', opacity: i < fase ? 1 : 0.3 }}>
              <Icone nome="ok" cor={c.folha} />
              <Text style={{ flex: 1, fontFamily: FONTES.texto, fontSize: 15, color: c.tinta }}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
    </Tela>
  );
}
