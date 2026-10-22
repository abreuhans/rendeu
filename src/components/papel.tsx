// Papel de cupom fiscal com a borda de baixo picotada (lista de compras e exemplo).
import { useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCores } from '@/theme';

export function Papel({ children, style, inclinado }: { children: ReactNode; style?: StyleProp<ViewStyle>; inclinado?: boolean }) {
  const c = useCores();
  const [largura, setLargura] = useState(0);
  const dentes = Math.ceil(largura / 14);
  let d = '';
  for (let i = 0; i < dentes; i++) d += `M${i * 14} 0H${i * 14 + 14}L${i * 14 + 7} 10Z`;
  return (
    <View
      onLayout={e => setLargura(e.nativeEvent.layout.width)}
      style={[{ marginBottom: 10, transform: inclinado ? [{ rotate: '-0.6deg' }] : undefined }, style]}
    >
      <View style={{ backgroundColor: c.papel, borderTopLeftRadius: 4, borderTopRightRadius: 4, boxShadow: c.sombra }}>{children}</View>
      {largura > 0 ? (
        <Svg width={largura} height={10} style={{ position: 'absolute', left: 0, bottom: -9 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Path d={d} fill={c.papel} />
        </Svg>
      ) : null}
    </View>
  );
}
