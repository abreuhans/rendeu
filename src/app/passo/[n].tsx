import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Sobrelinha, Tela } from '@/components/tela';
import { Botao } from '@/components/ui';
import { useApp } from '@/estado/app';
import { PASSOS } from '@/lib/textos';
import {
  PassoCozinha, PassoDieta, PassoGostos, PassoMercados, PassoOrcamento, PassoPlano, validarPasso,
} from '@/screens/passos';
import { FONTES, useCores } from '@/theme';

export default function Passo() {
  const { n } = useLocalSearchParams<{ n: string }>();
  const passo = Math.min(PASSOS, Math.max(1, Number(n) || 1));
  const { prefs } = useApp();
  const c = useCores();
  const [orcamentoOk, setOrcamentoOk] = useState(true);
  const v = validarPasso(passo, prefs, orcamentoOk);

  const seguir = () => {
    if (!validarPasso(passo, prefs, orcamentoOk).ok) return;
    if (passo < PASSOS) router.push(`/passo/${passo + 1}`);
    else router.push('/gerando');
  };

  const corpo = [
    <PassoOrcamento key={1} onValido={setOrcamentoOk} onPronto={seguir} />,
    <PassoMercados key={2} />,
    <PassoDieta key={3} />,
    <PassoCozinha key={4} />,
    <PassoGostos key={5} />,
    <PassoPlano key={6} />,
  ][passo - 1];

  return (
    <Tela
      rodape={
        <View style={{ gap: 6 }}>
          {v.msg ? (
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: FONTES.texto, fontSize: 13, color: c.tomate }}>{v.msg}</Text>
          ) : null}
          <Botao onPress={seguir} desativado={!v.ok}>{passo === PASSOS ? 'Gerar meu plano' : 'Continuar'}</Botao>
        </View>
      }
    >
      <View
        accessibilityRole="progressbar"
        aria-valuemin={0}
        aria-valuemax={PASSOS}
        aria-valuenow={passo}
        style={{ height: 4, borderRadius: 999, backgroundColor: c.superficie2, overflow: 'hidden', marginBottom: 16 }}
      >
        <View style={{ width: `${(passo / PASSOS) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: c.folha }} />
      </View>
      <Sobrelinha>{`Passo ${passo} de ${PASSOS}`}</Sobrelinha>
      {corpo}
    </Tela>
  );
}
