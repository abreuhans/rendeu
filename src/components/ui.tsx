// Peças básicas das telas: botões, chips, opções, rótulos e selos, no visual do Rendeu.
import { useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FONTES, RAIO, useCores } from '@/theme';
import { Icone, type NomeIcone } from './icones';

type VarianteBotao = 'primario' | 'contorno' | 'destaque';

interface BotaoProps {
  children: string;
  onPress: () => void;
  variante?: VarianteBotao;
  pequeno?: boolean;
  icone?: NomeIcone;
  desativado?: boolean;
  dica?: string;
  style?: StyleProp<ViewStyle>;
}

export function Botao({ children, onPress, variante = 'primario', pequeno, icone, desativado, dica, style }: BotaoProps) {
  const c = useCores();
  const fundo = variante === 'primario' ? c.folha : variante === 'destaque' ? c.etiqueta : 'transparent';
  const tinta = variante === 'primario' ? c.folhaTinta : variante === 'destaque' ? c.etiquetaTinta : c.tinta;
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      aria-disabled={!!desativado}
      accessibilityHint={dica}
      style={({ pressed }) => [
        {
          minHeight: pequeno ? 40 : 50,
          paddingHorizontal: pequeno ? 14 : 22,
          paddingVertical: pequeno ? 8 : 12,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: variante === 'contorno' ? c.linha : 'transparent',
          backgroundColor: fundo,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: desativado ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {icone ? <Icone nome={icone} cor={tinta} tamanho={pequeno ? 16 : 18} /> : null}
      <Text style={{ fontFamily: FONTES.textoForte, fontSize: pequeno ? 14 : 16, color: tinta }}>{children}</Text>
    </Pressable>
  );
}

interface ChipProps {
  rotulo: string;
  ativo: boolean;
  onPress: () => void;
  /** "nao" marca com ✕ em vermelho (não como); "sim" com ♥ (adoro). */
  tipo?: 'normal' | 'sim' | 'nao';
  pequeno?: boolean;
}

export function Chip({ rotulo, ativo, onPress, tipo = 'normal', pequeno }: ChipProps) {
  const c = useCores();
  const corAtiva = tipo === 'nao' ? c.tomate : c.folha;
  const prefixo = !ativo || pequeno ? '' : tipo === 'nao' ? '✕ ' : tipo === 'sim' ? '♥ ' : '✓ ';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      aria-checked={ativo}
      accessibilityLabel={rotulo}
      hitSlop={pequeno ? 6 : 2}
      style={({ pressed }) => ({
        borderWidth: 1.5,
        borderColor: ativo ? corAtiva : c.linha,
        backgroundColor: ativo ? (tipo === 'nao' ? c.tomateSuave : c.folhaSuave) : c.superficie,
        paddingHorizontal: pequeno ? 10 : 14,
        paddingVertical: pequeno ? 5 : 9,
        borderRadius: 999,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontFamily: FONTES.textoMedio, fontSize: pequeno ? 12.5 : 15, color: c.tinta }}>
        {prefixo ? <Text style={{ fontFamily: FONTES.textoNegrito, color: corAtiva }}>{prefixo}</Text> : null}
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function Chips({ children, junto }: { children: ReactNode; junto?: boolean }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: junto ? 6 : 12 }}>{children}</View>;
}

interface OpcaoProps {
  titulo: string;
  descricao?: string;
  ativo: boolean;
  onPress: () => void;
}

/** Cartão de escolha única (como um botão de rádio grande). */
export function Opcao({ titulo, descricao, ativo, onPress }: OpcaoProps) {
  const c = useCores();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      aria-checked={ativo}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: ativo ? c.folha : c.linha,
        backgroundColor: ativo ? c.folhaSuave : c.superficie,
        borderRadius: RAIO.m,
        borderCurve: 'continuous',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: FONTES.tituloMedio, fontSize: 17, color: c.tinta }}>{titulo}</Text>
        {descricao ? <Text style={{ fontFamily: FONTES.texto, fontSize: 14, color: c.tinta2 }}>{descricao}</Text> : null}
      </View>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: ativo ? c.folha : c.linha,
          backgroundColor: c.superficie,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ativo ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.folha }} /> : null}
      </View>
    </Pressable>
  );
}

export function Pergunta({ children }: { children: string }) {
  const c = useCores();
  return (
    <Text accessibilityRole="header" style={{ fontFamily: FONTES.titulo, fontSize: 28, lineHeight: 32, letterSpacing: -0.6, color: c.tinta, marginTop: 4 }}>
      {children}
    </Text>
  );
}

export function Rotulo({ children, cor }: { children: string; cor?: string }) {
  const c = useCores();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontFamily: FONTES.textoForte, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: cor ?? c.tinta2, marginTop: 26 }}
    >
      {children}
    </Text>
  );
}

export function Ajuda({ children, aviso }: { children: ReactNode; aviso?: boolean }) {
  const c = useCores();
  return <Text style={{ fontFamily: FONTES.texto, fontSize: 14.5, lineHeight: 21, color: aviso ? c.tomate : c.tinta2, marginTop: 6 }}>{children}</Text>;
}

export function Nota({ children, aviso }: { children: ReactNode; aviso?: boolean }) {
  const c = useCores();
  return <Text style={{ fontFamily: FONTES.texto, fontSize: 13, lineHeight: 19, color: aviso ? c.tomate : c.tinta2, marginTop: 10 }}>{children}</Text>;
}

export function Selo({ children, cor }: { children: string; cor?: string }) {
  const c = useCores();
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: cor ?? c.folhaSuave }}>
      <Text style={{ fontFamily: FONTES.textoForte, fontSize: 11.5, color: c.tinta }}>{children}</Text>
    </View>
  );
}

/** Etiqueta amarela de preço, com a ponta à esquerda como na gôndola. */
export function EtiquetaPreco({ valor, legenda }: { valor: string; legenda?: string }) {
  const c = useCores();
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start' }}>
      <Svg width={11} height="100%" viewBox="0 0 11 10" preserveAspectRatio="none" style={{ alignSelf: 'stretch' }}>
        <Path d="M11 0L0 5L11 10Z" fill={c.etiqueta} />
      </Svg>
      <View style={{ backgroundColor: c.etiqueta, paddingVertical: 6, paddingRight: 10, paddingLeft: 5, alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: FONTES.monoForte, fontSize: 15, color: c.etiquetaTinta, fontVariant: ['tabular-nums'] }}>{valor}</Text>
        {legenda ? <Text style={{ fontFamily: FONTES.textoMedio, fontSize: 9.5, color: c.etiquetaTinta }}>{legenda}</Text> : null}
      </View>
    </View>
  );
}

export function Cartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useCores();
  return (
    <View style={[{ backgroundColor: c.superficie, borderRadius: RAIO.g, borderCurve: 'continuous', padding: 20, boxShadow: c.sombra }, style]}>
      {children}
    </View>
  );
}

/** Campo de texto: a borda fica verde quando está em foco (no navegador, no lugar do contorno padrão). */
export function Campo({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const c = useCores();
  const [foco, setFoco] = useState(false);
  return (
    <TextInput
      {...props}
      onFocus={e => { setFoco(true); onFocus?.(e); }}
      onBlur={e => { setFoco(false); onBlur?.(e); }}
      placeholderTextColor={c.tinta2}
      selectionColor={c.folha}
      style={[
        {
          fontFamily: FONTES.texto, fontSize: 16, color: c.tinta, paddingVertical: 12, paddingHorizontal: 14,
          borderRadius: 12, borderCurve: 'continuous', borderWidth: 1.5, borderColor: foco ? c.folha : c.linha,
          backgroundColor: c.superficie, outlineWidth: 0,
        },
        style,
      ]}
    />
  );
}
