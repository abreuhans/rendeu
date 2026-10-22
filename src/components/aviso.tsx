// Aviso rápido no rodapé ("Lista copiada", "Receita trocada…").
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/estado/app';
import { FONTES, useCores } from '@/theme';

export function Aviso() {
  const { aviso } = useApp();
  const c = useCores();
  const { bottom } = useSafeAreaInsets();
  if (!aviso) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 16, right: 16, bottom: bottom + 20, alignItems: 'center' }}
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={{ maxWidth: 480, backgroundColor: c.tinta, borderRadius: 14, borderCurve: 'continuous', paddingVertical: 12, paddingHorizontal: 16, boxShadow: c.sombra }}
      >
        <Text selectable style={{ fontFamily: FONTES.textoMedio, fontSize: 14.5, lineHeight: 20, color: c.fundo }}>{aviso}</Text>
      </View>
    </View>
  );
}
