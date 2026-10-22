// Cores, fontes e medidas do Rendeu: verde-erva sobre fundo sálvia, amarelo de
// etiqueta de preço e papel de cupom fiscal nas listas (as mesmas do protótipo web).
import { useColorScheme } from 'react-native';

export const CLARO = {
  fundo: '#EEF3EC',
  superficie: '#FFFFFF',
  superficie2: '#E3EBE0',
  tinta: '#13231A',
  tinta2: '#4A5E51',
  linha: '#CFDBCC',
  folha: '#1D7A4A',
  folhaTinta: '#FFFFFF',
  folhaSuave: '#D5EADB',
  etiqueta: '#FFD43B',
  etiquetaTinta: '#2B2200',
  tomate: '#C2412A',
  tomateSuave: '#F6E0DA',
  papel: '#FFFEF8',
  papelTinta: '#1F2420',
  papelLinha: '#D6D3C4',
  sombra: '0 1px 2px rgba(19, 35, 26, 0.06), 0 10px 28px rgba(19, 35, 26, 0.09)',
  escuro: false,
};

export type Cores = typeof CLARO;

export const ESCURO: Cores = {
  fundo: '#0D1511',
  superficie: '#15201A',
  superficie2: '#1D2B23',
  tinta: '#E6EFE8',
  tinta2: '#9EB2A5',
  linha: '#2B3B32',
  folha: '#4CB37E',
  folhaTinta: '#04140B',
  folhaSuave: '#183326',
  etiqueta: '#FFD43B',
  etiquetaTinta: '#2B2200',
  tomate: '#FF7E61',
  tomateSuave: '#3A1F19',
  papel: '#1A231E',
  papelTinta: '#E3EAE4',
  papelLinha: '#35453B',
  sombra: '0 1px 2px rgba(0, 0, 0, 0.4), 0 10px 28px rgba(0, 0, 0, 0.35)',
  escuro: true,
};

export function useCores(): Cores {
  return useColorScheme() === 'dark' ? ESCURO : CLARO;
}

/** Nomes das fontes carregadas no _layout (uma família por peso, como pede o Android). */
export const FONTES = {
  titulo: 'BricolageGrotesque_800ExtraBold',
  tituloForte: 'BricolageGrotesque_700Bold',
  tituloMedio: 'BricolageGrotesque_600SemiBold',
  texto: 'Figtree_400Regular',
  textoMedio: 'Figtree_500Medium',
  textoForte: 'Figtree_600SemiBold',
  textoNegrito: 'Figtree_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedio: 'IBMPlexMono_500Medium',
  monoForte: 'IBMPlexMono_600SemiBold',
};

export const RAIO = { p: 8, m: 14, g: 22 };

/** Largura máxima do conteúdo em telas largas (tablet e navegador). */
export const LARGURA_MAX = 560;
