import { Redirect, router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { BotaoCabecalho, Tela } from '@/components/tela';
import { Botao } from '@/components/ui';
import { useApp } from '@/estado/app';
import { Abas, Bastidores, Cardapio, Compras, Mercados, Resumo, type Aba } from '@/screens/plano';

export default function PlanoTela() {
  const { plano, editar } = useApp();
  const [aba, setAba] = useState<Aba>('cardapio');
  if (!plano) return <Redirect href="/" />;

  return (
    <Tela>
      <Stack.Screen
        options={{ headerRight: () => <BotaoCabecalho icone="nota" rotulo="Preços reais das notas fiscais" onPress={() => router.push('/notas')} /> }}
      />
      <Resumo plano={plano} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <Botao
          pequeno
          variante="contorno"
          onPress={() => {
            editar();
            router.push('/passo/1');
          }}
        >
          Editar escolhas
        </Botao>
        <Botao pequeno variante="contorno" icone="refazer" onPress={() => router.push({ pathname: '/gerando', params: { novo: '1' } })}>
          Gerar outro plano
        </Botao>
      </View>
      <Abas aba={aba} onChange={setAba} />
      {aba === 'cardapio' ? <Cardapio plano={plano} /> : null}
      {aba === 'compras' ? <Compras plano={plano} /> : null}
      {aba === 'mercados' ? <Mercados plano={plano} /> : null}
      {aba === 'bastidores' ? <Bastidores plano={plano} /> : null}
    </Tela>
  );
}
