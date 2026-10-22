import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { ITEM, MERCADOS, dinheiro, linkConsulta } from '@/core';
import { Tela } from '@/components/tela';
import { Ajuda, Botao, Campo, Cartao, Nota, Rotulo } from '@/components/ui';
import { useApp } from '@/estado/app';
import { ehLinkDeNota, precoLido } from '@/lib/notas';
import { nomeMercado, plural } from '@/lib/textos';
import { FONTES, useCores } from '@/theme';

export default function Notas() {
  const { precos, notas, apagarPrecos, mostrarAviso } = useApp();
  const c = useCores();
  const [link, setLink] = useState('');
  const [erro, setErro] = useState('');
  const [confirmar, setConfirmar] = useState(false);

  const porMercado = useMemo(() => {
    const lista = Object.values(precos);
    const grupos = new Map<string, typeof lista>();
    for (const p of lista) grupos.set(p.mercadoId, [...(grupos.get(p.mercadoId) ?? []), p]);
    return MERCADOS.filter(m => grupos.has(m.id)).map(m => ({
      mercado: m.id,
      itens: grupos.get(m.id)!.sort((a, b) => ITEM[a.itemId].nome.localeCompare(ITEM[b.itemId].nome)),
    }));
  }, [precos]);

  const abrir = () => {
    const url = linkConsulta(link);
    if (!url || !ehLinkDeNota(url)) {
      setErro('Não reconheci esse link. Cole o endereço do QR Code da nota ou os 44 números da chave de acesso.');
      return;
    }
    setErro('');
    router.push({ pathname: '/notas/consulta', params: { url } });
  };

  const apagar = () => {
    if (!confirmar) {
      setConfirmar(true);
      return;
    }
    apagarPrecos();
    setConfirmar(false);
    mostrarAviso('Preços das notas apagados. O app volta a usar estimativas.');
  };

  return (
    <Tela>
      <Text style={{ fontFamily: FONTES.texto, fontSize: 16, lineHeight: 23, color: c.tinta2, marginTop: 6 }}>
        Depois das compras, leia o QR Code da nota fiscal (NFC-e). O app abre a nota no site da Sefaz, lê os produtos e passa a usar esses preços no mercado da nota.
      </Text>
      <View style={{ gap: 10, marginTop: 18 }}>
        <Botao icone="camera" onPress={() => router.push('/notas/ler')}>Ler QR Code da nota</Botao>
      </View>

      <Rotulo>Ou cole o link da nota</Rotulo>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <Campo
          value={link}
          onChangeText={t => { setLink(t); setErro(''); }}
          onSubmitEditing={abrir}
          placeholder="https://sat.sef.sc.gov.br/nfce/consulta?p=…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          accessibilityLabel="Link ou chave da nota fiscal"
          style={{ flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 11 }}
        />
        <Botao pequeno variante="contorno" desativado={!link.trim()} onPress={abrir}>Abrir</Botao>
      </View>
      {erro ? <Nota aviso>{erro}</Nota> : null}

      <Rotulo>Preços salvos</Rotulo>
      {porMercado.length ? (
        porMercado.map(g => (
          <Cartao key={g.mercado} style={{ marginTop: 12, padding: 16 }}>
            <Text style={{ fontFamily: FONTES.tituloForte, fontSize: 17, color: c.tinta }}>
              {nomeMercado(g.mercado)} <Text style={{ fontFamily: FONTES.texto, fontSize: 13, color: c.tinta2 }}>· {g.itens.length} {plural(g.itens.length, 'preço', 'preços')}</Text>
            </Text>
            {g.itens.map(p => (
              <View key={p.itemId} style={{ flexDirection: 'row', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: c.linha }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTES.textoMedio, fontSize: 14.5, color: c.tinta }}>{ITEM[p.itemId]?.nome ?? p.itemId}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: FONTES.mono, fontSize: 11.5, color: c.tinta2 }}>{p.descricao}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: FONTES.monoMedio, fontSize: 13, color: c.tinta, fontVariant: ['tabular-nums'] }}>{precoLido(p)}</Text>
                  <Text style={{ fontFamily: FONTES.texto, fontSize: 11, color: c.tinta2 }}>{p.data.split(' ')[0]}</Text>
                </View>
              </View>
            ))}
          </Cartao>
        ))
      ) : (
        <Ajuda>Nenhuma nota lida ainda. Enquanto isso, o app usa preços estimados para cada mercado.</Ajuda>
      )}

      {notas.length ? (
        <>
          <Rotulo>Notas lidas</Rotulo>
          {notas.map(n => (
            <View key={n.lidaEm} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: c.linha }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTES.textoForte, fontSize: 15, color: c.tinta }}>{nomeMercado(n.mercadoId)}</Text>
                <Text style={{ fontFamily: FONTES.texto, fontSize: 13, color: c.tinta2 }}>
                  {n.data} · {n.reconhecidos} de {n.itens} produtos usados
                </Text>
              </View>
              {n.total ? <Text style={{ fontFamily: FONTES.monoMedio, fontSize: 14, color: c.tinta }}>{dinheiro(n.total)}</Text> : null}
            </View>
          ))}
          <View style={{ marginTop: 18, alignItems: 'flex-start', gap: 6 }}>
            <Botao pequeno variante="contorno" icone="lixo" onPress={apagar}>{confirmar ? 'Toque de novo para apagar' : 'Apagar preços das notas'}</Botao>
          </View>
        </>
      ) : null}

      <Nota>Da nota, o app guarda só os produtos, os preços, o mercado e a data. Nada de CPF.</Nota>
    </Tela>
  );
}
