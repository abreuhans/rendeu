import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { linkConsulta } from '@/core';
import { Tela } from '@/components/tela';
import { Ajuda, Botao, Pergunta } from '@/components/ui';
import { ehLinkDeNota } from '@/lib/notas';
import { FONTES, useCores } from '@/theme';

export default function LerNota() {
  const [permissao, pedir] = useCameraPermissions();
  const [ativa, setAtiva] = useState(true);
  const [erro, setErro] = useState('');
  const lido = useRef(false);
  const c = useCores();
  const { bottom } = useSafeAreaInsets();

  // A câmera só fica ligada enquanto a tela está aberta.
  useFocusEffect(
    useCallback(() => {
      lido.current = false;
      setAtiva(true);
      return () => setAtiva(false);
    }, []),
  );

  const aoLer = useCallback(({ data }: BarcodeScanningResult) => {
    if (lido.current) return;
    const url = linkConsulta(data);
    if (!url || !ehLinkDeNota(url)) {
      setErro('Esse QR Code não é de nota fiscal. Procure o QR Code no fim do cupom, perto da chave de acesso.');
      return;
    }
    lido.current = true;
    setAtiva(false);
    if (process.env.EXPO_OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/notas/consulta', params: { url } });
  }, []);

  if (!permissao) return <Tela>{null}</Tela>;

  if (!permissao.granted) {
    return (
      <Tela>
        <View style={{ marginTop: 16 }}>
          <Pergunta>Ler o QR Code da nota</Pergunta>
        </View>
        <Ajuda>
          O app usa a câmera só para ler o QR Code impresso no cupom fiscal. Com ele, o app abre a nota no site da Sefaz e atualiza os preços do mercado.
        </Ajuda>
        <View style={{ gap: 10, marginTop: 22 }}>
          {permissao.canAskAgain ? (
            <Botao icone="camera" onPress={pedir}>Permitir câmera</Botao>
          ) : (
            <>
              <Ajuda aviso>A câmera está bloqueada para o Rendeu. Libere nos Ajustes do celular.</Ajuda>
              <Botao onPress={() => Linking.openSettings()}>Abrir Ajustes</Botao>
            </>
          )}
          <Botao variante="contorno" onPress={() => router.back()}>Colar o link em vez disso</Botao>
        </View>
      </Tela>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        active={ativa}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={ativa ? aoLer : undefined}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 240, height: 240, borderRadius: 24, borderCurve: 'continuous', borderWidth: 3, borderColor: c.etiqueta }} />
      </View>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: bottom + 24, gap: 10, alignItems: 'center' }}>
        <View style={{ backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, maxWidth: 420 }}>
          <Text style={{ fontFamily: FONTES.textoMedio, fontSize: 15, lineHeight: 21, color: '#FFFFFF', textAlign: 'center' }}>
            {erro || 'Aponte para o QR Code no fim do cupom fiscal.'}
          </Text>
        </View>
      </View>
    </View>
  );
}
