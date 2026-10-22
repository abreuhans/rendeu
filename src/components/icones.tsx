// Ícones de traço (os mesmos do protótipo web), desenhados com react-native-svg.
import Svg, { Path, Rect } from 'react-native-svg';

export type NomeIcone = 'voltar' | 'ok' | 'fechar' | 'trocar' | 'refazer' | 'copiar' | 'compartilhar' | 'nota' | 'camera' | 'link' | 'lixo' | 'mais';

interface Props {
  nome: NomeIcone;
  cor: string;
  tamanho?: number;
}

export function Icone({ nome, cor, tamanho = 18 }: Props) {
  const traco = { fill: 'none', stroke: cor, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {nome === 'voltar' && <Path d="M15 5l-7 7 7 7" {...traco} strokeWidth={2.2} />}
      {nome === 'ok' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...traco} strokeWidth={2.4} />}
      {nome === 'fechar' && <Path d="M6 6l12 12M18 6L6 18" {...traco} strokeWidth={2.2} />}
      {nome === 'trocar' && <Path d="M7 7h11l-3-3M17 17H6l3 3" {...traco} />}
      {nome === 'refazer' && <Path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4" {...traco} />}
      {nome === 'copiar' && (
        <>
          <Rect x={8} y={8} width={12} height={12} rx={2} {...traco} />
          <Path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" {...traco} />
        </>
      )}
      {nome === 'compartilhar' && <Path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...traco} />}
      {nome === 'nota' && <Path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 8h6M9 12h6M9 16h3" {...traco} />}
      {nome === 'camera' && (
        <>
          <Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" {...traco} />
          <Rect x={8} y={8} width={8} height={8} rx={1} {...traco} />
        </>
      )}
      {nome === 'link' && <Path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" {...traco} />}
      {nome === 'lixo' && <Path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5" {...traco} />}
      {nome === 'mais' && <Path d="M12 5v14M5 12h14" {...traco} strokeWidth={2.2} />}
    </Svg>
  );
}
