// Estrutura comum das telas: rolagem com largura máxima e, se preciso, um rodapé fixo
// (o botão "Continuar") que sobe junto com o teclado.
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTES, LARGURA_MAX, useCores } from '@/theme';
import { Icone, type NomeIcone } from './icones';

interface TelaProps {
  children: ReactNode;
  rodape?: ReactNode;
  fundo?: string;
}

export function Tela({ children, rodape, fundo }: TelaProps) {
  const c = useCores();
  const { bottom } = useSafeAreaInsets();
  const cabecalho = useHeaderHeight();
  const conteudo = (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: fundo ?? c.fundo }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: rodape ? 24 : bottom + 32, alignItems: 'center' }}
    >
      <View style={{ width: '100%', maxWidth: LARGURA_MAX }}>{children}</View>
    </ScrollView>
  );
  if (!rodape) return conteudo;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: fundo ?? c.fundo }}
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={cabecalho}
    >
      {conteudo}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(bottom, 10) + 6, alignItems: 'center', backgroundColor: fundo ?? c.fundo }}>
        <View style={{ width: '100%', maxWidth: LARGURA_MAX }}>{rodape}</View>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Botão de ícone para o cabeçalho (ex.: abrir os preços reais). */
export function BotaoCabecalho({ icone, rotulo, onPress }: { icone: NomeIcone; rotulo: string; onPress: () => void }) {
  const c = useCores();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={10}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, paddingVertical: 4, opacity: pressed ? 0.6 : 1 })}
    >
      <Icone nome={icone} cor={c.tinta} tamanho={22} />
    </Pressable>
  );
}

export function Sobrelinha({ children, cor }: { children: string; cor?: string }) {
  const c = useCores();
  return (
    <Text style={{ fontFamily: FONTES.textoForte, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: cor ?? c.folha }}>
      {children}
    </Text>
  );
}
