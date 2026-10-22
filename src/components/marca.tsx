// Logo do Rendeu: etiqueta de preço com uma tigela + o nome.
import { Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { FONTES, useCores } from '@/theme';

const ETIQUETA = 'M28 2H92Q98 2 98 8V56Q98 62 92 62H28Q25 62 23 60L3 35Q1 32 3 29L23 4Q25 2 28 2ZM15 32A5 5 0 1 0 25 32A5 5 0 1 0 15 32Z';
const TIGELA = 'M47 34H83C83 45 75 51 65 51C55 51 47 45 47 34Z';
const VAPOR = 'M44 34H86M59 55H71M57 28C54 24 60 21 57 16M65 28C62 24 68 21 65 13M73 28C70 24 76 21 73 16';
const BARBANTE = 'M21 39C12 36 4 26 -6 22';

interface MarcaProps {
  largura?: number;
  /** Cor da etiqueta (amarela por padrão). */
  etiqueta?: string;
  tigela?: string;
  barbante?: string;
}

/** Só o desenho (etiqueta + tigela). Proporção 118 × 82. */
export function Simbolo({ largura = 28, etiqueta, tigela, barbante }: MarcaProps) {
  const c = useCores();
  const altura = (largura * 82) / 118;
  return (
    <Svg width={largura} height={altura} viewBox="-10 -12 118 82" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <G transform="rotate(-14 50 32)">
        <Path d={ETIQUETA} fill={etiqueta ?? c.etiqueta} fillRule="evenodd" />
        <Path d={TIGELA} fill={tigela ?? '#1D7A4A'} />
        <Path d={VAPOR} fill="none" stroke={tigela ?? '#1D7A4A'} strokeWidth={largura < 40 ? 5 : 3.4} strokeLinecap="round" />
      </G>
      <Path d={BARBANTE} fill="none" stroke={barbante ?? c.tinta} strokeWidth={largura < 40 ? 4 : 2.8} strokeLinecap="round" />
    </Svg>
  );
}

/** Símbolo + "Rendeu", para o cabeçalho e a tela inicial. */
export function Marca({ tamanho = 21, cor }: { tamanho?: number; cor?: string }) {
  const c = useCores();
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="Rendeu"
      style={{ flexDirection: 'row', alignItems: 'center', gap: tamanho * 0.42 }}
    >
      <Simbolo largura={tamanho * 1.55} barbante={cor ?? c.tinta} />
      <Text style={{ fontFamily: FONTES.titulo, fontSize: tamanho, letterSpacing: -0.4, color: cor ?? c.tinta }}>Rendeu</Text>
    </View>
  );
}
