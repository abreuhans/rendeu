import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Aviso } from '@/components/aviso';
import { Marca } from '@/components/marca';
import { AppProvider } from '@/estado/app';
import { FONTES, useCores } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Ao abrir um link direto (ex.: /plano no navegador), a tela inicial fica por baixo.
export const unstable_settings = { anchor: 'index' };

export default function RootLayout() {
  const [carregou, erro] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const c = useCores();

  useEffect(() => {
    if (carregou || erro) SplashScreen.hideAsync();
  }, [carregou, erro]);

  const tema = useMemo(() => {
    const base = c.escuro ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: c.fundo, card: c.fundo, text: c.tinta, primary: c.folha, border: c.linha } };
  }, [c]);

  if (!carregou && !erro) return null;

  const titulo = (texto: string) => ({ headerTitle: texto });

  return (
    <ThemeProvider value={tema}>
      <AppProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.fundo },
            headerShadowVisible: false,
            headerTintColor: c.tinta,
            headerTitleStyle: { fontFamily: FONTES.tituloForte, color: c.tinta },
            headerTitleAlign: 'center',
            headerBackButtonDisplayMode: 'minimal',
            headerTitle: () => <Marca />,
            contentStyle: { backgroundColor: c.fundo },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Rendeu' }} />
          <Stack.Screen name="passo/[n]" options={{ title: 'Suas escolhas' }} />
          <Stack.Screen name="gerando" options={{ title: 'Montando o plano', headerBackVisible: false, gestureEnabled: false }} />
          <Stack.Screen name="problema" options={{ title: 'Ajustar o plano' }} />
          <Stack.Screen name="plano" options={{ title: 'Seu plano' }} />
          <Stack.Screen
            name="receita/[i]"
            options={{ presentation: 'modal', title: 'Receita', ...titulo('Receita'), contentStyle: { backgroundColor: c.superficie }, headerStyle: { backgroundColor: c.superficie } }}
          />
          <Stack.Screen name="notas/index" options={{ title: 'Preços reais', ...titulo('Preços reais') }} />
          <Stack.Screen name="notas/ler" options={{ title: 'Ler nota fiscal', ...titulo('Ler nota fiscal') }} />
          <Stack.Screen name="notas/consulta" options={{ title: 'Nota fiscal', ...titulo('Nota fiscal') }} />
        </Stack>
        <Aviso />
        <StatusBar style={c.escuro ? 'light' : 'dark'} />
      </AppProvider>
    </ThemeProvider>
  );
}
