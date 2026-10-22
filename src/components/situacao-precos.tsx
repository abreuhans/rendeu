// Uma linha dizendo de onde vêm os preços agora: sites dos mercados (e de quando), notas ou estimativa.
import { Text, View } from 'react-native';
import { lojasValidas } from '@/core';
import { useApp } from '@/estado/app';
import { juntar, nomeMercado, quando } from '@/lib/textos';
import { FONTES, useCores } from '@/theme';

export function SituacaoPrecos() {
  const c = useCores();
  const { site, infoSite } = useApp();
  const validas = lojasValidas(site);
  const lojas = Object.keys(validas).map(nomeMercado);
  // A loja lida mais recentemente (as outras podem ter ficado com os preços de uma coleta anterior).
  const ultima = Object.values(validas).map(l => l.data).sort().pop();
  let texto: string;
  let ok = false;
  if (lojas.length && ultima) {
    ok = true;
    texto = `Preços dos sites de ${juntar(lojas)}, lidos ${quando(ultima)}.`;
    if (infoSite.falhou) texto += ' Sem internet agora: o app usa esses até conseguir atualizar.';
  } else if (infoSite.baixando) {
    texto = 'Buscando os preços de hoje nos sites dos mercados…';
  } else if (site) {
    texto = 'O robô ainda não conseguiu ler os sites dos mercados: por enquanto os preços são estimados.';
  } else if (infoSite.falhou) {
    texto = 'Sem internet: por enquanto os preços são estimados.';
  } else {
    texto = 'Preços estimados (os dos sites ainda não chegaram).';
  }
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 12 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: ok ? c.folha : c.etiqueta }} />
      <Text style={{ flex: 1, fontFamily: FONTES.texto, fontSize: 13.5, lineHeight: 19, color: c.tinta2 }}>{texto}</Text>
    </View>
  );
}
